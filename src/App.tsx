import { useEffect, useRef, useState } from 'react'
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

  const { progress, active } = useTurnProgress(stageRef)
  const capture = useSpreadCapture(objectNode, true)

  useEffect(() => startSmoothScroll(), [])

  return (
    <main className="studio">
      <TopChrome />

      <div className="stage" ref={stageRef}>
        <div className="stage__sticky">
          <div className="stage__object" ref={setObjectNode}>
            <HeroDefs />
            <Notebook
              leftPage={<HeroLeftPage />}
              rightPage={<HeroRightPage />}
              turningSide={active ? 'right' : null}
            />
            {capture ? (
              <PageTurnStage progressRef={progress} capture={capture} active={active} />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
