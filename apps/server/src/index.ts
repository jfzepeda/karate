import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import { type ServerConfig, defaultConfig } from "./config";
import { ensureDir } from "./storage";
import { loadOrCreateKeys, type KeyPair } from "./keys";
import { buildRoutes } from "./routes";
import { LicenseStore } from "./licenses";
import { signLicenseToken } from "./auth";
import { saveData } from "./data-store";
import type { KioskSession, Role } from "@karate/core";

export interface KarateServer {
  app: Express;
  config: ServerConfig;
  keys: KeyPair;
  kioskSession: KioskSession | null;
  licenses: LicenseStore;
  publicKeySpki: string;
  start(): Promise<{ port: number; url: string }>;
  stop(): Promise<void>;
}

export async function createServer(
  overrides: Partial<ServerConfig> = {}
): Promise<KarateServer> {
  const config = defaultConfig(overrides);
  ensureDir(config.dataDir);
  ensureDir(path.join(config.dataDir, "uploads"));
  const keys = await loadOrCreateKeys(config.dataDir);
  const licenses = new LicenseStore(config.dataDir);

  // Seed test claim codes the first time the server boots. After seeding the
  // codes are idempotent — `seedCode` is a no-op on re-runs because each code
  // hash already exists in the store.
  for (const seed of config.seedClaimCodes) {
    licenses.seedCode(seed.code, {
      role: seed.role,
      features: seed.features,
      label: seed.label,
    });
  }

  let kioskSession: KioskSession | null = null;
  if (config.launchConfig) {
    const lc = config.launchConfig;
    if (lc.expiresAt > Date.now()) {
      saveData(config.dataDir, lc.data);
      const role = lc.role as Role;
      const features = role === "superadmin"
        ? ["scoring", "public_display", "bracket_view", "tournament_config",
            "logo_upload", "user_management", "activity_log"] as const
        : ["scoring", "public_display", "bracket_view"] as const;
      const userId = "kiosk_" + Math.random().toString(36).slice(2, 10);
      const { token, payload } = await signLicenseToken(
        { config, keys, licenses },
        {
          userId,
          role,
          features: [...features],
          plan: role,
          machineFingerprint: "kiosk-no-fp",
          activatedAt: Math.floor(Date.now() / 1000),
          ttlSeconds: lc.sessionTtlSeconds ?? Math.floor((lc.expiresAt - Date.now()) / 1000),
        }
      );
      kioskSession = {
        token,
        issuedAt: payload.iat * 1000,
        expiresAt: payload.exp * 1000,
        user: { role, features: [...features] },
      };
    }
  }

  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(buildRoutes(config, keys, licenses, kioskSession));

  if (config.staticDir && fs.existsSync(config.staticDir)) {
    const staticDir = config.staticDir;
    app.use(express.static(staticDir, { extensions: ["html"], index: "index.html" }));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== "GET") return next();
      if (req.path.startsWith("/api/") || req.path.startsWith("/admin-panel")) {
        return next();
      }
      const candidates = [
        path.join(staticDir, req.path, "index.html"),
        path.join(staticDir, "index.html"),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          res.sendFile(c);
          return;
        }
      }
      next();
    });
  }

  let server: ReturnType<Express["listen"]> | null = null;

  return {
    app,
    config,
    keys,
    kioskSession,
    licenses,
    publicKeySpki: keys.publicKeySpki,
    start() {
      return new Promise((resolve) => {
        server = app.listen(config.port, () => {
          const port = (server!.address() as { port: number }).port;
          resolve({ port, url: `http://127.0.0.1:${port}` });
        });
      });
    },
    stop() {
      return new Promise((resolve) => {
        if (!server) return resolve();
        server.close(() => resolve());
      });
    },
  };
}

export type { ServerConfig } from "./config";
export type { KeyPair } from "./keys";
