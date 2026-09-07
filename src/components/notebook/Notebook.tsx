import { Cover } from './Cover'
import { MaterialDefs } from './MaterialDefs'
import { Pages } from './Pages'
import { Rings } from './Rings'
import { Spine } from './Spine'
import './notebook.css'

/**
 * Assembly, back to front, in the order the physical object is stacked:
 *
 *   cover  ->  page block  ->  binding valley + mechanism  ->  rings
 *
 * The rings sit on top, but they are threaded THROUGH the paper rather than
 * laid on it: Rings carries a mask that subtracts the wire where it dips under
 * the sheet beside each punch hole. Doing it that way — rather than repainting
 * paper over the wire — leaves the page and its shadows untouched.
 *
 * Each part is an independent element in the shared coordinate space, so page
 * turning and book closing can be added later by transforming these pieces
 * rather than rebuilding them.
 */
export function Notebook() {
  return (
    <div className="notebook-stage">
      <MaterialDefs />
      <div className="notebook">
        <Cover />
        <Pages />
        <Spine />
        <Rings />
        {/*
          Mounting rail for the chapter tabs that will hang off the outer edge
          of the right page in a later phase. It renders nothing on purpose:
          an empty notebook should look empty, not pre-slotted.
        */}
        <div className="notebook__tab-rail" data-slot="chapter-tabs" />
      </div>
    </div>
  )
}
