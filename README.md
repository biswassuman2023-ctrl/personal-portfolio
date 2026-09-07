# Suman Biswas — Portfolio

React + TypeScript + Vite. Tailwind CSS v4, GSAP (with ScrollTrigger) and Lenis
are installed as part of the project stack.

```bash
npm install
npm run dev
```

## Phase 01 — the empty notebook

The only thing built so far is the physical object: an open black leather
ring-binder sitting in a quiet warm-white room. It is intentionally empty.

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

### Deliberately not here yet

Page turning, book closing, scroll-driven movement and chapter content are all
later phases. The pieces are already separate elements with their hinges set at
the binding edge (`.notebook__page--left/right` in `notebook.css`), and there
is an empty `data-slot="chapter-tabs"` rail for the sticky tabs, so none of
that requires rebuilding the notebook.

`src/lib/gsap.ts` registers ScrollTrigger and is intentionally not imported
anywhere yet.
