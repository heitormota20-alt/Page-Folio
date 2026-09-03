import { useEffect, useRef, type RefObject } from 'react'

type RestAt = 'center' | 'start'
type Mapping = 'absolute' | 'relative'

export interface UseVideoScrubOptions {
  /**
   * `absolute` (default): pointer X maps straight onto the clip — far left = first
   * frame, far right = last frame. `sensitivity` is the fraction of the clip the
   * full viewport width covers (1 = the whole clip).
   *
   * `relative`: the spec's delta model — each move advances the playhead by
   * `(delta / innerWidth) * sensitivity * duration`.
   */
  mapping?: Mapping
  sensitivity?: number
  /** Where the playhead sits before the pointer has moved. */
  restAt?: RestAt
}

/** Keep away from the exact end of `seekable`; landing on it flips `ended` (req 1). */
const SEEKABLE_TAIL = 1 / 30
/** Below this, a seek is a no-op — don't take the lock for it. */
const SEEK_EPSILON = 1 / 1000
/** If `seeked` never arrives, drop the lock after this so the effect can't wedge (req 7). */
const WATCHDOG_MS = 400

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Scrub a <video>'s currentTime from horizontal pointer movement.
 *
 * Every numbered comment maps to a known, source-verified browser bug (WebKit or
 * Chromium) that this hook is written to survive.
 */
export function useVideoScrub(
  videoRef: RefObject<HTMLVideoElement | null>,
  { mapping = 'absolute', sensitivity = 0.8, restAt = 'center' }: UseVideoScrubOptions = {},
) {
  // Options live in a ref so changing them never re-subscribes the listeners.
  const optsRef = useRef({ mapping, sensitivity, restAt })
  optsRef.current = { mapping, sensitivity, restAt }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let prevX: number | null = null // null until the first move anchors it (req 5, relative mode)
    let desiredFrac: number | null = null // absolute target in [0,1]
    let desiredTime: number | null = null // relative accumulator, in seconds (req 4 / 5)
    let locked = false // exactly one seek in flight at a time (req 6)
    let watchdog: ReturnType<typeof setTimeout> | undefined

    const clearWatchdog = () => {
      if (watchdog !== undefined) {
        clearTimeout(watchdog)
        watchdog = undefined
      }
    }

    // req 1: read the LIVE `seekable` range every time, never cache it — it grows
    // as the buffer fills. req 3: an empty range means "cannot seek yet".
    const seekableRange = (): { start: number; end: number } | null => {
      const s = video.seekable
      if (!s || s.length === 0) return null
      const start = s.start(0)
      const end = s.end(s.length - 1) - SEEKABLE_TAIL
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
      return { start, end }
    }

    const resolveTarget = (range: { start: number; end: number }): number | null => {
      const { mapping: mode, sensitivity: sens } = optsRef.current
      if (mode === 'absolute') {
        if (desiredFrac === null) return null
        const full = range.end - range.start
        const span = full * sens // sensitivity < 1 => a centered slice of the clip
        const offset = (full - span) / 2
        return range.start + offset + clamp01(desiredFrac) * span
      }
      return desiredTime
    }

    const requestSeek = () => {
      if (locked) return // req 6: never start a seek while one is pending
      if (video.readyState < 1) return // req 2: writing currentTime at readyState 0 silently no-ops
      const range = seekableRange() // req 1 / 3
      if (!range) return
      const wanted = resolveTarget(range)
      if (wanted === null) return
      const next = Math.min(range.end, Math.max(range.start, wanted))
      if (Math.abs(video.currentTime - next) < SEEK_EPSILON) return

      locked = true
      clearWatchdog()
      watchdog = setTimeout(() => {
        // req 7: a dropped `seeked` must not freeze the effect forever
        locked = false
        watchdog = undefined
        requestSeek()
      }, WATCHDOG_MS)

      video.currentTime = next
    }

    // req 6: the ONLY place a follow-up seek is chained from.
    const onSeeked = () => {
      clearWatchdog()
      locked = false
      requestSeek()
    }

    const applyPointer = (clientX: number) => {
      const width = window.innerWidth
      if (!width) return // req 9: innerWidth is 0 inside some iframes -> division blows up

      const { mapping: mode, sensitivity: sens } = optsRef.current

      if (mode === 'absolute') {
        desiredFrac = clamp01(clientX / width)
        requestSeek()
        return
      }

      // relative (spec) model
      if (prevX === null) {
        prevX = clientX // req 5: first move only anchors, produces no jump
        return
      }
      const delta = clientX - prevX
      prevX = clientX
      // req 4: duration is NaN before loadedmetadata; NaN is absorbing under +=,
      // so only commit a finite result to the accumulator.
      const step = (delta / width) * sens * video.duration
      const candidate = (desiredTime ?? 0) + step
      if (!Number.isFinite(candidate)) return
      desiredTime = candidate
      requestSeek()
    }

    const onMouseMove = (e: MouseEvent) => applyPointer(e.clientX)
    const onTouchMove = (e: TouchEvent) => {
      // Without this the mobile video is stuck on frame 0 forever.
      const touch = e.touches[0]
      if (touch) applyPointer(touch.clientX)
    }

    // Re-anchor so a re-entry doesn't teleport the playhead (relative mode).
    const reanchor = () => {
      prevX = null
    }

    const onLoadedMetadata = () => {
      const { restAt: rest } = optsRef.current
      const d = video.duration
      // req 10: rest at the middle, not 0. Also the warm-up seek that makes iOS
      // start filling the buffer.
      if (rest === 'center') {
        desiredFrac = 0.5
        if (Number.isFinite(d)) desiredTime = d / 2
      } else {
        desiredFrac = 0
        desiredTime = 0
      }
      requestSeek()
    }

    // req 3: `seekable` may only become non-empty here.
    const onProgress = () => {
      if (!locked) requestSeek()
    }

    // req 8: these all discard a pending seek WITHOUT emitting `seeked`.
    const onResetPending = () => {
      clearWatchdog()
      locked = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('blur', reanchor)
    window.addEventListener('touchend', reanchor)
    window.addEventListener('touchcancel', reanchor)
    document.addEventListener('mouseleave', reanchor)

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('progress', onProgress)
    video.addEventListener('canplay', onProgress)
    video.addEventListener('loadeddata', onProgress)
    video.addEventListener('emptied', onResetPending)
    video.addEventListener('error', onResetPending)
    video.addEventListener('abort', onResetPending)
    video.addEventListener('loadstart', onResetPending)

    // Metadata can already be present on a StrictMode remount or a warm cache.
    if (video.readyState >= 1) onLoadedMetadata()

    return () => {
      // StrictMode mounts twice in dev — every listener and timer must come off.
      clearWatchdog()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('blur', reanchor)
      window.removeEventListener('touchend', reanchor)
      window.removeEventListener('touchcancel', reanchor)
      document.removeEventListener('mouseleave', reanchor)

      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('canplay', onProgress)
      video.removeEventListener('loadeddata', onProgress)
      video.removeEventListener('emptied', onResetPending)
      video.removeEventListener('error', onResetPending)
      video.removeEventListener('abort', onResetPending)
      video.removeEventListener('loadstart', onResetPending)
    }
  }, [videoRef])
}
