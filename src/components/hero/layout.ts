/**
 * Where every artefact sits on the spread.
 *
 * All values are notebook units — the same 1277x748 space the cover, pages and
 * binding are drawn in — so the composition scales with the object and can be
 * reasoned about against `notebook/geometry.ts`.
 *
 * Two hard constraints the numbers respect:
 *
 *   - The rings span x 610-738 and are drawn ON TOP of the paper, and the punch
 *     holes sit at x 618.6 / 729.4. Printed content therefore stops at x 600 on
 *     the left page and starts at x 748 on the right.
 *   - Nothing is centred and nothing is evenly spaced.
 *
 * The count matters as much as the coordinates. Four things on the left page,
 * five on the right, and nothing else — the empty lower half of the left page
 * and the empty outer corner of the right are the composition, not gaps in it.
 */

/** One notebook unit as a CSS length. `--u` is defined on `.notebook`. */
export const u = (n: number) => `calc(var(--u) * ${n})`

/* ------------------------------------------------------------- left page -- */

/*
 * Positions are transposed from the reference by mapping its notebook box onto
 * ours. One correction is applied on the way across: OUR rings are wider than
 * the reference's (128 units against 92), so anything on the right page needs
 * more clearance from the gutter than a direct transposition gives. The
 * reference leaves ~51 units between its rings and its first right-page
 * element; every right-page x below keeps that same gap from OUR rings, which
 * puts the column at 790 rather than the 721 a literal mapping would produce.
 */

/** Index marks down the outer edge, aligned to the ring rows. */
export const INDEX_X = 108

export const NAME_TAG = { x: 126, y: 168, w: 176, h: 55, rotate: -1.4 }
export const PORTRAIT = { x: 322, y: 60, w: 230, h: 214, rotate: 1.6 }
export const CONTACT_CARD = { x: 140, y: 520, w: 280, h: 150, rotate: -1.1 }

/* ------------------------------------------------------------ right page -- */

/** Rings end at x 738. Everything on this page clears them by ~50 units. */
export const RIGHT_COLUMN = 790

export const ROLE_CARD = { x: RIGHT_COLUMN, y: 84, w: 200, h: 104, rotate: -0.7 }
export const PHOTO_STACK = { x: 1030, y: 48, w: 185, h: 205, rotate: 2.2 }
export const DESCRIPTOR = { x: RIGHT_COLUMN, y: 540 }
export const STATEMENT = { x: RIGHT_COLUMN, y: 600, w: 330 }
export const SIGN_OFF = { x: 1040, y: 694 }

/* -------------------------------------------------------------- wordmark -- */

/**
 * The one element belonging to neither page. Rendered into BOTH at identical
 * coordinates; each sheet clips its own half, so the word runs off the left
 * page and is picked up by the right the way ink on a real spread does.
 *
 * TWO runs, split where the reference splits it:
 *
 *     left page          right page
 *     Port               folio
 *
 * The f is the first letter of `folio` and sits on the RIGHT page. Its swash
 * carries back toward the binding — Cormorant's italic f has a deep negative
 * left bearing, so the tail reaches the page edge on its own — but the letter
 * reads as belonging to the word it starts. An earlier pass set the f on the
 * left page leaning over the `t`, which made it read as part of `Port`.
 */
export const WORDMARK = {
  baseline: 452,
  portX: 140,
  /** Bodoni cap height is ~0.70em, so this lands a cap of ~172 units. */
  portSize: 207,
  /** Far enough right that the f's swash tail clears the rail at x 707. */
  folioX: 736,
  folioSize: 236,
  yearSize: 34,
  yearRise: 78,
}

/* --------------------------------------------------------------- content -- */

/**
 * Contact values live here so they are edited in one place. The two handles are
 * placeholders — replace `username` with the real ones.
 */
export const CONTACT = [
  'biswassuman2023@gmail.com',
  'github.com/username',
  'linkedin.com/in/username',
]
