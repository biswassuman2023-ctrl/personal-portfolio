/**
 * The site wordmark, top-left. Pagkaki set large in the house blue.
 *
 * It is the first name, not a logo: no mark, no container, no tagline, no
 * surname. One word, set at a scale that reads as a masthead rather than a
 * navbar brand — the face is doing the work, so anything built around it, or
 * appended after it, would only get in the way.
 */
export function Wordmark() {
  return (
    <a className="chrome__wordmark" href="#top" aria-label="Suman Biswas — home">
      SUMAN
    </a>
  )
}
