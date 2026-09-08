import { tapeStrip } from '../origin/marks'

/**
 * The two ways anything gets held to this board.
 *
 * Two, and only two, on purpose. A board where every object is attached
 * differently — a pin here, tape there, a clip, a staple, a magnet — is a
 * board assembled by someone auditioning fasteners; the restraint is what
 * makes the pieces read as one person's working surface. So: most things are
 * tacked, a couple are taped, and the tape exists mainly so the tack is a
 * choice rather than the only option.
 *
 * Both are SVG fragments meant to be dropped into an object's own SVG, in
 * that object's own coordinates, so a fastener sits in the same space as the
 * paper it is holding and scales with it.
 */

/**
 * A thumbtack, seen from very slightly above — which is why the head is a
 * circle with the light on its upper left and the shadow it casts sits down
 * and to the right of it rather than directly underneath.
 */
export function Tack({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <ellipse cx={x + r * 0.34} cy={y + r * 0.62} rx={r * 0.95} ry={r * 0.66} fill="#3a2f1e" fillOpacity={0.26} />
      <circle cx={x} cy={y} r={r} fill="url(#bd-tack)" />
      {/* The one bright point where the dome catches the room. */}
      <ellipse cx={x - r * 0.3} cy={y - r * 0.34} rx={r * 0.3} ry={r * 0.22} fill="#ffffff" fillOpacity={0.5} />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#5e120b" strokeOpacity={0.35} strokeWidth={r * 0.09} />
    </g>
  )
}

/**
 * A strip of masking tape across a corner. The path is the notebook's own
 * torn-tape silhouette (origin/marks.ts) — the same roll of tape that holds
 * the photographs in Chapter 02, which is exactly the point: one project,
 * one drawer of materials.
 */
export function Tape({
  x,
  y,
  w,
  h,
  rotate,
}: {
  x: number
  y: number
  w: number
  h: number
  rotate: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
      <path d={tapeStrip(w, h)} fill="url(#bd-tape)" />
      <path d={tapeStrip(w, h)} fill="none" stroke="#b6a781" strokeOpacity={0.34} strokeWidth={0.6} />
    </g>
  )
}
