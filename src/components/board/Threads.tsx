import { Tack } from './Fasteners'
import { BOARD, CATEGORIES, HUB } from './layout'
import { threadPath } from './threadGeometry'

/**
 * The red thread, tied at one tack and run out to six others.
 *
 * UNDER the cards, not over them — the last few units of every run slide
 * beneath the card it arrives at, which is what happens on a real board where
 * the card went up over the thread. Ending a thread in open air just short of
 * its destination is the tell that it was drawn rather than tied.
 *
 * Each run is stroked twice: once dark and offset a little down and right for
 * the shadow it drops on the board, then the thread itself over that. One
 * stroke reads as a line; two read as something with a thickness lying on a
 * surface, and the offset is what puts it above the board rather than printed
 * on it.
 *
 * The `d` of every path is rewritten each frame by useBoardMotion — the
 * endpoints move with their cards, so the threads have to be re-solved rather
 * than transformed. What is authored here is the resting geometry, so the
 * board is correct on the first paint and stays correct with JavaScript off.
 */

type Props = {
  registerPath: (id: string, el: SVGPathElement | null) => void
  /** The hub tack rides its own shallow depth — see useBoardMotion. */
  hubRef: React.Ref<SVGGElement>
}

export function Threads({ registerPath, hubRef }: Props) {
  return (
    <svg
      className="board__threads"
      viewBox={`0 0 ${BOARD.w} ${BOARD.h}`}
      aria-hidden="true"
      focusable="false"
    >
      {CATEGORIES.map((c) => {
        const d = threadPath(HUB.x, HUB.y, c.x + c.w * c.pin.at, c.y + c.pin.y)
        return (
          <g key={c.id}>
            <path
              d={d}
              fill="none"
              stroke="#4a3520"
              strokeOpacity={0.2}
              strokeWidth={4.2}
              strokeLinecap="round"
              transform="translate(1.6 2.6)"
              ref={(el) => registerPath(`${c.id}:shadow`, el)}
            />
            <path
              d={d}
              fill="none"
              stroke="#b32418"
              strokeWidth={3.2}
              strokeLinecap="round"
              ref={(el) => registerPath(c.id, el)}
            />
          </g>
        )
      })}

      {/* The knot everything is tied at, drawn last so it sits over every run
          that leaves it. */}
      <g ref={hubRef}>
        <Tack x={HUB.x} y={HUB.y} r={11} />
      </g>
    </svg>
  )
}
