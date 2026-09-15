import { useRef } from 'react'
import { useVideoScrub } from '../hooks/useVideoScrub'

/**
 * Full-bleed background video that never plays — it is only ever seeked.
 * No autoplay, no controls, no loop.
 *
 * `absolute` mapping: pointer at the far left = first frame (character looking
 * left), far right = last frame.
 */
export function ScrubVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  useVideoScrub(ref, { mapping: 'absolute', sensitivity: 1, restAt: 'center' })

  return (
    <video
      ref={ref}
      src="/Personagem_Definitivo_scrub.mp4"
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 z-0 h-full w-full object-cover [object-position:60%_20%] sm:[object-position:64%_center]"
    />
  )
}
