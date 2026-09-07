# Suman Biswas — Portfolio

React + TypeScript + Vite. Tailwind CSS v4, GSAP (with ScrollTrigger) and Lenis
are installed as part of the project stack.

```bash
npm install
npm run dev
```

## Fonts

All four faces are **self-hosted** in `public/fonts` and declared in
`src/styles/global.css`. That is not a preference: the page-turn capture can
only inline same-origin fonts, and served from Google the two wordmark faces
silently fell back to a system sans inside the texture.

| token | face | used for |
| --- | --- | --- |
| `--font-display` | PAGKAKI | headings, printed labels, site chrome |
| `--font-hand` | Schoolbell | annotations, microcopy |
| `--font-serif` | Bodoni Moda 900 | the wordmark's `Port` only |
| `--font-script` | Cormorant Garamond Italic 300 | the wordmark's `folio` only |

PAGKAKI was originally dropped in `dist/`, **which Vite empties on every
build** — it now lives in `public/`, which is served at the site root and
survives. It ships one weight, so do not ask CSS for a bold; browsers will
synthesise one and it will not match.

`--font-serif` / `--font-script` exist ONLY for the giant Portfolio wordmark,
a one-off display treatment reconstructed from the reference. Nothing else may
reach for them.

## Phase 01 — the notebook

The physical object: an open black leather ring-binder in a quiet warm-white
room. It knows nothing about the chapter it is showing — content is handed to
`<Notebook leftPage={…} rightPage={…} />` and rendered inside the sheets, so the
paper keeps its own clipping, shadows and hinges.

### How it is put together

`src/components/notebook/` holds one part per physical component, assembled
back to front in `Notebook.tsx`:

| file | part |
| --- | --- |
| `geometry.ts` | every proportion, measured off the reference photograph |
| `silhouettes.ts` | hand-authored contours for the cover and the two sheets |
| `holes.ts` | punch-hole positions, derived from the ring |
| `MaterialDefs.tsx` | shared SVG materials — leather, paper, metal, shadow |
| `Cover.tsx` | the leather slab, its board thickness and the saddle stitch |
| `Pages.tsx` / `Page.tsx` | the page block; each half is separately transformable |
| `Spine.tsx` | backing plate, two hinged leaves, seam, boosters |
| `Rings.tsx` | the six rings and their housings |

Four decisions are worth knowing before changing anything:

**Everything draws into one shared coordinate space** (`FRAME`, 1277×748).
Each layer is a full-frame SVG, or a percentage window onto that frame, so one
user unit is the same physical size in the cover, the paper and the metal. SVG
filter frequencies depend on this — rescale a layer on its own and its grain
stops matching its neighbours.

**Grain is a height field, not an overlay.** `feTurbulence` drives
`feDiffuseLighting` against one agreed light direction (upper-left, azimuth
130°), and the result is remapped through `feComponentTransfer` into the narrow
tonal band the real material occupies. Noise multiplied over a flat fill is
what makes a rendered material look like CSS. The leather's height field is
hierarchical (fine pores over larger follicle clusters) and its specular pass
is multiplied by a low-frequency roughness mask, so sheen varies across the
hide instead of coating it evenly.

**The three materials are calibrated to react differently.** Measured over the
render: paper spans ~10 levels (matte), leather ~16 with a median near #222
(grain, deep black), metal ~43 (hard specular). If a change collapses those
spreads toward each other the materials stop separating, whatever the colours
say. `scripts` for this live outside the repo, but the check is just sampling
regions of a screenshot.

**The rings are threaded through the paper, not laid on it.** Hole positions
come from the ring parametrisation in `holes.ts`, and `Rings.tsx` masks the
wire away where it dips under the sheet beside each hole. Masking the wire
(rather than repainting paper over it) leaves the page and its shadows intact.
The ring's cast shadow is deliberately outside that mask.

## Phase 02 — Chapter 01, Hero

`src/components/hero/` — the spread's printed matter. `layout.ts` holds every
position in notebook units, so the whole composition scales with the object and
can be reasoned about against the page geometry.

Four things worth knowing:

**The element count is the design.** Four artefacts on the left page, five on
the right, and nothing else. Earlier passes also carried an origin card, a
discipline strip and a two-paragraph bio; each one made the spread read as a
portfolio site with a notebook behind it. If you are about to fill the empty
lower half of the left page, that is the space doing its job.

**The wordmark is SVG text, not HTML.** In SVG, `y` IS the baseline. The runs
are set at very different sizes and must sit on one line; CSS cannot hold two
font sizes to a shared baseline reliably (line-height puts it at a different
offset for each), and the first attempt drifted enough to collide with
everything below it.

