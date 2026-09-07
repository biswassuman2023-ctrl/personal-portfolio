import type React from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FRAME, GUTTER, LEFT_PAGE, RIGHT_PAGE, type Box } from '../notebook/geometry'
import type { SpreadCapture } from './useSpreadCapture'
import {
  pageFragmentShader,
  pageVertexShader,
  shadowFragmentShader,
  shadowVertexShader,
} from './pageShader'

/**
 * The sheet in the air, drawn in notebook units so it lands exactly where the
 * DOM pages it travels between are sitting.
 *
 * Three surfaces:
 *
 *   shadow   projected onto whatever is underneath, behind the page plane
 *   edge     the same surface pushed back along its own normal, in cut-paper
 *            tone — the sheet's thickness at the silhouette
 *   face     the captured spread on the front, bare warm paper on the back
 *
 * All three run the same deformation from the same progress value, so they
 * cannot drift apart at any point in the turn.
 */

const SEGMENTS_ALONG = 96
const SEGMENTS_ACROSS = 8

/** Total arc the sheet bows through at the peak of the turn, in radians. */
const CURL = 1.02
const TIP_CURL = 34
const DROOP = 22
const PAPER_THICKNESS = 2.6

/** Upper-left, matching the light the rest of the notebook is drawn under. */
const LIGHT = new THREE.Vector3(-0.42, 0.58, 0.7)
const LIGHT_SLIDE = new THREE.Vector2(0.3, -0.2)

/**
 * Radii from the RING AXIS. Both pages' inner edges sit the same distance from
 * it; their outer edges do not (the two pages differ by 12 units), so the free
 * edge lerps between them and progress 1 is the destination footprint exactly.
 */
const INNER = RIGHT_PAGE.x - GUTTER.center
const OUTER_FROM = RIGHT_PAGE.x + RIGHT_PAGE.w - GUTTER.center
const OUTER_TO = GUTTER.center - LEFT_PAGE.x

/**
 * The cut edge is the notebook's own paper, fractionally down. It is a tint on
 * the sampled page, not a colour of its own — a chosen colour here is a second
 * paper, which is exactly what made the sheet change material as it landed.
 */
const EDGE_TINT = 0.955

/**
 * The destination page's lighting, fitted to the notebook's own measured
 * profile — the real page divided by the material the mesh samples, sampled
 * across ring-free rows so the metal does not contaminate the paper.
 *
 * GUTTER is an exponential, not a ramp: the paper is down to 0.875 only a
 * twentieth of the way out of the binding and is back to 0.996 by a third,
 * which no smoothstep holds at both ends. SHEEN is the part an earlier pass
 * could not reach at all — the open field sits about 1.6% ABOVE the bare
 * paper, so a shader with only darkening terms leaves the whole sheet
 * uniformly under the page it lands on.
 */
const BACK_CURVE = new THREE.Vector4(0.57, 0.0626, 1.0, 0)
const BACK_SHEEN = 0.031

/**
 * ...and the page it is leaving, which is lit the other way about. Measured the
 * same way, the right page peaks around a third of the way out and declines to
 * 0.944 at its outer edge, where the left page climbs to 1.016 — the light is
 * upper-left, so each page's far edge does the opposite thing. Reusing one
 * curve for both left the front face flat where the real page has a gradient.
 */
const FRONT_CURVE = new THREE.Vector4(0.67, 0.0742, 1.0047, -0.0787)
const FRONT_SHEEN = 0

/** Shading of a page lying flat, so a resting sheet shades by exactly 1.0. */
const REST_DOT = new THREE.Vector3(0, 0, 1).dot(LIGHT.clone().normalize()) * 0.5 + 0.5
const SHADE_DEPTH = 0.85
const SHADE_FLOOR = 0.84

type Props = {
  /** Read per frame, never through React state: scrolling must not re-render. */
  progressRef: React.RefObject<number>
  capture: SpreadCapture
}

