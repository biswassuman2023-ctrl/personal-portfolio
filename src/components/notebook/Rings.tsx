import { FRAME, FRAME_VIEWBOX, GUTTER, RING, RING_CENTERS_Y } from './geometry'
import { THREAD_DIP, threadDips } from './holes'

/**
 * The six binder rings.
 *
 * A ring is a torus lying in a plane perpendicular to the spine, seen from
 * near-overhead — so it reads as a wide, heavily foreshortened oval. It is a
 * stroked ellipse whose stroke is a cross-section gradient: bright along the
 * upper arc where the tube turns toward the light, dark along the lower arc,
 * with a little bounce off the paper at the very bottom. That gradient is
 * what gives it cylinder rather than outline.
 *
 * WHY IT DOES NOT FLOAT — three separate cues, none of them decoration:
 *
 *   down   the ring's lowest point is swallowed by a housing on the mechanism
 *          (drawn after the tube, so it genuinely occludes it)
 *   out    the tube is wider than the channel, so it laps onto the paper and
 *          casts onto it
 *   through the wire is masked away where it dips under the sheet just inboard
 *          of each punch hole, so it enters the hole and does not come out
 *
 * The housing is where the wire is anchored in reality, so it is hardware that
 * belongs here rather than a part invented to solve the problem.
 */

const SPEC_RX = RING.rx - 1.9
const SPEC_RY = RING.ry - 1.9

/** Housing on the leaves that the ring's feet disappear into. */
const BOSS = { w: 14, h: 11, r: 2.5 }

/** Point on the specular ellipse at a given angle, y measured from the centre. */
const specPoint = (deg: number) => {
  const r = (deg * Math.PI) / 180
  return { x: GUTTER.center + SPEC_RX * Math.cos(r), dy: SPEC_RY * Math.sin(r) }
}

/** Upper-left through top to upper-right: the lit sweep of the tube. */
const SPEC_FROM = specPoint(195)
const SPEC_TO = specPoint(325)

const specPath = (cy: number) =>
  `M ${SPEC_FROM.x.toFixed(2)} ${(cy + SPEC_FROM.dy).toFixed(2)} ` +
  `A ${SPEC_RX} ${SPEC_RY} 0 0 1 ${SPEC_TO.x.toFixed(2)} ${(cy + SPEC_TO.dy).toFixed(2)}`

/** Height at which the tube crosses the housing flank, so the wire meets it. */
const flankDy = (dx: number) => RING.ry * Math.sqrt(1 - (dx / RING.rx) ** 2)

export function Rings() {
  const bossX = GUTTER.center - BOSS.w / 2
  const flank = flankDy(BOSS.w / 2)

  return (
    <svg
      className="notebook__layer notebook__rings"
      viewBox={FRAME_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id="nb-ring-thread" maskUnits="userSpaceOnUse" x={0} y={0} width={FRAME.w} height={FRAME.h}>
          <rect x={0} y={0} width={FRAME.w} height={FRAME.h} fill="#ffffff" />
          {threadDips().map(({ x, y }) => (
            <ellipse
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              rx={THREAD_DIP.rx}
              ry={THREAD_DIP.ry}
              fill="#000000"
            />
          ))}
        </mask>
      </defs>

      {RING_CENTERS_Y.map((cy) => (
        <g key={cy} className="notebook__ring">
          {/*
            Cast onto the paper it laps over, and onto the mechanism.
            Deliberately OUTSIDE the threading mask: masking the shadow as well
            as the tube is the more literal reading, but it stamps a bright
            ellipse of unshadowed paper around every hole. The shadow is soft
            enough that its exact extent is not readable; the bright patch was.
          */}
          <ellipse
            cx={GUTTER.center + 3}
            cy={cy + 5.4}
            rx={RING.rx}
            ry={RING.ry}
            fill="none"
            stroke="#241f19"
            strokeOpacity="0.42"
            strokeWidth={RING.tube + 2.4}
            filter="url(#nb-soft-sm)"
          />

          <g mask="url(#nb-ring-thread)">
            <ellipse
              cx={GUTTER.center}
              cy={cy}
              rx={RING.rx}
              ry={RING.ry}
              fill="none"
              stroke="url(#nb-ring)"
              strokeWidth={RING.tube}
            />
            <path
              d={specPath(cy)}
              fill="none"
              stroke="url(#nb-ring-spec)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* housing, drawn last so the ring's feet go INTO it */}
          <rect
            x={bossX}
            y={cy + 11.5}
            width={BOSS.w}
            height={BOSS.h}
            rx={BOSS.r}
            fill="#0d0b09"
            opacity="0.5"
            filter="url(#nb-soft-xs)"
          />
          <rect
            x={bossX}
            y={cy + 10}
            width={BOSS.w}
            height={BOSS.h}
            rx={BOSS.r}
            fill="url(#nb-ring-boss)"
          />
          <path
            d={`M ${bossX + 2.5} ${cy + 11.1} H ${bossX + BOSS.w - 2.5}`}
            stroke="#e6e9e9"
            strokeOpacity="0.45"
            strokeWidth="1.1"
          />
          {/* the slots the wire disappears into, on the flanks not the top */}
          <ellipse cx={bossX} cy={cy + flank} rx={1.2} ry={2} fill="#14171a" opacity="0.45" />
          <ellipse cx={bossX + BOSS.w} cy={cy + flank} rx={1.2} ry={2} fill="#14171a" opacity="0.5" />
        </g>
      ))}
    </svg>
  )
}
