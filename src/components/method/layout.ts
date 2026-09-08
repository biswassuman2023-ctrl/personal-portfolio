/**
 * Chapter 03 — Method. Where every artefact sits on the final spread.
 *
 * Same coordinate space as the hero and Chapter 02: notebook units, the
 * 1277x748 frame the cover, pages and binding are drawn in. The two hard
 * constraints from `hero/layout.ts` hold here unchanged:
 *
 *   - The rings span x 610-738 and are drawn ON TOP of the paper. Printed
 *     content stops at x 600 on the left page and starts at x 748 on the right.
 *   - Nothing is centred and nothing is evenly spaced.
 *
 * This spread is mostly EMPTY at rest, and stays that way — the design, not
 * an unfinished state. The left page holds a heading and one line of
 * instruction; moving the cursor across it presses the method into the paper
 * one word at a time, and each impression fades again a moment later, so the
 * page is never more than a few words deep at once and returns to empty the
 * instant the cursor stops. The right page holds four prints and nothing
 * else. A page that arrives already full has nothing for the reader to do.
 */

export { u } from '../hero/layout'

/* ------------------------------------------------------------- left page --
   THE WAY I BUILD — the process, pressed briefly onto the page along
   whatever path the cursor actually traces across it. */

/** Index marks down the outer edge, aligned to the ring rows, as Chapters 01-02. */
export const INDEX_X = 108

export const EYEBROW = { x: 126, y: 62 }

/**
 * "THE WAY / I BUILD", set over two lines at the same size Chapter 02's
 * headings use. Three chapters in, the size of a chapter heading is a
 * settled thing; changing it here would only make this spread look like it
 * came from somewhere else.
 */
export const HEADING = { x: 124, y: 92, size: 56 }

/** The one instruction on the page. Small, and it leaves once it is obeyed. */
export const INSTRUCTION = { x: 128, y: 226 }

/**
 * The five stages, in the order they happen, each with the width its own
 * rule needs — a stamp cut for UNDERSTAND was never the same block of rubber
 * as one cut for BUILD. Every width is tuned so the word fills roughly three
 * quarters of its rule (measured 73-80%): a rule that stands well clear of
 * its word reads as a bordered label rather than as cut rubber.
 *
 * This is the one list every stamp — trailing or static — is drawn from, and
 * the only place any of these five words is spelled out.
 */
export const STAMP_WORDS = [
  { word: 'UNDERSTAND', w: 190 },
  { word: 'DESIGN', w: 103 },
  { word: 'BUILD', w: 88 },
  { word: 'REFINE', w: 103 },
  { word: 'DELIVER', w: 124 },
] as const

/** Every stamp on this page shares one rule height, whatever its width. */
export const STAMP_HEIGHT = 46

/**
 * Where a stamp is allowed to land, centred. Rings start at x 610, so 580
 * plus half of even the widest word (95) still clears them; the heading and
 * instruction keep the top clear on their own, so 260 is a small margin under
 * the instruction rather than a hard collision limit.
 */
export const STAMP_BOUNDS = { minX: 132, maxX: 580, minY: 260, maxY: 706 }

/**
 * How far the cursor has to travel, in notebook units, before the next stamp
 * is allowed to press — the entire throttle, and deliberately DISTANCE rather
 * than time. A slow, deliberate sweep still leaves a trail; a motionless
 * cursor leaves none; nothing is running on a clock in the background either
 * way. At 70, five or six stamps typically live on the page at once during an
 * ordinary unhurried sweep — enough to read as a trail following the cursor,
 * not so many that the page ever looks crowded.
 */
export const STAMP_MIN_SPAWN_DISTANCE = 70

/**
 * However fast the cursor moves, no more stamps than this are ever alive at
 * once. The distance throttle above already keeps ordinary movement well
 * under it; this is the hard ceiling for the pathological case — someone
 * shaking the cursor in place — where distance covered stays high without
 * the page position going anywhere.
 */
export const STAMP_MAX_ALIVE = 6

/**
 * The visible breathing room a new stamp must clear from every stamp already
 * on the page, on top of their own edges not touching. A trail where each
 * impression sits flush against the last one reads as a pile the moment two
 * of them arrive close together; this is what keeps it reading as several
 * separate presses instead.
 */
export const STAMP_GAP = 16

/**
 * The five stages laid out ONCE, permanently — the accessible answer for a
 * touch screen, which has no cursor to trail with (see useStampTrail). These
 * are the ORIGINAL fixed positions this page opened with, since a hand-tuned
 * still layout remains exactly the right thing for a state nothing is ever
 * going to move through.
 */
export const STATIC_STAMP_LAYOUT = [
  { word: 'UNDERSTAND', x: 138, y: 288, w: 190, h: 46, rotate: -2.2 },
  { word: 'DESIGN', x: 330, y: 366, w: 103, h: 46, rotate: 1.7 },
  { word: 'BUILD', x: 176, y: 452, w: 88, h: 46, rotate: -1.3 },
  { word: 'REFINE', x: 356, y: 530, w: 103, h: 46, rotate: 2.4 },
  { word: 'DELIVER', x: 212, y: 610, w: 124, h: 46, rotate: -1.6 },
] as const

/* ------------------------------------------------------------ right page --
   WHAT I MAKE — four prints lying on the paper, loose enough to be moved. */

/** Rings end at x 738. Everything here clears them by ~50 units, as Ch 01-02. */
export const RIGHT_COLUMN = 790

export const WORK_HEADING = { x: RIGHT_COLUMN, y: 92, size: 56 }

/**
 * The four prints, as a small collection rather than a grid.
 *
 * Sizes, angles and positions all differ, and pairs overlap by a dozen units
 * or so — enough to say these were put down one after another, not enough to
 * hide anything. The labels are written in each print's own chin, the way a
 * photograph gets named on the paper rather than beside it, which keeps them
 * secondary to the image without making them small enough to squint at.
 *
 * The wells are EMPTY on purpose: they are placeholders for real work, and a
 * bare emulsion panel reads as an unexposed print rather than as a missing
 * asset. Nothing invented goes in them.
 */
export const WORKS = [
  { slot: 'method-interface', label: 'INTERFACE', x: 792, y: 200, w: 206, h: 176, rotate: -2.8 },
  { slot: 'method-system', label: 'SYSTEM', x: 986, y: 238, w: 178, h: 156, rotate: 2.2 },
  { slot: 'method-interaction', label: 'INTERACTION', x: 822, y: 410, w: 192, h: 166, rotate: 1.6 },
  { slot: 'method-product', label: 'PRODUCT', x: 1000, y: 452, w: 196, h: 170, rotate: -2.0 },
] as const

/**
 * How far a print may be pushed before it is off its own page.
 *
 * A photograph shoved into the binding or over the paper's edge stops being a
 * photograph lying on a page, so the drag is clamped to the printable area of
 * the right page rather than to the window. Content starts at x 748; these
 * keep a few units clear of that and of the sheet's outer and lower edges.
 */
export const WORK_BOUNDS = { minX: 754, maxX: 1224, minY: 32, maxY: 714 }

export const WORK_INSTRUCTION = { x: RIGHT_COLUMN, y: 662 }
