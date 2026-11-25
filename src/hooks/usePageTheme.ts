import { useEffect } from 'react'

/**
 * Tema da página por seção. Cada seção que muda o tema leva
 *   data-theme="light" | "dark"   e   data-theme-at="0.6"
 * (fração da altura da tela). Vale o tema da ÚLTIMA seção marcada cujo topo já
 * subiu acima de `data-theme-at`; antes de todas, o escuro (hero e segunda dobra).
 * Claro = html.theme-light (ver index.css); a troca é a transição das variáveis
 * --color-page / --color-ink / --color-title.
 */
export function usePageThemes() {
  useEffect(() => {
    const root = document.documentElement
    let frame = 0

    const update = () => {
      frame = 0
      const vh = window.innerHeight || 1
      let theme = 'dark'
      for (const el of document.querySelectorAll<HTMLElement>('[data-theme]')) {
        const at = Number(el.dataset.themeAt ?? 0.5)
        if (el.getBoundingClientRect().top < vh * at) theme = el.dataset.theme ?? theme
      }
      root.classList.toggle('theme-light', theme === 'light')
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
  }, [])
}
