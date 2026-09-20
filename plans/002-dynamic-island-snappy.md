# 002 — Snappy Dynamic Island mode switches

- **Status**: DONE
- **Commit**: bc8294a
- **Severity**: HIGH
- **Category**: Purpose & frequency / Easing & duration
- **Estimated scope**: 1 file (`DynamicIsland.tsx`)

## Problem

`apps/web/src/components/DynamicIsland.tsx:883–890` wraps high-frequency mode switches (command palette ↔ task ↔ event ↔ default) in `AnimatePresence mode="wait"` with `y: 5` slides. Command/keyboard-driven UI should not animate content swaps — Raycast pattern: morph shell optionally, content snaps.

Also `height: 'auto'` at `:872` forces layout animation on every expand.

## Target

- Keep shell morph: `borderRadius` + height, duration `0.15`, ease `[0.32, 0.72, 0, 1]` (`--ease-drawer`).
- Content mode switches: opacity-only, `duration: 0.08`, **no `y`**, drop `mode="wait"` (use `mode="sync"` or remove wait so exit doesn't block enter).
- Command palette branch: `initial={false}` / no enter animation when opening command mode.

## Steps

1. Change content `initial`/`exit` from `{ opacity: 0, y: 5 }` to `{ opacity: 0 }` (and matching animate).
2. Set transitions to `{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }`.
3. Replace `AnimatePresence mode="wait"` with `AnimatePresence initial={false}` (no wait).
4. Leave shell `height` morph as-is this pass (separate layout perf plan if needed).

## Boundaries

- Do NOT redesign island UX.
- Do NOT touch TaskModal springs.

## Verification

- Feel: spam mode switches / Esc — content crossfades without vertical bob; no wait gap.
- Done when: no `y:` on DynamicIsland content presence animations.
