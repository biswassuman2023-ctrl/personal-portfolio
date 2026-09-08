import { useEffect, useRef, useState } from 'react'
import { FRAME } from '../notebook/geometry'
import {
  STAMP_BOUNDS,
  STAMP_GAP,
  STAMP_HEIGHT,
  STAMP_MAX_ALIVE,
  STAMP_MIN_SPAWN_DISTANCE,
  STAMP_WORDS,
  STATIC_STAMP_LAYOUT,
} from './layout'

export type LiveStamp = {
  id: number
  word: string
  /** Centre, in notebook units — a stamp is pressed AT the cursor, not near it. */
  x: number
  y: number
  w: number
  h: number
  rotate: number
  seed: number
  /** No timeline, no removal — the touch fallback's permanent five. */
  static?: boolean
}

let nextId = 0

/** No cursor sweeps a touch screen, so the trail below is unreachable there. */
const noHoverDevice = () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

/** The touch fallback: the five stages laid out once, at their original fixed
    positions, and never removed — see useStampTrail's own doc comment. */
const staticStamps = (): LiveStamp[] =>
  STATIC_STAMP_LAYOUT.map((s, i) => ({
    id: i,
    word: s.word,
    x: s.x + s.w / 2,
    y: s.y + s.h / 2,
    w: s.w,
    h: s.h,
    rotate: s.rotate,
    seed: i * 97 + 11,
    static: true,
  }))

/** Does a box this size at this centre clear the page bounds and every stamp
    already alive, with STAMP_GAP of daylight on every side? */
function fits(cx: number, cy: number, w: number, h: number, alive: readonly LiveStamp[]): boolean {
  if (cx - w / 2 < STAMP_BOUNDS.minX || cx + w / 2 > STAMP_BOUNDS.maxX) return false
  if (cy - h / 2 < STAMP_BOUNDS.minY || cy + h / 2 > STAMP_BOUNDS.maxY) return false
  for (const s of alive) {
    if (Math.abs(cx - s.x) < (w + s.w) / 2 + STAMP_GAP && Math.abs(cy - s.y) < (h + s.h) / 2 + STAMP_GAP) {
      return false
    }
  }
  return true
}

/**
 * The nearest place near `(x, y)` a `w`×`h` stamp actually fits, or `null` if
 * nowhere close enough does.
 *
 * Tried at the raw point first, then in widening rings around it — a spiral
 * search rather than anything cleverer, because "nearest free spot" only
 * needs to be approximately true here: a stamp nudged a little from where the
 * cursor actually was still reads as pressed along the cursor's path, and the
 * alternative (computing the true nearest point exactly) is a lot more
 * geometry for a difference nobody would see. Four rings, 8 points further
 * apart each time, is enough that a spawn only fails when the area genuinely
 * has nowhere left — checked directly against STAMP_MAX_ALIVE in the caller,
 * this runs at most a few dozen times a second even under a very fast sweep.
 */
function nearestFreeSpot(
  x: number,
  y: number,
  w: number,
  h: number,
  alive: readonly LiveStamp[],
): { x: number; y: number } | null {
  if (fits(x, y, w, h, alive)) return { x, y }

  const step = Math.max(w, h) * 0.55
  for (let ring = 1; ring <= 4; ring++) {
    const radius = step * ring
    const points = 8 * ring
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const cx = x + Math.cos(angle) * radius
      const cy = y + Math.sin(angle) * radius
      if (fits(cx, cy, w, h, alive)) return { x: cx, y: cy }
    }
  }
  return null
}

