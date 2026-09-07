import { ROLE_CARD, u } from './layout'
import { PAPER } from './fonts'
import { PaperShadow } from './PaperShadow'
import { cutRect } from './paper'

/**
 * The classification card at the head of the right page — a printed slip
 * stating the field, in the flat declarative voice of a library label.
 *
 * The field and nothing else. It carried a ruled strip with a qualifier under
 * it ("Self-taught, full-stack"); that is a sentence about someone, and this
 * is a label. Small on purpose, too: the moment the card grows enough to need
 * internal padding decisions it stops being a slip of paper and becomes a card
 * component.
 */
export function RoleCard() {
  const { x, y, w, h, rotate } = ROLE_CARD

  return (
    <div
      className="hero-artifact role-card"
      style={{
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="role-card__svg" aria-hidden="true">
        <PaperShadow id="shadow-role-card" dx={1.2} dy={2.2} blur={2.4} opacity={0.22} />
        <path d={cutRect(w, h, 1, 0.6)} fill={PAPER.card} filter="url(#shadow-role-card)" />
        <path
          d={cutRect(w, h, 1, 0.6)}
          fill="none"
          stroke={PAPER.keyline}
          strokeWidth={1.3}
        />
        <rect
          x={2.4}
          y={2.4}
          width={w - 4.8}
          height={h - 4.8}
          fill="none"
          stroke={PAPER.keyline}
          strokeWidth={0.55}
        />
      </svg>

      <div className="role-card__body">
        <p className="role-card__title">
          Web Development
          <br />
          <span className="role-card__amp">&amp;</span>
          Design
        </p>
      </div>
    </div>
  )
}
