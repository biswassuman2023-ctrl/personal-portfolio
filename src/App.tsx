import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Credit } from './components/chrome/Credit'
import { TopChrome } from './components/chrome/TopChrome'
import { HeroDefs } from './components/hero/HeroDefs'
import { HeroLeftPage } from './components/hero/HeroLeftPage'
import { HeroRightPage } from './components/hero/HeroRightPage'
import { MethodLeftPage } from './components/method/MethodLeftPage'
import { MethodRightPage } from './components/method/MethodRightPage'
import { Notebook } from './components/notebook/Notebook'
import { OriginLeftPage } from './components/origin/OriginLeftPage'
import { OriginRightPage } from './components/origin/OriginRightPage'
import type { Spread } from './components/page-turn/spreads'
import { PageTurnStage } from './components/page-turn/PageTurnStage'
import { useSpreadCapture } from './components/page-turn/useSpreadCapture'
import { useTurnProgress } from './components/page-turn/useTurnProgress'
import { startSmoothScroll } from './lib/smoothScroll'
import './components/hero/hero.css'
import './components/method/method.css'
import './components/origin/origin.css'

/**
 * The book, and the site it is lying in.
 *
 * Three layers, and the order matters:
 *
 *   TopChrome     the website. Outside the notebook, off its edges.
 *   .stage        a scroll runway; its height IS the length of every turn.
 *   .stage__object the notebook, held still while the scroll moves paper.
 *
 * The spread renders as live DOM at rest and hands over to a WebGL sheet only
 * while a page is actually in the air. That split is deliberate: a mesh cannot
 * show live text, and text baked into a texture is never quite as crisp as the
 * real thing — so the texture is only on screen while it is moving, which is
 * the one time nobody can tell.
 */

/** The chapters, in the order they are bound. Adding one is appending an entry. */
const BOOK: Spread[] = [
  { id: 'hero', left: <HeroLeftPage />, right: <HeroRightPage /> },
  { id: 'origin', left: <OriginLeftPage />, right: <OriginRightPage /> },
  { id: 'method', left: <MethodLeftPage />, right: <MethodRightPage /> },
]

/** One sheet between each pair of spreads. Three chapters, two leaves to turn. */
const TURNS = BOOK.length - 1

/**
 * The chapters not on the page yet, in the order the turns will need them.
 *
 * Both lists are the book from the second spread on, split by side, because
 * that is exactly what the two faces of the sheets ahead are: turn N's back is
 * spread N+1's left page, and its front is spread N's right page — which for
 * every turn after the first is also a chapter that is not on screen yet.
 * They live in the DOM from mount so no capture ever waits on a render.
 */
const PREVIEW_LEFTS = BOOK.slice(1).map((spread) => spread.left)
const PREVIEW_RIGHTS = BOOK.slice(1).map((spread) => spread.right)

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  /* State, not a ref: the capture needs to run once the node EXISTS, and
     assigning a ref does not re-render, so a ref here never reaches the hook. */
  const [objectNode, setObjectNode] = useState<HTMLDivElement | null>(null)

  const captures = useSpreadCapture(objectNode, true, TURNS)
  /* Passed straight to useTurnProgress as the ceiling on how far scroll may
     drive the book — see the note on `readyTurns` there for why. */
  const { progress, active, landed, from } = useTurnProgress(stageRef, TURNS, captures.length)
  /** The sheet currently in the air is the one leaving spread `from`. */
  const capture = captures[from]

  useEffect(() => startSmoothScroll(), [])

  /*
    Which spread each page is showing — and they are NOT always the same one,
    because a book in the middle of a turn is showing two chapters at once.

    RIGHT changes first. The sheet being lifted carries the current right page
    away with it (that ink is on the mesh now, not on the paper), so what lies
    under it is already the next chapter's right page — from the moment the
    turn starts, not when it finishes. That is what makes the turn read as
    uncovering something rather than as a page going blank and refilling.

    LEFT changes last, when the sheet actually comes to rest on it.

    The capture gate is load-bearing. The turning sheet's front texture is a
    photograph of the departing right page taken once from this DOM; until that
    photograph exists this has to render the spread it is leaving whatever the
    scroll says, or a reload partway down the runway would show the next
    chapter with no sheet over it and the turn would have nothing to uncover.
  */
  const rightSpread = capture && (active || landed) ? from + 1 : from
  const leftSpread = capture && landed ? from + 1 : from

  return (
    <main className="studio">
      <TopChrome />

      {/* The runway is one turn long per sheet — see .stage in global.css,
          which does the arithmetic so adding a chapter never means editing a
          viewport height by hand. */}
      <div className="stage" ref={stageRef} style={{ '--turns': TURNS } as CSSProperties}>
        <div className="stage__sticky">
          {/* The notebook and its printed credit, centered as one group —
              see the comment on .stage__sticky in global.css. */}
          <div className="stage__group">
            <div className="stage__object" ref={setObjectNode}>
              <HeroDefs />
              {/*
                Three states, one spread. At rest the notebook draws itself.
                While a sheet is in the air its ink moves to the mesh, whose
                back face carries a real photograph of the spread being
                arrived at rather than blank paper — so the reveal happens as
                the sheet moves, not in a single frame when it disappears.
                When the turn finishes, the mesh goes away and the live DOM —
                already showing that same content — is what is left. Nothing
                to fade, nothing sitting on top of anything.
              */}
              <Notebook
                leftPage={BOOK[leftSpread].left}
                rightPage={BOOK[rightSpread].right}
                previewLeftPages={PREVIEW_LEFTS}
                previewRightPages={PREVIEW_RIGHTS}
              />
              {capture ? (
                <PageTurnStage progressRef={progress} capture={capture} active={active} />
              ) : null}
            </div>
            <Credit />
          </div>
        </div>
      </div>
    </main>
  )
}