**Two runs, split at the binding: `Port` left, `folio` right.** The f is the
first letter of `folio` and belongs on the right page; its swash carries back
toward the gutter on its own, because Cormorant's italic f has a deep negative
left bearing. An earlier pass set the f on the left page leaning over the `t`,
which made it read as part of `Port`. The wordmark is rendered into BOTH pages
at identical coordinates and each sheet clips its own half, which is why it
behaves like ink on a real spread.

**Nothing in the hero puts a filter on type.** `Port` briefly ran through a
turbulence displacement for a dry-press texture; filtered text is rasterised
through the filter region and goes soft, which made the biggest thing on the
page the blurriest. The Didone's own contrast carries the print character.

**Positions are transposed from the reference, with one correction.** Our rings
are wider than the reference's (128 units against 92), so a literal mapping
pushes right-page content into the hardware. Everything on the right page sits
on `RIGHT_COLUMN` (x 790), which keeps the reference's ~50-unit gap from OUR
rings. `fontcheck.mjs` in the scratchpad prints the loaded fonts, the computed
family on each element, and the wordmark run positions in notebook units.

**Images are placeholders on purpose.** Each `PhotoPrint` carries a `data-slot`;
the well is a bare emulsion panel with crop marks, not stock photography.

There is deliberately no paperclip on the photo stack. It was drawn three ways
and at this size every version read as a hook or a hairpin — a clip is
recognised by its nested U-turns and there is not enough room to state them.

### Deliberately not here yet

Page turning, book closing, scroll-driven movement and chapter content are all
later phases. The pieces are already separate elements with their hinges set at
the binding edge (`.notebook__page--left/right` in `notebook.css`), and there
is an empty `data-slot="chapter-tabs"` rail for the sticky tabs, so none of
that requires rebuilding the notebook.

`src/lib/gsap.ts` registers ScrollTrigger and is intentionally not imported
anywhere yet.

## Phase 03 — page turn, chrome, player

`src/components/chrome/` (wordmark + nav), `src/components/music/` (vinyl),
`src/components/page-turn/` (the WebGL sheet).

### The page turn

**DOM at rest, WebGL only in flight.** A mesh cannot show live text, so the
turning sheet has to be a texture — and a texture is never quite as crisp as
the real thing. So the spread renders as live DOM until a page actually moves,
and the textured mesh is only on screen while it is moving, which is the one
time nobody can tell. `.page-turn` crossfades over ~140ms to hide the handover.

**The sheet is bent, then swung.** `pageShader.ts`: a sheet of length L bent
through angle K lies on a circle of radius R = L/K, so a point at fraction u
along it sits at `(R·sin(Ku), R·(1−cos(Ku)))`. The bound edge stays pinned for
any K — the rings' constraint falls out of the maths instead of being special-
cased. K peaks mid-turn, so the page is flat lying down and most bowed
overhead. The shadow re-runs the same bend and drops it onto the page below,
displaced along the light by height, so it deforms and slides as the sheet
lifts.

**Spreads, not pages.** `spreads.ts`: a turn takes spread N to N+1 by rotating
one sheet whose front is N's right page and whose back is N+1's left. Adding a
chapter is appending an entry.

### Three traps, all of which cost real time

**R3F aims the default camera at the origin.** The scene was built in notebook
coordinates (centre ≈ 638, 374) and nothing rendered at all — which looks
exactly like a broken shader. The scene is now centred on the origin.

**CSS on SVG children does not survive the capture.** The texture is made by
serialising the DOM into an SVG `foreignObject`, and CSS targeting SVG elements
is lost: shapes whose `fill` came from a class came back BLACK (SVG's default),
and text whose family came from a class came back in a system serif. Hero SVG
therefore sets `fill` and `font-family` as **presentation attributes**
(`fonts.ts`), not classes. Do not "tidy" these back into the stylesheet.

**Webfonts must be same-origin.** Served from Google, the two wordmark faces
silently fell back inside the texture. All four faces are self-hosted in
`public/fonts`.

### Known rough edges

- Mid-turn the sheet reads nearly edge-on, because the camera reproduces the
  notebook's own near-orthographic CSS perspective (`perspective: 2600px`).
  Truer to the object, less showy than a wide-angle turn.
- The vinyl needs `public/audio/track.mp3`; it 404s until one is added. The
  control still toggles, by design.

### Page-turn correction (what was actually wrong)

**The hinge was in the wrong place.** The sheet turned about its own inner edge
(x 707) rather than the RING AXIS (x 674). A 524-wide sheet hinged at 707 lands
at 183–707 after 180°, but the destination page is 105–641 — 78 units short and
overhanging the gutter, which reads as a turn that stopped halfway. Hinged at
the axis, where both pages' inner edges sit 33 units away, it lands on 105–641
exactly. The free-edge radius lerps between the two pages' widths (they differ
by 12 units) so progress 1 is the destination footprint to the unit.

