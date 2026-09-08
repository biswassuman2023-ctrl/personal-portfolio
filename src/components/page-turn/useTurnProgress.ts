import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

/**
 * Turns scroll position into WHICH sheet is in the air and how far through its
 * turn it is.
 *
 * Scrubbed, not triggered: the page does not flip past a threshold, it sits
 * wherever the scroll leaves it. `scrub` takes a number rather than `true` so
 * GSAP eases the value toward the scroll position over about a fifth of a
 * second — that lag IS the paper's momentum, and it is what stops a fast flick
 * snapping the sheet from flat to turned.
 *
 * The runway is ONE continuous scroll divided into `turns` equal segments,
 * rather than a trigger per chapter. A book does not have a scroll region per
 * leaf; it has a stack you move through, and the sheet you are moving is
 * whichever one your hands are on. So the whole runway maps to 0..turns, the
 * integer part names the sheet and the fraction is that sheet's own turn:
 *
 *   total 0.4  ->  sheet 0, 40% through          (hero  -> origin)
 *   total 1.0  ->  sheet 1, at rest              (origin, both pages)
 *   total 1.6  ->  sheet 1, 60% through          (origin -> method)
 *
 * Reversing the scroll walks back through the same mapping, so turns undo in
 * the order they were made. `progress` is always the CURRENT sheet's local
 * 0..1 — the shader never sees the total, because a sheet only ever knows its
 * own turn.
 *
 * The value is kept in a ref and mirrored into state only when it crosses a
 * boundary that changes what React renders, so scrolling drives the shader
 * through `useFrame` without re-rendering on every frame.
 *
 * DEBUG: `?turn=1.75` pins progress and skips ScrollTrigger entirely, so each
 * point in the motion can be inspected on its own rather than by guessing at
 * scroll offsets. The value is the TOTAL, so 0..1 is the first turn exactly as
 * it was before there was a second one. `?turn=live` restores normal
 * behaviour.
 *
 * `readyTurns` is how many sheets actually have a photograph to turn with —
 * see useSpreadCapture, which publishes them one at a time rather than all at
 * once. The mapped total is clamped to it, so scrolling ahead of what has been
 * captured cannot ask for a sheet that does not exist yet: the reader simply
 * arrives at the last READY spread and holds there, at rest, no mesh, exactly
 * as if that were the end of the scroll — rather than `from` advancing into a
 * turn with no capture behind it, which is what used to make the WebGL layer
 * unmount (nothing to show) and then pop back in already partway through a
 * turn the instant the capture caught up. Holding is a state that was always
 * going to exist anyway — it is what "the reader stopped scrolling" already
 * looks like — so nothing new has to be built to reach it, only the ceiling
 * on `total` that makes readiness one more reason to be there.
 */

/**
 * Where the turn is finished. The sheet has to stop being WebGL at this point
 * and become the notebook's own page again — see `landed` below.
 */
const LANDED = 0.999

export function useTurnProgress(
  target: React.RefObject<HTMLElement | null>,
  turns: number,
  readyTurns: number,
) {
  /** The CURRENT sheet's own 0..1, never the total. Read per frame. */
  const progress = useRef(0)
  /* A ref, not a dependency of the effect below: `readyTurns` changes on
     every capture that finishes, and the ScrollTrigger this effect creates
     must not be torn down and recreated each time — only the NEXT scroll
     update needs to see the latest ceiling, which reading `.current` inside
     that update's own closure already gets for free. Written from an effect
     rather than during render itself, so a render React ends up discarding
     can never leave the ref holding a value nothing actually committed. */
  const readyTurnsRef = useRef(readyTurns)
  useEffect(() => {
    readyTurnsRef.current = readyTurns
  }, [readyTurns])
  const [active, setActive] = useState(false)
  /**
   * The turn is over and the DOM has the page back.
   *
   * Without this the mesh never hands off: `active` stayed true at progress 1,
   * so a textured sheet sat over a DOM page that still had its own ink
   * underneath, for as long as the user stayed there. No amount of material
   * matching fixes that — two surfaces in almost the same place read as two
   * surfaces. At the end of the turn the WebGL layer goes away entirely and
   * the notebook renders the landed spread itself, which is sharp because it
   * is live DOM rather than a photograph of it.
   */
  const [landed, setLanded] = useState(false)
  /** Index of the spread the current sheet is leaving. */
  const [from, setFrom] = useState(0)

  useEffect(() => {
    /** Splits a total into the sheet that is moving and its own progress. */
    const applyTotal = (total: number) => {
      const clamped = Math.min(Math.max(total, 0), turns)
      // The last sheet keeps its own index at the very end of the runway
      // rather than rolling over into a turn that does not exist.
      const sheet = Math.min(Math.floor(clamped), turns - 1)
      const local = Math.min(Math.max(clamped - sheet, 0), 1)

      progress.current = local
      const isLanded = local >= LANDED
      const isActive = local > 0.0005 && !isLanded
      setFrom((was) => (was === sheet ? was : sheet))
      setActive((was) => (was === isActive ? was : isActive))
      setLanded((was) => (was === isLanded ? was : isLanded))
    }

    const pinned = readPinnedProgress(turns)
    if (pinned !== null) {
      applyTotal(pinned)
      return
    }

    const el = target.current
    if (!el) return

    const state = { value: 0 }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.22,
      animation: gsap.to(state, {
        value: 1,
        ease: 'none',
        // Ceiling only here, not inside `applyTotal` itself: the pinned debug
        // path calls that directly and is meant to reach a state whether or
        // not its capture exists yet, exactly to make that state inspectable.
        onUpdate: () => applyTotal(Math.min(state.value * turns, readyTurnsRef.current)),
      }),
    })

    return () => {
      trigger.kill()
    }
  }, [target, turns])

  return { progress, active, landed, from }
}

function readPinnedProgress(turns: number): number | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('turn')
  if (raw === null || raw === 'live') return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), turns) : null
}
