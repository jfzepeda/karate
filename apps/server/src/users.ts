import * as path from "path";
import * as bcrypt from "bcryptjs";
import { readJsonSafe, writeJson } from "./storage";

export type Role = "superadmin" | "referee";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  expiresAt: number | null;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface UsersFile {
  users: UserRecord[];
  version: number;
}

const FILE_VERSION = 1;

function usersPath(dataDir: string): string {
  return path.join(dataDir, "users.json");
}

export function loadUsers(dataDir: string): UsersFile {
  return readJsonSafe<UsersFile>(usersPath(dataDir), { users: [], version: FILE_VERSION });
}

export function saveUsers(dataDir: string, file: UsersFile): void {
  writeJson(usersPath(dataDir), file);
}

export function findByUsername(file: UsersFile, username: string): UserRecord | undefined {
  const u = username.trim().toLowerCase();
  return file.users.find((x) => x.username.toLowerCase() === u);
}

export function findById(file: UsersFile, id: string): UserRecord | undefined {
  return file.users.find((x) => x.id === id);
}

export function newUserId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function createUser(opts: {
  username: string;
  passwordHash: string;
  role: Role;
  expiresAt?: number | null;
}): UserRecord {
  return {
    id: newUserId(),
    username: opts.username.trim(),
    passwordHash: opts.passwordHash,
    role: opts.role,
    active: true,
    expiresAt: opts.expiresAt ?? null,
    createdAt: Date.now(),
    lastLoginAt: null,
  };
}

export function publicUser(u: UserRecord) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    active: u.active,
    expiresAt: u.expiresAt,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}
