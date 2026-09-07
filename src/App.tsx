import { useEffect, useRef, useState } from 'react'
import { Credit } from './components/chrome/Credit'
import { TopChrome } from './components/chrome/TopChrome'
import { HeroDefs } from './components/hero/HeroDefs'
import { HeroLeftPage } from './components/hero/HeroLeftPage'
import { HeroRightPage } from './components/hero/HeroRightPage'
import { Notebook } from './components/notebook/Notebook'
import { PageTurnStage } from './components/page-turn/PageTurnStage'
import { useSpreadCapture } from './components/page-turn/useSpreadCapture'
import { useTurnProgress } from './components/page-turn/useTurnProgress'
import { startSmoothScroll } from './lib/smoothScroll'
import './components/hero/hero.css'

/**
 * Chapter 01 — Hero, inside the notebook, inside the site.
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
export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  /* State, not a ref: the capture needs to run once the node EXISTS, and
     assigning a ref does not re-render, so a ref here never reaches the hook. */
  const [objectNode, setObjectNode] = useState<HTMLDivElement | null>(null)

  const { progress, active, landed } = useTurnProgress(stageRef)
  const capture = useSpreadCapture(objectNode, true)

  useEffect(() => startSmoothScroll(), [])

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
                Three states, one spread. At rest the notebook draws itself. While
                a sheet is in the air its ink moves to the mesh. When the turn
                finishes the mesh goes away and the notebook draws the spread the
                sheet landed on — the back of the turned leaf on the left, the
                next page on the right, both of them blank for now. The last frame
                of a turn is therefore live DOM, not a texture: nothing to fade,
                nothing sitting on top of anything.
              */}
              <Notebook
                leftPage={<HeroLeftPage />}
                rightPage={<HeroRightPage />}
                turningSide={active ? 'right' : null}
                landed={landed}
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
