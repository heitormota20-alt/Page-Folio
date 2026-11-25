import { type RefObject, useEffect } from 'react'

/**
 * Liga o tema claro da página (html.theme-light, ver index.css) quando o topo
 * do elemento sobe acima de `at` (fração da altura da tela); desliga ao voltar.
 * A troca em si é a transição das variáveis --color-page / --color-ink.
 */
export function usePageTheme(ref: RefObject<HTMLElement | null>, { at = 0.4 } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement

    let frame = 0
    const update = () => {
      frame = 0
      const top = el.getBoundingClientRect().top
      root.classList.toggle('theme-light', top < window.innerHeight * at)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      root.classList.remove('theme-light')
    }
  }, [ref, at])
}
