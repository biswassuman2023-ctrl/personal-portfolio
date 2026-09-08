import { useEffect, useRef, useState } from 'react'
import { FRAME } from '../notebook/geometry'
import { WORKS, WORK_BOUNDS } from './layout'

/**
 * The four prints as one arrangement: where each has been pushed, which is on
 * top, and which one the reader currently has hold of.
 *
 * WHY THE HIT TEST IS DONE BY HAND. The obvious build puts a pointer handler
 * on each print and lets the browser decide which one was pressed. That worked
 * exactly once per print. After a print had been moved, Chrome kept routing
 * pointer events using the hit region it had cached for the print's ORIGINAL
 * position: inside the very same event handler, `e.target` came back as the
 * page while `elementsFromPoint` at the identical coordinates came back as the
 * print. It draws in the right place, `getBoundingClientRect` agrees, and a
 * screenshot looks perfect — only a second drag reveals it, and only in a real
 * browser. Moving the print by `left`/`top` and by `transform` both behaved
 * the same way, and a plain box in a bare page did not reproduce it, so it is
 * something about this particular composited subtree rather than a rule that
 * can be designed around.
 *
 * So nothing here depends on the browser telling us what was pressed. Every
 * print's box is known exactly, in notebook units, and the pointer is
 * converted into those units and tested against them directly. It is less
 * code than the per-print version, it cannot go stale, and it makes the
 * stacking order explicit — which the DOM-order version was only ever
 * implying.
 *
 * `stack` is the pile, back to front. Grabbing a print moves it to the end,
 * which is what happens when you put your hand on one of four overlapping
 * photographs, and rendering in that order makes DOM order the paint order.
 */

type Grab = {
  pointerId: number
  index: number
  clientX: number
  clientY: number
  originX: number
  originY: number
  /** Notebook units per client pixel, measured at grab time. */
  perPixel: number
}

type Offset = { x: number; y: number }

const clampFor = (index: number, nx: number, ny: number): Offset => {
  const work = WORKS[index]
  const minX = WORK_BOUNDS.minX - work.x
  const maxX = Math.max(minX, WORK_BOUNDS.maxX - (work.x + work.w))
  const minY = WORK_BOUNDS.minY - work.y
  const maxY = Math.max(minY, WORK_BOUNDS.maxY - (work.y + work.h))
  return {
    x: Math.min(Math.max(nx, minX), maxX),
    y: Math.min(Math.max(ny, minY), maxY),
  }
}

export function useWorkGallery() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [offsets, setOffsets] = useState<Offset[]>(() => WORKS.map(() => ({ x: 0, y: 0 })))
  const [stack, setStack] = useState<number[]>(() => WORKS.map((_, i) => i))
  const [heldIndex, setHeldIndex] = useState<number | null>(null)
  const [hovered, setHovered] = useState(false)
  const grab = useRef<Grab | null>(null)

  /** Client pixels -> notebook units, using the page wrapper's own box. */
  const toUnits = (clientX: number, clientY: number) => {
    const rect = pageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    return {
      x: ((clientX - rect.left) / rect.width) * FRAME.w,
      y: ((clientY - rect.top) / rect.height) * FRAME.h,
      perPixel: FRAME.w / rect.width,
    }
  }

  /**
   * The topmost print under a point, or null. Front of the pile first.
   *
   * Only ever called from React's own event handlers, which close over the
   * current render — so this reads `offsets` and `stack` directly and cannot
   * be looking at a stale arrangement.
   */
  const printAt = (x: number, y: number) => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const index = stack[i]
      const work = WORKS[index]
      const left = work.x + offsets[index].x
      const top = work.y + offsets[index].y
      if (x >= left && x <= left + work.w && y >= top && y <= top + work.h) return index
    }
    return null
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = toUnits(event.clientX, event.clientY)
    if (!point) return
    const index = printAt(point.x, point.y)
    if (index === null) return

    grab.current = {
      pointerId: event.pointerId,
      index,
      clientX: event.clientX,
      clientY: event.clientY,
      originX: offsets[index].x,
      originY: offsets[index].y,
      perPixel: point.perPixel,
    }
    setHeldIndex(index)
    // Picked up, so it comes to the top of the pile.
    setStack((prev) => [...prev.filter((i) => i !== index), index])
  }

  /* Hover is tracked here rather than left to `:hover`, for the same reason
     the press is: the browser's own idea of what the cursor is over goes stale
     once a print has been moved, so a moved print would stop showing the grab
     cursor. */
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (grab.current) return
    const point = toUnits(event.clientX, event.clientY)
    if (!point) return
    const over = printAt(point.x, point.y) !== null
    setHovered((was) => (was === over ? was : over))
  }

  const onPointerLeave = () => {
    if (!grab.current) setHovered(false)
  }

  useEffect(() => {
    if (heldIndex === null) return

    /* On the window rather than the page: a hand moving a piece of paper does
       not stop moving it the moment the cursor leaves the paper's edge, and a
       fast drag outruns the print constantly. */
    const onMove = (event: PointerEvent) => {
      const start = grab.current
      if (!start || event.pointerId !== start.pointerId) return
      const next = clampFor(
        start.index,
        start.originX + (event.clientX - start.clientX) * start.perPixel,
        start.originY + (event.clientY - start.clientY) * start.perPixel,
      )
      setOffsets((prev) => {
        const copy = [...prev]
        copy[start.index] = next
        return copy
      })
    }

    const onUp = (event: PointerEvent) => {
      if (grab.current && event.pointerId !== grab.current.pointerId) return
      grab.current = null
      setHeldIndex(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [heldIndex])

  return {
    pageRef,
    offsets,
    stack,
    heldIndex,
    hovered,
    handlers: { onPointerDown, onPointerMove, onPointerLeave },
  }
}
