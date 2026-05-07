import * as path from "path";
import * as os from "os";

export interface ServerConfig {
  dataDir: string;
  port: number;
  tokenTtlSeconds: number;
  renewalThresholdSeconds: number;
  superadminBootstrap: { username: string; password: string };
  refereeBootstrap: { username: string; password: string }[];
  /**
   * Optional path to a directory of static files (e.g., a Next.js `out/` build).
   * When set, the server mounts it at "/" with proper SPA-style fallback so the
   * web app can be served from the same origin as the API.
   */
  staticDir?: string | null;
}

export function defaultDataDir(): string {
  if (process.env.KARATE_DATA_DIR) return process.env.KARATE_DATA_DIR;
  return path.join(os.homedir(), ".karate-tournament");
}

export function defaultConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    dataDir: overrides.dataDir ?? defaultDataDir(),
    port: overrides.port ?? Number(process.env.KARATE_PORT ?? 47291),
    tokenTtlSeconds: overrides.tokenTtlSeconds ?? 24 * 60 * 60,
    renewalThresholdSeconds: overrides.renewalThresholdSeconds ?? 20 * 60 * 60,
    superadminBootstrap: overrides.superadminBootstrap ?? {
      username: "superadmin",
      password: "KarateAdmin2024!",
    },
    refereeBootstrap: overrides.refereeBootstrap ?? [
      { username: "referee1", password: "Ref1Pass#2024" },
      { username: "referee2", password: "Ref2Pass#2024" },
      { username: "referee3", password: "Ref3Pass#2024" },
    ],
    staticDir: overrides.staticDir ?? null,
  };
}

export const PATHS = {
  keys: "keys",
  privateKey: "keys/private.pem",
  publicKey: "keys/public.pem",
  users: "users.json",
  data: "tournament.json",
  activity: "activity.log",
  uploads: "uploads",
  logo: "uploads/logo",
};
