import { FRAME_VIEWBOX } from '../notebook/geometry'
import { FONT_SCRIPT, FONT_SERIF, PAPER } from './fonts'
import { WORDMARK } from './layout'

/**
 * The giant "Portfolio" — the one piece of typography outside the project's
 * type system, reconstructed from the reference:
 *
 *   Port    left page. A Didone: flat serifs, heavy stems, hairline joins.
 *   folio   right page. A delicate high-contrast italic, set slightly smaller
 *           but reading much larger because of the f's ascender and swash.
 *   '25     a small superior figure on the shoulder of the last o.
 *
 * Three decisions are load-bearing:
 *
 * TWO RUNS, SPLIT AT THE BINDING. The f is the first letter of `folio` and
 * lives on the right page; its swash reaches back toward the gutter, but the
 * letter belongs to the word it starts. Setting it on the left page against
 * the `t` made it read as part of `Port`.
 *
 * SVG TEXT. In SVG, `y` IS the baseline. The two runs are set at different
 * sizes in different faces and must sit on one line; CSS cannot hold that
 * reliably, because line-height puts the baseline at a different offset for
 * each size.
 *
 * NO FILTERS. An earlier pass ran `Port` through a displacement filter for a
 * dry-ink texture. It cost more than it bought: filtered text is rasterised
 * and goes soft, and at this size soft is the one thing the word cannot be.
 * The Didone's own contrast carries the print character instead.
 */
export function Wordmark() {
  const { baseline, portX, portSize, folioX, folioSize, yearSize, yearRise } = WORDMARK

  return (
    <svg className="wordmark" viewBox={FRAME_VIEWBOX} aria-hidden="true" focusable="false">
      <text
        x={portX}
        y={baseline}
        fontSize={portSize}
        fontFamily={FONT_SERIF}
        fontWeight={900}
        fill={PAPER.inkDeep}
        letterSpacing="-0.012em"
      >
        Port
      </text>
      <text
        x={folioX}
        y={baseline}
        fontSize={folioSize}
        fontFamily={FONT_SCRIPT}
        fontStyle="italic"
        fontWeight={300}
        fill={PAPER.inkDeep}
      >
        folio
        <tspan
          fontSize={yearSize}
          dy={-yearRise}
          fontFamily={FONT_SERIF}
          fontStyle="normal"
          fontWeight={400}
          letterSpacing="0.02em"
        >
          ’25
        </tspan>
      </text>
    </svg>
  )
}

/** Screen-reader heading for the spread, rendered once by the left page. */
export function WordmarkLabel() {
  return <h1 className="sr-only">Suman Biswas — Portfolio ’25</h1>
}
