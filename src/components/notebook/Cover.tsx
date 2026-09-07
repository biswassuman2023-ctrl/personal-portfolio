import { FRAME_VIEWBOX } from './geometry'
import { COVER_PATH, STITCH_PATH } from './silhouettes'

/**
 * The leather slab the whole book is built on.
 *
 * Drawn as a single hide because that is how the object is made — the front
 * and back boards are one piece wrapped around the mechanism. The exposed
 * border around the page block is the only part that stays visible, and it is
 * where nearly all of the material reading happens.
 *
 * Everything below the base hide is clipped to the contour, so the bevel and
 * the wear stay INSIDE the edge instead of haloing around it.
 */

/** Top and left rims face the light; bottom and right fall away from it. */
const RIM_LIT = 'M 3.4 17.6 C 4.2 8.8, 7.6 3.4, 13.5 2.4 C 330 1.1, 700 2.2, 1263.5 3.6'
const RIM_SHADED =
  'M 1274.2 731 C 1273.6 740.4, 1267 745.6, 1257.5 746.2 C 900 747.4, 402 745.9, 16.8 744.1'

/**
 * Wear comes in patches, not evenly. Long irregular dashes let the perimeter
 * lighten where a binder actually rubs — corners and the middle of a long
 * edge — without scattering scratches, which is the other failure mode.
 */
const WEAR_DASH = '210 70 130 260 90 170 240 110'

/** One stitch run, reused at several offsets to build a sewn seam. */
const stitch = (extra: Record<string, string | number>) => ({
  d: STITCH_PATH,
  fill: 'none',
  strokeDasharray: '8.5 7.5',
  strokeLinecap: 'round' as const,
  ...extra,
})

export function Cover() {
  return (
    <svg
      className="notebook__layer notebook__cover"
      viewBox={FRAME_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      {/* board thickness, seen as the sliver of underside past the top face */}
      <path d={COVER_PATH} transform="translate(1.6 2.8)" fill="#0c0c0c" />

      <path d={COVER_PATH} fill="#141415" filter="url(#nb-leather)" />

      <g clipPath="url(#nb-cover-clip)">
        {/* one broad light source, stated twice: where it lands, where it leaves */}
        <path d={COVER_PATH} fill="url(#nb-cover-sheen)" />
        <path d={COVER_PATH} fill="url(#nb-cover-fall)" />

        {/* soft bevel: the board's edge rolls over rather than being cut */}
        <path
          d={RIM_LIT}
          fill="none"
          stroke="#5a554f"
          strokeOpacity="0.4"
          strokeWidth="3.4"
          filter="url(#nb-soft-sm)"
        />
        <path
          d={RIM_SHADED}
          fill="none"
          stroke="#000000"
          strokeOpacity="0.5"
          strokeWidth="4.2"
          filter="url(#nb-soft-sm)"
        />

        {/* patchy edge wear, greying where the hide has been handled */}
        <path
          d={COVER_PATH}
          fill="none"
          stroke="#6d675f"
          strokeOpacity="0.2"
          strokeWidth="5"
          strokeDasharray={WEAR_DASH}
          filter="url(#nb-soft-sm)"
        />
        {/* crisper catch right on the outermost fibres */}
        <path
          d={COVER_PATH}
          fill="none"
          stroke="#8b857b"
          strokeOpacity="0.14"
          strokeWidth="1.4"
          strokeDasharray={WEAR_DASH}
          strokeDashoffset="90"
          filter="url(#nb-soft-xs)"
        />
      </g>

      {/*
        Saddle stitch, built as a seam rather than a line: the leather is
        pulled into a channel, the thread sits down in it, the thread's own
        lit face is up-left and its cast shadow is down-right. Two thread
        passes at different dash phases keep the run from being mechanical.
      */}
      <g className="notebook__stitch">
        <path {...stitch({ stroke: '#000000', strokeOpacity: 0.55, strokeWidth: 4.4 })} filter="url(#nb-soft-sm)" transform="translate(0.3 0.9)" />
        <path {...stitch({ stroke: '#000000', strokeOpacity: 0.42, strokeWidth: 1.5 })} transform="translate(0.55 1)" filter="url(#nb-soft-xs)" />
        <path {...stitch({ stroke: '#a29b8c', strokeOpacity: 0.34, strokeWidth: 1.9 })} />
        <path
          {...stitch({ stroke: '#b3ac9c', strokeOpacity: 0.28, strokeWidth: 1.7 })}
          strokeDashoffset="1.1"
          transform="translate(0 -0.35)"
        />
        <path
          {...stitch({ stroke: '#d9d3c5', strokeOpacity: 0.3, strokeWidth: 0.85 })}
          transform="translate(-0.45 -0.7)"
        />
      </g>
    </svg>
  )
}
