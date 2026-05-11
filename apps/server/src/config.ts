import * as path from "path";
import * as os from "os";
import type { Role, Feature } from "@karate/core";

export interface LaunchConfig {
  issuedAt: number;
  expiresAt: number;
  sessionTtlSeconds?: number;
  role: Role;
  data: Record<string, unknown>;
}

export interface ServerConfig {
  dataDir: string;
  port: number;
  staticDir?: string | null;
  launchConfig?: LaunchConfig | null;
  /** Test claim codes seeded on first boot. See passwords.txt. */
  seedClaimCodes: Array<{ code: string; role: Role; features: Feature[]; label: string }>;
}

export function defaultDataDir(): string {
  if (process.env.KARATE_DATA_DIR) return process.env.KARATE_DATA_DIR;
  return path.join(os.homedir(), ".karate-tournament");
}

const FULL_SUPERADMIN: Feature[] = [
  "scoring",
  "public_display",
  "bracket_view",
  "tournament_config",
  "logo_upload",
  "user_management",
  "activity_log",
];

const FULL_REFEREE: Feature[] = ["scoring", "public_display", "bracket_view"];

export function defaultConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    dataDir: overrides.dataDir ?? defaultDataDir(),
    port: overrides.port ?? Number(process.env.KARATE_PORT ?? 47291),
    staticDir: overrides.staticDir ?? null,
    launchConfig: overrides.launchConfig ?? null,
    seedClaimCodes: overrides.seedClaimCodes ?? [
      { code: "482719", role: "superadmin", features: FULL_SUPERADMIN, label: "Dev Superadmin" },
      { code: "305847", role: "referee", features: FULL_REFEREE, label: "Test Referee 1" },
      { code: "671234", role: "referee", features: FULL_REFEREE, label: "Test Referee 2" },
      { code: "918273", role: "referee", features: FULL_REFEREE, label: "Test Referee 3" },
      { code: "774410", role: "referee", features: FULL_REFEREE, label: "Unassigned spare" },
    ],
  };
}

export const FEATURE_PRESETS = {
  superadmin: FULL_SUPERADMIN,
  referee: FULL_REFEREE,
};

export const PATHS = {
  keys: "keys",
  privateKey: "keys/ed25519-private.pem",
  publicKey: "keys/ed25519-public.pem",
  licenses: "licenses.json",
  data: "tournament.json",
  activity: "activity.log",
  uploads: "uploads",
  logo: "uploads/logo",
  downloads: "downloads",
};
