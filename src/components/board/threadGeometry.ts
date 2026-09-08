/**
 * The red thread between two tacks.
 *
 * A straight line between two points is a diagram connector; the difference
 * between that and a thread is that a thread has slack in it. Every run below
 * sags toward the floor at its midpoint — proportionally, so a short run
 * between two close tacks barely dips and a long one across the board hangs
 * visibly — which is the single detail doing most of the work here. It is
 * also why the sag is capped: past a point the curve stops reading as a
 * loose thread and starts reading as an arc someone drew on purpose.
 *
 * Quadratic rather than cubic. A real hanging thread is a catenary, and a
 * quadratic is close enough to one over these distances that the difference
 * is under a pixel — while being a third of the arithmetic to run sixty
 * times a second.
 */

const SAG_RATIO = 0.105
const SAG_MAX = 48

export function threadPath(x1: number, y1: number, x2: number, y2: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const sag = Math.min(len * SAG_RATIO, SAG_MAX)
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 + sag
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`
}
