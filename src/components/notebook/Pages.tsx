import type { ReactNode } from 'react'
import { LEFT_PAGE, RIGHT_PAGE } from './geometry'
import { LEFT_SHEET_PATH, RIGHT_SHEET_PATH } from './silhouettes'
import { Page } from './Page'

type PagesProps = {
  left?: ReactNode
  right?: ReactNode
  /** The sheet currently in the air, hidden here while WebGL draws it. */
  turningSide?: "left" | "right" | null
  /**
   * The sheet has finished its turn. Both pages of this spread are blank: the
   * left is the back of the leaf that just came over, the right is the page it
   * uncovered. Neither has been written yet.
   */
  landed?: boolean
}

/**
 * The page block. The two halves are separate elements on purpose — they are
 * the parts that will move first when page turning arrives — and each takes
 * whatever is printed on it as children, so the notebook itself stays a
 * physical object with no knowledge of the chapter it is showing.
 */
export function Pages({ left, right, turningSide = null, landed = false }: PagesProps) {
  return (
    <div className="notebook__pages" data-slot="page-stack">
      <Page side="left" box={LEFT_PAGE} sheet={LEFT_SHEET_PATH} turning={turningSide === "left" || landed}>
        {left}
      </Page>
      <Page side="right" box={RIGHT_PAGE} sheet={RIGHT_SHEET_PATH} turning={turningSide === "right" || landed}>
        {right}
      </Page>
    </div>
  )
}
