# 008 — Island measured height + timeline scaleX

- **Status**: DONE
- **Commit**: bc8294a
- **Severity**: MEDIUM
- **Category**: Performance

## Target

- DynamicIsland: ResizeObserver-measured pixel height instead of `height: 'auto'`; activity edit uses opacity/y instead of height auto.
- Timeline hover rail: `scaleX` instead of animating `width`.
