import { useEffect, useState } from 'react'
import { toCanvas } from 'html-to-image'
import { captureFontCSS } from './captureFonts'
import * as THREE from 'three'

/**
 * Photographs the notebook so every turning sheet has something to show on
 * BOTH of its faces, and what its back shows is real.
 *
 * Per sheet, two photographs — plus ONE shared photograph of the bare paper:
 *
 *   content    the spread's right page as it stands — the front of the sheet
 *   nextLeft   the NEXT spread's left page, ink visible — the back of the
 *              sheet, i.e. the page actually being arrived at
 *   blank      the notebook with every page's ink hidden — the material the
 *              sheet's cut edge and any unwritten paper is built from. Taken
 *              once and shared: the paper does not change between chapters,
 *              and photographing it per turn would only be a chance for the
 *              three copies to disagree.
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
 * All passes photograph the whole notebook rather than a single page, because
 * the paper is painted by SVG filters defined further up the tree; clone a
 * page on its own and every `url(#…)` in it resolves to nothing.
 *
 * EVERY TURN IS PHOTOGRAPHED AT MOUNT, not when its turn comes round. The
 * chapters that are not on the page yet are photographed from the hidden
 * preview layers Pages.tsx keeps in the DOM for exactly this
 * (`previewLefts` / `previewRights`), so no pass ever has to wait for React
 * to render something first.
 *
 * NONE OF THIS TOUCHES THE LIVE, ON-SCREEN NOTEBOOK. Every pass needs to
 * reveal a different hidden preview and hide the page it is standing in for
 * — a hard requirement of photographing five different states (blank, two
 * fronts, two backs) out of one DOM tree. Doing that to `target` itself, the
 * SAME element the reader is looking at, used to mean the reader's own screen
 * briefly showed whatever the capture needed at that instant: the whole
 * spread's ink vanishing during the blank pass, a later chapter's page
 * flashing in during a preview reveal, all of it happening on real, painted
 * pixels seconds after the page loaded. It cost nothing to reproduce and
 * explained the entire family of "pages look tangled for a moment" reports —
 * every one of them was a genuine photograph of a real, momentary DOM state,
 * just not one anybody was supposed to see.
 *
 * The fix is a DEEP CLONE of `target`, detached from layout via
 * `position: fixed` and parked far off-screen, and every mutation below runs
 * on that clone instead. The clone carries its own copy of every preview
 * layer already in `target` (nothing to wait on), and — because `.notebook-
 * stage`'s own sizing is entirely `vw`/`dvh`-based rather than inherited from
 * a parent's box (see notebook.css), moving it off-screen changes nothing
 * about how it lays out. `target` itself is never read from after the clone
 * exists and never written to at all.
 *
 * Results are published PER TURN as each finishes, so the first sheet is ready
 * to move while the later ones are still being taken — the reader can start
 * scrolling immediately and the rest arrive long before they are reached.
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

const PREVIEW = '.notebook__page-content--preview'
const LIVE_CONTENT = '.notebook__page-content:not(.notebook__page-content--preview)'

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
 *
 * Run against the CLONE, not `target` — its `<img>`/`<image>` nodes are fresh
 * DOM elements that need their own load/decode even when the same URL was
 * already fetched once for the live page's copy.
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

/**
 * A detached, off-screen copy of `source`, laid out exactly as it is on
 * screen but invisible and inert.
 *
 * `position: fixed` takes it out of document flow entirely — nothing here can
 * grow the page's scroll size or introduce a scrollbar — and parking it far
 * to the left keeps it off every real monitor without relying on `opacity`
 * or `visibility`, either of which would have to be set on the clone's OWN
 * ancestor chain rather than on the clone itself: html-to-image reads the
 * capture ROOT's own computed style, so hiding the root the same way would
 * photograph nothing.
 */
