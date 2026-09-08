import { PhotoPrint } from '../hero/PhotoPrint'

/**
 * A print lying loose on the right page.
 *
 * Purely presentational: where it sits and whether it is being held are
 * decided by MethodRightPage, which owns the whole arrangement. That is not
 * indirection for its own sake — a print cannot know whether it is the one
 * under the reader's hand without knowing about the three on top of it, and
 * the gallery is the only thing that does.
 *
 * WHAT THE LIFT IS MADE OF: shadow, not scale. Picking a print up is sold by
 * the shadow under it growing and softening, which is what actually happens
 * when paper leaves the page; scaling it up is a hover state pretending to be
 * physics, and at this size it also softens the print's own edges. So the held
 * state changes the contact shadow and nothing else geometric.
 */

type Props = {
  slot: string
  label: string
  x: number
  y: number
  w: number
  h: number
  rotate: number
  /** Where the reader has pushed it, in notebook units. */
  offset: { x: number; y: number }
  held: boolean
}

export function WorkPrint({ slot, label, x, y, w, h, rotate, offset, held }: Props) {
  return (
    <PhotoPrint
      className={`work-print__print ${held ? 'is-held' : ''}`}
      slot={slot}
      x={x}
      y={y}
      w={w}
      h={h}
      rotate={rotate}
      edge="cut"
      border={9}
      chin={20}
      label={label}
      offset={offset}
    />
  )
}
