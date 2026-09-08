/**
 * Chapter 04 — What I build with. The investigation board, and where every
 * object on it is pinned.
 *
 * Its own coordinate space, the way the notebook has one: a 1440x900 board
 * frame, one board unit via `--bu` (see board.css), so the whole composition
 * scales as a single object rather than reflowing. The notebook is an object
 * lying in the blue room; this is a second object hanging in the same room,
 * and it is laid out the same way for the same reason.
 *
 * NOTHING HERE IS ON A GRID. Every card carries its own width, height and
 * angle, and the positions were placed against each other by eye — the six
 * are a scatter with a reading order, not two rows of three. A grid is the
 * single fastest way to turn a board back into a skills section, so the
 * numbers below are deliberately irregular and should stay that way: the
 * spacing between any two cards is never the spacing between any other two.
 */

/**
 * The board's own frame. Everything below is in these units.
 *
 * Sized to land at roughly the notebook's own rendered size — the two are
 * meant to read as two objects of comparable presence in one room, and a
 * board noticeably larger than the book it follows makes the book look like
 * a preamble. 1.6:1 rather than the notebook's 1.71:1 so it reads as a
 * different KIND of object rather than the same rectangle again.
 */
export const BOARD = { w: 1440, h: 900 } as const

/**
 * The title, upper left — three stacked red bars with the words knocked out
 * of them, each one its own width and its own small angle, the way a headline
 * set in cut paper strips sits.
 */
export const TITLE = {
  x: 96,
  y: 92,
  /* `dx` ragged-edges the left margin. Three strips cut by hand and stuck up
     one under the other do not share a left edge, and flush-left is the one
     detail that would make them read as three divs rather than three pieces
     of paper. */
  lines: [
    { text: 'WHAT', w: 178, rotate: -1.4, dx: 0 },
    { text: 'I BUILD', w: 250, rotate: 0.8, dx: 17 },
    { text: 'WITH', w: 170, rotate: -0.6, dx: 6 },
  ],
  /** Bar height and the gap between bars, in board units. */
  bar: 64,
  gap: 8,
} as const

/** The small typed line above the title — a case file's own header. */
export const EYEBROW = { x: 100, y: 62 }

/**
 * The one pin every thread is tied to. Sits just below and right of the
 * title, close enough to read as the title's own pin, far enough to be a
 * separate object — which is what makes the six threads look tied to a point
 * rather than sprouting from type.
 */
export const HUB = { x: 388, y: 366 }

/** The handwritten instruction, under the hub. The board's only directions. */
export const NOTE = { x: 208, y: 438, w: 320 }

export type Category = {
  id: string
  index: string
  name: string
  /**
   * Four or five words in the margin saying what this part of the stack is
   * actually FOR. Not a tagline and not a description — the note someone
   * writes to themselves so a board of six labels still means something a
   * week later. It is also what stops each card being a name floating in the
   * middle of an empty rectangle, which is what the first pass of this was.
   */
  blurb: string
  items: readonly string[]
  /** Top-left of the card, in board units. */
  x: number
  y: number
  w: number
  h: number
  /** How the card was put down. Never zero — nothing here is square to the wall. */
  rotate: number
  /** Where its tack went in: fraction across the card, then units down. */
  pin: { at: number; y: number }
  /** Held by a tack, or by a strip of tape. Two ways, so neither is a motif. */
  hold: 'pin' | 'tape'
}

/**
 * The six. Sizes follow content weight rather than a shared template —
 * DEVOPS carries ten tools and is the widest object on the board, TESTING
 * carries two and is the smallest. That correspondence is doing real work:
 * the board tells you where the depth is before you have read a single word
 * of it.
 */
