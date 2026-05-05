# Karate Tournament — Monorepo

Next.js + Turborepo conversion of the original single-file karate tournament scoring app.

## Layout

```
karate/
├── apps/
│   └── web/                Next.js 15 (App Router) + Tailwind v4
│       ├── app/
│       │   ├── admin/      Bracket management
│       │   ├── private/    Referee scoreboard
│       │   └── public/     Audience display (chromeless)
│       ├── components/
│       └── lib/store.tsx   React context + BroadcastChannel sync
├── packages/
│   └── core/               Pure logic + types (TypeScript)
│       └── src/
│           ├── types.ts
│           ├── data.ts            Mock rosters
│           ├── subcategories.ts   Generation rules (R=0/1/2/3 + cascading)
│           ├── winner.ts          Combat / Kata winner computation
│           └── state.ts           Initial state, lookups, finalize/propagate
├── legacy/index.html       Original single-file app (preserved for reference)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json            Root scripts: build / dev / lint / typecheck
```

## Run

```bash
pnpm install
pnpm dev                    # turbo dev → next dev on :3000
```

Open http://localhost:3000 — redirects to `/admin`. The public view at `/public` is chromeless and meant for fullscreen.

## Loading participants

The app starts with **no participants** and no categories. Open
**Tournament Settings** in the admin sidebar to:

- **Load from CSV** — upload a file with header `nombre,apellido,beltColor,age`. Belt accepts English (`yellow`, `brown`, `black`…) or Spanish aliases (`amarillo`, `marrón`, `negro`…). Age must be an integer.
- **Add participant** — inline form for one-off entries.
- **Download current** — export the active roster as CSV.

`mock-participants.csv` at the repo root is a 180-row sample (the original mock data preserved for reference) — load it from the modal to populate the tournament instantly.

Categories are derived automatically by `(beltColor, ageRange)`. Age ranges: `4-6`, `7-9`, `10-12`, `13-15`, `16-17`, `adult` (18+). Within each category, the chosen subcategory size + remainder rules build the brackets.

## Architecture notes

- **`@karate/core`** is a pure-TypeScript workspace package; no React, no DOM. It exports types, the state shape, subcategory generation (with R=0/1/2/3 rules and G=8/16 cascading), winner/tiebreaker logic, CSV parser/serializer, category derivation, and finalize/propagate functions that mutate an `AppState`.
- **`@karate/web`** consumes core through `transpilePackages`. The `StoreProvider` (`apps/web/lib/store.tsx`) holds the canonical `AppState` in React state, persists to `localStorage` (key bumped to `karate-state-v3`), and broadcasts cross-tab via `BroadcastChannel`. Each action does a structured-clone, mutates, and re-publishes — keeps reducers easy to read.
- **Routing** uses the App Router with three pages (`/admin` `/private` `/public`). Body classes are toggled by `BodyClassSync` based on pathname (`is-public` `is-private`) and on `state.match.discipline === "kata"` (`match-kata`), which the CSS uses to hide the timer column, penalties, and senshu star in kata matches.
- **Timer** runs in any private-view tab that has claimed `karate-timer-owner-v3` — multiple private tabs cooperate without double-ticking.
- **Jury popup** is global state (`state.jury`); rendered in the root layout so it overlays every view.
