import { type RefObject, useEffect } from 'react'

const TARGET_SCALE = 0.52
const TARGET_RADIUS = 20
export const SCALE_END = 0.5

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

      // Overlay de cor — sobe até 0.55
      if (overlayRef?.current) {
        overlayRef.current.style.opacity = `${t * 0.55}`
      }

      // Texto: stagger de baixo para cima — cada filho some em sequência
      if (textRef?.current) {
        const children = Array.from(textRef.current.children)
        const total = children.length

        children.forEach((child, i) => {
          // order 0 = elemento de baixo (último filho), some primeiro
          const order = total - 1 - i
          const fadeStart = 0.22 + order * 0.13   // stagger de 0.13 entre elementos
          const fadeEnd   = fadeStart + 0.36

          const progress = Math.min(Math.max((t - fadeStart) / (fadeEnd - fadeStart), 0), 1)
          const ease = progress * (2 - progress)  // ease-out no próprio elemento

          ;(child as HTMLElement).style.opacity   = `${1 - ease}`
          ;(child as HTMLElement).style.transform = `translateY(${-ease * 22}px)`
        })

        // Remove pointer-events quando todos someram
        textRef.current.style.pointerEvents = t >= 0.9 ? 'none' : ''
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [ref, overlayRef, textRef])
}
