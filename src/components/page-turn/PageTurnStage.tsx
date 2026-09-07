import type React from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { SpreadCapture } from './useSpreadCapture'
import { FRAME } from '../notebook/geometry'
import { TurningPage } from './TurningPage'
import './page-turn.css'

/**
 * The WebGL layer, laid exactly over the notebook.
 *
 * The scene is built in NOTEBOOK UNITS — the same 1277x748 space the cover,
 * pages and binding are drawn in — so a page mesh can be positioned from the
 * same geometry module the DOM pages use and land on top of itself.
 *
 * The camera reproduces the notebook's own CSS projection rather than picking
 * a pleasant 3D angle: `perspective: 2600px` on an element means the eye is
 * 2600px from the z = 0 plane, so the camera sits at z = 2600 with the field
 * of view that makes the frame exactly fill the frustum there. The same small
 * rotations the CSS applies are applied to the scene, about the frame's centre
 * rather than the origin — CSS transforms default to the element's middle, and
 * rotating about a corner here would slide the whole layer off the notebook.
 */

const CAMERA_DISTANCE = 2600
const FOV = (2 * Math.atan(FRAME.h / 2 / CAMERA_DISTANCE) * 180) / Math.PI

/** Matches `.notebook`'s transform so the layers agree on where the page is. */
const TILT_X = THREE.MathUtils.degToRad(2.4)
const TILT_Z = THREE.MathUtils.degToRad(0.28)

type Props = {
  progressRef: React.RefObject<number>
  capture: SpreadCapture
  /** True while a sheet is in the air. Drives both the fade and the rAF loop. */
  active: boolean
}

export function PageTurnStage({ progressRef, capture, active }: Props) {
  return (
    <div className={`page-turn ${active ? 'is-active' : ''}`} aria-hidden="true">
      <Canvas
        /*
          Bounded at 2x, not matched to the capture's full density.

          That was tried at the capture's own ratio (up to 3x) on the reasoning
          that one texel under one rendered pixel is what makes the sheet as
          sharp as the texture holds. It is, in a static screenshot — but it
          means rasterising and shading several million extra pixels every
          frame, continuously, for as long as a sheet is in the air, and a
          custom fragment shader (two texture samples, anisotropic filtering,
          per-page lighting) is not free. On a screen the swiftshader renders
          used for testing never reproduce, that cost reads as the page falling
          behind the finger on a real scroll — dropped frames blur a moving
          image far worse than an under-sharp mip level ever did.

          Capped at 2x, the remaining gap between the capture's density and
          what's actually rendered is closed by `uLodBias` in the shader
          instead — a cheap per-fragment mip choice, not a render-target size.
        */
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
        /*
          A TIGHT depth range around the object, not a generous one. With
          near 1 / far 7800 and the camera 2600 away, the depth buffer cannot
          resolve the couple of units between the page and its own edge, and
          the flat edge wins the test in patches — the sheet then renders as
          blank paper with no artwork on it at all.
        */
        camera={{
          fov: FOV,
          near: CAMERA_DISTANCE - 900,
          far: CAMERA_DISTANCE + 400,
          position: [0, 0, CAMERA_DISTANCE],
        }}
        // no sheet in the air means nothing to draw: do not hold a rAF loop
        frameloop={active ? 'always' : 'demand'}
      >
        {/*
          The scene is shifted so the notebook CENTRE sits on the origin. R3F
          aims the default camera at the origin, so building the scene in raw
          notebook coordinates leaves the object off to one side of a
          16-degree frustum and nothing draws at all — which looks exactly like
          a broken shader and is not one. Centring here also makes the tilt
          rotate about the middle of the object, as the CSS transform does.
        */}
        <group rotation={[TILT_X, 0, TILT_Z]}>
          <group position={[-FRAME.w / 2, -FRAME.h / 2, 0]}>
            <TurningPage progressRef={progressRef} capture={capture} />
          </group>
        </group>
      </Canvas>
    </div>
  )
}
