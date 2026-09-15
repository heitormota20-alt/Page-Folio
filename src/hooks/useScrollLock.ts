import { useEffect } from 'react'
import { lenisRef } from './useLenis'

// Must match SCALE_END in useHeroScrollScale
const LOCK_AT_RATIO = 0.5
const LOCK_DURATION_MS = 1400

export function useScrollLock() {
  useEffect(() => {
    let triggered = false
    let timer: ReturnType<typeof setTimeout>

    const onScroll = () => {
      if (triggered) return
      if (window.scrollY < window.innerHeight * LOCK_AT_RATIO) return

      triggered = true
      lenisRef.current?.stop()
      timer = setTimeout(() => lenisRef.current?.start(), LOCK_DURATION_MS)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [])
}
