import { JOURNEY, JOURNEY_BEATS, u } from './layout'
import { stepArrow } from './marks'

/**
 * The route from Economics to the web, drawn rather than listed.
 *
 * One column, one x for every word and every connector — the thing that
 * makes this read as a single hand-drawn line rather than five separate
 * marks is that the connector sits at the exact same offset from the column
 * every time. Variation belongs to the stroke each connector draws (see
 * marks.ts), never to where it sits.
 *
 * All five words are Pagkaki, and Pagkaki on this spread is always the same
 * deep red — no ramp, no fading beat. Hierarchy here comes from the words
 * and the connectors between them, not from making four-fifths of the path
 * harder to read than the fifth.
 */
export function JourneyPath() {
  const { x, y, step, size } = JOURNEY
  const arrow = { w: 14, h: 16 }
  // fixed offset from the column for every connector — never per-beat
  const arrowX = x + 10

  return (
    <>
      {JOURNEY_BEATS.map((label, i) => {
        const beatY = y + i * step
        const isLast = i === JOURNEY_BEATS.length - 1

        return (
          <div key={label}>
            <span
              className="origin-beat"
              style={{ left: u(x), top: u(beatY), fontSize: u(size) }}
            >
              {label}
            </span>

            {isLast ? null : (
              <div
                className="hero-artifact origin-step"
                style={{
                  left: u(arrowX),
                  top: u(beatY + size + 6),
                  width: u(arrow.w),
                  height: u(arrow.h),
                }}
              >
                <svg viewBox={`0 0 ${arrow.w} ${arrow.h}`} aria-hidden="true">
                  <path
                    d={stepArrow(arrow.w, arrow.h, i % 2 === 0 ? 0.02 : -0.02)}
                    fill="none"
                    stroke="var(--origin-red-muted)"
                    strokeOpacity={0.85}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
