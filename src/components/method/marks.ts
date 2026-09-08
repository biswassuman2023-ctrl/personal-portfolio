/**
 * The stamp's own paper: a scalloped, perforated-edge rectangle.
 *
 * This is the shape of a stamp torn off a sheet along its own perforation —
 * a row of semicircular bites cut evenly into the paper on every side — not a
 * border drawn around a word. That distinction is the whole rebuild: the
 * previous version of this page printed red ink directly onto the notebook's
 * own paper (a rule with a word inside it); this one is a separate small
 * object, its own sheet, laid down on top of the page. The corners are simply
 * where two rows of bites happen to meet, not a fifth curve of their own.
 *
 * Every arc is drawn with `rx = ry = half the step`, so each bite is an exact
 * semicircle — mathematically the only shape that can meet the arc on either
 * side of it with no gap or overlap along a straight run, which is what keeps
 * the perforation reading as one continuous punched edge rather than a
 * wobbling line. `sweep = 1` is what makes each arc cut INTO the paper rather
 * than bulge out of it — bulging out draws a scalloped CLOUD, not a stamp.
 *
 * Bite size is derived from the stamp's own height rather than fixed, so a
 * short five-letter stamp and a long ten-letter one perforate at the same
 * physical gauge instead of the wide one looking coarser.
 */

const n = (v: number) => v.toFixed(2)

export function perforatedRect(w: number, h: number): string {
  const bite = h * 0.115
  const bitesX = Math.max(4, Math.round(w / (bite * 2)))
  const bitesY = Math.max(3, Math.round(h / (bite * 2)))
  const stepX = w / bitesX
  const stepY = h / bitesY
  const rx = n(stepX / 2)
  const ry = n(stepY / 2)

  let d = 'M 0 0'
  for (let i = 1; i <= bitesX; i++) d += ` A ${rx} ${rx} 0 0 1 ${n(stepX * i)} 0`
  for (let i = 1; i <= bitesY; i++) d += ` A ${ry} ${ry} 0 0 1 ${n(w)} ${n(stepY * i)}`
  for (let i = 1; i <= bitesX; i++) d += ` A ${rx} ${rx} 0 0 1 ${n(w - stepX * i)} ${n(h)}`
  for (let i = 1; i <= bitesY; i++) d += ` A ${ry} ${ry} 0 0 1 0 ${n(h - stepY * i)}`
  return d + ' Z'
}
