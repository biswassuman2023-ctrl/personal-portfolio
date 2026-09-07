/**
 * Shared gradients for the printed matter. Mounted once.
 *
 * There is no ink or grain filter here any more. `Port` used to run through a
 * turbulence displacement for a dry-press texture, and it made the largest
 * type on the page the softest thing on it — filtered text is rasterised
 * through the filter region and loses its edges. Nothing in the hero puts a
 * filter on type now; the Didone's own contrast carries the print character.
 */
export function HeroDefs() {
  return (
    <svg className="hero__defs" aria-hidden="true" focusable="false">
      <defs>
        {/*
          An empty photo well. Not flat grey: a print with no image on it still
          catches the room, so it is lit from the same upper-left source as
          everything else and darkens into the sheet's shadow at lower-right.
        */}
        <linearGradient id="hero-well-shade" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="0.75" stopColor="#3d3a30" stopOpacity="0.06" />
          <stop offset="1" stopColor="#3d3a30" stopOpacity="0.16" />
        </linearGradient>
      </defs>
    </svg>
  )
}
