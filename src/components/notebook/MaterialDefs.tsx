import { FRAME } from './geometry'
import { HOLE_RX, HOLE_RY, holesFor } from './holes'
import { COVER_PATH } from './silhouettes'

/**
 * Shared SVG materials. Mounted once; every layer references these by id.
 *
 * The three materials are built to react DIFFERENTLY to the same light
 * (upper-left, azimuth 130 degrees), because that contrast is most of what
 * separates them:
 *
 *   leather  diffuse height field + a soft, unevenly distributed specular
 *   paper    diffuse only, very shallow — matte, no sheen at all
 *   metal    no height field; hard gradients across the form plus fine
 *            directional brush streaks
 *
 * Two techniques carry the leather:
 *
 *  1. The height field is HIERARCHICAL — fine pores composited over larger
 *     follicle clusters. A single turbulence frequency is what reads as
 *     procedural noise, however well it is tuned.
 *
 *  2. Roughness VARIES across the hide. The specular pass is multiplied by a
 *     low-frequency mask, so some areas take sheen and others stay dead matte.
 *     Uniform gloss is what makes leather look like moulded rubber.
 */

const LIGHT = { azimuth: 130, elevation: 54 }

/** Turbulence RGBA -> opaque greyscale, so it can act as a mask or multiplier. */
const TO_GREY = `0.33 0.33 0.33 0 0
                 0.33 0.33 0.33 0 0
                 0.33 0.33 0.33 0 0
                 0    0    0    0 1`

