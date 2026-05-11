import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import { type ServerConfig, defaultConfig } from "./config";
import { ensureDir } from "./storage";
import { loadOrCreateKeys, type KeyPair } from "./keys";
import { buildRoutes } from "./routes";
import { SessionStore } from "./session-store";
import { signToken } from "./auth";
import { saveData } from "./data-store";
import { loadAppConfig } from "./app-config";
import type { KioskSession, Role } from "@karate/core";

export interface KarateServer {
  app: Express;
  config: ServerConfig;
  keys: KeyPair;
  kioskSession: KioskSession | null;
  start(): Promise<{ port: number; url: string }>;
  stop(): Promise<void>;
}

export async function createServer(
  overrides: Partial<ServerConfig> = {}
): Promise<KarateServer> {
  const config = defaultConfig(overrides);
  ensureDir(config.dataDir);
  ensureDir(path.join(config.dataDir, "uploads"));
  const keys = loadOrCreateKeys(config.dataDir);

  const sessionStore = new SessionStore();

  let kioskSession: KioskSession | null = null;
  if (config.launchConfig) {
    const lc = config.launchConfig;
    if (lc.expiresAt > Date.now()) {
      saveData(config.dataDir, lc.data);
      // Use the explicit sessionTtlSeconds from the launch config if present,
      // otherwise fall back to the app-config TTL.
      const ttlSeconds = lc.sessionTtlSeconds ?? loadAppConfig(config.dataDir).sessionTtlMinutes * 60;
      const { token, issuedAt, expiresAt, jti } = signToken(
        { config, keys, sessions: sessionStore },
        lc.role as Role,
        ttlSeconds,
      );
      sessionStore.add({ jti, role: lc.role as Role, issuedAt, expiresAt, ip: null, revoked: false });
      kioskSession = {
        token, issuedAt, expiresAt,
        user: { role: lc.role as Role },
      };
    }
  }

  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(buildRoutes(config, keys, sessionStore, kioskSession));

  if (config.staticDir && fs.existsSync(config.staticDir)) {
    const staticDir = config.staticDir;
    // Serve static assets directly. `extensions: ["html"]` means /admin → admin.html.
    app.use(express.static(staticDir, { extensions: ["html"], index: "index.html" }));
    // SPA-ish fallback: for any non-API route that didn't match a file,
    // try `<route>/index.html` (Next.js export uses this for nested routes),
    // then fall back to root `index.html`.
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
