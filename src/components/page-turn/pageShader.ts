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

    // Thickness belongs to a sheet in the air. Lying down at either end it is
    // one leaf inside a block of them, and a 2.6-unit lip standing proud of
    // the page it has landed on is precisely the "card resting on card" tell —
    // the eye reads the rim, not the paper. Scaling by the same bow the bend
    // uses retires it exactly when the sheet goes flat, at both ends, without
    // touching the motion in between.
    float bow = sin(uProgress * PI);
    vec3 q = sheet.pos + sheet.normal * (uOffset * behind * bow);

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
  uniform vec4 uPaperRect;     // the ink-free paper to read, in that same space
  uniform vec3 uLight;
  uniform float uRestDot;      // the shading term of a page lying flat
  uniform float uShadeDepth;
  uniform float uShadeFloor;
  uniform float uEdgeTint;     // 1 for a face, slightly under for the cut edge
  uniform float uShowInk;      // 0 for the edge, which is paper on both sides
  /**
   * Mip bias, by however much the texture out-resolves the frame being drawn.
   *
   * The capture is deliberately denser than the screen, and mipmapping will
   * quietly throw that away: sampling a 2x texture into a 1x frame lands on
   * mip level 1 — a half-resolution copy — which is blurrier than plain
   * bilinear on the full-size image. That was measurable, at edge acutance
   * 55.9 against the live page's 76.3.
   *
   * The renderer is deliberately capped at 2x rather than matched to the
   * capture's own density (up to 3x) — rendering several million extra pixels
   * every frame for as long as a sheet is airborne cost more than it bought,
   * and on real hardware read as dropped frames, which blur a moving image
   * far worse than an under-sharp mip level does. This bias is what recovers
   * the gap instead: a per-fragment mip choice costs nothing extra to render,
   * where a bigger render target costs the whole frame.
   */
  uniform float uLodBias;
  // A page's lighting as (fall out of the binding) x (how the room crosses it).
  // xy = amount and scale of the binding fall, z = overall level, w = linear
  // tilt across the page. The sheens are separate because only one page has one.
  uniform vec4 uFrontCurve;    // the page the sheet is leaving
  uniform vec4 uBackCurve;     // the page it is landing on
  uniform vec2 uSheens;        // front, back

  float pageLight(float u, vec4 c, float sheen) {
    float fall = 1.0 - c.x * exp(-u / c.y);
    return fall * (c.z + c.w * u + sheen * smoothstep(0.30, 0.95, u));
  }

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 base;
    bool front = uShowInk > 0.5 && gl_FrontFacing;

    if (front) {
      base = texture2D(uInk, uInkRect.xy + vUv * uInkRect.zw, uLodBias).rgb;
    } else {
      // Same region as the front, from the ink-free capture: this is the same
      // sheet, seen from behind. Sampled in the same direction so the shading
      // that belongs at the gutter stays at the gutter once the sheet lands.
      base = texture2D(uPaper, uPaperRect.xy + vUv * uPaperRect.zw, uLodBias).rgb * uEdgeTint;
    }

    // THE PAGE'S OWN LIGHTING, measured rather than invented.
    //
    // Neither capture carries lighting any more, so both faces get it here —
    // and they get DIFFERENT lighting, because the page the sheet leaves and
    // the page it lands on are not lit alike. Dividing each real page by the
    // material gives the two curves:
    //
    //   u:      0.05   0.14   0.37   0.56   0.75   0.98
    //   front:  0.80   0.935  0.976  0.964  0.956  0.944   (falls outward)
    //   back:   0.875  0.96   0.996  1.005  1.012  1.016   (rises outward)
    //
    // Both dive at the binding; past that they go opposite ways, because the
    // light is upper-LEFT, so the left page's outer edge is its brightest part
    // and the right page's outer edge is its dimmest. One shared curve cannot
    // be both, and using the front's on the back is a visible 2% step across
    // the whole sheet — which reads as a second piece of paper, not as shading.
    //
    // The back also has to LIFT above the bare material (1.016). An earlier
    // pass only had terms that darken and could never reach it.
    base *= front ? pageLight(vUv.x, uFrontCurve, uSheens.x)
                  : pageLight(vUv.x, uBackCurve, uSheens.y);

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
    // sin() alone is still throwing a visible shadow at 0.9 (0.31 of full) and
    // only reaches nothing exactly at 1.0, so the sheet floats right up to the
    // last frame and the shadow snaps off. Settling it over the last stretch
    // means contact is established BEFORE the landing, which is what selling
    // "it came to rest" actually requires.
    vAirborne = sin(uProgress * PI) * (1.0 - smoothstep(0.86, 1.0, uProgress));

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
