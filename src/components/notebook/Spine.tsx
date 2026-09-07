import { FRAME_VIEWBOX, SPINE } from './geometry'

/**
 * The binder mechanism.
 *
 * Built as the hardware actually is — two hinged leaves on a backing plate,
 * with a sprung end plate top and bottom — because a single gradient-filled
 * strip has no way to read as anything but a drawn rectangle.
 *
 * The hard-won constraint here is TONAL RANGE, not construction. Every version
 * of this that gave the metal a dark core, dark outer edges or a top-to-bottom
 * ramp turned the gutter into a chrome rod lying on the book, no matter how
 * correct the parts were. So the mechanism is deliberately flat and bright:
 * it sits near the paper's value, the leaves fall off only at their very
 * edges, and the seam is a light recess rather than a black line. It is
 * brushed nickel catching a soft overhead light, and it is meant to sit
 * quietly behind the rings — those are the metal the eye should land on.
 */

const EDGE = { x: 641, w: 66 }
const LEAF_L = { x: 643, w: 30 }
const LEAF_R = { x: 675, w: 30 }
const SEAM = { x: 673.2, w: 1.6 }

const LEAF_TOP = 13
const LEAF_BOTTOM = 735
const LEAF_H = LEAF_BOTTOM - LEAF_TOP

const BOOSTER = { x: 640, w: 68, h: 38, r: 1.5 }
const BOOSTER_TOP_Y = SPINE.y + 1
const BOOSTER_BOTTOM_Y = 696

export function Spine() {
  return (
    <svg
      className="notebook__layer notebook__spine"
      viewBox={FRAME_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      {/* the valley, feathered onto the inner edge of both page blocks */}
      <rect x={620} y={0} width={108} height={748} fill="url(#nb-well)" />

      {/* the hardware stands proud of the cover, so it contacts either side.
          Kept light: heavy verticals here frame the strip and rod it again. */}
      <g filter="url(#nb-soft-sm)">
        <rect x={638.6} y={8} width={2.2} height={732} fill="#0d0b09" opacity="0.18" />
        <rect x={706.6} y={8} width={2.4} height={732} fill="#0d0b09" opacity="0.22" />
      </g>

      {/* backing plate, a turned edge either side of the leaves. Kept close in
          value to them: dark verticals here frame the strip and rod it again. */}
      <rect x={EDGE.x} y={SPINE.y} width={2} height={SPINE.h} fill="#7c8183" />
      <rect x={EDGE.x + EDGE.w - 2} y={SPINE.y} width={2} height={SPINE.h} fill="#717678" />

      <rect x={LEAF_L.x} y={LEAF_TOP} width={LEAF_L.w} height={LEAF_H} fill="url(#nb-leaf-left)" />
      <rect x={LEAF_R.x} y={LEAF_TOP} width={LEAF_R.w} height={LEAF_H} fill="url(#nb-leaf-right)" />

      {/* drawn finish, not a polish: fine vertical streaks along the leaves */}
      <g style={{ mixBlendMode: 'multiply' }} opacity="0.5">
        <rect
          x={LEAF_L.x}
          y={LEAF_TOP}
          width={LEAF_R.x + LEAF_R.w - LEAF_L.x}
          height={LEAF_H}
          fill="#ffffff"
          filter="url(#nb-brushed)"
        />
      </g>

      {/* the recess between the leaves, and the lip each one turns up along it */}
      <rect x={SEAM.x} y={LEAF_TOP} width={SEAM.w} height={LEAF_H} fill="#8d9294" />
      <rect x={SEAM.x - 0.8} y={LEAF_TOP} width={0.8} height={LEAF_H} fill="#dfe3e3" opacity="0.5" />
      <rect
        x={SEAM.x + SEAM.w}
        y={LEAF_TOP}
        width={0.8}
        height={LEAF_H}
        fill="#cfd3d4"
        opacity="0.42"
      />

      {/* sprung end plates */}
      {[BOOSTER_TOP_Y, BOOSTER_BOTTOM_Y].map((y, i) => (
        <g key={y}>
          <rect
            x={BOOSTER.x}
            y={y + 2}
            width={BOOSTER.w}
            height={BOOSTER.h}
            rx={BOOSTER.r}
            fill="#0d0b09"
            opacity="0.3"
            filter="url(#nb-soft-sm)"
          />
          <rect
            x={BOOSTER.x}
            y={y}
            width={BOOSTER.w}
            height={BOOSTER.h}
            rx={BOOSTER.r}
            fill="url(#nb-lever)"
          />
          <path
            d={`M ${BOOSTER.x + 2} ${y + 1.2} H ${BOOSTER.x + BOOSTER.w - 2}`}
            stroke="#e4e7e7"
            strokeOpacity="0.5"
            strokeWidth="1.1"
          />
          <path
            d={`M ${BOOSTER.x + 2} ${y + BOOSTER.h - 1} H ${BOOSTER.x + BOOSTER.w - 2}`}
            stroke="#3a3f41"
            strokeOpacity="0.4"
            strokeWidth="1.3"
          />
          {/* the pressed slot the thumb pushes against */}
          <rect
            x={664}
            y={y + (i === 0 ? 14 : 17)}
            width={20}
            height={12}
            rx={2}
            fill="#7c8183"
            opacity="0.55"
          />
          <rect
            x={664}
            y={y + (i === 0 ? 14 : 17) + 1.2}
            width={20}
            height={1.6}
            rx={0.8}
            fill="#e4e7e7"
            opacity="0.4"
          />
        </g>
      ))}

      {/* a whisper of vertical falloff, no more */}
      <rect x={BOOSTER.x} y={SPINE.y} width={BOOSTER.w} height={SPINE.h} fill="url(#nb-metal-fall)" />
    </svg>
  )
}