/**
 * Presses a momentary stamp along the actual path the cursor traces, never
 * on top of one already there.
 *
 * This replaced a version where the five words were fixed points on the page
 * and a stamp landed, permanently, once the cursor came near one — closer to
 * a checklist the cursor ticked off than to ink. The instruction it was built
 * against was to keep it temporary and to spread it out: something is
 * stamped only where the cursor actually goes, it disappears again, and no
 * two impressions are ever allowed to sit on top of each other. So there is
 * no fixed set of drop points here — every stamp is a new instance, born near
 * the cursor and gone a little over a second later — and the five words are
 * drawn from in order, not chosen by position, since nothing about WHERE the
 * cursor happens to be says which stage of the process it should be
 * labelling.
 *
 * THE THROTTLE IS DISTANCE, NOT TIME. See STAMP_MIN_SPAWN_DISTANCE. A raw
 * `pointermove` fires far more often than a page should spawn anything from
 * it — sometimes over 100 times a second — so events are coalesced to at most
 * once per animation frame regardless of how fast they arrive, and even then
 * a stamp presses only once the cursor has actually covered enough ground
 * since the last one. Together these are what keep a fast sweep from
 * flooding the page and a stationary cursor from spawning anything at all,
 * without a single timer running while nothing is happening.
 *
 * `aliveRef` mirrors `stamps` state and is the thing collision checks and the
 * alive-count cap actually read — plain state read back through a closure
 * from inside a rAF callback can be one render behind, and "one render
 * behind" here means checking a new stamp against a list that no longer
 * matches what is actually on screen.
 *
 * The listener is on the page's own element rather than on the window, for
 * the same reason it always was: the notebook keeps preview copies of
 * chapters not yet reached in the DOM for the page-turn capture, and an
 * element that is `visibility: hidden` — which every one of those is, and
 * which the live page also is while its own sheet is in the air — receives
 * no pointer events at all. Neither case needs a flag to guard it.
 */
export function useStampTrail() {
  const rootRef = useRef<HTMLDivElement>(null)
  /* Whether this is a no-hover device is decided once, up front, from the
     lazy initialiser — not discovered inside an effect and then patched in a
     moment later, which would mean a touch reader's first frame is the empty
     page after all, briefly, before the fallback catches up. */
  const [stamps, setStamps] = useState<LiveStamp[]>(() => (noHoverDevice() ? staticStamps() : []))
  const [interacted, setInteracted] = useState(() => noHoverDevice())
  const interactedRef = useRef(interacted)
  const aliveRef = useRef(stamps)

  const wordIndex = useRef(0)
  const lastSpawn = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el || noHoverDevice()) return

    let rafId: number | null = null
    let pending: PointerEvent | null = null

    const process = () => {
      rafId = null
      const event = pending
      if (!event) return
      pending = null

      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const x = ((event.clientX - rect.left) / rect.width) * FRAME.w
      const y = ((event.clientY - rect.top) / rect.height) * FRAME.h

      if (!interactedRef.current) {
        interactedRef.current = true
        setInteracted(true)
      }

      const last = lastSpawn.current
      if (last) {
        const dx = x - last.x
        const dy = y - last.y
        if (dx * dx + dy * dy < STAMP_MIN_SPAWN_DISTANCE * STAMP_MIN_SPAWN_DISTANCE) return
      }

      if (aliveRef.current.length >= STAMP_MAX_ALIVE) return

      const { word, w } = STAMP_WORDS[wordIndex.current % STAMP_WORDS.length]
      const h = STAMP_HEIGHT
      const clampedX = Math.min(Math.max(x, STAMP_BOUNDS.minX + w / 2), STAMP_BOUNDS.maxX - w / 2)
      const clampedY = Math.min(Math.max(y, STAMP_BOUNDS.minY + h / 2), STAMP_BOUNDS.maxY - h / 2)

      const spot = nearestFreeSpot(clampedX, clampedY, w, h, aliveRef.current)
      // Nowhere nearby fits — leave the trail's last real spawn point alone
      // and let the very next frame try again from wherever the cursor has
      // moved to by then, rather than counting this as a used turn.
      if (!spot) return

      lastSpawn.current = { x, y }
      wordIndex.current++

      const stamp: LiveStamp = {
        id: nextId++,
        word,
        x: spot.x,
        y: spot.y,
        w,
        h,
        // A hand does not press a stamp dead square. Independent of the
        // per-instance texture inside the stamp itself (Stamp.tsx) — that
        // varies the paper, this varies the whole stamp's angle on the page.
        rotate: (Math.random() - 0.5) * 11,
        seed: Math.floor(Math.random() * 0xffffffff),
      }

      aliveRef.current = [...aliveRef.current, stamp]
      setStamps(aliveRef.current)
    }

    const onMove = (event: PointerEvent) => {
      pending = event
      if (rafId === null) rafId = requestAnimationFrame(process)
    }

    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  const remove = (id: number) => {
    if (!aliveRef.current.some((s) => s.id === id)) return
    aliveRef.current = aliveRef.current.filter((s) => s.id !== id)
    setStamps(aliveRef.current)
  }

  return { rootRef, stamps, interacted, remove }
}
