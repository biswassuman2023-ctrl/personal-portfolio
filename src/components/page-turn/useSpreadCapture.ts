import { useEffect, useState } from 'react'
import { toCanvas } from 'html-to-image'
import { captureFontCSS } from './captureFonts'
import * as THREE from 'three'

/**
 * Photographs the notebook three times, so the turning sheet has something to
 * show on BOTH of its faces, and what its back shows is real.
 *
 *   content    the spread as it stands — the front of the sheet
 *   blank      the same notebook with every page's ink hidden — the material
 *              the sheet's cut edge is built from
 *   nextLeft   the NEXT spread's left page, ink visible — the back of the
 *              sheet, i.e. the page actually being arrived at
 *
 * nextLeft is what makes the back of the sheet a real page rather than a
 * blank one. Without it, the sheet's back showed the same ink-free material
 * as the cut edge — the only physically correct choice back when there was
 * no next chapter to photograph, but wrong the moment one existed: a blank
 * opaque sheet would sweep across the destination page for the whole turn,
 * and the real content would only appear in a single frame once the mesh
 * disappeared and the live DOM took over. Chapter 02's left page vanishing
 * behind that blank sheet was exactly this.
 *
 * The second pass (blank) is the reason the paper itself never drifts. The
 * back and the cut edge used to be a hand-picked hex colour, and a hand-picked
 * colour is a SECOND paper: it measured 6/10/20 levels off the real page — a
 * hue shift toward yellow rather than a brightness difference — so the sheet
 * visibly changed material as it landed. Sampling a photograph of the
 * notebook's own paper means there is exactly one paper in the project and
 * the WebGL sheet cannot drift from it. The grain, the warmth and the
 * across-page gradients all come along for free.
 *
 * All three passes photograph the whole notebook rather than a single page,
 * because the paper is painted by SVG filters defined further up the tree;
 * clone a page on its own and every `url(#…)` in it resolves to nothing.
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

/**
 * Every photograph printed anywhere in the captured DOM must actually be
 * downloaded and decoded before the FIRST screenshot, or that screenshot
 * — frozen forever into a texture — photographs an empty well.
 *
 * This is what made the college photo vanish specifically DURING a turn and
 * nowhere else: the capture sequence waited for webfonts and one frame, then
 * shot immediately, with nothing waiting on the `<image>` elements PhotoPrint
 * renders. A ~370KB image has no reason to have finished its network fetch in
 * that single frame. The live DOM's own `<img>` had the whole scroll to load
 * and was fine by the time the turn landed — only the texture taken at mount,
 * before the fetch resolved, ever had the gap.
 *
 * Rather than track which components use images, this DISCOVERS every URL
 * actually referenced in the DOM at capture time — both HTML `<img src>` and
 * SVG `<image href>` (PhotoPrint's developed prints are SVG) — and preloads
 * each through a throwaway `Image` + `decode()`. Browsers cache by URL, so
 * once that resolves, the real elements sharing the same URL paint from cache
 * essentially instantly; nothing here has to know which component put an
 * image where, so a future photo anywhere in the notebook is covered for
 * free.
 */
async function waitForImages(root: HTMLElement) {
  const urls = new Set<string>()
  for (const img of root.querySelectorAll('img')) {
    if (img.src) urls.add(img.src)
  }
  for (const img of root.querySelectorAll('image')) {
    const href = img.getAttribute('href') ?? img.getAttribute('xlink:href')
    if (href) urls.add(new URL(href, window.location.href).href)
  }
  await Promise.all(
    Array.from(urls, (url) => {
      const img = new Image()
      img.src = url
      // A missing or undecodable image must not block the capture forever;
      // it will simply photograph as empty, same as before this existed.
      return img.decode().catch(() => {})
    }),
  )
}

export type SpreadCapture = {
  /** The spread with its ink: the front of the turning sheet. */
  content: THREE.Texture
  /** The same notebook, ink hidden: the back of the sheet and its edge. */
  blank: THREE.Texture
  /**
   * The next spread's left page, ink visible: the back of the sheet where it
   * actually carries content. `null` past the last spread — there is nothing
   * to preview, and the shader falls back to material only, exactly as it did
   * before this page existed.
   */
  nextLeft: THREE.Texture | null
  /** Texture pixels per CSS pixel, so the shader can undo the oversampling. */
  pixelRatio: number
}

export function useSpreadCapture(target: HTMLElement | null, enabled: boolean) {
  const [capture, setCapture] = useState<SpreadCapture | null>(null)

  useEffect(() => {
    if (!target || !enabled || capture) return

    let cancelled = false
    const made: THREE.Texture[] = []

    const shoot = async (mode: 'content' | 'blank' | 'nextLeft', fontCSS: string) => {
      target.setAttribute('data-capturing', mode)
      // ALL passes: neither face may carry baked lighting. The front used to
      // keep it, on the assumption the serialiser reproduced the page it was
      // photographing — it does not. Measured against the live page, the
      // captured right page came back nearly flat (~228 across) where the real
      // one runs 199 at the binding to 242 mid-page, so the sheet changed tone
      // the instant a turn began. Lighting is the shader's job on every face.
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
      // Photographs next — the preview layer's image is already in the DOM
      // (just visibility:hidden), so this catches it before the very first
      // shoot rather than only before whichever pass happens to reveal it.
      await waitForImages(target)
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (cancelled) return

      try {
        const fontCSS = await captureFontCSS()
        if (cancelled) return
        const content = await shoot('content', fontCSS)
        if (cancelled) return
        const blank = await shoot('blank', fontCSS)
        if (cancelled) return
        // Only if there is a next spread to preview at all — Pages.tsx does
        // not render the preview layer when `previewLeft` is undefined, so
        // its absence here means "nothing past this chapter yet," not a bug.
        const hasPreview = !!target.querySelector('.notebook__page-content--preview')
        const nextLeft = hasPreview ? await shoot('nextLeft', fontCSS) : null
        if (cancelled) return
        setCapture({ content, blank, nextLeft, pixelRatio: density })
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
