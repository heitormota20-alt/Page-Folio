import { useEffect } from 'react'
import Lenis from 'lenis'

/** Smooth scrolling, driven by a single rAF loop. Torn down cleanly for StrictMode. */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])
}
