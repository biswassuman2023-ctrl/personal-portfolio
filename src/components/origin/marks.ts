/**
 * The hand-drawn marks: the circle, the arrows, the underline.
 *
 * These are the one thing on the spread most likely to betray it. A mark drawn
 * with a geometry primitive — `<circle>`, a straight `<line>`, a filled
 * triangle arrowhead — reads as interface the instant you look at it, however
 * warm the colour is. Three things are doing the work here instead:
 *
 *   OVERSHOOT. A hand closing a circle does not stop where it started; it
 *   carries past and lifts. The circle below runs about a fifth of a lap
 *   beyond its own beginning, which is the single strongest tell.
 *
 *   ASYMMETRY. Every quadrant of every curve has different control handles.
 *   A shape whose four quarters match is a shape a machine drew.
 *
 *   OPEN HEADS. Arrowheads are two separate strokes that meet at the tip and
 *   are slightly uneven, never a closed filled shape.
 *
 * Paths are authored against the caller's own width and height rather than a
 * fixed viewBox, so a mark stretched to fit a wide word keeps an even stroke
 * weight instead of thickening along one axis.
 */

const n = (v: number) => v.toFixed(1)

/**
 * A loose circle round a word, drawn anticlockwise from the left and carried
 * past its own start.
 */
export function looseCircle(w: number, h: number): string {
  const p = (fx: number, fy: number) => `${n(fx * w)} ${n(fy * h)}`

  return [
    `M ${p(0.055, 0.46)}`,
    `C ${p(0.035, 0.22)}, ${p(0.24, 0.06)}, ${p(0.5, 0.05)}`,
    `C ${p(0.75, 0.04)}, ${p(0.97, 0.19)}, ${p(0.955, 0.47)}`,
    `C ${p(0.945, 0.74)}, ${p(0.72, 0.94)}, ${p(0.46, 0.93)}`,
    `C ${p(0.22, 0.92)}, ${p(0.045, 0.74)}, ${p(0.065, 0.47)}`,
    // past the start and lifting — the overshoot
    `C ${p(0.075, 0.34)}, ${p(0.135, 0.2)}, ${p(0.3, 0.115)}`,
  ].join(' ')
}

/**
 * An arrow sweeping up and to the right — drawn from the lower left, so it
 * reads as pointing AT the thing it ends on rather than away from it.
 */
export function arcArrow(w: number, h: number): string {
  const p = (fx: number, fy: number) => `${n(fx * w)} ${n(fy * h)}`

  return [
    // shaft
    `M ${p(0.04, 0.9)}`,
    `C ${p(0.3, 0.86)}, ${p(0.58, 0.68)}, ${p(0.92, 0.16)}`,
    // head: two strokes meeting at the tip, deliberately uneven
    `M ${p(0.63, 0.28)} L ${p(0.94, 0.13)}`,
    `M ${p(0.84, 0.53)} L ${p(0.94, 0.13)}`,
  ].join(' ')
}

/**
 * The small connector between two beats of the journey: a controlled,
 * near-vertical stroke rather than a squiggle.
 *
 * An earlier version mirrored the whole curve left-to-right on every other
 * connector, which reads as a zigzag once four of them are stacked — a path
 * that visibly changes its mind about which way it's bowing is what "random
 * squiggle" actually looks like. This one only ever drifts, never reverses:
 * `drift` nudges the shaft a few degrees off true, the same small amount of
 * imperfection a hand adds redrawing a short vertical stroke five times, and
 * every connector leans the same general way. The head is two short strokes
 * meeting at the tip, open rather than filled, which is what keeps it an
 * annotation instead of a UI arrowhead.
 */
export function stepArrow(w: number, h: number, drift = 0): string {
  const p = (fx: number, fy: number) => `${n(fx * w)} ${n(fy * h)}`
  const x = (v: number) => 0.5 + (v - 0.5) * 0.3 + drift

  return [
    `M ${p(x(0.5), 0.03)}`,
    `C ${p(x(0.42), 0.34)}, ${p(x(0.56), 0.6)}, ${p(x(0.5), 0.88)}`,
    `M ${p(x(0.3), 0.68)} L ${p(x(0.5), 0.93)}`,
    `M ${p(x(0.7), 0.68)} L ${p(x(0.5), 0.93)}`,
  ].join(' ')
}

/**
 * Underline for the closing line. Two passes, because one clean stroke under a
 * sentence is a text-decoration and two slightly disagreeing ones are a pen.
 */
export function handUnderline(w: number, h: number): string {
  const p = (fx: number, fy: number) => `${n(fx * w)} ${n(fy * h)}`

  return [
    `M ${p(0.01, 0.42)}`,
    `C ${p(0.26, 0.12)}, ${p(0.58, 0.72)}, ${p(0.99, 0.3)}`,
    `M ${p(0.04, 0.78)}`,
    `C ${p(0.32, 0.5)}, ${p(0.62, 0.98)}, ${p(0.96, 0.62)}`,
  ].join(' ')
}

/**
 * A strip of masking tape.
 *
 * The ends are torn, not cut: the short edges step in and out a little, and
 * the two long edges are not parallel. Tape pulled off a roll by hand is never
 * a rectangle, and a rectangle at 40% opacity is the most obvious fake on a
 * page like this.
 */
export function tapeStrip(w: number, h: number): string {
  const p = (fx: number, fy: number) => `${n(fx * w)} ${n(fy * h)}`

  return [
    `M ${p(0.02, 0.14)}`,
    `L ${p(0.16, 0.05)} L ${p(0.34, 0.11)} L ${p(0.58, 0.03)} L ${p(0.8, 0.1)} L ${p(0.97, 0.06)}`,
    `L ${p(0.94, 0.42)} L ${p(0.99, 0.72)} L ${p(0.95, 0.94)}`,
    `L ${p(0.78, 0.88)} L ${p(0.55, 0.97)} L ${p(0.33, 0.9)} L ${p(0.12, 0.96)} L ${p(0.03, 0.9)}`,
    `L ${p(0.06, 0.6)} L ${p(0.01, 0.38)}`,
    'Z',
  ].join(' ')
}
