# 005 — Strong drawer easing + modal scale floors

- **Status**: DONE
- **Commit**: bc8294a
- **Severity**: MEDIUM
- **Category**: Easing & duration / Physicality & origin
- **Estimated scope**: 4 files

## Problem

1. `AppDrawer.css:9,51` use built-in `ease-out` (weak). Drawer curve should be `cubic-bezier(0.32, 0.72, 0, 1)`; duration can stay 150–250ms.
2. Entrances from `scale: 0.8` in `TaskModal.tsx`, `EventModal.tsx`, `FocusView.tsx`, `MobileNavBar.tsx` — too close to `scale(0)`. Floor at `0.95`–`0.96`.

## Target

```css
/* AppDrawer.css */
transition: opacity 200ms cubic-bezier(0.32, 0.72, 0, 1);
transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
```

```tsx
initial={{ opacity: 0, y: 12, scale: 0.96 }}
// FocusView buttons: scale: 0.95
// MobileNavBar menu: keep 0.96; icon swap 0.8 → 0.95
```

## Boundaries

- Do NOT change drawer swipe physics beyond easing/duration.
- Modals stay centered (origin center OK).

## Verification

- Open task drawer at 10% playback — accelerates out, no sluggish ease-in feel.
- Modal sections no longer “pop from nowhere.”
