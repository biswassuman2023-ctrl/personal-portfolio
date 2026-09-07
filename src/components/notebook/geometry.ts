/**
 * Physical proportions of the notebook, measured off the reference photograph.
 *
 * Every layer (cover, pages, spine, rings) draws into ONE shared coordinate
 * space, so a user unit means the same physical size everywhere. That is what
 * keeps the SVG filter frequencies — leather grain, paper fibre — coherent
 * between layers instead of each one inventing its own scale.
 */

export type Box = { x: number; y: number; w: number; h: number }

export const FRAME = { w: 1277, h: 748 } as const
export const ASPECT = FRAME.w / FRAME.h

/**
 * Two asymmetries taken straight from the reference, and the main reason the
 * silhouette reads as a bound object rather than a centred rectangle:
 *
 *  1. The binding axis sits right of true centre (52.8%, not 50%).
 *  2. The cover reaches far past the pages horizontally (105 / 46 units) but
 *     barely clears them vertically (22 / 25 units).
 */
export const GUTTER = { center: 674, halfWidth: 33 } as const

export const LEFT_PAGE: Box = { x: 105, y: 22, w: 536, h: 703 }
export const RIGHT_PAGE: Box = { x: 707, y: 22, w: 524, h: 703 }

/**
 * The mechanism does not fill the channel. It sits down inside it, leaving a
 * few units of dark on each side where the paper dives into the binding —
 * that sliver of valley is what puts the metal *in* the book rather than on
 * top of it.
 */
export const SPINE_INSET = 5

export const SPINE: Box = {
  x: GUTTER.center - GUTTER.halfWidth + SPINE_INSET,
  y: 11,
  w: (GUTTER.halfWidth - SPINE_INSET) * 2,
  h: 726,
}

/**
 * Six rings in two groups of three — the standard personal-organiser layout.
 * The wide gap between the groups is a load-bearing detail: evenly spaced
 * rings are the giveaway of a notebook nobody looked at.
 */
export const RING_CENTERS_Y = [129, 194, 260, 471, 537, 603] as const

/** Wide and flat: a ring seen from the front is a foreshortened torus. */
export const RING = { rx: 64, ry: 16.4, tube: 7.2 } as const

export const FRAME_VIEWBOX = `0 0 ${FRAME.w} ${FRAME.h}`

/** Position a sub-element as a percentage window onto the shared frame. */
export const framePct = (box: Box) => ({
  left: `${(box.x / FRAME.w) * 100}%`,
  top: `${(box.y / FRAME.h) * 100}%`,
  width: `${(box.w / FRAME.w) * 100}%`,
  height: `${(box.h / FRAME.h) * 100}%`,
})

/** A viewBox that is a slice of the shared space, so user units stay 1:1. */
export const viewBoxOf = (box: Box) => `${box.x} ${box.y} ${box.w} ${box.h}`
