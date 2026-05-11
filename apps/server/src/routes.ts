import { Router, type Request, type Response } from "express";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import multer from "multer";
import { loadAppConfig, saveAppConfig } from "./app-config";

const execFileP = promisify(execFile);
import type { ServerConfig } from "./config";
import type { KeyPair } from "./keys";
import {
  signToken,
  requireAuth,
  requireRole,
  type AuthedRequest,
  type AuthDeps,
} from "./auth";
import type { SessionStore } from "./session-store";
import type { KioskSession } from "@karate/core";
import {
  loadData,
  saveData,
  readLogoInfo,
  clearLogo,
  ensureLogoDir,
  logoDir,
} from "./data-store";
import { logActivity, readActivity } from "./activity";
import { renderAdminPanelHtml, renderAdminLoginHtml } from "./admin-panel";

function clientIp(req: Request): string | null {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? null;
}

const SUPERADMIN_CODE = "KAR-IAS";

// In-memory store for single-use referee codes
const refereeCodes = new Map<string, number>(); // code → expiresAt

function generateRefereeCode(): string {
  const digits = () => Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${digits()}-${digits()}`;
}

export function buildRoutes(config: ServerConfig, keys: KeyPair, sessions: SessionStore, kioskSession?: KioskSession | null): Router {
  const deps: AuthDeps = { config, keys, sessions };
  const router = Router();
  const auth = requireAuth(deps);
  const superOnly = requireRole("superadmin");

  // ---- Public health/key endpoints --------------------------------
  router.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  router.get("/api/public-key", (_req, res) => {
    res.type("text/plain").send(keys.publicKey);
  });

  // ---- Authentication ---------------------------------------------
  router.post("/api/login", async (req: Request, res: Response) => {
    const { code } = req.body ?? {};
    const ip = clientIp(req);
    if (typeof code !== "string" || !code.trim()) {
      res.status(400).json({ error: "missing_code" });
      return;
    }
    const upper = code.trim().toUpperCase();

    // Superadmin master code
    if (upper === SUPERADMIN_CODE) {
      const { token, issuedAt, expiresAt, jti } = signToken(deps, "superadmin");
      sessions.add({ jti, role: "superadmin", issuedAt, expiresAt, ip, revoked: false });
      logActivity(config.dataDir, { ts: Date.now(), username: "superadmin", action: "login", result: "success", ip });
      res.json({ token, issuedAt, expiresAt, user: { role: "superadmin" } });
      return;
    }

    // Referee numeric code
    const now = Date.now();
    // Prune expired codes
    for (const [k, exp] of refereeCodes) { if (exp < now) refereeCodes.delete(k); }
    const codeExpiry = refereeCodes.get(upper);
    if (!codeExpiry || codeExpiry < now) {
      refereeCodes.delete(upper);
      logActivity(config.dataDir, { ts: now, username: null, action: "login", result: "fail", ip, message: "invalid_code" });
      res.status(401).json({ error: "invalid_code" });
      return;
    }
    refereeCodes.delete(upper); // single-use
    const ttlSeconds = loadAppConfig(config.dataDir).sessionTtlMinutes * 60;
    const { token, issuedAt, expiresAt, jti } = signToken(deps, "referee", ttlSeconds);
    sessions.add({ jti, role: "referee", issuedAt, expiresAt, ip, revoked: false });
    logActivity(config.dataDir, { ts: now, username: "referee", action: "login", result: "success", ip });
    res.json({ token, issuedAt, expiresAt, user: { role: "referee" } });
  });

  router.get("/api/me", auth, (req: AuthedRequest, res: Response) => {
    res.json({ user: { role: req.auth!.role } });
  });

  // ---- Tournament data --------------------------------------------
  router.get("/api/data", auth, (_req: AuthedRequest, res: Response) => {
    const file = loadData(config.dataDir);
    res.set("ETag", file.etag);
    res.json(file);
  });

  router.put("/api/data", auth, superOnly, (req: AuthedRequest, res: Response) => {
    const incoming = req.body && typeof req.body === "object" ? req.body : null;
    if (!incoming || typeof incoming !== "object") {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }
    const file = saveData(config.dataDir, incoming as Record<string, unknown>);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.role, action: "data_update",
      result: "success", ip: clientIp(req),
    });
    res.set("ETag", file.etag);
    res.json(file);
  });

  // ---- Logo upload ------------------------------------------------
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _f, cb) => cb(null, ensureLogoDir(config.dataDir)),
      filename: (_req, f, cb) => {
        const ext = path.extname(f.originalname).toLowerCase() || ".png";
        cb(null, `logo${ext}`);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, f, cb) => {
      const ok = ["image/png", "image/jpeg", "image/svg+xml"].includes(f.mimetype);
      if (!ok) return cb(new Error("Only PNG / JPG / SVG allowed"));
      cb(null, true);
    },
  });

  router.post(
    "/api/upload-logo",
    auth,
    superOnly,
    (req, res, next) => {
      upload.single("logo")(req, res, (err: unknown) => {
        if (err) {
          res.status(400).json({ error: err instanceof Error ? err.message : "upload_failed" });
          return;
        }
        next();
      });
    },
    (req: AuthedRequest, res: Response) => {
      // Delete old files of different extensions so only one logo lives at a time.
      const dir = logoDir(config.dataDir);
      const keep = (req as Request & { file?: Express.Multer.File }).file?.filename;
      for (const f of fs.readdirSync(dir)) {
        if (f !== keep) fs.unlinkSync(path.join(dir, f));
      }
      const info = readLogoInfo(config.dataDir);
      logActivity(config.dataDir, {
        ts: Date.now(), username: req.auth!.role, action: "logo_upload",
        result: "success", ip: clientIp(req),
      });
      res.json({ logo: info });
    }
  );

  router.delete("/api/upload-logo", auth, superOnly, (req: AuthedRequest, res: Response) => {
    clearLogo(config.dataDir);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.role, action: "logo_remove",
      result: "success", ip: clientIp(req),
    });
    res.json({ ok: true });
  });

  router.get("/api/logo", (_req, res) => {
    const info = readLogoInfo(config.dataDir);
    if (!info) {
      res.status(404).end();
      return;
    }
    res.type(info.mime);
    fs.createReadStream(path.join(logoDir(config.dataDir), info.filename)).pipe(res);
  });

  router.get("/api/logo-info", auth, (_req: AuthedRequest, res: Response) => {
    res.json({ logo: readLogoInfo(config.dataDir) });
  });

  // ---- Kiosk session (public) -------------------------------------
  router.get("/api/kiosk-session", (_req, res) => {
    if (!kioskSession) {
      res.status(404).json({ error: "not_kiosk" });
      return;
    }
    res.json(kioskSession);
  });

  // ---- Generate launch config (auth required) ---------------------
  router.post("/api/generate-launch", auth, async (req: AuthedRequest, res: Response) => {
    const dataFile = loadData(config.dataDir);
    const ip = clientIp(req);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.role, action: "generate_launch",
      result: "success", ip,
    });
    res.json({
      issuedAt: Date.now(),
      expiresAt: Date.now() + loadAppConfig(config.dataDir).sessionTtlMinutes * 60 * 1000,
      role: req.auth!.role,
      data: dataFile.data,
    });
  });

  // ---- Session management (superadmin) ----------------------------
  router.get("/api/sessions", auth, superOnly, (_req: AuthedRequest, res: Response) => {
    res.json({ sessions: sessions.listActive() });
  });

  router.delete("/api/sessions/:jti", auth, superOnly, (req: AuthedRequest, res: Response) => {
    const { jti } = req.params;
    const revoked = sessions.revoke(jti);
    if (!revoked) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.role, action: "session_revoke",
      result: "success", ip: clientIp(req), message: `jti ${jti}`,
    });
    res.json({ ok: true });
  });

  router.delete("/api/sessions", auth, superOnly, (_req: AuthedRequest, res: Response) => {
    res.status(404).json({ error: "not_found" });
  });

  // ---- Activity log -----------------------------------------------
  router.get("/api/activity", auth, superOnly, (req: AuthedRequest, res: Response) => {
    const max = Math.min(Number(req.query.max ?? 200), 2000);
    res.json({ entries: readActivity(config.dataDir, max) });
  });

  // ---- App config (superadmin) ------------------------------------
  router.get("/api/app-config", auth, superOnly, (_req: AuthedRequest, res: Response) => {
    res.json(loadAppConfig(config.dataDir));
  });

  router.put("/api/app-config", auth, superOnly, (req: AuthedRequest, res: Response) => {
    const { sessionTtlMinutes } = req.body ?? {};
    if (typeof sessionTtlMinutes !== "number" || sessionTtlMinutes < 1) {
      res.status(400).json({ error: "invalid_value" });
      return;
    }
    const cfg = { sessionTtlMinutes: Math.floor(sessionTtlMinutes) };
    saveAppConfig(config.dataDir, cfg);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.role, action: "access_extend",
      result: "success", ip: clientIp(req), message: `set sessionTtlMinutes=${cfg.sessionTtlMinutes}`,
    });
    res.json(cfg);
  });

  // ---- Referee access code generation ----------------------------
  router.post("/api/referee-code", auth, superOnly, (_req: AuthedRequest, res: Response) => {
    const now = Date.now();
    for (const [k, exp] of refereeCodes) { if (exp < now) refereeCodes.delete(k); }
    const code = generateRefereeCode();
    refereeCodes.set(code, now + loadAppConfig(config.dataDir).sessionTtlMinutes * 60 * 1000);
    res.json({ code });
  });

  router.get("/api/referee-codes", auth, superOnly, (_req: AuthedRequest, res: Response) => {
    const now = Date.now();
    const active: { code: string; expiresAt: number }[] = [];
    for (const [code, expiresAt] of refereeCodes) {
      if (expiresAt >= now) active.push({ code, expiresAt });
      else refereeCodes.delete(code);
    }
    res.json({ codes: active });
  });

  router.delete("/api/referee-codes/:code", auth, superOnly, (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    refereeCodes.delete(code);
    res.json({ ok: true });
  });

  // ---- Custom DMG builder -----------------------------------------
  async function createCustomDmg(
    baseDmgPath: string,
    launchConfig: Record<string, unknown>,
  ): Promise<string> {
    const tmpId      = crypto.randomUUID();
    const shadowFile = `/tmp/karate-shadow-${tmpId}.shadow`;
    const mountPoint = `/tmp/karate-mount-${tmpId}`;
    const outputBase = `/tmp/karate-out-${tmpId}`;

    fs.mkdirSync(mountPoint, { recursive: true });

    try {
      // Mount the original DMG with a shadow file — no copy, no conversion needed.
      await execFileP("/usr/bin/hdiutil", [
        "attach", baseDmgPath,
        "-shadow", shadowFile,
        "-mountpoint", mountPoint,
        "-nobrowse", "-quiet",
      ]);

      const appName = fs.readdirSync(mountPoint).find((f) => f.endsWith(".app"));
      if (!appName) throw new Error("No .app found in DMG");

      const launchJson = JSON.stringify(launchConfig);

      // Write at the DMG root so it's found when running directly from the DMG.
      fs.writeFileSync(path.join(mountPoint, "karate-launch.json"), launchJson);

      // Also write inside the bundle (Contents/Resources) so it's found after
      // the user copies the .app to /Applications and the DMG is unmounted.
      // Since we ship without an Apple code signature, writing here is safe.
      const resourcesDir = path.join(mountPoint, appName, "Contents", "Resources");
      if (fs.existsSync(resourcesDir)) {
        fs.writeFileSync(path.join(resourcesDir, "karate-launch.json"), launchJson);
      }

      await execFileP("/usr/bin/hdiutil", ["detach", mountPoint, "-quiet"]);

      // Merge shadow + original into a standard ULFO (lzfse) read-only image.
      // On Apple Silicon this takes ~1-2 s and produces a normal openable DMG.
      await execFileP("/usr/bin/hdiutil", [
        "convert", baseDmgPath,
        "-shadow", shadowFile,
        "-format", "ULFO",
        "-o", outputBase,
      ]);

      return `${outputBase}.dmg`;
    } catch (err) {
      await execFileP("/usr/bin/hdiutil", ["detach", mountPoint, "-quiet"]).catch(() => {});
      throw err;
    } finally {
      fs.rmSync(mountPoint, { recursive: true, force: true });
      if (fs.existsSync(shadowFile)) fs.unlinkSync(shadowFile);
    }
  }

  // In-memory store for single-use download tokens (max 5 min TTL)
  const pendingDownloads = new Map<string, { launchConfig: Record<string, unknown>; createdAt: number }>();

  function prunePendingDownloads() {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [k, v] of pendingDownloads) {
      if (v.createdAt < cutoff) pendingDownloads.delete(k);
    }
  }

  router.post("/api/prepare-download", auth, async (req: AuthedRequest, res: Response) => {
    const dataFile = loadData(config.dataDir);
    const ttlMinutes = loadAppConfig(config.dataDir).sessionTtlMinutes;
    const launchConfig = {
      issuedAt: Date.now(),
      // Give a 2-hour window to finish downloading and open the app.
      // The actual session TTL is applied when the app starts (see index.ts).
      expiresAt: Date.now() + Math.max(ttlMinutes * 60 * 1000, 2 * 60 * 60 * 1000),
      sessionTtlSeconds: ttlMinutes * 60,
      role: req.auth!.role,
      data: dataFile.data,
    };

    prunePendingDownloads();
    const tokenId = crypto.randomUUID();
    pendingDownloads.set(tokenId, { launchConfig, createdAt: Date.now() });

    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.role, action: "prepare_download",
      result: "success", ip: clientIp(req),
    });

    res.json({ tokenId });
  });

  router.get("/api/download-app/:tokenId", async (req: Request, res: Response) => {
    const entry = pendingDownloads.get(req.params.tokenId);
    if (!entry) { res.status(404).json({ error: "not_found" }); return; }
    pendingDownloads.delete(req.params.tokenId);

    const dmgInfo = scanDownloads();
    if (!dmgInfo.mac) { res.status(404).json({ error: "no_installer" }); return; }
    const baseDmgPath = path.join(downloadsDir(), dmgInfo.mac);

    let outputDmg: string | null = null;
    try {
      outputDmg = await createCustomDmg(baseDmgPath, entry.launchConfig);
      const stat = fs.statSync(outputDmg);
      res.setHeader("Content-Type", "application/x-apple-diskimage");
      res.setHeader("Content-Disposition", 'attachment; filename="KarateTournament.dmg"');
      res.setHeader("Content-Length", stat.size);
      const stream = fs.createReadStream(outputDmg);
      stream.pipe(res);
      res.on("finish", () => { if (outputDmg) try { fs.unlinkSync(outputDmg); } catch {} });
    } catch (err) {
      if (outputDmg) try { fs.unlinkSync(outputDmg); } catch {}
      if (!res.headersSent) res.status(500).json({ error: "build_failed", detail: String(err) });
    }
  });

  // ---- Downloads (public) -----------------------------------------
  function downloadsDir(): string {
    return path.join(config.dataDir, "downloads");
  }

  function scanDownloads(): { mac: string | null; win: string | null } {
    const dir = downloadsDir();
    if (!fs.existsSync(dir)) return { mac: null, win: null };
    const files = fs.readdirSync(dir);
    const mac = files.find((f) => f.toLowerCase().endsWith(".dmg")) ?? null;
    const win = files.find((f) => f.toLowerCase().endsWith(".exe")) ?? null;
    return { mac, win };
  }

  router.get("/api/download-info", (_req, res) => {
    res.json(scanDownloads());
  });

  router.get("/api/downloads/:filename", (req: Request, res: Response) => {
    const filename = path.basename(req.params.filename);
    const filepath = path.join(downloadsDir(), filename);
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === ".dmg" ? "application/x-apple-diskimage"
      : ext === ".exe" ? "application/vnd.microsoft.portable-executable"
      : "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(filepath).size);
    fs.createReadStream(filepath).pipe(res);
  });

  // ---- Admin panel (HTML) -----------------------------------------
  // The admin panel uses a separate cookie-style session backed by JWT in localStorage.
  router.get("/admin-panel", (_req, res) => {
    res.type("html").send(renderAdminPanelHtml());
  });
  router.get("/admin-panel/login", (_req, res) => {
    res.type("html").send(renderAdminLoginHtml());
  });

  return router;
}
