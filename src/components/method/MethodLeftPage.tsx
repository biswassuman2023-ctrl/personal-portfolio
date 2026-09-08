import { RING_CENTERS_Y } from '../notebook/geometry'
import { EYEBROW, HEADING, INDEX_X, INSTRUCTION, u } from './layout'
import { Stamp } from './Stamp'
import { useStampTrail } from './useStampTrail'

/**
 * Left page: the way I build. A heading, one instruction, and a trail of
 * stamps that come and go under the cursor.
 *
 * This is the emptiest page in the book at rest, and stays close to empty
 * even mid-interaction — the other two chapters hand the reader a finished
 * page; this one hands them a blank one and an instruction, and the method
 * only ever exists a few words at a time, wherever their hand has just been.
 * A process page that arrives already printed would be a list of five words
 * — which is exactly what every other portfolio does with this content, and
 * exactly what makes it unreadable. One that FILLS UP and stays full is only
 * a slower way of arriving at the same list.
 *
 * The instruction leaves the moment the reader starts moving the cursor and
 * does not come back — bringing it back every time the page empties out
 * again (which is constantly, by design) would make it a nag rather than a
 * hint.
 */
export function MethodLeftPage() {
  const { rootRef, stamps, interacted, remove } = useStampTrail()

  return (
    <div className="method-page" ref={rootRef}>
      <IndexMarks />

      <span className="method-eyebrow" style={{ left: u(EYEBROW.x), top: u(EYEBROW.y) }}>
        Chapter 03 · Method
      </span>

      <h2
        className="method-heading"
        style={{ left: u(HEADING.x), top: u(HEADING.y), fontSize: u(HEADING.size) }}
      >
        The way
        <br />I build
      </h2>

      <p
        className={`method-instruction ${interacted ? 'is-done' : ''}`}
        style={{ left: u(INSTRUCTION.x), top: u(INSTRUCTION.y) }}
      >
        move your mouse around
      </p>

      {stamps.map((stamp) => (
        <Stamp
          key={stamp.id}
          word={stamp.word}
          x={stamp.x}
          y={stamp.y}
          w={stamp.w}
          h={stamp.h}
          rotate={stamp.rotate}
          seed={stamp.seed}
          static={stamp.static}
          onDone={stamp.static ? undefined : () => remove(stamp.id)}
        />
      ))}
    </div>
  )
}

/** Index numbers down the outer edge, set against the ring rows, as Ch 01-02. */
function IndexMarks() {
  return (
    <div className="index-marks" aria-hidden="true">
      {RING_CENTERS_Y.map((y, i) => (
        <span key={y} style={{ left: u(INDEX_X), top: u(y - 8) }}>
          {i + 1}
        </span>
      ))}
    </div>
  )
}