export function TurningPage({ progressRef, capture }: Props) {
  /**
   * Anisotropic filtering, at whatever the GPU will actually give us.
   *
   * This is the single biggest thing standing between a moving sheet and a
   * sharp one. A turning page is foreshortened — heavily so through the middle
   * of the turn — which means it is minified hard along one axis and barely at
   * all along the other. Trilinear filtering has one mip level to choose for
   * both, so it picks for the squashed axis and blurs the sharp one, and the
   * paper goes soft precisely while it is moving. Anisotropy is the mechanism
   * that samples the two axes at different rates; capping it at a hardcoded 8
   * was leaving quality on the table on every GPU that offers 16.
   */
  const gl = useThree((s) => s.gl)

  /**
   * How far to bias the mip fetch: exactly the ratio between the texture's
   * density and the screen's, so a flat sheet reads the full-resolution level
   * instead of a blended half-size one. Clamped, because a bias deeper than
   * the oversampling would alias rather than sharpen.
   */
  const lodBias = useMemo(
    () => THREE.MathUtils.clamp(-Math.log2(capture.pixelRatio / gl.getPixelRatio()), -2, 0),
    [capture.pixelRatio, gl],
  )
  useEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy()
    const textures = [capture.content, capture.blank, capture.nextLeft].filter(
      (t): t is THREE.Texture => t !== null,
    )
    for (const texture of textures) {
      if (texture.anisotropy === max) continue
      texture.anisotropy = max
      texture.needsUpdate = true
    }
  }, [gl, capture])

  const faceRef = useRef<THREE.ShaderMaterial>(null)
  const edgeRef = useRef<THREE.ShaderMaterial>(null)
  const shadowRef = useRef<THREE.ShaderMaterial>(null)

  /* The shader derives x entirely from uv.x and the radii, so the plane only
     has to supply uv and the vertical extent. */
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, RIGHT_PAGE.h, SEGMENTS_ALONG, SEGMENTS_ACROSS)
    return g
  }, [])

  /* Where the source page sits inside the whole-notebook capture: the page's
     own geometry as a fraction of the frame, flipped in Y because canvas
     textures upload bottom-up. */
  const inkRect = useMemo(() => rectOf(RIGHT_PAGE), [])
  /* The material sample for the cut edge — and the back's fallback when there
     is no nextLeft capture. Deliberately the RIGHT page, not the left: the
     serialiser renders the left page's gutter gradient far harder than the
     browser does, and the edge would carry a grey band around with it for the
     whole turn. Sampled in the same direction as the front, so the
     gutter-side shading stays on the gutter side when the sheet lands. */
  const paperRect = useMemo(() => rectOf(RIGHT_PAGE), [])
  /* Where the sheet is actually arriving: the next spread's LEFT page, in the
     nextLeft capture's own atlas (a separate photograph, not a region of
     `content` or `blank` — see useSpreadCapture). This is what the back of
     the face mesh samples once it exists. */
  const nextLeftRect = useMemo(() => rectOf(LEFT_PAGE), [])

  const shape = useMemo(
    () => ({
      uProgress: { value: 0 },
      uInner: { value: INNER },
      uOuterFrom: { value: OUTER_FROM },
      uOuterTo: { value: OUTER_TO },
      uCurl: { value: CURL },
      uTipCurl: { value: TIP_CURL },
      uDroop: { value: DROOP },
    }),
    [],
  )

  const faceUniforms = useMemo(
    () => ({
      ...cloneUniforms(shape),
      uOffset: { value: 0 },
      uInk: { value: capture.content },
      uPaper: { value: capture.blank },
      // Falls back to the material capture (and uShowBackInk 0) when there is
      // no next spread — the shader then behaves exactly as it did before
      // this uniform existed. A sampler must always be bound to SOMETHING or
      // WebGL errors, even when uShowBackInk keeps it from ever being read.
      uInkBack: { value: capture.nextLeft ?? capture.blank },
      uInkRect: { value: inkRect },
      uPaperRect: { value: paperRect },
      uInkBackRect: { value: nextLeftRect },
      uLight: { value: LIGHT },
      uRestDot: { value: REST_DOT },
      uShadeDepth: { value: SHADE_DEPTH },
      uShadeFloor: { value: SHADE_FLOOR },
      uEdgeTint: { value: 1 },
      uShowInk: { value: 1 },
      uShowBackInk: { value: capture.nextLeft ? 1 : 0 },
      uLodBias: { value: lodBias },
      uFrontCurve: { value: FRONT_CURVE },
      uBackCurve: { value: BACK_CURVE },
      uSheens: { value: new THREE.Vector2(FRONT_SHEEN, BACK_SHEEN) },
    }),
    [shape, capture, inkRect, paperRect, nextLeftRect, lodBias],
  )

  const edgeUniforms = useMemo(
    () => ({
      ...cloneUniforms(shape),
      uOffset: { value: -PAPER_THICKNESS },
      uInk: { value: capture.content },
      uPaper: { value: capture.blank },
      // Unused (uShowBackInk is always 0 for the edge — a cut edge is paper,
      // not a printed face, on either side of the turn) but a sampler still
      // needs a bound texture; reusing `blank` costs nothing extra to upload.
      uInkBack: { value: capture.blank },
      uInkRect: { value: inkRect },
      uPaperRect: { value: paperRect },
      uInkBackRect: { value: paperRect },
      uLight: { value: LIGHT },
      uRestDot: { value: REST_DOT },
      uShadeDepth: { value: SHADE_DEPTH },
      uShadeFloor: { value: SHADE_FLOOR },
      uEdgeTint: { value: EDGE_TINT },
      uShowInk: { value: 0 },
      uShowBackInk: { value: 0 },
      uLodBias: { value: lodBias },
      uFrontCurve: { value: FRONT_CURVE },
      uBackCurve: { value: BACK_CURVE },
      uSheens: { value: new THREE.Vector2(FRONT_SHEEN, BACK_SHEEN) },
    }),
    [shape, capture, inkRect, paperRect, lodBias],
  )

  const shadowUniforms = useMemo(
    () => ({
      ...cloneUniforms(shape),
      uLightSlide: { value: LIGHT_SLIDE },
      uPlane: { value: -1.6 },
      uStrength: { value: 0.42 },
      uFalloff: { value: OUTER_TO * 0.7 },
    }),
    [shape],
  )

  useFrame(() => {
    const p = progressRef.current
    if (faceRef.current) faceRef.current.uniforms.uProgress.value = p
    if (edgeRef.current) edgeRef.current.uniforms.uProgress.value = p
    if (shadowRef.current) shadowRef.current.uniforms.uProgress.value = p
  })

  /* The hinge is the ring axis, and the sheet's vertical centre matches the
     pages' (both run y 22..725, so there is nothing to interpolate). */
  const hingeY = FRAME.h - (RIGHT_PAGE.y + RIGHT_PAGE.h / 2)

  return (
    <group position={[GUTTER.center, hingeY, 0]}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={shadowRef}
          vertexShader={shadowVertexShader}
          fragmentShader={shadowFragmentShader}
          uniforms={shadowUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={geometry}>
        <shaderMaterial
          ref={edgeRef}
          vertexShader={pageVertexShader}
          fragmentShader={pageFragmentShader}
          uniforms={edgeUniforms}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={geometry}>
        <shaderMaterial
          ref={faceRef}
          vertexShader={pageVertexShader}
          fragmentShader={pageFragmentShader}
          uniforms={faceUniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/** A page's footprint as a rectangle in the capture's UV space (textures
    upload bottom-up, hence the flip in y). */
function rectOf(page: Box) {
  const w = page.w / FRAME.w
  const h = page.h / FRAME.h
  return new THREE.Vector4(page.x / FRAME.w, 1 - page.y / FRAME.h - h, w, h)
}

/** Uniform objects are mutable and must not be shared between materials. */
function cloneUniforms(source: Record<string, { value: unknown }>) {
  const out: Record<string, { value: unknown }> = {}
  for (const [key, entry] of Object.entries(source)) out[key] = { value: entry.value }
  return out
}
