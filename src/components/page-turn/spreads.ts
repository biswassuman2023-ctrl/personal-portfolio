import type { ReactNode } from 'react'

/**
 * The book, as a list of spreads.
 *
 * A turn takes spread N to spread N+1 by rotating ONE sheet. That sheet's
 * front is spread N's right page and its back is spread N+1's left page —
 * which is the whole reason the chapters are modelled as spreads rather than
 * as pages. Adding a chapter is appending an entry here; nothing in the turn
 * itself knows how many there are.
 */
export type Spread = {
  id: string
  left: ReactNode
  right: ReactNode
}

/** Which sheet is in the air, and how far through its turn it is. */
export type TurnState = {
  /** Index of the spread the turn is leaving. */
  from: number
  /** 0 at rest on `from`, 1 landed on `from + 1`. */
  progress: number
}

export const isTurning = (turn: TurnState) => turn.progress > 0.0005
