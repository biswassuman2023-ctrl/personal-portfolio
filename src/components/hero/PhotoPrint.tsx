import { u } from './layout'
import { PAPER } from './fonts'
import { PaperShadow } from './PaperShadow'
import { cutRect, deckleRect } from './paper'

/**
 * A printed photograph lying on the page.
 *
 * The image well is an EMPTY PLACEHOLDER by design — no stock photography, no
 * generated faces. It is a bare emulsion panel with corner crop marks, which
 * reads as an unexposed print rather than as a missing asset. Each carries a
 * `data-slot` so the real image can be dropped in later without touching the
 * composition.
 *
 * A print is paper first: the sheet is the object, the image is a window cut
 * into it. So the white border, its deckle or guillotined edge, and its contact
 * shadow all belong to the sheet, and the well is inset within it.
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
}: PhotoPrintProps) {
  const sheet = edge === 'deckle' ? deckleRect(w, h, 8.5, 1.25) : cutRect(w, h, 1.2, 0.6)
  const well = {
    x: border,
    y: border,
    w: w - border * 2,
    h: h - border * 2 - chin,
  }

  return (
    <div
      className={`hero-artifact photo-print ${className}`}
      style={{
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="photo-print__svg" aria-hidden="true">
        <PaperShadow id={`shadow-${slot}`} dx={1.2} dy={2.4} blur={2.6} opacity={0.26} />
        <g filter={`url(#shadow-${slot})`}>
          <path d={sheet} fill={PAPER.print} />
          <rect {...boxAttrs(well)} fill={PAPER.well} />
          <rect {...boxAttrs(well)} fill="url(#hero-well-shade)" />
          <rect
            {...boxAttrs(well)}
            fill="none"
            stroke={PAPER.wellEdge}
            strokeWidth={0.6}
            opacity={0.55}
          />
          <CropMarks {...well} />
        </g>
      </svg>
      <span className="sr-only" data-slot={slot}>
        Photograph placeholder
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
