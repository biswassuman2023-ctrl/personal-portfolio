/**
 * The turning sheet's deformation.
 *
 * Everything below is a function of ONE value, uProgress, so position, bend,
 * curl, droop, thickness and shadow can never disagree about where the sheet is.
 *
 * HINGE. The sheet turns about the RING AXIS, not about its own inner edge.
 * That distinction is the whole geometry of a ring binder and it is what makes
 * the turn land: both pages' inner edges sit 33 units from the axis, so a sheet
 * hinged there sweeps from one page's footprint onto the other's. Hinging at
 * the page edge instead leaves the sheet 78 units short of the destination and
 * overhanging the gutter — which reads as a turn that stopped halfway.
 *
 * BEND. A sheet of length L bent through a total angle K lies on a circle of
 * radius R = L / K, so a point at fraction u along it has turned through K·u
 * and sits at (R·sin(K·u), R·(1 − cos(K·u))) from where the sheet begins. The
 * bound edge stays put for any K, so the rings' constraint falls out of the
 * arithmetic instead of being special-cased.
 *
 * ENDPOINTS. K is scaled by sin(progress·π), which is exactly zero at both
 * ends, so the sheet is provably flat at rest AND flat when it lands — the
 * bend cannot stall the turn. The outer radius lerps between the two pages'
 * widths (they differ by 12 units), so progress 1 is the destination
 * footprint to the unit rather than approximately.
 */

/** Shared by the page and its shadow so the two can never drift apart. */
const deform = /* glsl */ `
  uniform float uProgress;
  uniform float uInner;       // radius of the bound edge from the ring axis
  uniform float uOuterFrom;   // radius of the free edge at rest
  uniform float uOuterTo;     // ...and where it has to arrive
  uniform float uCurl;
  uniform float uTipCurl;
  uniform float uDroop;

  const float PI = 3.141592653589793;

  struct Sheet {
    vec3 pos;
    vec3 normal;
  };

  Sheet sheetAt(vec2 uvIn, float yIn) {
    float u = uvIn.x;
    float swing = uProgress * PI;
    float bow = sin(uProgress * PI);   // zero at BOTH ends: flat, bowed, flat

    float outer = mix(uOuterFrom, uOuterTo, uProgress);
    float L = outer - uInner;

    float K = max(uCurl * bow, 0.0008);  // guard: R is undefined at K = 0
    float R = L / K;
    float a = K * u;

    vec3 p;
    p.x = uInner + R * sin(a);
    p.y = yIn;
    p.z = R * (1.0 - cos(a));

    // the last of the sheet curls harder than the body of it
    p.z += uTipCurl * bow * smoothstep(0.68, 1.0, u);

    // held at one edge, the far corner sags
    p.y -= uDroop * bow * u * u;

    vec3 n = vec3(-sin(a), 0.0, cos(a));

    // swing about the ring axis: +X lifts toward the viewer, then lands on -X
    float c = cos(swing);
    float s = sin(swing);

    Sheet sheet;
    sheet.pos = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
    sheet.normal = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
    return sheet;
  }
`

export const pageVertexShader = /* glsl */ `
  ${deform}

  uniform float uOffset;      // along the normal: the sheet's own thickness

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;

    Sheet sheet = sheetAt(uv, position.y);

    // The thickness surface must sit BEHIND the face from wherever it is being
    // looked at. Offsetting blindly along the normal only works while the sheet
    // faces us: once it turns past 90 degrees the normal points away, the edge
    // lands in FRONT, and the page reads as the cut edge's tone instead of its
    // own paper. Flipping with the normal keeps it behind for the whole turn.
    float behind = sheet.normal.z >= 0.0 ? 1.0 : -1.0;
    vec3 q = sheet.pos + sheet.normal * (uOffset * behind);

    vNormal = normalize(normalMatrix * sheet.normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
  }
`

/**
 * ONE PAPER. The front samples the captured spread; the back and the cut edge
 * sample a second capture of the same notebook with its ink hidden — so every
 * face of the sheet is a photograph of the paper it is travelling between,
 * carrying that paper's own grain, warmth and gradients. There is no invented
 * paper colour anywhere in this pipeline.
 *
 * Shading is normalised against the sheet's RESTING orientation, so a flat page
 * shades by exactly 1.0. That is what makes the DOM-to-WebGL handoff invisible
 * at progress 0 and again at progress 1: the mesh is not merely close to the
 * page it replaces, it is arithmetically the same value. Turning away from the
 * light darkens it, down to a floor — never toward grey, and never toward a
 * different material.
 *
 * The page never carries its own shadow; that is a separate surface, cast onto
 * whatever lies underneath.
 */
