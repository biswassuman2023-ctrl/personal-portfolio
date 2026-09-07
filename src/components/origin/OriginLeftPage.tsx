import { RING_CENTERS_Y } from '../notebook/geometry'
import {
  COLLEGE_CAPTION,
  COLLEGE_PHOTO,
  DEGREE,
  DEGREE_LINES,
  EYEBROW,
  HEADING,
  INDEX_X,
  NARRATIVE,
  SUBJECT,
  u,
} from './layout'
import { arcArrow, looseCircle } from './marks'
import { TapedPhoto } from './TapedPhoto'

/**
 * Left page: where it started. Five things and the page numbers.
 *
 * The composition is a diagonal — heading top-left, photograph answering it on
 * the right, the facts settling underneath at the left — so the eye crosses
 * the page instead of running down a single column. The lower third is bare
 * and stays bare; on this spread as on Chapter 01, the empty paper is the
 * composition rather than a gap in it.
 *
 * ECONOMICS is the only word on the page circled in pen — it is the subject
 * of the whole spread, and marking it by hand says so more quietly than
 * making it bigger would. Colour on this page is locked to the font: Pagkaki
 * (the eyebrow, the heading, ECONOMICS itself) is always deep red; Schoolbell
 * (the degree, the story, the photo caption) is always the muted red one
 * shade lighter — see origin.css for why that split replaced picking a colour
 * per element.
 */
export function OriginLeftPage() {
  return (
    <div className="origin-page">
      <IndexMarks />

      <span className="origin-eyebrow" style={{ left: u(EYEBROW.x), top: u(EYEBROW.y) }}>
        Chapter 02 · Origin
      </span>

      <h2
        className="origin-heading"
        style={{ left: u(HEADING.x), top: u(HEADING.y), fontSize: u(HEADING.size) }}
      >
        Where it
        <br />
        started
      </h2>

      <span
        className="origin-subject"
        style={{ left: u(SUBJECT.x), top: u(SUBJECT.y), fontSize: u(SUBJECT.size) }}
      >
        ECONOMICS
      </span>

      {/* Circled by hand, after the fact — see marks.ts on the overshoot. */}
      <div
        className="hero-artifact origin-mark"
        style={{ left: u(102), top: u(246), width: u(246), height: u(72) }}
      >
        <svg viewBox="0 0 246 72" aria-hidden="true">
          <path
            d={looseCircle(246, 72)}
            fill="none"
            stroke="var(--origin-red-muted)"
            strokeOpacity={0.82}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <ul className="origin-degree" style={{ left: u(DEGREE.x), top: u(DEGREE.y) }}>
        {DEGREE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* Points at the photograph without touching it: an arrow that lands on
          the thing it indicates is a UI connector, not an annotation. */}
      <div
        className="hero-artifact origin-mark"
        style={{ left: u(252), top: u(452), width: u(76), height: u(58) }}
      >
        <svg viewBox="0 0 76 58" aria-hidden="true">
          <path
            d={arcArrow(76, 58)}
            fill="none"
            stroke="var(--origin-red-muted)"
            strokeOpacity={0.7}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <TapedPhoto
        slot="origin-college"
        {...COLLEGE_PHOTO}
        edge="deckle"
        caption="Delhi · 2025"
        captionAt={COLLEGE_CAPTION}
        tapeAt={0.26}
      />

      <div
        className="origin-narrative-block"
        style={{ left: u(NARRATIVE.x), top: u(NARRATIVE.y), width: u(NARRATIVE.w) }}
      >
        <p className="origin-narrative">
          I started as an Economics student at the University of Delhi, where I
          completed my graduation at Motilal Nehru College.
        </p>
        <p className="origin-narrative">
          Somewhere along the way, curiosity pulled me toward technology. I
          started teaching myself computer science and web development,
          learning by building, experimenting, and figuring things out one
          project at a time.
        </p>
      </div>
    </div>
  )
}

/** Index numbers down the outer edge, set against the ring rows, as Chapter 01. */
function IndexMarks() {
  return (
    <div className="index-marks" aria-hidden="true">
      {RING_CENTERS_Y.map((y, i) => (
        <span key={y} style={{ left: u(INDEX_X), top: u(y - 8) }}>
          {i + 1}
        </span>
      ))}
    </div>
  )
}
