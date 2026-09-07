import { PhotoPrint } from '../hero/PhotoPrint'
import { PaperShadow } from '../hero/PaperShadow'
import { u } from './layout'
import { tapeStrip } from './marks'

/**
 * A print held down with a strip of masking tape, with a caption written
 * under it.
 *
 * The print itself is the hero's own `PhotoPrint`, untouched — same sheet,
 * same deckle, same empty well with its crop marks, same contact shadow. This
 * spread does not get its own idea of what a photograph looks like; it gets
 * the one Chapter 01 already established, with tape added.
 *
 * The well stays EMPTY on purpose. It is a placeholder for a real photograph,
 * and a bare emulsion panel reads as an unexposed print rather than as a
 * missing asset — `data-slot` on each one marks where the real image goes.
 *
 * The tape is placed to STRADDLE the print's top edge: half on the paper, half
 * on the photograph. Tape that sits entirely within the photo's own bounds
 * isn't holding anything down, it is a sticker printed on the picture. Its
 * angle is deliberately a few degrees off the print's own — the two were not
 * aligned by the same hand at the same moment.
 */

type Props = {
  slot: string
  x: number
  y: number
  w: number
  h: number
  rotate: number
  /** Written under the print, in the same hand as the rest of the margin. */
  caption?: string
  /** Where the caption sits, in notebook units. Required with `caption`. */
  captionAt?: { x: number; y: number }
  /** Along the print's top edge, as a fraction of its width. */
  tapeAt?: number
  edge?: 'deckle' | 'cut'
}

export function TapedPhoto({
  slot,
  x,
  y,
  w,
  h,
  rotate,
  caption,
  captionAt,
  tapeAt = 0.3,
  edge = 'cut',
}: Props) {
  const tape = { w: 104, h: 26 }

  return (
    <>
      <PhotoPrint slot={slot} x={x} y={y} w={w} h={h} rotate={rotate} edge={edge} border={9} />

      <div
        className="hero-artifact origin-tape"
        style={{
          left: u(x + w * tapeAt),
          top: u(y - tape.h * 0.62),
          width: u(tape.w),
          height: u(tape.h),
          transform: `rotate(${rotate - 6.5}deg)`,
        }}
      >
        <svg viewBox={`0 0 ${tape.w} ${tape.h}`} aria-hidden="true">
          <PaperShadow id={`shadow-tape-${slot}`} dx={0.6} dy={1.3} blur={1.2} opacity={0.22} />
          {/*
            Masking tape is not a tinted rectangle: it is a translucent warm
            film that lets the paper under it through, which is why the fill is
            partly transparent rather than a solid pale colour. The hairline
            along the long edges is where the adhesive catches the light.
          */}
          <path
            d={tapeStrip(tape.w, tape.h)}
            fill="#e6dcc4"
            fillOpacity={0.58}
            filter={`url(#shadow-tape-${slot})`}
          />
          <path
            d={tapeStrip(tape.w, tape.h)}
            fill="none"
            stroke="#b8ab8e"
            strokeOpacity={0.34}
            strokeWidth={0.5}
          />
        </svg>
      </div>

      {caption && captionAt ? (
        <span className="origin-caption" style={{ left: u(captionAt.x), top: u(captionAt.y) }}>
          {caption}
        </span>
      ) : null}
    </>
  )
}
