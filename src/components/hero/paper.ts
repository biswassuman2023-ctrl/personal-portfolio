/**
 * Silhouettes for the paper artefacts pinned to the spread.
 *
 * Everything here is deliberately off-true. Cards bow a unit across their
 * length, corners take different radii, photo edges are deckled. Artefacts
 * drawn as exact rectangles read as HTML boxes no matter how they are shaded,
 * and that is the single loudest tell in a composition like this.
 */

/**
 * A deckle (feather) edge — the soft scalloped cut on a hand-torn print.
 * Walks each side emitting alternating shallow arcs.
 */
export function deckleRect(w: number, h: number, scallop = 9, amp = 1.3): string {
  const side = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0)
    const steps = Math.max(3, Math.round(len / scallop))
    const nx = -(y1 - y0) / len
    const ny = (x1 - x0) / len
    let d = ''
    for (let i = 1; i <= steps; i++) {
      const mid = (i - 0.5) / steps
      const swing = i % 2 ? 1 : -1
      const mx = x0 + (x1 - x0) * mid + nx * amp * swing
      const my = y0 + (y1 - y0) * mid + ny * amp * swing
      const ex = x0 + (x1 - x0) * (i / steps)
      const ey = y0 + (y1 - y0) * (i / steps)
      d += ` Q ${mx.toFixed(2)} ${my.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`
    }
    return d
  }

  return (
    'M 0 0' +
    side(0, 0, w, 0) +
    side(w, 0, w, h) +
    side(w, h, 0, h) +
    side(0, h, 0, 0) +
    ' Z'
  )
}

/** A guillotined sheet: straight, but bowed slightly and unequally cornered. */
export function cutRect(w: number, h: number, r = 1.5, bow = 0.7): string {
  return [
    `M ${r} ${bow * 0.3}`,
    `C ${w * 0.35} ${-bow * 0.5}, ${w * 0.7} ${bow * 0.6}, ${w - r} 0`,
    `Q ${w} 0, ${w} ${r}`,
    `C ${w + bow * 0.5} ${h * 0.35}, ${w - bow * 0.4} ${h * 0.7}, ${w} ${h - r}`,
    `Q ${w} ${h}, ${w - r} ${h}`,
    `C ${w * 0.7} ${h + bow * 0.6}, ${w * 0.3} ${h - bow * 0.4}, ${r} ${h}`,
    `Q 0 ${h}, 0 ${h - r}`,
    `C ${-bow * 0.4} ${h * 0.7}, ${bow * 0.5} ${h * 0.3}, 0 ${r}`,
    `Q 0 0, ${r} ${bow * 0.3}`,
    'Z',
  ].join(' ')
}

/**
 * A hand-cut oval tag. Every quadrant is a slightly different curve and the
 * ends do not match — a true ellipse here reads as a border-radius pill, which
 * is the one thing this shape must not look like.
 */
export function tagOval(w: number, h: number): string {
  const n = (v: number) => v.toFixed(2)
  const rx = w / 2
  const ry = h / 2

  /*
    A true ELLIPSE, four cubic quadrants, not a capsule. The distinction is the
    whole job here: a capsule has straight sides between two round ends, and
    straight sides plus a radius is exactly how a UI pill is built. An ellipse
    curves continuously, which is what a tag cut out of card actually looks
    like. Each quadrant's handles are nudged by a fraction of a unit so the four
    are not identical.
  */
  const k = 0.5523
  const q = [1.02, 0.97, 1.03, 0.98]

  return [
    `M 0.6 ${n(ry)}`,
    `C 0.6 ${n(ry - ry * k * q[0])}, ${n(rx - rx * k * q[0])} 0.4, ${n(rx)} 0.4`,
    `C ${n(rx + rx * k * q[1])} 0.4, ${n(w - 0.5)} ${n(ry - ry * k * q[1])}, ${n(w - 0.5)} ${n(ry)}`,
    `C ${n(w - 0.5)} ${n(ry + ry * k * q[2])}, ${n(rx + rx * k * q[2])} ${n(h - 0.4)}, ${n(rx)} ${n(h - 0.5)}`,
    `C ${n(rx - rx * k * q[3])} ${n(h - 0.6)}, 0.6 ${n(ry + ry * k * q[3])}, 0.6 ${n(ry)}`,
    'Z',
  ].join(' ')
}
