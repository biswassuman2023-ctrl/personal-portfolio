import { CLOSING, DESK_NOTE, DESK_PHOTO, STORY, TURN_HEADING, u } from './layout'
import { handUnderline } from './marks'
import { JourneyPath } from './JourneyPath'
import { TapedPhoto } from './TapedPhoto'

/**
 * Right page: the turn. Five things.
 *
 * "THE TURN" is doing two jobs at once, which is why it won over the more
 * literal headings. It names the turn he made — and it is also the page you
 * physically turned to arrive here, on a site whose whole conceit is a
 * notebook. A heading that means one thing about the story and another about
 * the object it is printed on is worth more than one that only reports.
 *
 * The closing line is the payoff of the entire spread and is the largest type
 * on this page, but it is still under two-thirds the size of the heading above
 * it — a sentence that shouts is a poster, and this is a notebook.
 */
export function OriginRightPage() {
  return (
    <div className="origin-page">
      <h2
        className="origin-heading"
        style={{ left: u(TURN_HEADING.x), top: u(TURN_HEADING.y), fontSize: u(TURN_HEADING.size) }}
      >
        The turn
      </h2>

      <JourneyPath />

      {/* No caption under this one — the handwritten note below it is the
          caption, and doing both would be saying it twice. */}
      <TapedPhoto slot="origin-desk" {...DESK_PHOTO} tapeAt={0.44} />

      {/* The one note in the margin that is a voice rather than a label. */}
      <p
        className="origin-note"
        style={{ left: u(DESK_NOTE.x), top: u(DESK_NOTE.y), width: u(DESK_NOTE.w) }}
      >
        then curiosity took over.
      </p>

      <p
        className="origin-story"
        style={{ left: u(STORY.x), top: u(STORY.y), width: u(STORY.w) }}
      >
        I got curious about the systems behind the screen, so I started teaching
        myself — programming, computer science, and a lot of figuring things out
        by building them.
      </p>

      <div className="origin-closing" style={{ left: u(CLOSING.x), top: u(CLOSING.y) }}>
        <span className="origin-closing__quiet">I started by studying systems.</span>
        <span className="origin-closing__loud">Now I build them.</span>
      </div>

      <div
        className="hero-artifact origin-mark"
        style={{ left: u(788), top: u(684), width: u(272), height: u(10) }}
      >
        <svg viewBox="0 0 272 10" aria-hidden="true">
          <path
            d={handUnderline(272, 10)}
            fill="none"
            stroke="var(--origin-red-muted)"
            strokeOpacity={0.75}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
