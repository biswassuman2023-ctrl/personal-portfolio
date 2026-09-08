import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'

/**
 * A reload must land on the resting Chapter 01 spread, deterministically —
 * not wherever the browser's own scroll memory last left it.
 *
 * The whole page-turn state machine is a pure function of `window.scrollY`
 * (see useTurnProgress), which is exactly what makes a browser's automatic
 * scroll restoration dangerous here: on a plain reload it can put the
 * viewport back at, say, mid-Chapter-02 before a single capture exists to
 * turn a sheet with. Nothing downstream can tell that apart from a reader who
 * scrolled there in the ordinary way, so it renders whatever a mid-turn
 * scroll position maps to — a spread combination nobody actually turned to.
 *
 * Opting out of that restoration is done in `index.html`, not here — see the
 * comment there for why it has to be that early. This corrects a restoration
 * that already landed before either script ran (some browsers apply it as
 * part of navigation, ahead of all scripts) and is cheap enough to do
 * unconditionally.
 */
if (typeof window !== 'undefined') {
  window.scrollTo(0, 0)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
