import type React from 'react'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
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
 * The binding shadow carried by the sheet's unlit back face, fitted to the
 * notebook's own gutter rather than chosen: sampled across the left page, the
 * paper runs 207 hard against the rings, 231 only twenty units further out,
 * and is not fully back to 247 until a third of the way across. Two bands,
 * because one ramp cannot be both that abrupt and that long.
 */
const GUTTER_DEPTH = new THREE.Vector2(0.66, 0.9)
const GUTTER_WIDTH = new THREE.Vector2(0.075, 0.4)

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
  /* The back of the sheet samples the SAME page region as the front, from the
     ink-free capture — it is the same physical sheet, just its reverse. The
     left page is deliberately not used: the serialiser renders that page's
     gutter gradient far harder than the browser does, and the sheet would
     carry a grey band around with it for the whole turn. Sampled in the same
     direction as the front, so the gutter-side shading stays on the gutter
     side when the sheet lands. */
  const paperRect = useMemo(() => rectOf(RIGHT_PAGE), [])

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
      uInkRect: { value: inkRect },
      uPaperRect: { value: paperRect },
      uLight: { value: LIGHT },
      uRestDot: { value: REST_DOT },
      uShadeDepth: { value: SHADE_DEPTH },
      uShadeFloor: { value: SHADE_FLOOR },
      uEdgeTint: { value: 1 },
      uShowInk: { value: 1 },
      uGutterDepth: { value: GUTTER_DEPTH },
      uGutterWidth: { value: GUTTER_WIDTH },
    }),
    [shape, capture, inkRect, paperRect],
  )

  const edgeUniforms = useMemo(
    () => ({
      ...cloneUniforms(shape),
      uOffset: { value: -PAPER_THICKNESS },
      uInk: { value: capture.content },
      uPaper: { value: capture.blank },
      uInkRect: { value: inkRect },
      uPaperRect: { value: paperRect },
      uLight: { value: LIGHT },
      uRestDot: { value: REST_DOT },
      uShadeDepth: { value: SHADE_DEPTH },
      uShadeFloor: { value: SHADE_FLOOR },
      uEdgeTint: { value: EDGE_TINT },
      uShowInk: { value: 0 },
      uGutterDepth: { value: GUTTER_DEPTH },
      uGutterWidth: { value: GUTTER_WIDTH },
    }),
    [shape, capture, inkRect, paperRect],
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
