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
   * The chapters each side will later hold, invisible in ordinary view and
   * revealed one at a time for the page-turn captures.
   *
   * BOTH sides carry them now. The left page's are the sheets' BACKS — what
   * the reader arrives at, always a left page in this binding. The right
   * page's are the sheets' FRONTS, which only becomes a thing that needs
   * standing in for once there is more than one turn: the first sheet's front
   * is the page already on screen. (spreads.ts — a sheet's front is spread N's
   * right page, its back is spread N+1's left page.)
   */
  previewLefts?: ReactNode[]
  previewRights?: ReactNode[]
}

/**
 * The page block. The two halves are separate elements on purpose — they are
 * the parts that will move first when page turning arrives — and each takes
 * whatever is printed on it as children, so the notebook itself stays a
 * physical object with no knowledge of the chapter it is showing.
 */
export function Pages({
  left,
  right,
  turningSide = null,
  landed = false,
  previewLefts,
  previewRights,
}: PagesProps) {
  return (
    <div className="notebook__pages" data-slot="page-stack">
      <Page
        side="left"
        box={LEFT_PAGE}
        sheet={LEFT_SHEET_PATH}
        turning={turningSide === "left" || landed}
        previews={previewLefts}
      >
        {left}
      </Page>
      <Page
        side="right"
        box={RIGHT_PAGE}
        sheet={RIGHT_SHEET_PATH}
        turning={turningSide === "right" || landed}
        previews={previewRights}
      >
        {right}
      </Page>
    </div>
  )
}
