import { u } from './layout'
import { FONT_HAND, PAPER } from './fonts'
import { PaperShadow } from './PaperShadow'
import { cutRect, deckleRect } from './paper'

/**
 * A printed photograph lying on the page.
 *
 * The well is an EMPTY PLACEHOLDER unless `image` is given — no stock
 * photography, no generated faces, ever. Without one it is a bare emulsion
 * panel with corner crop marks, which reads as an unexposed print rather than
 * as a missing asset. Each carries a `data-slot` so a real image can be
 * dropped in without touching the composition.
 *
 * A print is paper first: the sheet is the object, the image is a window cut
 * into it. So the white border, its deckle or guillotined edge, and its contact
 * shadow all belong to the sheet, and the well is inset within it — a
 * developed print sits inside that same well rather than replacing it, and
 * still shows the sheen and the crop marks over its own surface.
 */

type PhotoPrintProps = {
  slot: string
  x: number
  y: number
  w: number
  h: number
  rotate?: number
  edge?: 'deckle' | 'cut'
  /** Wider bottom border, the way a print leaves room to be written on. */
  chin?: number
  border?: number
  className?: string
  /** A developed print: same-origin image path. Omitted, the well stays bare. */
  image?: string
  /** Alt text for the developed print. Ignored while `image` is unset. */
  alt?: string
  /**
   * Written in the print's chin, the way a photograph is named on the paper
   * rather than on a label beside it. Needs `chin` to have left room for it.
   */
  label?: string
  /**
   * Pushed off its printed position, in notebook units — a reader moving it.
   *
   * Deliberately part of the TRANSFORM rather than an adjustment to `x`/`y`.
   * Moving a print by its `left`/`top` left Chrome hit-testing it at the place
   * it used to be: it drew correctly at the new position and `elementsFromPoint`
   * agreed, but pointer events still resolved against the old box, so a print
   * could be dragged once and then could not be picked up again. Composing the
   * offset into the same transform as the rotation moves the layer itself, and
   * the hit region goes with it.
   */
  offset?: { x: number; y: number }
}

export function PhotoPrint({
  slot,
  x,
  y,
  w,
  h,
  rotate = 0,
  edge = 'cut',
  chin = 0,
  border = 9,
  className = '',
  image,
  alt = '',
  label,
  offset,
}: PhotoPrintProps) {
  const sheet = edge === 'deckle' ? deckleRect(w, h, 8.5, 1.25) : cutRect(w, h, 1.2, 0.6)
  const well = {
    x: border,
    y: border,
    w: w - border * 2,
    h: h - border * 2 - chin,
  }
  const clipId = `well-clip-${slot}`

  return (
    <div
      className={`hero-artifact photo-print ${className}`}
      style={{
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        transform: offset
          ? `translate(${u(offset.x)}, ${u(offset.y)}) rotate(${rotate}deg)`
          : `rotate(${rotate}deg)`,
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="photo-print__svg" aria-hidden="true">
        <PaperShadow id={`shadow-${slot}`} dx={1.2} dy={2.4} blur={2.6} opacity={0.26} />
        <g filter={`url(#shadow-${slot})`}>
          <path d={sheet} fill={PAPER.print} />
          {image ? (
            <>
              <clipPath id={clipId}>
                <rect {...boxAttrs(well)} />
              </clipPath>
              {/* The developed print. Processed into a duotone or a graded
                  print before it ever reaches this component — see the
                  session's processing scripts — so what lands here is a
                  photograph printed in this book's own material, not a raw
                  digital image laid on top of one. */}
              <image
                href={image}
                x={well.x}
                y={well.y}
                width={well.w}
                height={well.h}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
              />
              <rect {...boxAttrs(well)} fill="url(#hero-well-shade)" opacity={0.3} />
            </>
          ) : (
            <>
              <rect {...boxAttrs(well)} fill={PAPER.well} />
              <rect {...boxAttrs(well)} fill="url(#hero-well-shade)" />
            </>
          )}
          <rect
            {...boxAttrs(well)}
            fill="none"
            stroke={PAPER.wellEdge}
            strokeWidth={0.6}
            opacity={0.55}
          />
          <CropMarks {...well} />
        </g>

        {/* Outside the shadow group on purpose: this is ink ON the sheet, not
            part of the sheet, so it must not pick up the paper's own contact
            shadow. Font and fill are presentation attributes rather than CSS
            for the reason fonts.ts gives — a class here comes back as the
            browser's default serif in the page-turn capture. */}
        {label ? (
          <text
            x={w / 2}
            y={well.y + well.h + chin * 0.66}
            textAnchor="middle"
            fontFamily={FONT_HAND}
            fontSize={13}
            letterSpacing={0.8}
            fill={PAPER.ink}
            fillOpacity={0.8}
          >
            {label}
          </text>
        ) : null}
      </svg>
      <span className="sr-only" data-slot={slot}>
        {image ? alt : 'Photograph placeholder'}
      </span>
    </div>
  )
}

type Box = { x: number; y: number; w: number; h: number }
const boxAttrs = ({ x, y, w, h }: Box) => ({ x, y, width: w, height: h })

/** Printer's corner marks — a photographic convention, not interface chrome. */
function CropMarks({ x, y, w, h }: Box) {
  const len = Math.min(w, h) * 0.11
  const inset = 4.5
  const corners = [
    [x + inset, y + inset, 1, 1],
    [x + w - inset, y + inset, -1, 1],
    [x + inset, y + h - inset, 1, -1],
    [x + w - inset, y + h - inset, -1, -1],
  ] as const

  return (
    <g fill="none" stroke={PAPER.crop} strokeWidth={0.7} opacity={0.5}>
      {corners.map(([cx, cy, sx, sy]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M ${cx + sx * len} ${cy} H ${cx} V ${cy + sy * len}`}
        />
      ))}
    </g>
  )
}
