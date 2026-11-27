import { useEffect } from 'react'

/**
 * Animações CSS infinitas (ícones girando, peças flutuando, letreiro, pulso do
 * jogo…) param quando o bloco marcado com [data-pause-offscreen] sai da tela: o
 * hook liga [data-offscreen] e o index.css pausa as animações dentro dele
 * (animation-play-state). Voltam um pouco antes de o bloco entrar.
 */
export function usePauseOffscreen() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute('data-offscreen', !e.isIntersecting)
      },
      { rootMargin: '15% 0px' },
    )
    document.querySelectorAll('[data-pause-offscreen]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}
