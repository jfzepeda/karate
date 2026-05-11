import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { Role } from "@karate/core";
import type { ServerConfig } from "./config";
import type { KeyPair } from "./keys";
import type { SessionStore } from "./session-store";

export interface TokenPayload {
  jti: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthDeps {
  config: ServerConfig;
  keys: KeyPair;
  sessions: SessionStore;
}

export function signToken(
  deps: AuthDeps,
  role: Role,
  ttlSeconds?: number,
): { token: string; issuedAt: number; expiresAt: number; jti: string } {
  const jti = crypto.randomUUID();
  const issuedAt = Date.now();
  const payload: TokenPayload = { jti, role };
  const options: jwt.SignOptions = { algorithm: "RS256" };
  if (ttlSeconds !== undefined) options.expiresIn = ttlSeconds as never;
  const token = jwt.sign(payload, deps.keys.privateKey, options);
  const expiresAt = ttlSeconds !== undefined ? issuedAt + ttlSeconds * 1000 : 0;
  return { token, issuedAt, expiresAt, jti };
}

export function verifyToken(deps: AuthDeps, token: string): TokenPayload | null {
  try {
    return jwt.verify(token, deps.keys.publicKey, { algorithms: ["RS256"] }) as TokenPayload;
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  auth?: TokenPayload;
}

export function requireAuth(deps: AuthDeps) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "missing_token" });
      return;
    }
    const payload = verifyToken(deps, header.slice(7).trim());
    if (!payload) { res.status(401).json({ error: "invalid_token" }); return; }
    if (deps.sessions.isRevoked(payload.jti)) { res.status(401).json({ error: "token_revoked" }); return; }
    req.auth = payload;
    next();
  };
}

export function requireRole(role: Role | Role[]) {
  const roles = Array.isArray(role) ? role : [role];
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) { res.status(401).json({ error: "unauthenticated" }); return; }
    if (!roles.includes(req.auth.role)) { res.status(403).json({ error: "forbidden" }); return; }
    next();
  };
}
