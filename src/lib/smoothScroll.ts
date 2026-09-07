import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

/**
 * Smooth scrolling, driven by Lenis and handed to GSAP.
 *
 * The two have to share one clock. Lenis reports every scroll frame to
 * ScrollTrigger so triggers read the smoothed position rather than the raw
 * one, and GSAP's ticker advances Lenis so there is a single rAF loop instead
 * of two competing ones — which is what causes the small stutter you see when
 * a smooth-scroll library and a scroll-driven animation are wired separately.
 */
export function startSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.05,
    // Slightly long tail: a page being turned should carry a little momentum.
    easing: (t) => 1 - Math.pow(1 - t, 3.2),
    wheelMultiplier: 0.9,
  })

  lenis.on('scroll', ScrollTrigger.update)

  const advance = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(advance)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(advance)
    lenis.destroy()
  }
}
