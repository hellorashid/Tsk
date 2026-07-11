# Audit Progress

## Scope

- Full codebase audit for cleanup, dead code/files, simplification, stale docs/comments, bugs, and package/tooling debt.
- Basic.tech SDK-specific bugs are lower priority and may be deferred where appropriate.
- Convert the project from a single-package app into a simple monorepo that can host web, desktop, and Expo/mobile apps later.

## Working Notes

### Initial repo state

- Single Vite + React + TypeScript app at repo root.
- Build succeeds on the current codebase.
- Lint fails with 118 findings: 16 errors and 102 warnings.
- Production bundle is large: main JS chunk is about 1.07 MB before gzip.
- `dist/` is present in the repo and may be stale generated output.

### Current repo state

- Workspace monorepo structure is in progress:
  - `apps/web` contains the existing app
  - `apps/mobile` and `apps/desktop` are placeholder workspaces
  - `packages/shared` is reserved for future shared code
- Root linting now uses a single ESLint v9 flat config entrypoint.
- Lightweight Vitest coverage exists for extracted pure schedule/task helpers.

### Initial audit themes

- Tooling is partly modernized and partly stale:
  - React 19 is present.
  - Vite is still on the v4 line.
  - ESLint config is older and permissive in the wrong places while still failing on low-value issues.
- App structure is highly centralized:
  - `src/App.tsx` is very large and owns a wide set of unrelated concerns.
  - Several components appear oversized and prop-heavy.
- Likely cleanup areas:
  - Unused imports, helpers, props, and local variables.
  - Empty callback placeholders and `any` usage.
  - Potential dead files/assets/CSS after dependency tracing.
  - Stale README claims vs current code behavior.

## Findings Log

### Confirmed

- Build warning: outdated Browserslist database.
- Build warning: oversized bundle with poor code-splitting.
- ESLint warning: missing React version setting.
- Multiple lint errors are straightforward cleanup items:
  - unescaped apostrophes in JSX
  - missing `rel` on `target="_blank"` links
  - empty no-op callbacks
  - unnecessary primitive type annotations
- Dead dependencies identified in the original single-package setup:
  - `@dnd-kit/core`
  - `@dnd-kit/utilities`
  - `@heroicons/react`
  - `motion`
  - `vaul`
  - `workbox-cli`
- Dead assets identified:
  - `src/assets/sunrise.svg`
  - `src/assets/sunset.svg`
- The upgraded web app now builds successfully from the workspace root on Vite 7.
- Lint now runs successfully from the workspace root with zero warnings.
- Production bundle improved but is still large:
  - previous main JS chunk was about 1.07 MB before gzip
  - current main JS chunk is about 972 KB before gzip
- `npm audit --omit=dev` still reports four production vulnerabilities, all tied to the Basic.tech dependency chain or transitive URI tooling.
- Shared schedule-domain types now live outside the view layer in `apps/web/src/utils/schedule.ts`.
- `App.tsx` has been reduced materially and now delegates persisted UI state, task derivation, actions, and keyboard shortcuts to dedicated hooks.
- The web app now builds, lints, and tests successfully against `@basictech/react@0.9.0-beta.0`.
- Basic 0.9 required a full SDK surface migration:
  - `db.collection(...)` to `db.table(...)`
  - `.add(...)` to `.create(...)`
  - `.update(...)` to `.patch(...)`
  - auth method/state updates such as `signIn`, `signOut`, and `isReady`
  - `dbStatus` UI usage moved to the newer sync status model
- Basic 0.9 also changed startup behavior enough that synced queries/writes must wait for the `own` subscription to be open; the app now guards initial reads/writes on a shared DB-readiness hook to avoid signed-out/bootstrap crashes.

### Under review

