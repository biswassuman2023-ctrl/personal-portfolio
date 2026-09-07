import { LEFT_PAGE, RIGHT_PAGE } from './geometry'
import { LEFT_SHEET_PATH, RIGHT_SHEET_PATH } from './silhouettes'
import { Page } from './Page'

/**
 * The page block. The two halves are separate elements on purpose — they are
 * the parts that will move first when page turning arrives.
 */
export function Pages() {
  return (
    <div className="notebook__pages" data-slot="page-stack">
      <Page side="left" box={LEFT_PAGE} sheet={LEFT_SHEET_PATH} />
      <Page side="right" box={RIGHT_PAGE} sheet={RIGHT_SHEET_PATH} />
    </div>
  )
}
