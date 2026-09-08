/**
 * A tiny seeded PRNG (mulberry32).
 *
 * Every stamp that gets pressed onto the page is a fresh, short-lived
 * instance — there could be dozens across one visit — and each one needs its
 * own small set of imperfections (which edge is broken, which corner inked
 * lighter, how far it sits off true) that stay FIXED for that one stamp's
 * lifetime but never repeat the exact same flaw twice. A shared `Math.random`
 * calls would work too, but seeding per-stamp means the same seed always
 * reproduces the same stamp, which is what makes the imperfections feel cut
 * into the rubber rather than jittered every frame.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
