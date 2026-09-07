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
  /**
   * The NEXT spread's left page — invisible in ordinary view, revealed only
   * for the page-turn capture that photographs it for the turning sheet's
   * back face. Only the left page carries this: the sheet's back is what the
   * reader arrives at, and in this book's binding that is always a LEFT page
   * (spreads.ts — the sheet's front is spread N's right page, its back is
   * spread N+1's left page).
   */
  previewLeft?: ReactNode
}

/**
 * The page block. The two halves are separate elements on purpose — they are
 * the parts that will move first when page turning arrives — and each takes
 * whatever is printed on it as children, so the notebook itself stays a
 * physical object with no knowledge of the chapter it is showing.
 */
export function Pages({ left, right, turningSide = null, landed = false, previewLeft }: PagesProps) {
  return (
    <div className="notebook__pages" data-slot="page-stack">
      <Page
        side="left"
        box={LEFT_PAGE}
        sheet={LEFT_SHEET_PATH}
        turning={turningSide === "left" || landed}
        previewChildren={previewLeft}
      >
        {left}
      </Page>
      <Page side="right" box={RIGHT_PAGE} sheet={RIGHT_SHEET_PATH} turning={turningSide === "right" || landed}>
        {right}
      </Page>
    </div>
  )
}
