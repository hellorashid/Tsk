# 001 — Add motion tokens + prefers-reduced-motion

- **Status**: DONE
- **Commit**: bc8294a
- **Severity**: HIGH
- **Category**: Cohesion & tokens / Accessibility
- **Estimated scope**: 1–2 files

## Problem

No shared easing/duration tokens and zero `prefers-reduced-motion` handling in `apps/web/src`. Motion values are hand-typed (`[0.32, 0.72, 0, 1]`, `duration-200`, `ease-out`) and movement never softens for reduced-motion users.

## Target

In `apps/web/src/index.css` under `@theme` / `:root`:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
--duration-fast: 100ms;
--duration-ui: 200ms;
--duration-drawer: 250ms;
```

And:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

(Keep opacity feedback via near-instant transitions; drop perceptible movement.)

## Steps

1. Add tokens + reduced-motion block to `apps/web/src/index.css`.
2. Do not change component files in this plan.

## Boundaries

- Do NOT refactor Motion.js springs yet.
- Do NOT add dependencies.

## Verification

- Mechanical: `npm run lint --workspace=@tsk/web`
- Feel: DevTools → Rendering → emulate `prefers-reduced-motion: reduce`; open a drawer — no slide, near-instant appear.
- Done when: tokens exist and reduced-motion collapses CSS transitions.
