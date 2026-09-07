/**
 * The small printed credit under the notebook: "Made by Suman Biswas".
 *
 * It belongs to the canvas the notebook is resting on, not to the notebook
 * itself — so it sits below the object rather than inside it, in the same
 * quiet hand as the sign-off already printed on the hero page ("S.B. — '25"),
 * which is the closest thing this project already has to a small personal
 * attribution line. Reaching for that face here, rather than Pagkaki or the
 * wordmark's one-off serif/script pair, keeps this a signature rather than a
 * second masthead.
 *
 * HREF is a placeholder on purpose — swap it for wherever this should point.
 */
const HREF = '#'

export function Credit() {
  return (
    <a className="stage__credit" href={HREF}>
      Made by Suman Biswas
    </a>
  )
}
