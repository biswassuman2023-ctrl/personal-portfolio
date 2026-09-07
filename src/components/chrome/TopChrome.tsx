import { VinylPlayer } from '../music/VinylPlayer'
import { TopNav } from './TopNav'
import { Wordmark } from './Wordmark'
import './chrome.css'

/**
 * The website's own interface, living OUTSIDE the notebook.
 *
 * The whole point of this strip is that it is not printed on the paper. It sits
 * in the room the notebook is lying in, keeps a clear margin off the object,
 * and stays quiet enough that the notebook is still the thing you look at. It
 * has exactly three parts and no container, no bar, no background.
 */
export function TopChrome() {
  return (
    <header className="chrome">
      <Wordmark />
      <div className="chrome__right">
        <TopNav />
        <VinylPlayer />
      </div>
    </header>
  )
}