**The shadow was painting over the paper.** Transparent surfaces render after
opaque ones in three.js regardless of `renderOrder`, so a shadow sharing the
page's depth drew straight over it and greyed the sheet — the "page goes dark
mid-turn" artefact. It now sits behind the page plane and is occluded by the
paper.

**The capture could photograph an already-blank page.** The turning class hides
the page's ink; if `active` is true on mount (a reload mid-scroll, or the
`?turn=` flag) that happened BEFORE the capture ran, so the sheet turned over
carrying nothing. `[data-capturing]` now forces the ink visible for the capture
frame.

**The depth range was far too generous.** `near: 1, far: 7800` with the camera
2600 away cannot resolve the couple of units between the page and its own edge.
It is now tight around the object.

Shading is half-Lambert with a high ambient floor, so the paper stays warm
white at every angle and the curvature reads from the gradient and silhouette
rather than from darkening. There is no dark material anywhere in the pipeline.

**Debug:** `?turn=0.5` pins progress and bypasses ScrollTrigger, so any point in
the motion can be inspected on its own. `?turn=live` or no flag is normal.

### Material continuity (one paper, not two)

The turning sheet used to read as a different material from the pages it moved
between. Four separate causes, none of them "the texture needs more grain":

**The back of the sheet was a hand-picked colour.** A chosen hex is a SECOND
paper by definition; it measured 6/10/20 levels off the real page — a hue shift,
not a brightness one, which is why it read as a different stock rather than a
darker one. The sheet's back and cut edge now sample a photograph of the
notebook's own paper, so there is exactly one paper in the project and the mesh
cannot drift from it.

**The lighting was baked into the "blank" capture, because CSS cannot switch off
an SVG group through the serialiser.** This is the same trap as the black fills
and the fallback fonts, and it is the one that cost the most: a
`display: none` rule on `.notebook__page-shading` applied perfectly in the
browser and was silently dropped by html-to-image, so the paper capture came
back carrying the very gutter gradient it exists to exclude — 219 at the binding
against 241 in the open field. It looked like a rule that was not in the bundle;
it was in the bundle. Proof it was never applying: at every ink-free point the
"blank" capture was byte-identical to the lit one. `useSpreadCapture` now sets
`display="none"` as an **attribute**, which the serialiser copies. Do not move
this back into the stylesheet.

**The thickness surface landed in front of the face.** The edge is offset along
the sheet's normal, which points at the viewer for the first half of the turn
and away for the second — so past 90° the offset put the cut edge nearer the
camera than the page, and the landed sheet showed the edge's tone (×0.955)
instead of its own paper. The offset now flips with the normal so the edge is
behind the face for the whole turn.

**Having stripped the lighting, the shader had to give it back.** The paper
capture is unlit (~248) while the page beneath it carries its binding shadow
(207 at the rings), and a sheet that does not darken into its own gutter reads
as a cutout laid on top. `uGutterDepth`/`uGutterWidth` are fitted to the
notebook's own measured profile and are two bands, not one: the fall is abrupt
in the last ~20 units (207 → 231) and then gently continues to a third of the
way across (244 at x 480). One ramp was visibly neither.

Measured against the DOM page at progress 1, ink excluded (85th percentile per
column, so glyphs do not skew the paper tone):

| notebook x | 120 | 250 | 400 | 480 | 560 | 600 | 620 | 635 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| delta | −2 | −1 | 0 | +1 | −1 | +6 | +8 | +9 |

Across the body of the page that is within two levels. The residual is confined
to the last ~40 units against the binding, where the DOM also carries the spine
and ring shadows the sheet does not reproduce, and where the rings sit over it
anyway. Progress 0 and 0.25 are exact (delta 0 everywhere) because the front
face samples the lit capture directly, and 0.99 → 1 moves by at most one level,
so the handoff back to DOM has nothing to flash.

Mid-turn the sheet sits 11–16 levels under the flat page. That is the
half-Lambert term on a sheet standing up out of the light, not a material
difference — it is normalised so a page lying flat shades by exactly 1.0, which
is what makes both ends of the turn identities rather than approximations.

**Measuring this needs the DOM/screen mapping.** `.notebook-stage` is not the
frame: at a 1712-wide viewport it sits at x 275 with width 1163 for 1277
notebook units. Sampling raw screen pixels without converting cost one wrong
conclusion — a region I read as "the outer left page" was notebook x 61–105,
i.e. the cover, and the +27 it reported was a page/cover boundary rather than
paper.
