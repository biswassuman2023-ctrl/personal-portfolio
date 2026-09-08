import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { cutRect } from '../hero/paper'
import { Tack, Tape } from './Fasteners'
import { FOLD, foldColumns, foldHeight, type Category } from './layout'

/**
 * One category, as a folded note tacked to the board.
 *
 * THE CARD IS A FOLDED PIECE OF PAPER, and the whole interaction follows from
 * taking that literally. At rest you see the outside: a number and what it
 * says on the front. The stack is written on the INSIDE, on a flap hinged
 * along the card's bottom edge and folded up behind it — so opening one is a
 * flap swinging down on its crease, not a panel appearing. That is the
 * difference between investigating an object and operating a disclosure
 * widget, and it is why there is no modal, no overlay and no dropdown here:
 * the content was always part of the object, it was just folded away.
 *
 * The flap hinges in real perspective (see .board-card__body) rather than
 * scaling its height, because a height animation is paper being squashed and
 * a rotateX is paper being opened. `backface-visibility: hidden` covers the
 * first half of the swing, where we would otherwise be reading the list
 * mirrored through the back of the sheet.
 *
 * Position and lift are NOT set here. The outer element is written every
 * frame by the board's motion loop (useBoardMotion) — one place owning all
 * per-frame geometry, so a tween and a parallax write can never fight over
 * the same transform.
 */

type Props = {
  category: Category
  open: boolean
  onToggle: () => void
  onHover: (hovering: boolean) => void
  registerEl: (el: HTMLDivElement | null) => void
}

export function CategoryCard({ category, open, onToggle, onHover, registerEl }: Props) {
  const { id, index, name, items, w, h, pin, hold } = category
  const flapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const foldH = foldHeight(items.length)
  const columns = foldColumns(items.length)
  const face = cutRect(w, h, 2.2, 1.1)
  const flapSheet = cutRect(w, foldH, 2.2, 1.1)
  const pinX = w * pin.at

  useEffect(() => {
    const flap = flapRef.current
    const list = listRef.current
    if (!flap || !list) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(flap, { rotateX: open ? 0 : -90 })
      gsap.set(list, { opacity: open ? 1 : 0 })
      return
    }

    const tl = gsap.timeline()
    if (open) {
      // Paper has weight: it swings down and stops, with no bounce at the
      // end — a flap that springs back up is a flap made of plastic.
      tl.to(flap, { rotateX: 0, duration: 0.54, ease: 'power3.out' }, 0)
      // The writing arrives only once the inside is actually facing the room.
      tl.to(list, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0.28)
    } else {
      tl.to(list, { opacity: 0, duration: 0.14, ease: 'power1.in' }, 0)
      tl.to(flap, { rotateX: -90, duration: 0.42, ease: 'power2.inOut' }, 0.04)
    }

    return () => {
      tl.kill()
    }
  }, [open])

  return (
    <div
      className={`board-card ${open ? 'is-open' : ''}`}
      ref={registerEl}
      data-card={id}
      style={{
        left: `calc(var(--bu) * ${category.x})`,
        top: `calc(var(--bu) * ${category.y})`,
        width: `calc(var(--bu) * ${w})`,
        height: `calc(var(--bu) * ${h})`,
      }}
    >
      <div className="board-card__body">
        <svg className="board-card__sheet" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <defs>
            <clipPath id={`bd-clip-${id}`}>
              <path d={face} />
            </clipPath>
          </defs>
          <path d={face} fill="#f6f0e0" />
          <g clipPath={`url(#bd-clip-${id})`}>
            <rect width={w} height={h} filter="url(#bd-stock)" />
            <rect width={w} height={h} fill="url(#bd-card-shade)" />
          </g>
          <path d={face} fill="none" stroke="#b7ab8d" strokeOpacity={0.5} strokeWidth={0.7} />
          {/* Tape first, tack over it: the corner was curling, so a strip went
              on after the card was already pinned. Only two of the six carry
              it — enough that the tack is a choice rather than the only
              option, not so many that the board looks taped together. */}
          {hold === 'tape' ? (
            <Tape x={w - 48} y={h - 22} w={74} h={21} rotate={-41} />
          ) : null}
          <Tack x={pinX} y={pin.y} r={9} />
        </svg>

        <button
          type="button"
          className="board-card__face"
          onClick={onToggle}
          onPointerEnter={() => onHover(true)}
          onPointerLeave={() => onHover(false)}
          onFocus={() => onHover(true)}
          onBlur={() => onHover(false)}
          aria-expanded={open}
        >
          {/* Index, name, note — and deliberately no item count. The card's
              SIZE is already the count: the widest object on the board is the
              one with ten tools on it. Printing the number as well says the
              same thing twice, and a bare digit in a corner says it worse. */}
          <span className="board-card__index">{index}</span>
          <span className="board-card__name">{name}</span>
          <span className="board-card__blurb">{category.blurb}</span>
        </button>

        <div
          className="board-card__flap"
          ref={flapRef}
          style={{ height: `calc(var(--bu) * ${foldH})` }}
        >
          <svg className="board-card__flap-sheet" viewBox={`0 0 ${w} ${foldH}`} aria-hidden="true">
            <defs>
              <clipPath id={`bd-flap-clip-${id}`}>
                <path d={flapSheet} />
              </clipPath>
            </defs>
            <path d={flapSheet} fill="#f6f0e0" />
            <g clipPath={`url(#bd-flap-clip-${id})`}>
              <rect width={w} height={foldH} filter="url(#bd-stock)" />
              {/* The crease: the inside of a fold never comes up to the same
                  brightness as the face that was lying on top of it. */}
              <rect width={w} height={foldH} fill="url(#bd-crease)" />
            </g>
            <path d={flapSheet} fill="none" stroke="#b7ab8d" strokeOpacity={0.5} strokeWidth={0.7} />
          </svg>

          <ul
            className="board-card__stack"
            ref={listRef}
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridAutoFlow: 'column',
              gridTemplateRows: `repeat(${Math.ceil(items.length / columns)}, calc(var(--bu) * ${FOLD.line}))`,
            }}
          >
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
