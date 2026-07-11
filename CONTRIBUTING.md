# Contributing to tsk

This repo is now a small npm workspace monorepo.

## Workspaces

- `apps/web`: the current Vite + React web app
- `apps/mobile`: reserved for the future Expo app
- `apps/desktop`: reserved for the future desktop shell
- `packages/shared`: intended home for shared types, utilities, and design tokens

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- A Basic.tech account is optional for local UI work

## Getting Started

```bash
npm install
npm run dev
```

Root scripts currently proxy to the web app workspace:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

You can also target the web workspace directly:

```bash
npm run dev --workspace @tsk/web
```

## Key Paths

```text
tsk/
├── apps/
│   ├── web/
│   │   ├── basic.config.ts
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── mobile/
│   └── desktop/
├── packages/
│   └── shared/
├── AUDIT_PROGRESS.md
├── README.md
└── package.json
```

## Architecture Notes

- Basic.tech schema and project config live in `apps/web/basic.config.ts`.
- The web app still has a large `App.tsx` plus several oversized UI components. Splitting state and view concerns further would be a good next refactor.
- Theme preferences and a good amount of UI state still live in localStorage.
- Weather data is fetched from Open-Meteo and stored alongside schedule items.

## Current Cleanup Direction

- Prefer removing dead dependencies and stale generated artifacts before adding new packages.
- Treat Basic.tech SDK-specific bugs as lower priority for now because a broader SDK upgrade is expected later.
- When extracting shared code for mobile/desktop, start with types and pure utilities before moving UI.

## Verification

Before shipping changes to the web app, run:

```bash
npm run build
npm run lint
```
