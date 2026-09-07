import type { ReactNode } from 'react'
import { FRAME, framePct, viewBoxOf, type Box } from './geometry'
import { HOLE_RX, HOLE_RY, holesFor } from './holes'

/**
 * One page: a stack of sheets with the top one facing us, punched for the
 * rings.
 *
 * The holes are a real cut, not a dark circle painted on: the sheet group is
 * masked, so the opening is transparent through to the cover beneath. Over
 * that opening go the three things that make a punched hole read — a bore lit
 * on its lower-right inner wall (the light is upper-left, so that is the wall
 * it reaches), the bright cut edge of the paper's own thickness, and a
 * whisper of crushed fibre outside the rim where the punch went through.
 *
 * The element is its own transform container with its hinge at the binding
 * edge, so a later phase can rotate it without touching the rest of the
 * assembly. Nothing here animates yet.
 */

type Side = 'left' | 'right'

type PageProps = {
  side: Side
  box: Box
  sheet: string
  /** What is printed on this sheet. Laid out in notebook-frame units. */
  children?: ReactNode
  /** True while WebGL is drawing this sheet mid-turn; the DOM twin hides. */
  turning?: boolean
  /**
   * The NEXT spread's content for this page, rendered in the same frame but
   * invisible in ordinary view — revealed only for the page-turn's capture of
   * the turning sheet's back face, so that face can show a real photograph of
   * the page it is arriving at instead of blank material. See page-turn.css's
   * `[data-capturing='nextLeft']` rules and useSpreadCapture's third pass.
   */
  previewChildren?: ReactNode
}

/**
 * Children are wrapped in a box the size of the WHOLE notebook frame, shifted
 * so its origin sits on the notebook's origin. Anything printed on the page can
 * then be positioned in the same 1277x748 space every other layer uses, and the
 * page's own clip decides how much of it this sheet shows.
 */
const spreadFrame = (box: Box) => ({
  left: `${(-box.x / box.w) * 100}%`,
  top: `${(-box.y / box.h) * 100}%`,
  width: `${(FRAME.w / box.w) * 100}%`,
  height: `${(FRAME.h / box.h) * 100}%`,
})

/**
 * Cut edges of the sheets underneath. Deliberately non-linear: the tones step
 * unevenly and the vertical jitter is hand-picked rather than computed,
 * because a settled stack has no rhythm to it.
 */
const STACK_TONES = ['#e7dfd0', '#ded4c2', '#d3c8b2', '#c7baa1', '#b9ab8f']
const STACK_JITTER = [0.45, -0.35, 0.8, -0.15, 0.55]
const STACK_STEP = 2.4

/** The paper surface itself. */
function PageSurface({ side, sheet }: { side: Side; sheet: string }) {
  return (
    <>
      <path className="notebook__sheet" d={sheet} fill="#f2ece1" filter="url(#nb-paper)" />
      {/* Lighting, not material: the sheen, the falloff and the gutter shading
          describe how the room falls on this page, not what the paper is. They
          carry a class so the page-turn's paper capture can leave them out and
          photograph the material alone — a turning sheet gets its lighting from
          the shader, and baking a gutter gradient into its texture drags a hard
          grey band around with it. */}
      <g className="notebook__page-shading">
        <path d={sheet} fill={`url(#nb-sheen-${side})`} />
        <path d={sheet} fill="url(#nb-page-fall)" />
        <path d={sheet} fill={`url(#nb-gutter-${side})`} />
      </g>
    </>
  )
}

/** Bore, cut edge and crushed fibre. */
function PunchHole({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse
        cx={x}
        cy={y}
        rx={HOLE_RX + 2.6}
        ry={HOLE_RY + 2.6}
        fill="none"
        stroke="#8d8272"
        strokeOpacity="0.16"
        strokeWidth="2.8"
        filter="url(#nb-soft-sm)"
      />
      <ellipse cx={x} cy={y} rx={HOLE_RX} ry={HOLE_RY} fill="url(#nb-hole-bore)" />
      <ellipse
        cx={x}
        cy={y}
        rx={HOLE_RX - 0.7}
        ry={HOLE_RY - 0.7}
        fill="none"
        stroke="url(#nb-hole-rim)"
        strokeWidth="0.9"
      />
      {/* the sheet edge drops its own shadow into the bore */}
      <path
        d={`M ${x - HOLE_RX} ${y} A ${HOLE_RX} ${HOLE_RY} 0 0 1 ${x + HOLE_RX} ${y}`}
        fill="none"
        stroke="#0f0d0a"
        strokeOpacity="0.35"
        strokeWidth="2.6"
        filter="url(#nb-soft-xs)"
      />
    </g>
  )
}

export function Page({ side, box, sheet, children, turning = false, previewChildren }: PageProps) {
  const outward = side === 'left' ? -1 : 1
  const understack = STACK_TONES.map((tone, i) => ({ tone, depth: i + 1 })).reverse()

  return (
    <div
      className={[
        'notebook__page',
        `notebook__page--${side}`,
        turning ? 'notebook__page--turning' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={framePct(box)}
    >
      <svg
        className="notebook__page-svg"
        viewBox={viewBoxOf(box)}
        aria-hidden="true"
        focusable="false"
      >
        <g mask={`url(#nb-punch-${side})`}>
          <g className="notebook__understack">
            {understack.map(({ tone, depth }) => (
              <path
                key={depth}
                d={sheet}
                transform={`translate(${outward * depth * STACK_STEP} ${STACK_JITTER[depth - 1]})`}
                fill={tone}
                stroke="#a2947a"
                strokeOpacity={0.28}
                strokeWidth={0.5}
              />
            ))}
          </g>
          <PageSurface side={side} sheet={sheet} />
        </g>

        <g className="notebook__punch">
          {holesFor(side).map(({ x, y }) => (
            <PunchHole key={y} x={x} y={y} />
          ))}
        </g>
      </svg>

      {children ? (
        <div className="notebook__page-content">
          <div className="notebook__spread-frame" style={spreadFrame(box)}>
            {children}
          </div>
        </div>
      ) : null}

      {previewChildren ? (
        <div className="notebook__page-content notebook__page-content--preview">
          <div className="notebook__spread-frame" style={spreadFrame(box)}>
            {previewChildren}
          </div>
        </div>
      ) : null}
    </div>
  )
}
