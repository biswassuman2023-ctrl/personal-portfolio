import { useCallback, useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { BOARD, CATEGORIES, HOVER_LIFT, HUB, PARALLAX } from './layout'
import { threadPath } from './threadGeometry'

/**
 * Everything on this board that moves, moved from one place.
 *
 * ONE LOOP OWNS ALL GEOMETRY. Cards carry a resting angle, a parallax offset
 * and a hover lift at the same time, and their threads have to be re-solved
 * from wherever those leave the tacks — so the parallax cannot be a tween on
 * a transform while the lift is another tween on the same transform, and the
 * threads cannot be React state re-rendering sixty times a second. Instead
 * GSAP animates plain NUMBERS (a hover scalar per card), a single rAF pass
 * reads those numbers along with the smoothed pointer, and that pass is the
 * only thing in the section that writes a transform, a filter or a path.
 *
 * The threads are the reason it has to work this way. A parallax applied as a
 * transform on a layer would move the thread's ENDS away from the tacks it is
 * tied to — the whole illusion — so the runs are re-solved in board
 * coordinates each frame from where their tacks actually are.
 *
 * The pointer is lerped rather than used raw: paper on a wall has mass, and
 * a board that snaps to the cursor is a board made of CSS. Between the lerp
 * and the small displacements in PARALLAX, the movement should be something
 * you notice only when you stop.
 *
 * The loop does not run while the section is off screen. Chapters 01-03 are
 * a long scroll above this one, and a rAF pass writing thirteen elements the
 * whole way down that runway is work nobody can see.
 */

/**
 * How far in front of the board each card sits. Not uniform, because uniform
 * parallax is a single plane sliding — which reads as the whole board being
 * dragged rather than as objects at different depths on it.
 */
const DEPTH: Record<string, number> = {
  frontend: 1.0,
  backend: 0.82,
  data: 1.16,
  testing: 0.88,
  devops: 1.2,
  design: 0.94,
}

/** The hub tack is pinned to the board itself, so it barely leaves it. */
const HUB_DEPTH = 0.34
const TITLE_DEPTH = 0.5

export function useBoardMotion(openId: string | null) {
  const sectionRef = useRef<HTMLElement>(null)
  const surfaceRef = useRef<SVGSVGElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<SVGGElement>(null)

  const cards = useRef(new Map<string, HTMLDivElement>())
  const sheets = useRef(new Map<string, SVGSVGElement>())
  const paths = useRef(new Map<string, SVGPathElement>())
  /** GSAP tweens `.v` on these; the loop reads it. Never tweened directly. */
  const hover = useRef<Record<string, { v: number }>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, { v: 0 }])),
  )
  /* Read by the rAF pass, which is attached once and would otherwise close
     over whichever `openId` was current when it started. Written from an
     effect rather than during render, so a render React ends up discarding
     can never leave the loop reading a card that was never opened. */
  const openRef = useRef<string | null>(openId)
  useEffect(() => {
    openRef.current = openId
  }, [openId])

  const registerCard = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cards.current.set(id, el)
      const sheet = el.querySelector<SVGSVGElement>('.board-card__sheet')
      if (sheet) sheets.current.set(id, sheet)
    } else {
      cards.current.delete(id)
      sheets.current.delete(id)
    }
  }, [])

  const registerPath = useCallback((id: string, el: SVGPathElement | null) => {
    if (el) paths.current.set(id, el)
    else paths.current.delete(id)
  }, [])

  const setHover = useCallback((id: string, on: boolean) => {
    const target = hover.current[id]
    if (!target) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.v = on ? 1 : 0
      return
    }
    gsap.to(target, {
      v: on ? 1 : 0,
      // Out faster than in: picking something up takes a moment, putting it
      // back down does not.
      duration: on ? 0.34 : 0.26,
      ease: on ? 'power3.out' : 'power2.inOut',
      overwrite: true,
    })
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /** Pointer as -1..1 across the section: target, then the smoothed value. */
    const p = { tx: 0, ty: 0, x: 0, y: 0 }
    let raf: number | null = null
    let running = false

    const onMove = (event: PointerEvent) => {
      const r = section.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      p.tx = ((event.clientX - r.left) / r.width) * 2 - 1
      p.ty = ((event.clientY - r.top) / r.height) * 2 - 1
    }
    const onLeave = () => {
      p.tx = 0
      p.ty = 0
    }

    const frame = () => {
      const stage = surfaceRef.current
      if (!stage) {
        raf = requestAnimationFrame(frame)
        return
      }
      // Board units to CSS pixels, read from the board's own rendered width —
      // so every offset below is expressed in the same units the layout is.
      const bu = stage.getBoundingClientRect().width / BOARD.w

      p.x += (p.tx - p.x) * 0.075
      p.y += (p.ty - p.y) * 0.075

      if (surfaceRef.current) {
        const sx = p.x * PARALLAX.surface
        const sy = p.y * PARALLAX.surface
        surfaceRef.current.style.transform = `translate3d(${(sx * bu).toFixed(2)}px, ${(sy * bu).toFixed(2)}px, 0)`
      }
      if (titleRef.current) {
        const tx = p.x * PARALLAX.cards * TITLE_DEPTH
        const ty = p.y * PARALLAX.cards * TITLE_DEPTH
        titleRef.current.style.transform = `translate3d(${(tx * bu).toFixed(2)}px, ${(ty * bu).toFixed(2)}px, 0)`
      }

      const hubX = HUB.x + p.x * PARALLAX.cards * HUB_DEPTH
      const hubY = HUB.y + p.y * PARALLAX.cards * HUB_DEPTH
      if (hubRef.current) {
        hubRef.current.setAttribute(
          'transform',
          `translate(${(hubX - HUB.x).toFixed(2)} ${(hubY - HUB.y).toFixed(2)})`,
        )
      }

      for (const c of CATEGORIES) {
        const h = hover.current[c.id].v
        const depth = DEPTH[c.id] ?? 1
        const dx = p.x * PARALLAX.cards * depth
        const dy = p.y * PARALLAX.cards * depth
        const lift = h * HOVER_LIFT
        const isOpen = openRef.current === c.id

        const el = cards.current.get(c.id)
        if (el) {
          // Hovering straightens a card as it comes up — the small correction
          // a hand makes lifting something that was pinned crooked.
          const rot = c.rotate * (1 - h * 0.5)
          el.style.transform =
            `translate3d(${((dx) * bu).toFixed(2)}px, ${((dy - lift) * bu).toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)`
        }

        const sheet = sheets.current.get(c.id)
        if (sheet) {
          // Off the board a little further, so the shadow drops further and
          // softens — the only thing that actually says "lifted".
          const raise = h + (isOpen ? 0.55 : 0)
          const oy = (2 + raise * 7).toFixed(2)
          const ox = (0.7 + raise * 1.8).toFixed(2)
          const blur = (3.6 + raise * 11).toFixed(2)
          const alpha = (0.2 + raise * 0.07).toFixed(3)
          sheet.style.filter = `drop-shadow(${+ox * bu}px ${+oy * bu}px ${+blur * bu}px rgba(48, 38, 26, ${alpha}))`
        }

        const ex = c.x + c.w * c.pin.at + dx
        const ey = c.y + c.pin.y + dy - lift
        const d = threadPath(hubX, hubY, ex, ey)
        paths.current.get(c.id)?.setAttribute('d', d)
        paths.current.get(`${c.id}:shadow`)?.setAttribute('d', d)
      }

      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (running) return
      running = true
      if (!reduced) section.addEventListener('pointermove', onMove)
      section.addEventListener('pointerleave', onLeave)
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (!running) return
      running = false
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
    }

    // Nothing above the fold of this section needs any of the above running.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '120px' },
    )
    io.observe(section)

    return () => {
      io.disconnect()
      stop()
    }
  }, [])

  return { sectionRef, surfaceRef, titleRef, hubRef, registerCard, registerPath, setHover }
}
