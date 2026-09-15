import { RefObject, useEffect } from 'react'

const TARGET_SCALE = 0.52
const TARGET_RADIUS = 20
const SCALE_END = 0.5

export function useHeroScrollScale(
  ref: RefObject<HTMLDivElement | null>,
  overlayRef?: RefObject<HTMLDivElement | null>,
  textRef?: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      const vh = window.innerHeight
      const scaleRange = vh * SCALE_END

      const raw = Math.min(Math.max(window.scrollY / scaleRange, 0), 1)
      const t = raw * (2 - raw) // ease-out quad

      // Card: escala + border-radius
      el.style.transform = `scale(${1 - t * (1 - TARGET_SCALE)})`
      el.style.borderRadius = `${t * TARGET_RADIUS}px`

      // Overlay de cor: sobe até 0.55 (avatar continua visível)
      if (overlayRef?.current) {
        overlayRef.current.style.opacity = `${t * 0.55}`
      }

      // Texto: começa a sumir em t=0.35, está zerado em t=0.85
      if (textRef?.current) {
        const tText = Math.min(Math.max((t - 0.35) / 0.5, 0), 1)
        textRef.current.style.opacity = `${1 - tText}`
        textRef.current.style.pointerEvents = tText > 0.99 ? 'none' : ''
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [ref, overlayRef, textRef])
}
