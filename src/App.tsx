import { useEffect, useRef, useState } from 'react'
import { Credit } from './components/chrome/Credit'
import { TopChrome } from './components/chrome/TopChrome'
import { HeroDefs } from './components/hero/HeroDefs'
import { HeroLeftPage } from './components/hero/HeroLeftPage'
import { HeroRightPage } from './components/hero/HeroRightPage'
import { Notebook } from './components/notebook/Notebook'
import { OriginLeftPage } from './components/origin/OriginLeftPage'
import { OriginRightPage } from './components/origin/OriginRightPage'
import type { Spread } from './components/page-turn/spreads'
import { PageTurnStage } from './components/page-turn/PageTurnStage'
import { useSpreadCapture } from './components/page-turn/useSpreadCapture'
import { useTurnProgress } from './components/page-turn/useTurnProgress'
import { startSmoothScroll } from './lib/smoothScroll'
import './components/hero/hero.css'
import './components/origin/origin.css'

/**
 * The book, and the site it is lying in.
 *
 * Three layers, and the order matters:
 *
 *   TopChrome     the website. Outside the notebook, off its edges.
 *   .stage        a scroll runway; its height IS the length of one page turn.
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
]

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  /* State, not a ref: the capture needs to run once the node EXISTS, and
     assigning a ref does not re-render, so a ref here never reaches the hook. */
  const [objectNode, setObjectNode] = useState<HTMLDivElement | null>(null)

  const { progress, active, landed } = useTurnProgress(stageRef)
  const capture = useSpreadCapture(objectNode, true)

  useEffect(() => startSmoothScroll(), [])

  /*
    Which spread each page is showing — and they are NOT always the same one,
    because a book in the middle of a turn is showing two chapters at once.

    RIGHT changes first. The sheet being lifted carries Chapter 01's right page
    away with it (that ink is on the mesh now, not on the paper), so what lies
    under it is already the next chapter's right page — from the moment the
    turn starts, not when it finishes. That is what makes the turn read as
    uncovering something rather than as a page going blank and refilling.

    LEFT changes last, when the sheet actually comes to rest on it.

    The capture gate is load-bearing. The turning sheet's front texture is a
    photograph of Chapter 01's right page taken once from this DOM; until that
    photograph exists this has to render Chapter 01 whatever the scroll says,
    or a reload partway down the runway would photograph Chapter 02 and the
    sheet would turn over carrying the wrong chapter's ink.
  */
  const rightSpread = capture && (active || landed) ? 1 : 0
  const leftSpread = landed ? 1 : 0

  /*
    What the turning sheet's BACK face is a photograph of: the left page of
    the spread AFTER the one currently underneath. This is captured once, at
    mount, from a hidden copy of that page — see Pages.tsx's `previewLeft`
    and useSpreadCapture's third pass — so the sheet can show real content
    landing instead of blank paper. `undefined` past the last spread, which
    the capture and the shader both treat as "nothing to preview" rather than
    as an error.
  */
  const previewLeftPage = BOOK[leftSpread + 1]?.left

  return (
    <main className="studio">
      <TopChrome />

      <div className="stage" ref={stageRef}>
        <div className="stage__sticky">
          {/* The notebook and its printed credit, centered as one group —
              see the comment on .stage__sticky in global.css. */}
          <div className="stage__group">
            <div className="stage__object" ref={setObjectNode}>
              <HeroDefs />
              {/*
                Three states, one spread. At rest the notebook draws itself.
                While a sheet is in the air its ink moves to the mesh, whose
                back face now carries a real photograph of the spread being
                arrived at (previewLeftPage below) rather than blank paper —
                so the reveal happens as the sheet moves, not in a single
                frame when it disappears. When the turn finishes, the mesh
                goes away and the live DOM — already showing that same
                content — is what is left. Nothing to fade, nothing sitting
                on top of anything.
              */}
              <Notebook
                leftPage={BOOK[leftSpread].left}
                rightPage={BOOK[rightSpread].right}
                previewLeftPage={previewLeftPage}
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