export const pageFragmentShader = /* glsl */ `
  uniform sampler2D uInk;      // the spread, with its content
  uniform sampler2D uPaper;    // the same notebook, ink hidden
  uniform vec4 uInkRect;       // xy = origin, zw = size, in atlas UV
  uniform vec4 uPaperRect;     // the destination page, in the same atlas space
  uniform vec3 uLight;
  uniform float uRestDot;      // the shading term of a page lying flat
  uniform float uShadeDepth;
  uniform float uShadeFloor;
  uniform float uEdgeTint;     // 1 for a face, slightly under for the cut edge
  uniform float uShowInk;      // 0 for the edge, which is paper on both sides
  uniform vec2 uGutterDepth;   // how dark the paper goes at the rings: near, far
  uniform vec2 uGutterWidth;   // ...and how far out of the binding each reaches

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 base;

    if (uShowInk > 0.5 && gl_FrontFacing) {
      base = texture2D(uInk, uInkRect.xy + vUv * uInkRect.zw).rgb;
    } else {
      // Same region as the front, from the ink-free capture: this is the same
      // sheet, seen from behind. Sampled in the same direction so the shading
      // that belongs at the gutter stays at the gutter once the sheet lands.
      base = texture2D(uPaper, uPaperRect.xy + vUv * uPaperRect.zw).rgb * uEdgeTint;

      // The binding shadow. The paper capture is deliberately unlit, so the
      // back of the sheet arrives with no record of the light the rings keep
      // off it — it landed flat at 248 where the page beneath it reads 207,
      // and a page that does not darken into its own binding reads as a
      // cutout laid on top rather than a sheet bound into the book.
      //
      // The front face needs nothing here: it samples the lit capture, which
      // carries this same shadow already baked at the same edge.
      //
      // uv.x is 0 at the bound edge for the whole turn, so this is a property
      // of the sheet's own geometry rather than of whichever page it is over,
      // and it is right at both ends of the turn without being animated.
      // Fitted to the notebook's own gutter, sampled across the left page,
      // which turns out to be TWO overlapping falls rather than one: a narrow
      // hard band in the last ~20 units before the rings (207 against 231 only
      // 20 units further out) sitting inside a much wider, gentler one that is
      // not fully recovered until a third of the way across (244 at 480).
      // A single ramp can be one or the other and was visibly neither.
      float bandNear = mix(uGutterDepth.x, 1.0, smoothstep(0.0, uGutterWidth.x, vUv.x));
      float bandFar = mix(uGutterDepth.y, 1.0, smoothstep(0.0, uGutterWidth.y, vUv.x));
      base *= bandNear * bandFar;
    }

    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;

    // Half-Lambert, normalised so a page lying flat shades by exactly 1.0.
    // That identity is what makes the handoff invisible at both ends: the mesh
    // does not approximate the page it replaces, it matches it. Turning away
    // from the light darkens the sheet down to a floor, never to grey.
    float d = dot(n, normalize(uLight)) * 0.5 + 0.5;
    float shade = clamp(1.0 + uShadeDepth * (d - uRestDot), uShadeFloor, 1.0);

    gl_FragColor = vec4(base * shade, 1.0);

    // Raw ShaderMaterial does not inherit the renderer's output conversion;
    // without this the texture round-trips through linear and comes back wrong.
    #include <colorspace_fragment>
  }
`

/**
 * The shadow the sheet throws onto whatever is under it.
 *
 * Same deformation, then flattened onto the surface below by sliding each
 * point along the light in proportion to its height — so the shadow bends with
 * the paper, slides out from under it as it lifts and returns as it lands.
 *
 * It is drawn BEHIND the page plane on purpose. Transparent surfaces render
 * after opaque ones in three.js regardless of renderOrder, so a shadow sharing
 * the page's depth paints straight over the paper and turns it grey — which is
 * where the "the page goes dark mid-turn" artefact came from. Sitting behind
 * the sheet, it is occluded by the paper exactly where it should be.
 */
export const shadowVertexShader = /* glsl */ `
  ${deform}

  uniform vec2 uLightSlide;
  uniform float uPlane;

  varying float vHeight;
  varying vec2 vUv;
  varying float vAirborne;

  void main() {
    vUv = uv;

    // How much the sheet is in the air at all: zero when it is lying flat at
    // either end of the turn, full in the middle. A page resting ON another
    // page casts nothing — they are in contact — so tying the shadow to this
    // is both physically right and what makes the handoff clean: there is no
    // shadow to disappear at progress 0 or 1.
    vAirborne = sin(uProgress * PI);

    Sheet sheet = sheetAt(uv, position.y);
    vHeight = sheet.pos.z;

    vec3 dropped = vec3(sheet.pos.xy + uLightSlide * sheet.pos.z, uPlane);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(dropped, 1.0);
  }
`

export const shadowFragmentShader = /* glsl */ `
  uniform float uStrength;
  uniform float uFalloff;

  varying float vHeight;
  varying vec2 vUv;
  varying float vAirborne;

  void main() {
    // close to the surface: tight and dark. lifted: weak and diffuse.
    float lift = clamp(abs(vHeight) / uFalloff, 0.0, 1.0);
    float a = uStrength * (1.0 - lift) * (1.0 - lift);

    // and nothing at all while the sheet is lying down
    a *= vAirborne;

    // and it fades toward the free edge, which is furthest off the page
    a *= mix(1.0, 0.4, smoothstep(0.35, 1.0, vUv.x));

    gl_FragColor = vec4(0.16, 0.13, 0.10, a);
  }
`
