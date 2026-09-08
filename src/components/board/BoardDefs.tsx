/**
 * Every filter and gradient the board's materials are built from, declared
 * once and referenced by `url(#bd-…)` from each object's own SVG.
 *
 * Namespaced `bd-` so nothing here can collide with the notebook's `nb-`
 * defs — both trees are in the same document, and `url(#id)` resolves
 * document-wide, so two materials sharing a name would silently paint each
 * other's surfaces.
 *
 * The grain is a real turbulence, not a tiled image. On a surface this large
 * a repeating raster shows its own seam the moment the eye finds one, and
 * the seam is what reads as "texture applied to a rectangle" instead of
 * "board". Two different frequencies: coarse fibre for the board, a finer
 * and much weaker one for the cards, because a card is a smaller piece of
 * smoother stock and grain at the board's scale would look like dirt on it.
 */
export function BoardDefs() {
  return (
    <svg className="board__defs" aria-hidden="true" focusable="false">
      <defs>
        {/* Board fibre. Desaturated to near-black, then held back to a few
            percent — enough to break the flat fill, never enough to read as
            noise on its own. */}
        <filter id="bd-fibre" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.62 0.94" numOctaves={3} seed={7} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.19  0 0 0 0 0.15  0 0 0 0 0.09  0 0 0 0.105 0"
          />
        </filter>

        {/* Card stock: finer, weaker. */}
        <filter id="bd-stock" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={2} seed={19} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.2  0 0 0 0 0.17  0 0 0 0 0.12  0 0 0 0.055 0"
          />
        </filter>

        {/* The board is lit from the upper left, like everything else in this
            project — so it falls away toward the lower right and into all
            four corners. */}
        <radialGradient id="bd-vignette" cx="0.4" cy="0.34" r="0.82">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.62" stopColor="#000000" stopOpacity="0.03" />
          <stop offset="1" stopColor="#2c2416" stopOpacity="0.16" />
        </radialGradient>

        {/* A card's own paper is not one flat tone either. */}
        <linearGradient id="bd-card-shade" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#c9bda0" stopOpacity="0.3" />
        </linearGradient>

        {/* The inside of the flap has been folded away from the light, so it
            carries a soft shadow along its crease rather than sitting at the
            same brightness as the face above it. */}
        <linearGradient id="bd-crease" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b5b3e" stopOpacity="0.26" />
          <stop offset="0.11" stopColor="#6b5b3e" stopOpacity="0.05" />
          <stop offset="0.4" stopColor="#6b5b3e" stopOpacity="0" />
        </linearGradient>

        {/* A tack head: a small dome, lit from the same upper left. */}
        <radialGradient id="bd-tack" cx="0.34" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#f0908a" />
          <stop offset="0.42" stopColor="#c62f21" />
          <stop offset="1" stopColor="#7d180f" />
        </radialGradient>

        {/* Masking tape: warm, translucent, and never a flat rectangle. */}
        <linearGradient id="bd-tape" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe2bd" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#e6d8ac" stopOpacity="0.82" />
          <stop offset="1" stopColor="#d8c99c" stopOpacity="0.88" />
        </linearGradient>
      </defs>
    </svg>
  )
}