function offscreenClone(source: HTMLElement) {
  const mount = document.createElement('div')
  mount.setAttribute('aria-hidden', 'true')
  mount.style.position = 'fixed'
  mount.style.top = '0'
  mount.style.left = '-100000px'
  mount.style.pointerEvents = 'none'

  const clone = source.cloneNode(true) as HTMLElement
  mount.appendChild(clone)
  document.body.appendChild(mount)

  return {
    clone,
    remove: () => mount.remove(),
  }
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

/**
 * Which hidden chapter, if any, this pass needs standing in for the live page.
 * `undefined` on a side means "photograph whatever is really on the page".
 */
type Reveal = { left?: number; right?: number }

export function useSpreadCapture(target: HTMLElement | null, enabled: boolean, turns: number) {
  const [captures, setCaptures] = useState<SpreadCapture[]>([])

  useEffect(() => {
    if (!target || !enabled || turns < 1) return

    let cancelled = false
    const made: THREE.Texture[] = []
    let density = 1
    let detach: (() => void) | null = null

    /* Anything a previous run published points at textures this run's cleanup
       has already disposed. Start from nothing and let this run republish; the
       turn simply stays disabled for the moment in between, which is the same
       state the very first mount is in.

       Deliberately synchronous. Doing it a tick later leaves a window in which
       the sheet can be asked to render disposed textures, which is a black
       page rather than a slow one — and the whole point of clearing is to
       close that window. */
    // oxlint-disable-next-line react/set-state-in-effect
    setCaptures([])

    /**
     * Stands a hidden preview layer in for the live page for the duration of
     * one pass, and puts the page back afterwards — on `root`, the off-screen
     * clone, never on the notebook the reader is looking at.
     *
     * Done with inline styles from JS rather than by stylesheet, because which
     * preview to show is an INDEX and CSS cannot select on one. (The rules
     * that do not need to count — the blank pass, the turning page — stay in
     * page-turn.css where they read better.)
     */
    const stand = (root: HTMLElement, reveal: Reveal) => {
      const undo: Array<() => void> = []

      const setVisibility = (el: HTMLElement, value: string) => {
        const had = el.style.visibility
        el.style.visibility = value
        undo.push(() => {
          el.style.visibility = had
        })
      }

      for (const side of ['left', 'right'] as const) {
        const index = reveal[side]
        if (index === undefined) continue

        const page = root.querySelector<HTMLElement>(`.notebook__page--${side}`)
        if (!page) continue

        const wanted = page.querySelector<HTMLElement>(
          `${PREVIEW}[data-preview-index="${index}"]`,
        )
        if (!wanted) continue

        // The real page steps aside; the chapter being photographed steps in.
        const live = page.querySelector<HTMLElement>(LIVE_CONTENT)
        if (live) setVisibility(live, 'hidden')
        setVisibility(wanted, 'visible')
      }

      return () => {
        for (const fn of undo) fn()
      }
    }

    const shoot = async (
      root: HTMLElement,
      mode: 'content' | 'blank' | 'nextLeft',
      fontCSS: string,
      reveal: Reveal = {},
    ) => {
      root.setAttribute('data-capturing', mode)
      const restore = stand(root, reveal)
      // ALL passes: neither face may carry baked lighting. The front used to
      // keep it, on the assumption the serialiser reproduced the page it was
      // photographing — it does not. Measured against the live page, the
      // captured right page came back nearly flat (~228 across) where the real
      // one runs 199 at the binding to 242 mid-page, so the sheet changed tone
      // the instant a turn began. Lighting is the shader's job on every face.
      const shading = Array.from(root.querySelectorAll<SVGGElement>(SHADING))
      for (const g of shading) g.setAttribute('display', 'none')
      try {
        const pixelRatio = Math.min(
          Math.max(window.devicePixelRatio, 1) * CAPTURE_DENSITY,
          MAX_PIXEL_RATIO,
        )
        density = pixelRatio
        const canvas = await toCanvas(root, {
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
        restore()
        root.removeAttribute('data-capturing')
      }
    }

    const run = async () => {
      // Webfonts must resolve first, or the capture bakes in the fallbacks.
      await document.fonts.ready
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (cancelled) return

      // Everything from here on happens to a copy — see offscreenClone.
      const { clone, remove } = offscreenClone(target)
      detach = remove

      // Photographs next — every chapter's images, including the ones only in
      // the hidden preview layers, so no pass can shoot an empty well. Waited
      // on the CLONE's own <img>/<image> nodes: freshly cloned elements need
      // their own decode even when the URL was already fetched once for the
      // live page's copy.
      await waitForImages(clone)
      if (cancelled) return

      try {
        const fontCSS = await captureFontCSS()
        if (cancelled) return

        const blank = await shoot(clone, 'blank', fontCSS)
        if (cancelled) return

        const shots: SpreadCapture[] = []

        for (let turn = 0; turn < turns; turn++) {
          /* The sheet's FRONT is spread `turn`'s right page. At mount the
             live right page is spread 0's, so only later turns need a stand-in
             — preview index t-1 holds spread t's right page (the previews
             start at spread 1; there is no preview of the page already
             showing). */
          const content = await shoot(
            clone,
            'content',
            fontCSS,
            turn === 0 ? {} : { right: turn - 1 },
          )
          if (cancelled) return

          /* ...and its BACK is spread `turn + 1`'s left page, which is never
             the one on screen at mount, so it always comes from a preview.
             Absent past the last chapter: the shader treats a missing back as
             material only, exactly as it did before any of this existed. */
          const backing = clone.querySelector(
            `.notebook__page--left ${PREVIEW}[data-preview-index="${turn}"]`,
          )
          const nextLeft = backing ? await shoot(clone, 'nextLeft', fontCSS, { left: turn }) : null
          if (cancelled) return

          shots.push({ content, blank, nextLeft, pixelRatio: density })
          // Published one at a time: the first sheet can move while the rest
          // are still being photographed.
          setCaptures([...shots])
        }
      } catch {
        // A failed capture must not take the page down: the turn stays disabled
        // and the spread keeps rendering as live DOM.
        setCaptures([])
      }
    }

    void run()

    return () => {
      cancelled = true
      detach?.()
      for (const t of made) t.dispose()
    }
  }, [target, enabled, turns])

  return captures
}
