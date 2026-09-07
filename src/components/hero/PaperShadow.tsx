/**
 * The contact shadow under a piece of paper, as an SVG filter rather than a
 * CSS one.
 *
 * This is not a style preference. The page-turn capture serialises the DOM
 * into an SVG `foreignObject` before rasterising it, and a CSS `filter` on an
 * element containing SVG does not survive that trip — the artefact comes back
 * as a solid black rectangle. Native `feDropShadow`, declared inside the SVG
 * that uses it, serialises correctly.
 *
 * Values are in the host SVG's own user units, so each artefact passes numbers
 * that suit its own viewBox.
 */

type Props = {
  id: string
  dx?: number
  dy?: number
  blur?: number
  opacity?: number
}

export function PaperShadow({ id, dx = 1.2, dy = 2.4, blur = 2.4, opacity = 0.26 }: Props) {
  return (
    <defs>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feDropShadow
          dx={dx}
          dy={dy}
          stdDeviation={blur}
          floodColor="#3a3226"
          floodOpacity={opacity}
        />
      </filter>
    </defs>
  )
}
