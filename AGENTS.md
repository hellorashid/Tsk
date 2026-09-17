# AGENTS.md

## Cursor Cloud specific instructions

`tsk.lol` is an npm-workspace monorepo. The only real product is the web app at
`apps/web` (a Vite + React + TypeScript app). `apps/mobile`, `apps/desktop`, and
`packages/shared` are empty placeholders with no runnable code, so all
lint/test/build/run work targets `@tsk/web`.

### Commands

Standard commands are defined in the root `package.json` (they proxy to the
`@tsk/web` workspace). Run them from the repo root:

- `npm run dev` — start the Vite dev server (defaults to `http://localhost:5173/`).
- `npm run lint` — ESLint (runs with `--max-warnings 0`, so any warning fails).
- `npm run test` — Vitest unit tests.
- `npm run build` — type-check (`tsc`) then production Vite build.

Dependencies are installed with `npm install` from the repo root (single root
lockfile for the whole workspace).

### Non-obvious notes

- Data/auth/sync is backed by the hosted [Basic.tech](https://basic.tech) service
  (`@basictech/react`, project config in `apps/web/basic.config.ts`). There is no
  local backend to run — the dev server alone is enough to exercise the app.
- The app is **local-first**: you can create/edit tasks, folders, and schedule
  items without signing in. Tasks persist locally and survive reloads, so a
  Basic.tech account is NOT required to test core functionality. Sign-in only
  matters for cross-device cloud sync.
- On a cold first load there is a brief DB-readiness race: writes are gated on a
  readiness hook (`apps/web/src/hooks/useBasicDbReady.ts`) and a task created in
  the very first moment may not render until the local DB reaches a ready
  `sync.status`. If a just-created task doesn't appear, wait for the app to
  finish its initial load (or reload once) and retry — this is expected startup
  behavior, not a bug.
- The production build emits a large (~1 MB) main JS chunk and a chunk-size
  warning; this is known/expected and does not indicate a broken build.
