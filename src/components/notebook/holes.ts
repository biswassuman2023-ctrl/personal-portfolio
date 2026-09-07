import { GUTTER, RING, RING_CENTERS_Y } from './geometry'

/**
 * Punch holes, derived from the ring rather than guessed.
 *
 * Parametrise the ring as seen from near-overhead:
 *
 *     x = centre + rx·cos(t)      y = cy − ry·sin(t)
 *
 * so t = 90° is the top of the drawn oval (the highest part of the wire) and
 * t = 270° is the bottom (where the wire enters the mechanism).
 *
 * A page lying flat does not hang at the ring's widest point — it slides down
 * the wire until it is nearly level with the paper. That puts the left page's
 * hole around t = 210° and the right page's around t = 330°, low on each side.
 * Deriving both from the ring means moving the rings moves the holes with
 * them, and the hole always lands exactly on the wire.
 *
 * The consequence PaperLips depends on: from the hole INWARD to the page's
 * binding edge, the wire runs underneath the sheet. That stretch has to be
 * covered by paper, or the rings read as resting on top of a picture of a page.
 */

export const HOLE_RX = 7.6
export const HOLE_RY = 7.1

const HOLE_ANGLE = { left: 210, right: 330 } as const

const at = (deg: number) => {
  const t = (deg * Math.PI) / 180
  return { x: GUTTER.center + RING.rx * Math.cos(t), dy: -RING.ry * Math.sin(t) }
}

export type Hole = { x: number; y: number }

export const holeColumn = (side: 'left' | 'right') => at(HOLE_ANGLE[side])

export const holesFor = (side: 'left' | 'right'): Hole[] => {
  const { x, dy } = holeColumn(side)
  return RING_CENTERS_Y.map((cy) => ({ x, y: cy + dy }))
}

/**
 * Where the wire disappears under the sheet, just inboard of each hole.
 *
 * This is subtracted from the RINGS rather than being painted over them with
 * a redrawn patch of paper. Repainting the sheet on top works in principle but
 * erases whatever was already there — the ring's own cast shadow, most
 * visibly — leaving a rectangle of suspiciously clean paper beside every hole.
 * Masking the wire instead lets the real page show through untouched.
 *
 * Kept to about fourteen units. Blanking the wire all the way to the binding
 * edge is the more literal reading, but the paper tab there is curled up by
 * the ring it hangs on, so the wire re-emerges almost at once — and a long
 * blackout breaks the oval into fragments that stop reading as a ring at all.
 */
export const THREAD_DIP = { rx: 7.5, ry: 6, dx: 6, dy: 3 }

export const threadDips = (): Hole[] =>
  (['left', 'right'] as const).flatMap((side) => {
    const inward = side === 'left' ? 1 : -1
    return holesFor(side).map(({ x, y }) => ({
      x: x + inward * THREAD_DIP.dx,
      y: y + THREAD_DIP.dy,
    }))
  })
