// UDP server discovery: broadcast announcer for SERVER mode, listener
// for CLIENT and STANDALONE modes. Multi-NIC aware; filters known
// VPN/tunnel interfaces so broadcasts don't fan out across a tailnet.

const dgram = require("dgram");
const os = require("os");
const {
  MSG,
  DEFAULT_UDP_PORT,
  ANNOUNCE_INTERVAL_MS,
  SERVER_LOSS_MS,
  safeParse,
} = require("./protocol");

const VPN_NAMES = /^(utun|tun|tap|ppp|tailscale|wg|zt|vEthernet|Tailscale|ZeroTier)/i;
const TAILSCALE_CIDR_START = 0x64400000; // 100.64.0.0
const TAILSCALE_CIDR_MASK = 0xffc00000;  // /10

function ipv4ToInt(ip) {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isTailscale(ip) {
  const n = ipv4ToInt(ip);
  if (n == null) return false;
  return (n & TAILSCALE_CIDR_MASK) === TAILSCALE_CIDR_START;
}

function maskInt(prefix) {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return 0xffffffff;
  return ((0xffffffff << (32 - prefix)) >>> 0);
}

function netmaskToInt(netmask) {
  if (/^\d+$/.test(netmask)) return maskInt(parseInt(netmask, 10));
  return ipv4ToInt(netmask);
}

function broadcastAddress(addrInt, maskInt) {
  return (addrInt | (~maskInt >>> 0)) >>> 0;
}

function intToIpv4(n) {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

function rankRfc1918(ip) {
  const n = ipv4ToInt(ip);
  if (n == null) return 99;
  if ((n & 0xffff0000) === 0xc0a80000) return 0; // 192.168/16
  if ((n & 0xff000000) === 0x0a000000) return 1; // 10/8
  if ((n & 0xfff00000) === 0xac100000) return 2; // 172.16/12
  return 3;
}

function listLanInterfaces() {
  const ifs = os.networkInterfaces();
  const out = [];
  for (const [name, addrs] of Object.entries(ifs)) {
    if (VPN_NAMES.test(name)) continue;
    if (!addrs) continue;
    for (const a of addrs) {
      if (a.internal || a.family !== "IPv4") continue;
      if (isTailscale(a.address)) continue;
      out.push({ name, address: a.address, netmask: a.netmask });
    }
  }
  return out;
}

function pickServerIp() {
  const ifs = listLanInterfaces();
  if (ifs.length === 0) return null;
  ifs.sort((a, b) => rankRfc1918(a.address) - rankRfc1918(b.address));
  return ifs[0].address;
}

function computeBroadcastTargets() {
  const targets = new Set(["255.255.255.255"]);
  for (const i of listLanInterfaces()) {
    const addr = ipv4ToInt(i.address);
    const mask = netmaskToInt(i.netmask);
    if (addr != null && mask != null) {
      targets.add(intToIpv4(broadcastAddress(addr, mask)));
    }
  }
  return Array.from(targets);
}

function makeAnnouncer({ getPayload }) {
  let sock = null;
  let timer = null;
  let nicTimer = null;

  function start() {
    if (sock) return;
    sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
    sock.on("error", (err) => {
      console.warn("[karate-network] announcer error:", err.message);
    });
    sock.bind(() => {
      try { sock.setBroadcast(true); } catch { /* ignore */ }
    });
    const send = () => {
      const payload = getPayload();
      if (!payload) return;
      const msg = Buffer.from(JSON.stringify({ type: MSG.ANNOUNCE, ...payload }));
      for (const target of computeBroadcastTargets()) {
        try {
          sock.send(msg, DEFAULT_UDP_PORT, target);
        } catch { /* ignore */ }
      }
    };
    send();
    timer = setInterval(send, ANNOUNCE_INTERVAL_MS);
    // NIC list can change (DHCP renew, Wi-Fi roam); cheap recompute every 30 s.
    nicTimer = setInterval(() => { /* recompute happens inside send() */ }, 30000);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (nicTimer) { clearInterval(nicTimer); nicTimer = null; }
    if (sock) { try { sock.close(); } catch {} sock = null; }
  }

  return { start, stop };
}

function makeListener({ onAnnounce }) {
  let sock = null;
  const lastSeen = new Map();  // serverId → ts
  let pruneTimer = null;

  function start() {
    if (sock) return;
    sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
    sock.on("error", (err) => {
      console.warn("[karate-network] listener error:", err.message);
    });
    sock.on("message", (buf) => {
      const msg = safeParse(buf.toString("utf8"));
      if (!msg || msg.type !== MSG.ANNOUNCE) return;
      if (!msg.serverId || !msg.serverIp || !msg.serverPort) return;
      lastSeen.set(msg.serverId, { ts: Date.now(), record: msg });
      onAnnounce(msg);
    });
    sock.bind(DEFAULT_UDP_PORT, "0.0.0.0");
    pruneTimer = setInterval(() => {
      const cutoff = Date.now() - SERVER_LOSS_MS * 3;
      for (const [k, v] of lastSeen) {
        if (v.ts < cutoff) lastSeen.delete(k);
      }
    }, 5000);
  }

  function stop() {
    if (pruneTimer) { clearInterval(pruneTimer); pruneTimer = null; }
    if (sock) { try { sock.close(); } catch {} sock = null; }
    lastSeen.clear();
  }

  function listDiscovered() {
    const cutoff = Date.now() - SERVER_LOSS_MS;
    return Array.from(lastSeen.values())
      .filter((v) => v.ts >= cutoff)
      .map((v) => v.record);
  }

  function lastSeenFor(serverId) {
    const v = lastSeen.get(serverId);
    return v ? v.ts : 0;
  }

  return { start, stop, listDiscovered, lastSeenFor };
}

module.exports = { makeAnnouncer, makeListener, pickServerIp };
