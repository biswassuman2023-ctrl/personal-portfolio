import { CONTACT, CONTACT_CARD, u } from './layout'
import { FONT_DISPLAY, PAPER } from './fonts'
import { PaperShadow } from './PaperShadow'
import { cutRect } from './paper'

/**
 * The small card held down in the lower-left corner by a wax seal.
 *
 * Three lines and a heading. It is the only place on the spread that tells you
 * how to reach anyone, and it stays a card rather than growing into a panel —
 * the reference's version is barely bigger than the seal holding it.
 */
export function ContactCard() {
  const { x, y, w, h, rotate } = CONTACT_CARD

  return (
    <div
      className="hero-artifact contact-card"
      style={{
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="contact-card__svg" aria-hidden="true">
        <PaperShadow id="shadow-contact-card" dx={1.4} dy={2.6} blur={2.8} opacity={0.24} />
        <path
          d={cutRect(w, h, 1.4, 0.8)}
          fill={PAPER.cream}
          filter="url(#shadow-contact-card)"
        />
      </svg>

      <div className="contact-card__body">
        <span className="contact-card__heading">Contact</span>
        <ol className="contact-card__list">
          {CONTACT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>

      <WaxSeal />
    </div>
  )
}

/**
 * Wax seal holding the card down. Struck, not printed: the edge is irregular
 * where it spread under pressure, it is lit from the same upper-left source as
 * everything else, and the initials are pressed in rather than drawn on.
 */
function WaxSeal() {
  return (
    <svg className="wax-seal" viewBox="0 0 40 40" aria-hidden="true">
      <PaperShadow id="shadow-wax-seal" dx={0.7} dy={1.2} blur={1.1} opacity={0.4} />
      <path
        filter="url(#shadow-wax-seal)"
        d="M 20 1.5 C 27 1, 33.5 5.5, 36.5 11.5 C 39.5 17.5, 38.5 26, 34 31 C 29.5 36, 21 39, 14.5 37 C 8 35, 3 29.5, 1.8 23 C 0.6 16.5, 3 8.5, 8.5 4.5 C 12 1.9, 16 1.8, 20 1.5 Z"
        fill={PAPER.wax}
      />
      <path
        d="M 20 4.5 C 26 4.2, 31 8, 33.5 13 C 36 18, 35 25, 31.4 29 C 27.8 33, 21 35.4, 15.6 33.8 C 10.2 32.2, 6 27.6, 5 22.2 C 4 16.8, 6 10.2, 10.6 7 C 13.4 5, 16.8 4.7, 20 4.5 Z"
        fill="none" stroke={PAPER.waxRim} strokeWidth={1.4} opacity={0.7}
      />
      <text x="20" y="21.5" fontFamily={FONT_DISPLAY} fontSize={15} letterSpacing="0.06em" fill={PAPER.waxMark} textAnchor="middle" dominantBaseline="central">
        SB
      </text>
    </svg>
  )
}
