# 003 — Replace transition-all on high-traffic UI

- **Status**: DONE
- **Commit**: bc8294a
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: ~8 files

## Problem

`transition-all` animates unintended layout/paint properties. Hot paths:

- `ListItem.tsx:124` — every task row
- `Checkbox.tsx:68` — every toggle
- `FoldersBar.tsx:49`, `SubtasksList.tsx`, `MobileNavBar.tsx:88`, `IconSidebar.tsx`, `AgendaView`/`ScheduleSidebar` icon buttons, `FocusView.tsx:144`

## Target

Replace with explicit properties:

| Current | Target |
| --- | --- |
| `transition-all duration-200` (rows/buttons) | `transition-colors duration-200` or `transition-[background-color,opacity,box-shadow] duration-200` |
| `transition-all duration-100` (FoldersBar) | `transition-colors duration-100` |
| Checkbox `transition-all duration-500` | `transition-[background-color,border-color] duration-150` (see plan 004) |

## Steps

1. Grep `transition-all` under `apps/web/src` and replace per table above.
2. Prefer `transition-colors` when only bg/text change; use `transition-opacity` when only opacity.

## Boundaries

- Do NOT change visual end states.
- Do NOT touch Motion.js `transition` props.

## Verification

- `rg 'transition-all' apps/web/src` → zero (or only justified leftovers noted).
- Feel: hover task rows — no layout jitter.
