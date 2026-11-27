import { useEffect } from 'react'

/**
 * Tema da página por seção. Cada seção que muda o tema leva
 *   data-theme="blue" | "light" | "dark"   e   data-theme-at="0.6"
 * (fração da altura da tela). Vale o tema da ÚLTIMA seção marcada cujo topo já
 * subiu acima de `data-theme-at`; antes de todas, o padrão — o azul da segunda
 * dobra ("blue" volta a ele no meio da página). Claro = html.theme-light,
 * escuro = html.theme-dark (ver index.css); a
 * troca é a transição das variáveis --color-page / --color-ink / --color-title.
 */
export function usePageThemes() {
  useEffect(() => {
    const root = document.documentElement
    let frame = 0

    const update = () => {
      frame = 0
      const vh = window.innerHeight || 1
      let theme = 'blue'
      for (const el of document.querySelectorAll<HTMLElement>('[data-theme]')) {
        const at = Number(el.dataset.themeAt ?? 0.5)
        if (el.getBoundingClientRect().top < vh * at) theme = el.dataset.theme ?? theme
      }
      root.classList.toggle('theme-light', theme === 'light')
      root.classList.toggle('theme-dark', theme === 'dark')
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
      root.classList.remove('theme-light', 'theme-dark')
    }
  }, [])
}
