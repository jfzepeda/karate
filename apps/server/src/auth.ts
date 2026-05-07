import * as jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { Role, UserRecord } from "./users";
import type { ServerConfig } from "./config";
import type { KeyPair } from "./keys";

export interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthDeps {
  config: ServerConfig;
  keys: KeyPair;
}

export function signToken(deps: AuthDeps, user: UserRecord): {
  token: string;
  expiresAt: number;
} {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  const token = jwt.sign(payload, deps.keys.privateKey, {
    algorithm: "RS256",
    expiresIn: deps.config.tokenTtlSeconds,
  });
  const expiresAt = Date.now() + deps.config.tokenTtlSeconds * 1000;
  return { token, expiresAt };
}

export function verifyToken(deps: AuthDeps, token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, deps.keys.publicKey, {
      algorithms: ["RS256"],
    }) as TokenPayload;
    return decoded;
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
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "missing_token" });
      return;
    }
    const token = header.slice(7).trim();
    const payload = verifyToken(deps, token);
    if (!payload) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    req.auth = payload;
    next();
  };
}

export function requireRole(role: Role | Role[]) {
  const roles = Array.isArray(role) ? role : [role];
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  };
}
