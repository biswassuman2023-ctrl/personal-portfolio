import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Stack registration only. Nothing in the notebook is animated yet — the
 * scroll-driven work starts with page turning in a later phase.
 */
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