- Dead files/assets and checked-in generated artifacts.
- Whether root-level CSS files are all still used.
- Whether some feature areas should be split into isolated packages before monorepo migration.
- Package upgrade compatibility, especially around Vite, ESLint, and PWA/workbox setup.
- `DynamicIsland.tsx` and `TimelineView.tsx` are cleaner and more strongly typed, but are still larger than ideal and remain the best targets for the next extraction pass.

## Change Log

- Created this audit tracker.
- Added a workspace root package and placeholder mobile/desktop workspaces.
- Moved the active web app into `apps/web`.
- Removed two unused weather SVG assets.
- Replaced repeated native input picker logic with a shared helper.
- Cleaned up several accessibility and security issues in UI components.
- Removed dead dependencies from the active web workspace package:
  - `@dnd-kit/core`
  - `@dnd-kit/utilities`
  - `@heroicons/react`
  - `motion`
  - `vaul`
  - `workbox-cli`
- Upgraded core web tooling and UI packages in the web workspace.
- Refreshed root docs to reflect the monorepo structure.
- Migrated linting to root `eslint.config.mjs` using ESLint v9 flat config plus `typescript-eslint` v8.
- Added shared schedule/task helper modules and app-level orchestration hooks:
  - `apps/web/src/utils/schedule.ts`
  - `apps/web/src/utils/taskCollections.ts`
  - `apps/web/src/hooks/useHomeUiState.ts`
  - `apps/web/src/hooks/useTaskCollections.ts`
  - `apps/web/src/hooks/useAppActions.ts`
  - `apps/web/src/hooks/useHomeKeyboardShortcuts.ts`
- Added lightweight utility tests for schedule/date/task derivation logic.
- Burned the web workspace lint baseline down to zero warnings/errors.
- Upgraded `@basictech/react` from `0.8.0-beta.4` to `0.9.0-beta.0`.
- Migrated the web app to the Basic 0.9 database/auth APIs without changing product behavior.
- Added a shared Basic DB readiness hook and guarded startup query/write paths that were touching synced tables before the subscription had opened.
- Hardened Basic-backed reads with safe fallbacks so early Sync/2 subscription races do not throw into React during signed-out/bootstrap states.

## Verification

- `npm install`
- `npm run build`
- `npm run lint`
- `npm run test`
- Local runtime smoke check now passes on `http://localhost:5173/` after the Basic 0.9 guard fix:
  - app renders after reload
  - browser console is clean
  - the previous `subscription 'own' is not open` startup error no longer appears

## Design And UX Notes

- The visual style is distinctive and memorable. The sunset illustration gives the product personality immediately.
- The main weakness is task density in empty and low-data states:
  - desktop dedicates a very large amount of space to the background art
  - the primary create surface feels visually secondary until you look near the bottom edge
  - the right rail carries most of the useful information, which makes the center column feel underutilized
- Discoverability needs work:
  - several icon-only actions still depend on guesswork
  - the create controls are elegant but not very explanatory for first-time users
  - keyboard power features are a strength, but the UI does not teach them enough
- Mobile holds up better than expected, but:
  - the background still dominates above-the-fold attention
  - the nav icons are clear only after a short learning period
  - the create action could be more explicit or more central

## Suggested Product Changes

- Move the primary create affordance higher in empty states so the first action is obvious.
- Use the center column more intentionally on desktop:
  - show onboarding tips
  - show recent tasks
  - show suggested actions
  - show a lightweight “today focus” card
- Reduce decorative background contrast slightly behind primary content cards and text.
- Add more explicit labels or tooltips for icon-first actions, especially settings, view toggles, and create affordances.
- Consider a “first task” or “plan your day” guided state for new users instead of a mostly ambient empty canvas.
- Quiet non-essential console logging in development and especially production builds if any of it leaks beyond dev.

## Pending

- Further decomposition of `DynamicIsland.tsx` and especially `TimelineView.tsx` into smaller view/controller/helper modules.
- Reducing bundle size with targeted code-splitting.
- Re-evaluating production dependency vulnerabilities after the Basic 0.9 migration settles and any server/schema-side follow-ups are confirmed.
