# 004 — Cap checkbox and progress durations under 300ms

- **Status**: DONE
- **Commit**: bc8294a
- **Severity**: MEDIUM
- **Category**: Easing & duration / Purpose & frequency
- **Estimated scope**: 2 files

## Problem

- `Checkbox.tsx:68` — `duration-500` on a 100+/day control (UI budget < 300ms; press feedback 100–160ms).
- `AgendaView.tsx:210` — progress ring `transition-all duration-500` (animate `stroke-dashoffset` only, ≤200ms).

## Target

```tsx
// Checkbox
className={`... transition-[background-color,border-color] duration-150 ...`}

// AgendaView ProgressRing circle
className="transition-[stroke-dashoffset] duration-200 ease-out"
```

Tick path Motion transitions already at `0.1s` — leave them.

## Boundaries

- Do NOT change checkbox spring/tick path configs beyond durations already ≤100ms.

## Verification

- Toggle tasks rapidly — fill color snaps ≤150ms, no sluggish 500ms wash.
