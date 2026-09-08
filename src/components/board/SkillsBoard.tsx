import { useState } from 'react'
import { cutRect } from '../hero/paper'
import { BoardDefs } from './BoardDefs'
import { CategoryCard } from './CategoryCard'
import { Threads } from './Threads'
import { BOARD, CATEGORIES, EYEBROW, NOTE, TITLE } from './layout'
import { useBoardMotion } from './useBoardMotion'
import './board.css'

/**
 * Chapter 04 — What I build with.
 *
 * The notebook is finished and closed; this is the next thing in the room.
 * It is an investigation board: a warm board hung on the same blue wall, a
 * title cut from red paper strips, one tack every thread is tied to, and six
 * folded notes pinned around it — one per part of the stack, each holding its
 * own tools folded inside.
 *
 * WHY A BOARD AND NOT A SKILLS SECTION. The content here is the least
 * interesting thing a portfolio can list: thirty-five technology names that
 * every other portfolio also lists, usually as a wall of logos or a row of
 * bars claiming a percentage. The board makes the same content do something
 * else — it hides most of it, gives you a reason to open one piece at a time,
 * and uses SIZE to say where the depth is before you have read a word. The
 * widest object on the board is the one with ten tools on it; the smallest
 * has two. That correspondence is the section's actual information design.
 *
 * Nothing is centred and nothing is evenly spaced, the same rule the notebook
 * spreads run on — see layout.ts, where every position was placed by eye.
 */
export function SkillsBoard() {
  /** One at a time. Two flaps open at once is a board being read by nobody. */
  const [openId, setOpenId] = useState<string | null>(null)
  const { sectionRef, surfaceRef, titleRef, hubRef, registerCard, registerPath, setHover } =
    useBoardMotion(openId)

  const surface = cutRect(BOARD.w, BOARD.h, 5, 2.4)

  return (
    <section className="board-section" ref={sectionRef} aria-labelledby="board-title">
      <div className="board-stage">
        <div className="board">
          <BoardDefs />

          {/* The board itself: warm stock, its own fibre, its own falloff,
              and an edge that is not quite straight on any of its four sides. */}
          <svg
            className="board__surface"
            ref={surfaceRef}
            viewBox={`0 0 ${BOARD.w} ${BOARD.h}`}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <clipPath id="bd-board-clip">
                <path d={surface} />
              </clipPath>
            </defs>
            <path d={surface} fill="#eee2c3" />
            <g clipPath="url(#bd-board-clip)">
              <rect width={BOARD.w} height={BOARD.h} filter="url(#bd-fibre)" />
              <rect width={BOARD.w} height={BOARD.h} fill="url(#bd-vignette)" />
            </g>
            <path d={surface} fill="none" stroke="#b3a684" strokeOpacity={0.65} strokeWidth={1.4} />
          </svg>

          <Threads registerPath={registerPath} hubRef={hubRef} />

          <div className="board__title-layer" ref={titleRef}>
            <span
              className="board-eyebrow"
              style={{
                left: `calc(var(--bu) * ${EYEBROW.x})`,
                top: `calc(var(--bu) * ${EYEBROW.y})`,
              }}
            >
              Chapter 04 · The stack
            </span>

            {/* Three cut strips rather than one block of type: each carries
                its own width and its own angle, which a single element with
                three lines in it cannot do. */}
            <h2
              id="board-title"
              className="board-title"
              style={{
                left: `calc(var(--bu) * ${TITLE.x})`,
                top: `calc(var(--bu) * ${TITLE.y})`,
              }}
            >
              {TITLE.lines.map((line, i) => (
                <span
                  key={line.text}
                  className="board-title__bar"
                  style={{
                    left: `calc(var(--bu) * ${line.dx})`,
                    top: `calc(var(--bu) * ${i * (TITLE.bar + TITLE.gap)})`,
                    width: `calc(var(--bu) * ${line.w})`,
                    height: `calc(var(--bu) * ${TITLE.bar})`,
                    fontSize: `calc(var(--bu) * 46)`,
                    transform: `rotate(${line.rotate}deg)`,
                  }}
                >
                  {line.text}
                </span>
              ))}
            </h2>

            <p
              className="board-note"
              style={{
                left: `calc(var(--bu) * ${NOTE.x})`,
                top: `calc(var(--bu) * ${NOTE.y})`,
                width: `calc(var(--bu) * ${NOTE.w})`,
              }}
            >
              open one — the stack is folded inside
            </p>
          </div>

          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              open={openId === category.id}
              onToggle={() => setOpenId((was) => (was === category.id ? null : category.id))}
              onHover={(hovering) => setHover(category.id, hovering)}
              registerEl={(el) => registerCard(category.id, el)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
