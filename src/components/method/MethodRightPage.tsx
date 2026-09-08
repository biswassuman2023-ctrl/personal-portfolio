import { WORKS, WORK_HEADING, WORK_INSTRUCTION, u } from './layout'
import { useWorkGallery } from './useWorkGallery'
import { WorkPrint } from './WorkPrint'

/**
 * Right page: what I make. Four prints and one line telling you they move.
 *
 * The left page is the process; this is the result, and the pairing is the
 * reason the spread works as one thing. It carries no explanatory copy at all
 * — four labels written on four prints, and nothing claiming what any of them
 * achieved. There is no real work in these wells yet, and a caption describing
 * work that is not shown would be the one dishonest thing in the notebook.
 *
 * The prints being movable is not decoration. The whole book is an argument
 * that these are physical objects, and the last page is where it stops being
 * something the reader watches and becomes something they can put their hand
 * on. It is also the quietest possible way to say "there is more here than the
 * arrangement you happened to find".
 *
 * The prints are rendered in STACK ORDER, back to front, so DOM order is paint
 * order and picking one up genuinely brings it to the front of the pile. See
 * useWorkGallery, which also explains why the pointer test is done by hand.
 */
export function MethodRightPage() {
  const { pageRef, offsets, stack, heldIndex, hovered, handlers } = useWorkGallery()

  return (
    <div
      className={`method-page method-page--gallery ${hovered ? 'is-over-print' : ''} ${
        heldIndex !== null ? 'is-holding' : ''
      }`}
      ref={pageRef}
      {...handlers}
    >
      <h2
        className="method-heading"
        style={{
          left: u(WORK_HEADING.x),
          top: u(WORK_HEADING.y),
          fontSize: u(WORK_HEADING.size),
        }}
      >
        What I make
      </h2>

      {stack.map((index) => {
        const work = WORKS[index]
        return (
          <WorkPrint
            key={work.slot}
            slot={work.slot}
            label={work.label}
            x={work.x}
            y={work.y}
            w={work.w}
            h={work.h}
            rotate={work.rotate}
            offset={offsets[index]}
            held={heldIndex === index}
          />
        )
      })}

      <p
        className="method-note"
        style={{ left: u(WORK_INSTRUCTION.x), top: u(WORK_INSTRUCTION.y) }}
      >
        move through the work
      </p>
    </div>
  )
}
