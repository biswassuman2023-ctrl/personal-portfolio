/**
 * Chapter 02 — Origin. Where every artefact sits on the spread.
 *
 * Same coordinate space as the hero: notebook units, the 1277x748 frame the
 * cover, pages and binding are drawn in, so this spread scales with the object
 * exactly as Chapter 01 does. `hero/layout.ts` is the reference for the two
 * hard constraints, and they hold here unchanged:
 *
 *   - The rings span x 610-738 and are drawn ON TOP of the paper. Printed
 *     content stops at x 600 on the left page and starts at x 748 on the right.
 *   - Nothing is centred and nothing is evenly spaced.
 *
 * The composition is a diagonal, not a stack: the heading enters top-left, the
 * photograph answers it on the right, and the facts settle at the lower left —
 * so the eye crosses the page rather than running down a column. The lower
 * third of the left page and the outer corner of the right are deliberately
 * bare, the same way Chapter 01's are.
 */

export { u } from '../hero/layout'

/* ------------------------------------------------------------- left page --
   WHERE IT STARTED — Economics, Delhi, the years before any of this. */

/** Index marks down the outer edge, aligned to the ring rows, as Chapter 01. */
export const INDEX_X = 108

/** "CHAPTER 02 · ORIGIN". An eyebrow, not a title — the heading is below it. */
export const EYEBROW = { x: 126, y: 62 }

/**
 * "WHERE IT STARTED", set over two lines.
 *
 * 58 units against the hero wordmark's 207. This is a chapter heading, not a
 * masthead: Chapter 01 owns the one enormous piece of type in the book, and a
 * second one here would flatten the difference between an opening spread and
 * the spreads that follow it.
 */
export const HEADING = { x: 124, y: 92, size: 56 }

/** The subject of the page, circled in pen. */
export const SUBJECT = { x: 126, y: 264, size: 34 }

/** Degree, institution, place, years. Four short lines, not a paragraph. */
export const DEGREE = { x: 128, y: 332 }

export const COLLEGE_PHOTO = { x: 348, y: 268, w: 232, h: 202, rotate: -2.2 }
export const COLLEGE_CAPTION = { x: 362, y: 488 }

/** The origin story, told in two short paragraphs. */
export const NARRATIVE = { x: 128, y: 526, w: 434 }

/* ------------------------------------------------------------ right page --
   THE TURN — the page you just turned, and the one he did. */

/** Rings end at x 738. Everything here clears them by ~50 units, as Ch 01. */
export const RIGHT_COLUMN = 790

export const TURN_HEADING = { x: RIGHT_COLUMN, y: 92, size: 56 }

/**
 * The journey, as a hand-drawn path rather than a list.
 *
 * Five beats, ONE shared x. An earlier version nudged each beat along its own
 * offset so the path wandered down the page — legible as an idea, but it put
 * every connector at a different distance from the word above and below it,
 * which reads as misalignment rather than as a hand-drawn line. A single
 * column with the connector at one fixed offset from that column is what
 * "one intentional visual element" actually requires: the imperfection now
 * lives in the stroke each connector draws, not in where it sits.
 */
export const JOURNEY = { x: RIGHT_COLUMN, y: 180, step: 56, size: 26 }

export const JOURNEY_BEATS = ['ECONOMICS', 'SYSTEMS', 'CURIOSITY', 'CODE', 'THE WEB'] as const

export const DESK_PHOTO = { x: 1008, y: 175, w: 204, h: 178, rotate: 2.6 }
export const DESK_NOTE = { x: 1012, y: 372, w: 198 }

/** Three lines. The whole of the self-teaching, told once and briefly. */
export const STORY = { x: RIGHT_COLUMN, y: 460, w: 374 }

/** The payoff. Quiet line, then the loud one, underlined by hand. */
export const CLOSING = { x: RIGHT_COLUMN, y: 618 }

/* --------------------------------------------------------------- content --
   Facts live here so they are edited in one place. Nothing in this file is
   invented: degree, college, city and years are as supplied. */

export const DEGREE_LINES = [
  'B.A. (Hons.) Economics',
  'University of Delhi',
  'Motilal Nehru College',
  '2025 – 2026',
]
