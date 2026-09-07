import { useEffect, useState } from 'react'
import { toCanvas } from 'html-to-image'
import { captureFontCSS } from './captureFonts'
import * as THREE from 'three'

/**
 * Photographs the notebook twice, so the turning sheet has something to show on
 * BOTH of its faces.
 *
 *   content   the spread as it stands — the front of the sheet
 *   blank     the same notebook with every page's ink hidden — the back of the
 *             sheet, its cut edge, and any page not yet written
 *
 * The second pass is the point of this module. The back of the sheet used to be
 * a hand-picked hex colour, and a hand-picked colour is a SECOND paper: it
 * measured 6/10/20 levels off the real page — a hue shift toward yellow rather
 * than a brightness difference — so the sheet visibly changed material as it
 * landed. Sampling a photograph of the notebook's own paper means there is
 * exactly one paper in the project and the WebGL sheet cannot drift from it.
 * The grain, the warmth and the across-page gradients all come along for free.
 *
 * Both passes photograph the whole notebook rather than a single page, because
 * the paper is painted by SVG filters defined further up the tree; clone a page
 * on its own and every `url(#…)` in it resolves to nothing.
 *
 * Resolution is deliberately above the display's: this is what you look at
 * while the page is moving.
 */

/**
 * How much denser than CSS pixels the capture is taken.
 *
 * The notebook is ~1160 CSS px wide, so on a 2x display it is ~2320 real
 * pixels of paper. Capturing at the old `devicePixelRatio * 1.5` gave 1.5x on
 * an ordinary display — BELOW the density the page is shown at, which is
 * enlarging a texture across the sheet and is exactly the blur the eye picks
 * up while it moves. Twice the device's own ratio puts a comfortable margin
 * over it at every density, and the cap keeps the two textures inside sane
 * memory (at 3x the pair is ~1.4k x 0.8k CSS at 4 bytes, mipmaps included).
 */
const CAPTURE_DENSITY = 2
const MAX_PIXEL_RATIO = 3

/**
 * The page's lighting layer — sheen, falloff, gutter shading. Hidden for the
 * blank pass so the paper is photographed as MATERIAL, with the room's light
 * left to the shader.
 *
 * It has to be switched off with a real attribute rather than a stylesheet
 * rule. The capture serialises the DOM into an SVG foreignObject and CSS aimed
 * at SVG elements does not survive that — the same trap that turned class-filled
 * shapes black. A `display: none` rule on this group applied in the browser and
 * silently did nothing in the capture, so the "blank" paper came back carrying
 * the very gradients it exists to exclude: 219 at the gutter against 241 in the
 * open field, which is the sheet arriving 12 levels dark and visibly a
 * different material. Attributes are copied verbatim, so this one works.
 */
const SHADING = '.notebook__page-shading'

export type SpreadCapture = {
  /** The spread with its ink: the front of the turning sheet. */
  content: THREE.Texture
  /** The same notebook, ink hidden: the back of the sheet and its edge. */
  blank: THREE.Texture
  /** Texture pixels per CSS pixel, so the shader can undo the oversampling. */
  pixelRatio: number
}

export function useSpreadCapture(target: HTMLElement | null, enabled: boolean) {
  const [capture, setCapture] = useState<SpreadCapture | null>(null)

  useEffect(() => {
    if (!target || !enabled || capture) return

    let cancelled = false
    const made: THREE.Texture[] = []

    const shoot = async (mode: 'content' | 'blank', fontCSS: string) => {
      target.setAttribute('data-capturing', mode)
      // BOTH passes: neither face may carry baked lighting. The front used to
      // keep it, on the assumption the serialiser reproduced the page it was
      // photographing — it does not. Measured against the live page, the
      // captured right page came back nearly flat (~228 across) where the real
      // one runs 199 at the binding to 242 mid-page, so the sheet changed tone
      // the instant a turn began. Lighting is the shader's job on both sides.
      const shading = Array.from(target.querySelectorAll<SVGGElement>(SHADING))
      for (const g of shading) g.setAttribute('display', 'none')
      try {
        const pixelRatio = Math.min(
          Math.max(window.devicePixelRatio, 1) * CAPTURE_DENSITY,
          MAX_PIXEL_RATIO,
        )
        density = pixelRatio
        const canvas = await toCanvas(target, {
          pixelRatio,
          backgroundColor: undefined,
          // Explicit, because letting the library find the fonts itself lost
          // one of them silently. See captureFonts.ts.
          fontEmbedCSS: fontCSS,
        })
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        // Raised to the GPU's maximum once the renderer is known; see
        // TurningPage. 8 is a guess, and the guess is what goes soft.
        texture.anisotropy = 8
        texture.needsUpdate = true
        made.push(texture)
        return texture
      } finally {
        for (const g of shading) g.removeAttribute('display')
        target.removeAttribute('data-capturing')
      }
    }

    let density = 1

    const run = async () => {
      // Webfonts must resolve first, or the capture bakes in the fallbacks.
      await document.fonts.ready
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (cancelled) return

      try {
        const fontCSS = await captureFontCSS()
        if (cancelled) return
        const content = await shoot('content', fontCSS)
        if (cancelled) return
        const blank = await shoot('blank', fontCSS)
        if (cancelled) return
        setCapture({ content, blank, pixelRatio: density })
      } catch {
        // A failed capture must not take the page down: the turn stays disabled
        // and the spread keeps rendering as live DOM.
        setCapture(null)
      }
    }

    void run()

    return () => {
      cancelled = true
      for (const t of made) t.dispose()
    }
  }, [target, enabled, capture])

  return capture
}
