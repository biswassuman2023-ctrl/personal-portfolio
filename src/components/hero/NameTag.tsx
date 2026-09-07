import { NAME_TAG, u } from './layout'
import { FONT_DISPLAY, PAPER } from './fonts'
import { PaperShadow } from './PaperShadow'
import { tagOval } from './paper'

/**
 * The name, printed on a small paper tag.
 *
 * Quiet on purpose. There is no wire ring, no eyelet, no keyline and no fill
 * behind the type — those read as a UI pill with an icon on it, which is
 * exactly what this must not be. What makes it paper instead is the cut: the
 * oval is hand-authored and slightly out of true on every side, and it sits on
 * the page on nothing but its own contact shadow.
 */
export function NameTag() {
  const { x, y, w, h, rotate } = NAME_TAG

  return (
    <div
      className="hero-artifact name-tag"
      style={{
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <PaperShadow id="shadow-name-tag" dx={0.9} dy={1.8} blur={2} opacity={0.2} />
        <path d={tagOval(w, h)} fill={PAPER.tag} filter="url(#shadow-name-tag)" />
        <text
          x={w / 2}
          y={h / 2}
          fontFamily={FONT_DISPLAY}
          fontSize={23}
          letterSpacing="0.11em"
          fill={PAPER.ink}
          dominantBaseline="central"
          textAnchor="middle"
        >
          SUMAN BISWAS
        </text>
      </svg>
    </div>
  )
}
