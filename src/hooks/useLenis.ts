import { useEffect } from 'react'
import Lenis from 'lenis'

export const lenisRef: { current: Lenis | null } = { current: null }

/** Depois do último movimento, o laço ainda roda este tempo (ms) antes de dormir. */
const GRACE_MS = 250

/**
 * Rolagem suave (Lenis). O laço de quadros só roda enquanto há rolagem suave
 * (roda do mouse, teclado, scrollTo): parado, ele dorme. Um rAF que nunca para
 * obriga o navegador a refazer a página a cada quadro — e aí até as animações
 * CSS que rodariam sozinhas na GPU (ícones girando, peças flutuando) passam a
 * custar processador o tempo todo.
 */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    })

    lenisRef.current = lenis

    let frame = 0
    let until = 0
    const tick = (time: number) => {
      lenis.raf(time)
      frame = lenis.isScrolling === 'smooth' || time < until ? requestAnimationFrame(tick) : 0
    }
    const wake = () => {
      until = performance.now() + GRACE_MS
      if (frame) return
      lenis.time = 0 // o primeiro passo depois de dormir não conta o tempo parado (sem salto)
      frame = requestAnimationFrame(tick)
    }

    // entrada do usuário (roda/toque) e rolagens pedidas por código acordam o laço
    const offVirtual = lenis.on('virtual-scroll', wake)
    const scrollTo = lenis.scrollTo.bind(lenis)
    lenis.scrollTo = (...args: Parameters<Lenis['scrollTo']>) => {
      scrollTo(...args)
      wake()
    }
    window.addEventListener('keydown', wake)
    wake()

    return () => {
      cancelAnimationFrame(frame)
      offVirtual()
      window.removeEventListener('keydown', wake)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])
}
