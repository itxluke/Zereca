/** Keep ordinary frame timing while excluding time spent paused or in another tab.
 * Call reset() on visibilitychange: hidden tabs may receive no ticker callbacks.
 * Returned milliseconds are a private monotonic clock for Lenis. */
export function createCinemaFrameClock(maxStepMs = 50) {
 const cap = Number.isFinite(maxStepMs) && maxStepMs > 0 ? maxStepMs : 50;
 let previous: number | undefined;
 let current: number | undefined;
 return {
  step(nowMs: number, active = true): number | null {
   if (!active || !Number.isFinite(nowMs)) {
    previous = undefined;
    return null;
   }
   // A positive first timestamp avoids Lenis's `this.time || time` zero case.
   current ??= Math.max(1, nowMs);
   if (previous !== undefined) current += Math.max(0, Math.min(cap, nowMs - previous));
   previous = nowMs;
   return current;
  },
  reset() { previous = undefined; },
 };
}
