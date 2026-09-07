import { RING_CENTERS_Y } from '../notebook/geometry'
import { ContactCard } from './ContactCard'
import { INDEX_X, PORTRAIT, u } from './layout'
import { NameTag } from './NameTag'
import { PhotoPrint } from './PhotoPrint'
import { Wordmark, WordmarkLabel } from './Wordmark'

/**
 * Left page: who this is. Four things and the page numbers.
 *
 * The lower half beyond the contact card is deliberately bare. It was tried
 * with a discipline strip and an origin card in it and both made the spread
 * read as a portfolio site with a notebook behind it — the empty paper is
 * doing more work than either of them did.
 */
export function HeroLeftPage() {
  return (
    <>
      <WordmarkLabel />
      <IndexMarks />
      <NameTag />
      <PhotoPrint {...PORTRAIT} slot="hero-portrait" edge="deckle" border={10} />
      <Wordmark />
      <ContactCard />
    </>
  )
}

/** Index numbers down the outer edge, set against the ring rows. */
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
