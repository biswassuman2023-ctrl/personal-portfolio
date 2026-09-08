import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { u } from './layout'
import { perforatedRect } from './marks'
import { mulberry32 } from './random'

/**
 * One stage of the method, printed on its own small sheet of perforated
 * paper and pressed onto the page — for a moment.
 *
 * REBUILT FROM SCRATCH around a different physical object than before. The
 * previous version printed red ink directly onto the notebook's own paper —
 * a rubber-stamp rule with a word inside it, merged into the page via
 * multiply blend. This one is a separate, opaque little sheet with its own
 * scalloped, perforated edge (see marks.ts) and its own paper — closer to a
 * philatelic stamp than to a rubber stamp's impression — sitting ON the page
 * rather than soaked into it, complete with its own paper grain and its own
 * shadow.
 *
 * Two elements, not one, and the split is still load-bearing: the OUTER box
 * carries position and the stamp's own static angle, the INNER one carries
 * the whole GSAP lifecycle. A tween animating scale on an element that also
 * had to hold a static rotation would either fight that rotation or have to
 * re-declare it every frame.
 *
 * THE LIFECYCLE IS THE WHOLE POINT: press, hold, fade, GONE — not press and
 * stay. `onDone` fires once the exit animation finishes, and the PARENT
 * (useStampTrail) is what actually removes it from the DOM; nothing here
 * decides to linger. A mount of this component is a promise that it will ask
 * to be unmounted again on its own, a little over a second later.
 *
 * PER-INSTANCE VARIATION is what keeps a whole TRAIL of these from reading as
 * one template reused: `seed` drives an independent RNG (random.ts) that
 * scatters this stamp's own paper grain and nudges its ink's colour, so the
 * thing that repeats across a trail is the WORD and the paper's SHAPE, never
 * the exact mark.
 */

/** Warm off-white, the same paper tone PhotoPrint's own prints use. */
const PAPER = '#fdfbf6'
/** The soft warm grey the perforated edge is shaded with — same as the rest
    of the project's paper-edge language (hero/fonts.ts PAPER.wellEdge). */
const EDGE = '#a8a79c'
const INK_A = '#c1281b'
const INK_B = '#9c2015'

/** Ink at full press. Never quite opaque — even printed ink sits on paper. */
const INK_OPACITY = 0.97

/** How long one stamp lives on screen, appear to gone, in milliseconds. */
const LIFETIME_MS = 1380

type Props = {
  word: string
  /** Centre of the stamp, in notebook units. */
  x: number
  y: number
  w: number
  h: number
  rotate: number
  seed: number
  /** Fixed, permanent — the touch fallback. No timeline, no `onDone`. */
  static?: boolean
  onDone?: () => void
}

export function Stamp({ word, x, y, w, h, rotate, seed, static: isStatic, onDone }: Props) {
  const inkRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Plain consts, not memoised: `seed` never changes for a mounted instance,
  // mulberry32 is a pure function of it, and this is called in the same order
  // every time — a re-render (there should barely be any) recomputes the
  // exact same values rather than needing a ref to hold onto the first ones.
  const rng = mulberry32(seed)
  const path = perforatedRect(w, h)
  // A dozen faint flecks of grain, scattered rather than filtered onto the
  // paper — cheap, and immune to whatever an SVG turbulence filter would or
  // would not survive being serialised into a texture, which nothing here
  // needs to gamble on: these stamps mount opacity 0 for every page-turn
  // capture regardless, but the live interaction still has to render them
  // every single frame they are on screen.
  const grain = Array.from({ length: 10 }, () => ({
    cx: 4 + rng() * (w - 8),
    cy: 4 + rng() * (h - 8),
    r: 0.35 + rng() * 0.55,
    o: 0.05 + rng() * 0.09,
  }))
  const inkAngle = Math.floor(rng() * 40)

  useEffect(() => {
    const el = inkRef.current
    if (!el) return

    if (isStatic) {
      gsap.set(el, { opacity: INK_OPACITY, scale: 1 })
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Reduced motion means no press/spring — it does not mean permanent.
      // The interaction stays exactly as temporary, just without the motion.
      gsap.set(el, { opacity: INK_OPACITY, scale: 1 })
      const timer = window.setTimeout(() => onDoneRef.current?.(), LIFETIME_MS)
      return () => window.clearTimeout(timer)
    }

    const tl = gsap
      .timeline({ onComplete: () => onDoneRef.current?.() })
      // press: a stamp hitting paper — small scale-in, a tiny overshoot past
      // its own resting size, then settles. One `back.out` tween does the
      // overshoot-and-settle in a single physical motion rather than a
      // hand-built sequence of keyframes chasing the same shape.
      .fromTo(el, { opacity: 0, scale: 0.52 }, { opacity: INK_OPACITY, scale: 1, duration: 0.34, ease: 'back.out(2.3)' })
      // hold: read, unmoving
      .to(el, { opacity: INK_OPACITY, duration: 0.62 })
      // fade: gone
      .to(el, { opacity: 0, duration: 0.42, ease: 'power1.in' })

    return () => {
      tl.kill()
    }
  }, [isStatic])

  return (
    <div
      className="hero-artifact method-stamp"
      style={{
        left: u(x - w / 2),
        top: u(y - h / 2),
        width: u(w),
        height: u(h),
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div className="method-stamp__ink" ref={inkRef}>
        <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <defs>
            <linearGradient id={`stamp-shade-${seed}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="1" stopColor="#e9e2ce" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient
              id={`stamp-ink-${seed}`}
              gradientUnits="userSpaceOnUse"
              x1={w * 0.15}
              y1={h * 0.2}
              x2={w * 0.85}
              y2={h * 0.85}
              gradientTransform={`rotate(${inkAngle} ${w / 2} ${h / 2})`}
            >
              <stop offset="0" stopColor={INK_A} />
              <stop offset="1" stopColor={INK_B} />
            </linearGradient>
          </defs>

          {/* The stamp's own paper — a separate, opaque sheet, not ink merged
              into the notebook's page. */}
          <path d={path} fill={PAPER} />
          <path d={path} fill={`url(#stamp-shade-${seed})`} />
          {grain.map((g, i) => (
            <circle key={i} cx={g.cx} cy={g.cy} r={g.r} fill="#8f8a76" fillOpacity={g.o} />
          ))}
          <path d={path} fill="none" stroke={EDGE} strokeWidth={0.7} strokeOpacity={0.55} />

          <text
            x={w / 2}
            y={h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'PAGKAKI', 'Iowan Old Style', Georgia, serif"
            fontSize={h * 0.52}
            letterSpacing={0.7}
            fill={`url(#stamp-ink-${seed})`}
          >
            {word}
          </text>
        </svg>
      </div>
    </div>
  )
}
