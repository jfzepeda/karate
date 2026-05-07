# Karate Tournament — Monorepo

Distributable, role-aware karate tournament scoring system. Ships as a Next.js
web app, a Node.js (Express + JWT) license/data server, and an Electron
desktop wrapper that bundles both into a single `.exe` / `.dmg` / `.AppImage`.

## Layout

```
karate/
├── apps/
│   ├── web/                Next.js 15 (App Router) + Tailwind — the renderer
│   ├── server/             Express + JWT (RS256) + bcrypt + admin panel
│   └── desktop/            Electron wrapper (main.js, preload.js, builder cfg)
├── packages/
│   └── core/               Pure logic + types (TypeScript)
├── legacy/index.html       Original single-file app (preserved for reference)
├── mock-participants.csv   180-row sample roster
├── passwords.txt           Seed credentials for testing
└── ...
```

## Quick start (development)

```bash
pnpm install

# 1. Start the backend (port 47291; data dir defaults to ~/.karate-tournament)
pnpm --filter @karate/server dev

# 2. In another terminal, run the Next.js dev server (port 3000)
pnpm --filter @karate/web dev
```

Open http://localhost:3000. The web app talks to the backend at
`http://127.0.0.1:47291` by default; override via the
`NEXT_PUBLIC_KARATE_SERVER_URL` env var or the `karate.serverUrl` localStorage
key.

The first launch seeds the accounts listed in `passwords.txt` (one superadmin,
three referees). Sign in to be routed by role:

- `superadmin` → `/superadmin` (categories / competitors / seeding / areas / logo)
- `referee` → `/area-select` → `/admin` filtered to the chosen area

The audience display is anonymous. Open `/public` in a separate tab and press
**F** for fullscreen.

## Quick start (desktop build)

```bash
pnpm install
pnpm --filter @karate/desktop dev          # spawns Electron + bundled server
```

To produce installers:

```bash
pnpm --filter @karate/desktop package      # current platform
pnpm --filter @karate/desktop package:mac  # .dmg
pnpm --filter @karate/desktop package:win  # .exe (NSIS)
pnpm --filter @karate/desktop package:linux # .AppImage
```

The desktop wrapper:

1. Spawns the Express server in-process on a random localhost port.
2. Hosts the Next.js static export from that same server (single origin).
3. Loads the renderer at the resolved URL; preload exposes
   `window.__KARATE__` with `{ isElectron, serverUrl, openPublicWindow() }`.
4. Persists data + RSA keys + activity log under
   `~/.karate-tournament/` — nothing inside the app bundle is mutated.

## Roles & access control

| Role         | Can configure | Can referee | Sees admin panel |
| ------------ | ------------- | ----------- | ---------------- |
| `superadmin` | yes           | yes         | yes              |
| `referee`    | no            | yes         | no               |

Referees are scoped to a single competition **Area**. Areas are auto-distributed
by a greedy bin-packer that:

1. Balances the total number of subcategories per area.
2. Keeps each category's subcategories together where possible.

The superadmin can override any assignment from the **Tournament Setup → View
area assignments** panel.

## Auth flow

- Login with username + password → server returns a JWT signed RS256 with
  the keypair generated on first launch (under `<dataDir>/keys/`).
- Tokens are valid for 24 h. The app silently renews when the token age
  exceeds 20 h.
- Renewal sends the cached credentials. If the account is deactivated the
  server returns 401 and the desktop app shows a lock screen.
- The audience scoreboard requires no login — it mirrors live state from
  the authed admin/private windows over BroadcastChannel.

## Admin panel

Visit `<server>/admin-panel` (e.g. http://127.0.0.1:47291/admin-panel) and
sign in with the superadmin account. Sections:

- **Licenses / Users** — create accounts, set expiry dates, deactivate or
  delete users, reset passwords.
- **Content** — JSON editor over the live tournament data file.
- **Files** — upload / replace / remove the tournament logo (max 2 MB; PNG,
  JPG, or SVG). The logo appears centered in both the private referee view
  and the public scoreboard.
- **Activity Log** — login attempts, renewals, user mutations, IP addresses.

## Tournament configuration (superadmin web UI)

The `/superadmin` route is a single-page dashboard with five sections:

1. **Categories** — editable list of categories (name, accepted belts, age
   range). Belts are multi-select; an empty selection means "any belt".
   `maxAge: null` means "unlimited".
2. **Competitors** — per-category roster with CSV import / export, inline
   add, and per-row remove.
3. **Seeding** — view the current Mulberry32 random seed. Generate a new
   one (with confirmation) or set an explicit value to reproduce a prior
   bracket. Re-seeding rebuilds every bracket from scratch.
4. **Tournament Setup** — group size (4 / 8 / 16), discipline mode (combat /
   kata / both), point-difference auto-finish, number of areas, and the
   area-assignments matrix.
5. **Logo** — upload, preview, replace, remove.

## Loading participants

CSV format: header `nombre,apellido,beltColor,age`. Belt accepts English
(`yellow`, `brown`, `black`…) or Spanish aliases (`amarillo`, `marrón`,
`negro`…). Age is an integer 3–99.

`mock-participants.csv` at the repo root is a 180-row sample. Load it from
the **Competitors** section's *Import CSV…* button to populate the
tournament instantly. The superadmin dashboard also has a **Load demo
tournament** button that swaps in the spec-defined 4-category /
~180-competitor mock with realistic Spanish names.

## Architecture notes

- **`@karate/core`** is pure TypeScript — no React, no DOM. It owns the
  domain model: types, default category definitions, seeding (Mulberry32),
  area assignment, subcategory generation (R=0/1/2/3 + cascading), winner
  / tiebreaker logic, CSV parser/serializer, navigation, mock data, and
  finalize/propagate functions that mutate an `AppState`.
- **`@karate/server`** is consumed both by `apps/server/src/standalone.ts`
  (web mode) and by Electron's main process (`apps/desktop/main.js`) via
  the same `createServer()` factory. Optional `staticDir` lets the desktop
  build serve the Next.js export from the same origin as the API.
- **`@karate/web`** wraps everything in three providers: `AuthProvider`
  (token cache + 20 h auto-renewal), `StoreProvider` (canonical `AppState`,
  persisted to localStorage `karate-state-v5`, synced via BroadcastChannel),
  and `AreaProvider` (current area selection per referee). Routes are
  guarded by `<AuthGate roles={[…]}>` layouts.
- **`@karate/desktop`** is a thin Electron wrapper. `main.js` spawns the
  in-process Express server, then opens BrowserWindows pointed at the
  resolved localhost URL. `preload.js` exposes `window.__KARATE__` to the
  renderer with `additionalArguments`-passed serverUrl.
- **Cross-window sync** uses BroadcastChannel as primary, `storage` events
  as fallback for cross-Electron-window communication (same origin shares
  localStorage).

## Server config

| Env var               | Default                  | Purpose                            |
| --------------------- | ------------------------ | ---------------------------------- |
| `KARATE_DATA_DIR`     | `~/.karate-tournament`   | Where users / keys / data / logs live |
| `KARATE_PORT`         | `47291`                  | Server port (`0` = random free)    |
| `NEXT_PUBLIC_KARATE_SERVER_URL` | `http://127.0.0.1:47291` | Web client → server URL |

## Test credentials

See `passwords.txt`. Rotate before deploying to operators.
