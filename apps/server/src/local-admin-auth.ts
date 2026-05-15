import type { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const HEADER = "x-karate-local-admin";

function isLoopback(req: Request): boolean {
  const ip = req.socket.remoteAddress ?? "";
  return LOOPBACK.has(ip);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function requireLocalAdmin(getToken: () => string | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isLoopback(req)) {
      res.status(401).json({ error: "local_admin_required" });
      return;
    }
    const expected = getToken();
    if (!expected) {
      res.status(401).json({ error: "local_admin_required" });
      return;
    }
    const provided = req.headers[HEADER];
    if (typeof provided !== "string" || !timingSafeEqualStr(provided, expected)) {
      res.status(401).json({ error: "local_admin_required" });
      return;
    }
    next();
  };
}

export const LOCAL_ADMIN_HEADER = "X-Karate-Local-Admin";
