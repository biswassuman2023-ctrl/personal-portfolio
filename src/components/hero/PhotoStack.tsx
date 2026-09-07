import { PHOTO_STACK } from './layout'
import { PhotoPrint } from './PhotoPrint'

/**
 * Two prints at the top-right of the spread. The one underneath is offset and
 * rotated against the top one, so the group reads as a small stack squared up
 * by hand rather than as a card with a border.
 *
 * There is no paperclip. The reference has one and it was drawn three ways —
 * as nested wire loops, as an outer loop with the far limbs cut at the paper's
 * edge, and larger — and at this size every version read as a hook or a
 * hairpin rather than as a clip. A paperclip is recognised by its nested
 * U-turns, and there is not enough room here to state them clearly. It is a
 * small physical detail, not a load-bearing one, so it is gone: an unconvincing
 * one costs more than the detail is worth.
 */
export function PhotoStack() {
  const { x, y, w, h, rotate } = PHOTO_STACK

  return (
    <div className="photo-stack">
      <PhotoPrint
        slot="hero-photo-under"
        x={x + 8}
        y={y + 4}
        w={w - 11}
        h={h - 13}
        rotate={rotate - 4.6}
        border={7}
        className="photo-stack__under"
      />
      <PhotoPrint
        slot="hero-photo-top"
        x={x}
        y={y}
        w={w}
        h={h}
        rotate={rotate}
        border={9}
        chin={15}
      />
    </div>
  )
}
