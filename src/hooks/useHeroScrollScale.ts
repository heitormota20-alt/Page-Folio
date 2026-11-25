import { type RefObject, useEffect } from 'react'

const TARGET_SCALE = 0.52
const TARGET_RADIUS = 20
export const SCALE_END = 0.5
/** Opacidade final do véu sobre a home (a home fica a 1 − isso). */
const OVERLAY_MAX = 0.72
/** Fração do encolhimento em que o véu chega ao máximo. */
const OVERLAY_RAMP = 0.45

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

      // Card: escala + border-radius. Depois do pouso, sobe junto com a página
      // (como conteúdo normal) — a seção seguinte vem logo abaixo, sem corte.
      const exit = Math.max(0, window.scrollY - scaleRange)
      el.style.transform = `translate3d(0, ${-exit}px, 0) scale(${1 - t * (1 - TARGET_SCALE)})`
      el.style.borderRadius = `${t * TARGET_RADIUS}px`

      // Véu da cor da página sobre a home: ela fica em baixa opacidade e a
      // assinatura (branca) ganha leitura — como o card esmaecido do landonorris.
      // Sobe rápido: já está quase inteiro quando a caneta começa a escrever.
      if (overlayRef?.current) {
        const v = Math.min(raw / OVERLAY_RAMP, 1)
        overlayRef.current.style.opacity = `${OVERLAY_MAX * v * (2 - v)}`
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

/**
 * Para camadas fixas da segunda dobra (o letreiro): depois do pouso do card
 * (SCALE_END), sobem junto com a página, no mesmo ritmo do card.
 */
export function useScrollExit(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const exit = Math.max(0, window.scrollY - window.innerHeight * SCALE_END)
      el.style.transform = exit ? `translate3d(0, ${-exit}px, 0)` : ''
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [ref])
}
