import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

/**
 * Turns scroll position into how far through its turn the sheet is.
 *
 * Scrubbed, not triggered: the page does not flip past a threshold, it sits
 * wherever the scroll leaves it. `scrub` takes a number rather than `true` so
 * GSAP eases the value toward the scroll position over about a fifth of a
 * second — that lag IS the paper's momentum, and it is what stops a fast flick
 * snapping the sheet from flat to turned.
 *
 * The value is kept in a ref and mirrored into state only when it crosses the
 * at-rest boundary, so scrolling drives the shader through `useFrame` without
 * re-rendering React on every frame.
 *
 * DEBUG: `?turn=0.75` pins progress and skips ScrollTrigger entirely, so each
 * point in the motion can be inspected on its own rather than by guessing at
 * scroll offsets. `?turn=live` restores normal behaviour.
 */
/**
 * Where the turn is finished. The sheet has to stop being WebGL at this point
 * and become the notebook's own page again — see `landed` below.
 */
const LANDED = 0.999

export function useTurnProgress(target: React.RefObject<HTMLElement | null>) {
  const progress = useRef(0)
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

  useEffect(() => {
    const pinned = readPinnedProgress()
    if (pinned !== null) {
      progress.current = pinned
      setActive(pinned > 0.0005 && pinned < LANDED)
      setLanded(pinned >= LANDED)
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
        onUpdate: () => {
          progress.current = state.value
          const isLanded = state.value >= LANDED
          const isActive = state.value > 0.0005 && !isLanded
          setActive((was) => (was === isActive ? was : isActive))
          setLanded((was) => (was === isLanded ? was : isLanded))
        },
      }),
    })

    return () => {
      trigger.kill()
    }
  }, [target])

  return { progress, active, landed }
}

function readPinnedProgress(): number | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('turn')
  if (raw === null || raw === 'live') return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : null
}
