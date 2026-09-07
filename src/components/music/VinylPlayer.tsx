import { useEffect, useRef, useState } from 'react'
import './vinyl.css'

/**
 * A small record on a deck, top-right of the chrome.
 *
 * Drawn rather than iconified: concentric grooves at graduated opacity, a
 * paper centre label, one soft sheen crossing the disc, and a tonearm that
 * swings in from its rest post. Clicking the record plays and pauses.
 *
 * Audio never autoplays — browsers forbid it and it would be rude regardless.
 * The track is swapped by changing TRACK_SRC. If the file is absent the visual
 * still toggles, so the object stays alive before there is anything to play.
 */

const TRACK_SRC = '/audio/track.mp3'

export function VinylPlayer() {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      // Missing or undecodable file must not break the control.
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [playing])

  return (
    <div className={`vinyl ${playing ? 'is-playing' : ''}`}>
      <audio ref={audioRef} src={TRACK_SRC} loop preload="none" />

      <button
        type="button"
        className="vinyl__button"
        onClick={() => setPlaying((p) => !p)}
        aria-pressed={playing}
        aria-label={playing ? 'Pause music' : 'Play music'}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id="vinyl-sheen" cx="0.34" cy="0.28" r="0.85">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="vinyl__disc">
            <circle cx="50" cy="50" r="46" className="vinyl__body" />
            {/* grooves: closer together toward the rim, as a record's are */}
            {[42, 39.5, 37.4, 35.6, 34, 31.5, 29, 26.8, 24.8].map((r, i) => (
              <circle key={r} cx="50" cy="50" r={r} className="vinyl__groove" opacity={0.5 - i * 0.03} />
            ))}
            <circle cx="50" cy="50" r="17" className="vinyl__label" />
            <circle cx="50" cy="50" r="17" className="vinyl__label-edge" />
            <circle cx="50" cy="50" r="2.4" className="vinyl__spindle" />
            {/* one mark on the label, so rotation is legible */}
            <path d="M 50 36 A 14 14 0 0 1 61 41" className="vinyl__label-mark" />
          </g>

          <circle cx="50" cy="50" r="46" fill="url(#vinyl-sheen)" className="vinyl__sheen" />
        </svg>
      </button>

      <Tonearm />
    </div>
  )
}

/**
 * The arm. Pivots about its post at the top-right and drops onto the lead-in
 * groove when playing; the transform origin IS the post, so it swings rather
 * than slides.
 */
function Tonearm() {
  return (
    <svg className="vinyl__arm" viewBox="0 0 60 100" aria-hidden="true">
      <g className="vinyl__arm-swing">
        <path d="M 47 16 L 30 62" className="vinyl__arm-tube" />
        <path d="M 30 62 L 27 70" className="vinyl__arm-head" />
        <circle cx="26.4" cy="71.5" r="1.5" className="vinyl__arm-stylus" />
      </g>
      <circle cx="47" cy="14" r="5.4" className="vinyl__arm-post" />
      <circle cx="47" cy="14" r="2.2" className="vinyl__arm-post-cap" />
    </svg>
  )
}
