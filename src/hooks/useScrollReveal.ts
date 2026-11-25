import { type RefObject, useEffect } from 'react'

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/**
 * Revelação presa ao scroll — avança e volta junto com a rolagem (sem gatilho
 * "uma vez só"), para a página parecer um fluxo contínuo:
 *
 *  - [data-reveal-words]: cada [data-word] dentro dele acende em sequência,
 *    do momento em que o bloco entra por baixo até chegar a ~40% da tela;
 *  - [data-reveal]: sobe 40px e aparece ao entrar na tela.
 *
 * Com prefers-reduced-motion, tudo fica visível e parado.
 */
export function useScrollReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-words]')).map(
      (el) => ({ el, words: Array.from(el.querySelectorAll<HTMLElement>('[data-word]')) }),
    )
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    // deslocamento aplicado em cada item — descontado na medição (o rect inclui o transform)
    const shift = new Map<HTMLElement, number>()

    let frame = 0
    const update = () => {
      frame = 0
      const vh = window.innerHeight || 1

      for (const { el, words } of groups) {
        const top = el.getBoundingClientRect().top
        const p = reduce ? 1 : clamp01((vh * 0.95 - top) / (vh * 0.55))
        const n = words.length
        words.forEach((w, i) => {
          w.style.opacity = `${0.14 + 0.86 * clamp01(p * n - i)}`
        })
      }

      for (const el of items) {
        const top = el.getBoundingClientRect().top - (shift.get(el) ?? 0)
        const p = reduce ? 1 : clamp01((vh - top) / (vh * 0.28))
        const e = 1 - (1 - p) ** 3 // ease-out cúbico
        const dy = (1 - e) * 40
        shift.set(el, dy)
        el.style.opacity = `${e}`
        el.style.transform = dy ? `translate3d(0, ${dy}px, 0)` : ''
      }
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
    }
  }, [ref])
}
