import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { ensureDir } from "./storage";

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export function loadOrCreateKeys(dataDir: string): KeyPair {
  const dir = path.join(dataDir, "keys");
  ensureDir(dir);
  const privPath = path.join(dir, "private.pem");
  const pubPath = path.join(dir, "public.pem");

  if (fs.existsSync(privPath) && fs.existsSync(pubPath)) {
    return {
      privateKey: fs.readFileSync(privPath, "utf8"),
      publicKey: fs.readFileSync(pubPath, "utf8"),
    };
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  fs.writeFileSync(privPath, privateKey, { encoding: "utf8", mode: 0o600 });
  fs.writeFileSync(pubPath, publicKey, "utf8");
  return { privateKey, publicKey };
}
