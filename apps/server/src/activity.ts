import * as path from "path";
import { appendLine, readLines } from "./storage";

export type ActivityAction =
  | "login"
  | "renew"
  | "logout"
  | "user_create"
  | "user_update"
  | "user_deactivate"
  | "user_activate"
  | "user_delete"
  | "data_update"
  | "logo_upload"
  | "logo_remove"
  | "session_revoke"
  | "session_revoke_all"
  | "generate_launch"
  | "prepare_download"
  | "access_extend";

export interface ActivityEntry {
  ts: number;
  username: string | null;
  action: ActivityAction;
  result: "success" | "fail";
  ip: string | null;
  message?: string;
}

function file(dataDir: string): string {
  return path.join(dataDir, "activity.log");
}

export function logActivity(dataDir: string, entry: ActivityEntry): void {
  appendLine(file(dataDir), JSON.stringify(entry));
}

export function readActivity(dataDir: string, max = 500): ActivityEntry[] {
  const lines = readLines(file(dataDir), max);
  const out: ActivityEntry[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip malformed
    }
  }
  return out.reverse();
}
