import type { ServerConfig } from "./config";
import { loadUsers, saveUsers, hashPassword, createUser } from "./users";

export async function seedUsers(config: ServerConfig): Promise<void> {
  const file = loadUsers(config.dataDir);
  let changed = false;

  const wanted: { username: string; password: string; role: "superadmin" | "referee" }[] = [
    { ...config.superadminBootstrap, role: "superadmin" },
    ...config.refereeBootstrap.map((u) => ({ ...u, role: "referee" as const })),
  ];

  for (const w of wanted) {
    const exists = file.users.some((u) => u.username.toLowerCase() === w.username.toLowerCase());
    if (exists) continue;
    const passwordHash = await hashPassword(w.password);
    file.users.push(createUser({ username: w.username, passwordHash, role: w.role }));
    changed = true;
  }

  if (changed) saveUsers(config.dataDir, file);
}