export const CATEGORIES: readonly Category[] = [
  {
    id: 'frontend',
    index: '01',
    name: 'FRONTEND',
    blurb: 'the part people touch',
    items: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'Vite', 'Tailwind CSS', 'Redux'],
    x: 566,
    y: 100,
    w: 332,
    h: 152,
    rotate: -2.4,
    pin: { at: 0.24, y: 11 },
    hold: 'pin',
  },
  {
    id: 'backend',
    index: '02',
    name: 'BACKEND',
    blurb: 'the part that answers',
    items: ['Node.js', 'Express.js', 'REST APIs', 'JWT', 'Auth.js'],
    x: 1004,
    y: 208,
    w: 288,
    h: 140,
    rotate: 1.9,
    pin: { at: 0.72, y: 12 },
    hold: 'pin',
  },
  {
    id: 'data',
    index: '03',
    name: 'DATABASE + BaaS',
    blurb: 'where it all persists',
    items: ['PostgreSQL', 'MongoDB', 'Prisma', 'Supabase', 'Firebase', 'Appwrite'],
    x: 646,
    y: 372,
    w: 302,
    h: 146,
    rotate: -1.3,
    pin: { at: 0.18, y: 10 },
    hold: 'tape',
  },
  {
    id: 'testing',
    index: '04',
    name: 'TESTING',
    blurb: 'proof it still works',
    items: ['Vitest', 'Playwright'],
    x: 1056,
    y: 452,
    w: 216,
    h: 124,
    rotate: 2.9,
    pin: { at: 0.55, y: 11 },
    hold: 'pin',
  },
  {
    id: 'devops',
    index: '05',
    name: 'DEVOPS + TOOLING',
    blurb: 'how any of it ships',
    items: [
      'Git',
      'GitHub',
      'Docker',
      'CI/CD',
      'Vercel',
      'Railway',
      'Render',
      'Postman',
      'Cursor',
      'Claude',
    ],
    x: 296,
    y: 660,
    w: 344,
    h: 152,
    rotate: 1.5,
    pin: { at: 0.8, y: 11 },
    hold: 'pin',
  },
  {
    id: 'design',
    index: '06',
    name: 'DESIGN + MOTION',
    blurb: 'how the whole thing feels',
    items: ['Figma', 'UI/UX', 'GSAP', 'Three.js', 'Interaction Design'],
    x: 872,
    y: 686,
    w: 284,
    h: 140,
    rotate: -2.1,
    pin: { at: 0.3, y: 12 },
    hold: 'tape',
  },
]

/* ------------------------------------------------------------ the unfold --
   A card is a folded note. Clicking it opens the flap downward; the stack is
   written on the inside. These are the flap's own metrics. */

/**
 * How many columns the list inside a flap runs in.
 *
 * The flap gets taller with every row, and a flap tall enough to hang well
 * past the bottom of the board is a flap that has stopped being a fold and
 * started being a panel — so the longest list (ten tools) goes to three
 * columns rather than pushing the paper down another four rows. The widest
 * card on the board is the one carrying that list, which is what makes three
 * columns fit at all.
 */
export const foldColumns = (count: number) => (count >= 9 ? 3 : count >= 5 ? 2 : 1)

const FOLD_LINE = 26
const FOLD_PAD_TOP = 28
const FOLD_PAD_BOTTOM = 20

/** How tall the flap has to be to hold its own list. */
export function foldHeight(count: number): number {
  const rows = Math.ceil(count / foldColumns(count))
  return FOLD_PAD_TOP + rows * FOLD_LINE + FOLD_PAD_BOTTOM
}

export const FOLD = { line: FOLD_LINE, padTop: FOLD_PAD_TOP } as const

/* ------------------------------------------------------------- behaviour -- */

/** How far a card lifts off the board under the cursor, in board units. */
export const HOVER_LIFT = 7

/**
 * How far the board leans with the pointer, in board units, at the very edge
 * of the section. Small on purpose — the reference reads as physical because
 * nothing in it is moving much. Cards carry slightly more than the surface
 * under them, which is the whole parallax: depth, not float.
 */
export const PARALLAX = { surface: 5, cards: 13 } as const
