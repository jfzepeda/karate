import { Router, type Request, type Response } from "express";
import * as path from "path";
import * as fs from "fs";
import multer from "multer";
import type { ServerConfig } from "./config";
import type { KeyPair } from "./keys";
import {
  loadUsers,
  saveUsers,
  findByUsername,
  findById,
  hashPassword,
  verifyPassword,
  createUser,
  publicUser,
  type Role,
} from "./users";
import {
  signToken,
  requireAuth,
  requireRole,
  type AuthedRequest,
  type AuthDeps,
} from "./auth";
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

export function buildRoutes(config: ServerConfig, keys: KeyPair): Router {
  const deps: AuthDeps = { config, keys };
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
    const { username, password } = req.body ?? {};
    const ip = clientIp(req);
    if (typeof username !== "string" || typeof password !== "string") {
      logActivity(config.dataDir, {
        ts: Date.now(), username: null, action: "login", result: "fail", ip,
        message: "missing_fields",
      });
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const file = loadUsers(config.dataDir);
    const user = findByUsername(file, username);
    if (!user || !user.active) {
      logActivity(config.dataDir, {
        ts: Date.now(), username, action: "login", result: "fail", ip,
        message: !user ? "no_user" : "inactive",
      });
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    if (user.expiresAt && user.expiresAt < Date.now()) {
      logActivity(config.dataDir, {
        ts: Date.now(), username, action: "login", result: "fail", ip, message: "expired",
      });
      res.status(401).json({ error: "account_expired" });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      logActivity(config.dataDir, {
        ts: Date.now(), username, action: "login", result: "fail", ip, message: "bad_password",
      });
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    user.lastLoginAt = Date.now();
    saveUsers(config.dataDir, file);
    const { token, expiresAt } = signToken(deps, user);
    logActivity(config.dataDir, {
      ts: Date.now(), username, action: "login", result: "success", ip,
    });
    res.json({
      token,
      expiresAt,
      user: publicUser(user),
      publicKey: keys.publicKey,
    });
  });

  router.post("/api/renew-token", async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    const ip = clientIp(req);
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const file = loadUsers(config.dataDir);
    const user = findByUsername(file, username);
    if (!user || !user.active) {
      logActivity(config.dataDir, {
        ts: Date.now(), username, action: "renew", result: "fail", ip,
        message: !user ? "no_user" : "inactive",
      });
      res.status(401).json({ error: "account_revoked" });
      return;
    }
    if (user.expiresAt && user.expiresAt < Date.now()) {
      logActivity(config.dataDir, {
        ts: Date.now(), username, action: "renew", result: "fail", ip, message: "expired",
      });
      res.status(401).json({ error: "account_expired" });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      logActivity(config.dataDir, {
        ts: Date.now(), username, action: "renew", result: "fail", ip, message: "bad_password",
      });
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    const { token, expiresAt } = signToken(deps, user);
    logActivity(config.dataDir, {
      ts: Date.now(), username, action: "renew", result: "success", ip,
    });
    res.json({ token, expiresAt, user: publicUser(user) });
  });

  router.get("/api/me", auth, (req: AuthedRequest, res: Response) => {
    const file = loadUsers(config.dataDir);
    const user = findById(file, req.auth!.userId);
    if (!user || !user.active) {
      res.status(401).json({ error: "account_revoked" });
      return;
    }
    res.json({ user: publicUser(user) });
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
      ts: Date.now(), username: req.auth!.username, action: "data_update",
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
        ts: Date.now(), username: req.auth!.username, action: "logo_upload",
        result: "success", ip: clientIp(req),
      });
      res.json({ logo: info });
    }
  );

  router.delete("/api/upload-logo", auth, superOnly, (req: AuthedRequest, res: Response) => {
    clearLogo(config.dataDir);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.username, action: "logo_remove",
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

  // ---- User management (superadmin) -------------------------------
  router.get("/api/users", auth, superOnly, (_req: AuthedRequest, res: Response) => {
    const file = loadUsers(config.dataDir);
    res.json({ users: file.users.map(publicUser) });
  });

  router.post("/api/users", auth, superOnly, async (req: AuthedRequest, res: Response) => {
    const { username, password, role, expiresAt } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const r: Role = role === "superadmin" ? "superadmin" : "referee";
    const file = loadUsers(config.dataDir);
    if (findByUsername(file, username)) {
      res.status(409).json({ error: "username_taken" });
      return;
    }
    const hash = await hashPassword(password);
    const user = createUser({
      username,
      passwordHash: hash,
      role: r,
      expiresAt: typeof expiresAt === "number" ? expiresAt : null,
    });
    file.users.push(user);
    saveUsers(config.dataDir, file);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.username, action: "user_create",
      result: "success", ip: clientIp(req), message: `created ${username}`,
    });
    res.json({ user: publicUser(user) });
  });

  router.patch("/api/users/:id", auth, superOnly, async (req: AuthedRequest, res: Response) => {
    const file = loadUsers(config.dataDir);
    const user = findById(file, req.params.id);
    if (!user) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const { active, password, expiresAt, role } = req.body ?? {};
    if (typeof active === "boolean") user.active = active;
    if (typeof password === "string" && password.length > 0) {
      user.passwordHash = await hashPassword(password);
    }
    if (expiresAt === null || typeof expiresAt === "number") user.expiresAt = expiresAt;
    if (role === "superadmin" || role === "referee") user.role = role;
    saveUsers(config.dataDir, file);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.username,
      action: typeof active === "boolean" && !active ? "user_deactivate" : "user_update",
      result: "success", ip: clientIp(req), message: `target ${user.username}`,
    });
    res.json({ user: publicUser(user) });
  });

  router.delete("/api/users/:id", auth, superOnly, (req: AuthedRequest, res: Response) => {
    const file = loadUsers(config.dataDir);
    const idx = file.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (file.users[idx]!.role === "superadmin" && file.users.filter(u => u.role === "superadmin").length === 1) {
      res.status(400).json({ error: "cannot_delete_last_superadmin" });
      return;
    }
    const removed = file.users.splice(idx, 1)[0]!;
    saveUsers(config.dataDir, file);
    logActivity(config.dataDir, {
      ts: Date.now(), username: req.auth!.username, action: "user_delete",
      result: "success", ip: clientIp(req), message: `deleted ${removed.username}`,
    });
    res.json({ ok: true });
  });

  // ---- Activity log -----------------------------------------------
  router.get("/api/activity", auth, superOnly, (req: AuthedRequest, res: Response) => {
    const max = Math.min(Number(req.query.max ?? 200), 2000);
    res.json({ entries: readActivity(config.dataDir, max) });
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
