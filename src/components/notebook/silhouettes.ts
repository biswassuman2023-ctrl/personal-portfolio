/**
 * Hand-authored contours for the cover and the two sheets.
 *
 * None of these are rectangles. Every edge bows by a unit or two across its
 * length and every corner carries a different radius, because a bound object
 * that has been handled does not have four identical corners. The deviations
 * are small enough to read as material rather than as decoration — the
 * displacement filter in MaterialDefs then roughens the silhouette further at
 * roughly a pixel, which is the scale real edges actually live at.
 */

/** Outer contour of the leather slab: full frame, softened and slightly bowed. */
export const COVER_PATH = [
  'M 13.5 2.4',
  'C 330 1.1, 700 2.2, 1263.5 3.6',
  'C 1271 5.2, 1275.2 10.4, 1275.6 18.5',
  'C 1276.8 260, 1275.4 496, 1274.2 731',
  'C 1273.6 740.4, 1267 745.6, 1257.5 746.2',
  'C 900 747.4, 402 745.9, 16.8 744.1',
  'C 8.2 743.2, 3.1 737.6, 2.6 729',
  'C 1.2 494, 1.9 252, 3.4 17.6',
  'C 4.2 8.8, 7.6 3.4, 13.5 2.4',
  'Z',
].join(' ')

/** Saddle stitch line, tracking the contour about 13 units inside the edge. */
export const STITCH_PATH = [
  'M 21 15.5',
  'C 340 14.2, 700 15.1, 1255 16.6',
  'C 1260.5 17.6, 1263.4 20.6, 1263.7 26',
  'C 1264.7 262, 1263.4 494, 1262.3 724',
  'C 1261.9 730, 1258 733.3, 1251.6 733.8',
  'C 900 734.9, 404 733.5, 24.5 731.8',
  'C 18.8 731.2, 15.4 727.7, 15 722',
  'C 13.7 492, 14.3 254, 15.7 27',
  'C 16.2 20.8, 17.8 16.4, 21 15.5',
  'Z',
].join(' ')

/**
 * Left sheet. Outer edge (left) is the handled one, so it carries the softer
 * corners and the visible waver; the inner edge is cut square by the binding.
 */
export const LEFT_SHEET_PATH = [
  'M 110 22.9',
  'C 260 21.6, 470 23.2, 638.2 22.4',
  'L 641 24.6',
  'L 639.6 722.4',
  'L 636.5 724.9',
  'C 460 726.2, 250 724.4, 111.6 724.1',
  'A 5.6 5.6 0 0 1 105.9 718.2',
  'C 104.2 500, 106.1 250, 105.6 28.4',
  'A 5.2 5.2 0 0 1 110 22.9',
  'Z',
].join(' ')

/**
 * Right sheet. Deliberately NOT a mirror of the left: different corner radii,
 * different bow. Mirroring is the cheapest tell that a shape came from code.
 */
export const RIGHT_SHEET_PATH = [
  'M 707 23.1',
  'C 860 21.9, 1080 23.4, 1225.8 22.6',
  'A 4.8 4.8 0 0 1 1230.6 27.5',
  'C 1232 250, 1230 498, 1230.9 718.8',
  'A 6.1 6.1 0 0 1 1224.8 724.9',
  'C 1070 726.1, 850 724.3, 709.4 724.6',
  'L 707.2 722.2',
  'L 708.4 25.6',
  'Z',
].join(' ')
