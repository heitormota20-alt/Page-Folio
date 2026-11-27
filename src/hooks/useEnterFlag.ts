import { type RefObject, useEffect } from 'react'

/**
 * Marca o elemento com o atributo `data-<flag>` quando `ratio` dele está na tela, e
 * tira quando ele sai por completo — a entrada (CSS) se repete a cada chegada. Com
 * movimento reduzido, o CSS de cada seção já mostra tudo no lugar, sem animação.
 * Usado em "Sobre mim" e no rodapé.
 */
export function useEnterFlag(ref: RefObject<HTMLElement | null>, flag: string, ratio: number) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= ratio) el.dataset[flag] = ''
        else if (!entry.isIntersecting) delete el.dataset[flag]
      },
      { threshold: [0, ratio] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, flag, ratio])
}
