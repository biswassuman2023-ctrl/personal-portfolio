/**
 * Font stacks as literal strings, for use as SVG PRESENTATION ATTRIBUTES.
 *
 * SVG elements in the hero set their own fill and font directly rather than
 * inheriting them from a stylesheet. That is not a style preference: the
 * page-turn capture serialises this DOM into an SVG foreignObject, and CSS
 * targeting SVG children does not come along for the ride. An SVG shape that
 * got its fill from a class comes back BLACK — that is what turned every card
 * and print in the texture into a black slab — and text that got its family
 * from a class comes back in the browser's default serif.
 *
 * Presentation attributes travel with the node, so the capture matches the
 * page. `--font-*` in global.css stays the source of truth for HTML text.
 */

export const FONT_DISPLAY = "'PAGKAKI', 'Iowan Old Style', Georgia, serif"
export const FONT_HAND = "'Schoolbell', 'Bradley Hand', 'Comic Sans MS', cursive"
export const FONT_SERIF = "'Bodoni Moda', 'Didot', Georgia, serif"
export const FONT_SCRIPT = "'Cormorant Garamond', Georgia, serif"

/** Paper and ink tones shared between the stylesheet and the SVG attributes. */
export const PAPER = {
  print: '#fdfbf6',
  well: '#d5d4cb',
  wellEdge: '#a8a79c',
  crop: '#8f8d80',
  card: '#fdfbf5',
  cream: '#f7f2e4',
  tag: '#f8f3e5',
  ink: '#2a2620',
  inkDeep: '#16130f',
  keyline: '#2a2620',
  wax: '#8a3b30',
  waxRim: '#9c4a3d',
  waxMark: '#5e231c',
} as const
