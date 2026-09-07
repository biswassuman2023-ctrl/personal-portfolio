/**
 * The webfonts, inlined for the page-turn capture.
 *
 * The capture serialises the notebook into an SVG foreignObject, which cannot
 * reach out for a font file — so every face has to travel inside the markup as
 * a data URI. html-to-image will attempt this on its own by scraping the
 * stylesheets, and it very nearly works, which is the problem: on this project
 * it embedded three of the four faces and quietly dropped Cormorant Garamond.
 * There is no error for that. The `folio` half of the wordmark simply rendered
 * in the next stack entry, Georgia italic, which is a serif italic of roughly
 * the right colour and 19.5% wider — so the moment a turn began, the biggest
 * word on the spread jumped sideways.
 *
 * Measured: `folio` spans 430 units live and spanned 514 in the texture, while
 * `Port` (Bodoni Moda, embedded correctly) matched to within four units and a
 * non-text control matched exactly. That asymmetry is what identified it as a
 * font problem rather than a projection one.
 *
 * Doing it here instead makes the set explicit and checkable. It is also read
 * once and reused for both passes, rather than re-fetched per capture.
 *
 * These MUST stay in step with the `@font-face` blocks in `src/styles/global.css`,
 * which remain the source of truth for the live page.
 */

type Face = {
  family: string
  url: string
  format: 'woff2' | 'truetype'
  weight: number
  style: 'normal' | 'italic'
}

const FACES: Face[] = [
  { family: 'PAGKAKI', url: '/fonts/PAGKAKI-Regular.ttf', format: 'truetype', weight: 400, style: 'normal' },
  { family: 'Bodoni Moda', url: '/fonts/BodoniModa-900.woff2', format: 'woff2', weight: 900, style: 'normal' },
  {
    family: 'Cormorant Garamond',
    url: '/fonts/CormorantGaramond-Italic300.woff2',
    format: 'woff2',
    weight: 300,
    style: 'italic',
  },
  { family: 'Schoolbell', url: '/fonts/Schoolbell-Regular.woff2', format: 'woff2', weight: 400, style: 'normal' },
]

const MIME: Record<Face['format'], string> = {
  woff2: 'font/woff2',
  truetype: 'font/ttf',
}

/** btoa in chunks: spreading a whole font file into fromCharCode overflows the stack. */
function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

let cached: Promise<string> | null = null

/** Every face as `@font-face` rules with the file inlined. Fetched once. */
export function captureFontCSS() {
  cached ??= Promise.all(
    FACES.map(async (face) => {
      const response = await fetch(face.url)
      if (!response.ok) throw new Error(`capture font missing: ${face.url}`)
      const data = toBase64(await response.arrayBuffer())
      return [
        '@font-face{',
        `font-family:"${face.family}";`,
        `src:url(data:${MIME[face.format]};base64,${data}) format("${face.format}");`,
        `font-weight:${face.weight};`,
        `font-style:${face.style};`,
        'font-display:block;}',
      ].join('')
    }),
  ).then((rules) => rules.join('\n'))

  return cached
}