export function MaterialDefs() {
  return (
    <svg className="notebook__defs" aria-hidden="true" focusable="false">
      <defs>
        {/* --------------------------------------------------------- leather */}
        <filter
          id="nb-leather"
          x="-1%"
          y="-1.6%"
          width="102%"
          height="103.2%"
          colorInterpolationFilters="sRGB"
        >
          {/* pores over follicle clusters: two scales, one surface */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.62 0.68"
            numOctaves={2}
            seed={17}
            result="pores"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.13 0.15"
            numOctaves={3}
            seed={41}
            result="clusters"
          />
          <feComposite
            in="pores"
            in2="clusters"
            operator="arithmetic"
            k1="0"
            k2="0.45"
            k3="0.55"
            k4="0"
            result="height"
          />

          <feDiffuseLighting
            in="height"
            surfaceScale={1.05}
            diffuseConstant={1}
            lightingColor="#ffffff"
            result="diff"
          >
            <feDistantLight azimuth={LIGHT.azimuth} elevation={LIGHT.elevation} />
          </feDiffuseLighting>
          <feColorMatrix in="diff" type="saturate" values="0" result="diffGrey" />
          {/* squeeze into the band a black hide occupies: deep, never grey */}
          <feComponentTransfer in="diffGrey" result="hide">
            <feFuncR type="linear" slope="0.084" intercept="0.007" />
            <feFuncG type="linear" slope="0.081" intercept="0.006" />
            <feFuncB type="linear" slope="0.088" intercept="0.009" />
          </feComponentTransfer>

          {/* soft sheen — leather is not matte, but it is not plastic either */}
          <feSpecularLighting
            in="height"
            surfaceScale={0.85}
            specularConstant={0.22}
            specularExponent={14}
            lightingColor="#e8e6e2"
            result="spec"
          >
            <feDistantLight azimuth={LIGHT.azimuth} elevation={46} />
          </feSpecularLighting>

          {/* ...but only where the hide is smooth enough to take it */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0045 0.006"
            numOctaves={2}
            seed={63}
            result="rough"
          />
          <feColorMatrix in="rough" type="matrix" values={TO_GREY} result="roughGrey" />
          <feComponentTransfer in="roughGrey" result="roughMask">
            <feFuncR type="linear" slope="0.85" intercept="0.2" />
            <feFuncG type="linear" slope="0.85" intercept="0.2" />
            <feFuncB type="linear" slope="0.85" intercept="0.2" />
          </feComponentTransfer>
          <feComposite
            in="spec"
            in2="roughMask"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
            result="specMasked"
          />
          <feComposite
            in="hide"
            in2="specMasked"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="lit"
          />

          {/* broad tonal drift across the panel */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0035 0.006"
            numOctaves={3}
            seed={4}
            result="mottle"
          />
          <feColorMatrix in="mottle" type="matrix" values={TO_GREY} result="mottleGrey" />
          <feComponentTransfer in="mottleGrey" result="mottleBand">
            <feFuncR type="linear" slope="0.3" intercept="0.8" />
            <feFuncG type="linear" slope="0.3" intercept="0.8" />
            <feFuncB type="linear" slope="0.3" intercept="0.8" />
          </feComponentTransfer>
          <feBlend in="lit" in2="mottleBand" mode="multiply" result="leather" />

          <feComposite in="leather" in2="SourceAlpha" operator="in" result="shaped" />
          {/* roughen the silhouette by about a unit; real edges are not vector-true */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.06 0.09"
            numOctaves={2}
            seed={9}
            result="edgeNoise"
          />
          <feDisplacementMap
            in="shaped"
            in2="edgeNoise"
            scale={2.6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <clipPath id="nb-cover-clip">
          <path d={COVER_PATH} />
        </clipPath>

        {/*
          Punch masks live here rather than inside Page so that the holes have
          one definition. Rings derives its threading cut from the same hole
          positions, and the two must not be able to drift apart.
        */}
        {(['left', 'right'] as const).map((side) => (
          <mask
            key={side}
            id={`nb-punch-${side}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={FRAME.w}
            height={FRAME.h}
          >
            <rect x={0} y={0} width={FRAME.w} height={FRAME.h} fill="#ffffff" />
            {holesFor(side).map(({ x, y }) => (
              <ellipse key={y} cx={x} cy={y} rx={HOLE_RX} ry={HOLE_RY} fill="#000000" />
            ))}
          </mask>
        ))}

        {/* ----------------------------------------------------------- paper */}
        {/* diffuse only. No specular pass anywhere — paper is the matte one. */}
        <filter
          id="nb-paper"
          x="-0.5%"
          y="-0.8%"
          width="101%"
          height="101.6%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72 0.66"
            numOctaves={3}
            seed={23}
            result="fibre"
          />
          <feDiffuseLighting
            in="fibre"
            surfaceScale={0.55}
            diffuseConstant={1}
            lightingColor="#ffffff"
            result="lit"
          >
            <feDistantLight azimuth={LIGHT.azimuth} elevation={68} />
          </feDiffuseLighting>
          <feColorMatrix in="lit" type="saturate" values="0" result="grey" />
          <feComponentTransfer in="grey" result="paper">
            <feFuncR type="linear" slope="0.085" intercept="0.905" />
            <feFuncG type="linear" slope="0.082" intercept="0.888" />
            <feFuncB type="linear" slope="0.079" intercept="0.858" />
          </feComponentTransfer>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0035 0.005"
            numOctaves={2}
            seed={12}
            result="drift"
          />
          <feColorMatrix in="drift" type="matrix" values={TO_GREY} result="driftGrey" />
          <feComponentTransfer in="driftGrey" result="driftBand">
            <feFuncR type="linear" slope="0.09" intercept="0.945" />
            <feFuncG type="linear" slope="0.09" intercept="0.945" />
            <feFuncB type="linear" slope="0.09" intercept="0.945" />
          </feComponentTransfer>
          <feBlend in="paper" in2="driftBand" mode="multiply" result="papered" />
          <feComposite in="papered" in2="SourceAlpha" operator="in" result="shaped" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.10"
            numOctaves={2}
            seed={31}
            result="edge"
          />
          <feDisplacementMap
            in="shaped"
            in2="edge"
            scale={1.1}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* --------------------------------------------------- brushed metal */}
        {/* high frequency across, low along: fine vertical drawn streaks */}
        <filter id="nb-brushed" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9 0.012"
            numOctaves={2}
            seed={29}
            result="streak"
          />
          <feColorMatrix in="streak" type="matrix" values={TO_GREY} result="streakGrey" />
          <feComponentTransfer in="streakGrey" result="brushed">
            <feFuncR type="linear" slope="0.2" intercept="0.9" />
            <feFuncG type="linear" slope="0.2" intercept="0.9" />
            <feFuncB type="linear" slope="0.2" intercept="0.9" />
          </feComponentTransfer>
          <feComposite in="brushed" in2="SourceAlpha" operator="in" />
        </filter>

        {/* ----------------------------------------------------------- blurs */}
        <filter id="nb-soft-xs" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.85" />
        </filter>
        <filter id="nb-soft-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.9" />
        </filter>
        <filter id="nb-soft-md" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>

        {/* ------------------------------------------------------ cover light */}
        <radialGradient id="nb-cover-sheen" gradientUnits="userSpaceOnUse" cx="330" cy="150" r="900">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.075" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.022" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="nb-cover-fall"
          gradientUnits="userSpaceOnUse"
          x1="120"
          y1="60"
          x2="1180"
          y2="700"
        >
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.6" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>

        {/* ------------------------------------------------------- page light */}
        <linearGradient id="nb-gutter-left" gradientUnits="userSpaceOnUse" x1="641" y1="0" x2="496" y2="0">
          <stop offset="0" stopColor="#332d25" stopOpacity="0.46" />
          <stop offset="0.09" stopColor="#443d31" stopOpacity="0.26" />
          <stop offset="0.26" stopColor="#57503f" stopOpacity="0.1" />
          <stop offset="0.58" stopColor="#6e6653" stopOpacity="0.03" />
          <stop offset="1" stopColor="#6e6653" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nb-gutter-right" gradientUnits="userSpaceOnUse" x1="707" y1="0" x2="872" y2="0">
          <stop offset="0" stopColor="#2c261f" stopOpacity="0.56" />
          <stop offset="0.08" stopColor="#3e372c" stopOpacity="0.34" />
          <stop offset="0.24" stopColor="#524b3d" stopOpacity="0.14" />
          <stop offset="0.56" stopColor="#6e6653" stopOpacity="0.04" />
          <stop offset="1" stopColor="#6e6653" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nb-sheen-left" gradientUnits="userSpaceOnUse" cx="268" cy="196" r="560">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.62" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nb-sheen-right" gradientUnits="userSpaceOnUse" cx="880" cy="214" r="680">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nb-page-fall" gradientUnits="userSpaceOnUse" x1="140" y1="80" x2="1180" y2="720">
          <stop offset="0" stopColor="#5c5342" stopOpacity="0" />
          <stop offset="0.65" stopColor="#5c5342" stopOpacity="0.04" />
          <stop offset="1" stopColor="#5c5342" stopOpacity="0.115" />
        </linearGradient>

        {/* ------------------------------------------------------ punch holes */}
        {/* light enters from upper-left, so the lit bore wall is lower-right */}
        <radialGradient id="nb-hole-bore" cx="0.62" cy="0.68" r="0.74">
          <stop offset="0" stopColor="#574e42" />
          <stop offset="0.55" stopColor="#2e2820" />
          <stop offset="1" stopColor="#1c1813" />
        </radialGradient>
        {/* the cut edge of a sheet is fractions of a millimetre — any brighter
            than this and the hole reads as a reinforced metal eyelet */}
        <linearGradient id="nb-hole-rim" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#6f6553" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#b3a893" stopOpacity="0.26" />
          <stop offset="1" stopColor="#efe8db" stopOpacity="0.5" />
        </linearGradient>

        {/* ----------------------------------------------------------- metal --
            Brushed nickel, not chrome: the range tops out around #d5d9d9 and
            the darks stay warm-grey. Pushing the highlights to white is what
            makes stationery hardware look like a sci-fi prop. */}
        <linearGradient id="nb-well" gradientUnits="userSpaceOnUse" x1="620" y1="0" x2="728" y2="0">
          <stop offset="0" stopColor="#241f19" stopOpacity="0" />
          <stop offset="0.16" stopColor="#2a241d" stopOpacity="0.22" />
          <stop offset="0.34" stopColor="#1b1712" stopOpacity="0.44" />
          <stop offset="0.5" stopColor="#15120e" stopOpacity="0.5" />
          <stop offset="0.66" stopColor="#1b1712" stopOpacity="0.46" />
          <stop offset="0.84" stopColor="#2a241d" stopOpacity="0.24" />
          <stop offset="1" stopColor="#241f19" stopOpacity="0" />
        </linearGradient>

        {/* The leaves are rolled sheet seen from above: nearly flat, with only
            enough fall at each edge to say the metal turns over. Doming them
            hard makes the pair read as one chrome rod down the gutter. */}
        {/*
          NEARLY FLAT, and that is the whole point. Any leaf with a bright core
          and dark edges is a cylinder, and two of them side by side down the
          gutter is a chrome rod lying on the book — which is what every richer
          version of this gradient produced. The fall is confined to the last
          few percent at each edge, where the sheet actually turns over.
        */}
        <linearGradient id="nb-leaf-left" gradientUnits="userSpaceOnUse" x1="643" y1="0" x2="673" y2="0">
          <stop offset="0" stopColor="#a4a9ab" />
          <stop offset="0.06" stopColor="#bec2c3" />
          <stop offset="0.2" stopColor="#c4c8c9" />
          <stop offset="0.5" stopColor="#c2c6c7" />
          <stop offset="0.8" stopColor="#bec2c3" />
          <stop offset="0.94" stopColor="#b0b5b6" />
          <stop offset="1" stopColor="#9aa0a1" />
        </linearGradient>
        <linearGradient id="nb-leaf-right" gradientUnits="userSpaceOnUse" x1="675" y1="0" x2="705" y2="0">
          <stop offset="0" stopColor="#9ba0a2" />
          <stop offset="0.06" stopColor="#b7bbbc" />
          <stop offset="0.22" stopColor="#bfc3c4" />
          <stop offset="0.52" stopColor="#bdc1c2" />
          <stop offset="0.8" stopColor="#b8bcbd" />
          <stop offset="0.94" stopColor="#a8adae" />
          <stop offset="1" stopColor="#929799" />
        </linearGradient>
        <linearGradient id="nb-lever" gradientUnits="userSpaceOnUse" x1="638" y1="0" x2="710" y2="0">
          <stop offset="0" stopColor="#9aa0a1" />
          <stop offset="0.06" stopColor="#b4b8b9" />
          <stop offset="0.3" stopColor="#bcc0c1" />
          <stop offset="0.7" stopColor="#b9bdbe" />
          <stop offset="0.94" stopColor="#aab0b1" />
          <stop offset="1" stopColor="#93989a" />
        </linearGradient>
        <linearGradient id="nb-metal-fall" gradientUnits="userSpaceOnUse" x1="0" y1="11" x2="0" y2="737">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.2" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="0.6" stopColor="#000000" stopOpacity="0.03" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>

        {/*
          Ring tube cross-section.

          Offsets are fractions of the ELLIPSE BOUNDING BOX, and a stroked
          ellipse only paints near the top and bottom of that box — the upper
          arc lives in roughly 0.00-0.18 and the lower arc in 0.82-1.00, with
          nothing between. Spreading metal stops evenly across 0-1 puts the
          highlight in the hollow middle where no ink lands, which is exactly
          how a ring ends up looking like bent wire.
        */}
        <linearGradient id="nb-ring" x1="0" y1="0" x2="0.12" y2="1">
          <stop offset="0" stopColor="#b0b5b7" />
          <stop offset="0.04" stopColor="#f4f6f6" />
          <stop offset="0.085" stopColor="#e6e9e9" />
          <stop offset="0.13" stopColor="#c8cccd" />
          <stop offset="0.18" stopColor="#a3a8aa" />
          <stop offset="0.5" stopColor="#8b9092" />
          <stop offset="0.82" stopColor="#74797b" />
          <stop offset="0.88" stopColor="#63686a" />
          <stop offset="0.93" stopColor="#7f8486" />
          <stop offset="0.97" stopColor="#a8adaf" />
          <stop offset="1" stopColor="#c0c5c7" />
        </linearGradient>
        <linearGradient id="nb-ring-spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="0.48" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="0.78" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nb-ring-boss" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#d2d6d7" />
          <stop offset="0.3" stopColor="#b2b7b9" />
          <stop offset="0.62" stopColor="#8e9395" />
          <stop offset="1" stopColor="#6b7072" />
        </linearGradient>
      </defs>
    </svg>
  )
}
