import { type RefObject, useLayoutEffect } from 'react'

interface Options {
  /** scrollY (em frações do viewport) onde a caneta começa. */
  start: number
  /** scrollY (em frações do viewport) onde a assinatura termina. */
  end: number
  /** Atraso da caneta em relação ao scroll, em segundos (o `scrub` do GSAP). */
  lag?: number
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/**
 * Escreve a assinatura conforme o scroll — e apaga ao voltar.
 *
 * Cada `[data-pen]` do SVG é a caneta de um traço. O progresso (0–1) vira um
 * comprimento total desenhado, distribuído em ordem: um traço só começa quando
 * o anterior acaba, então a caneta percorre a assinatura como na escrita à mão.
 */
export function useSignatureDraw(
  svgRef: RefObject<SVGSVGElement | null>,
  { start, end, lag = 0.15 }: Options,
) {
  // layout effect: esconde os traços antes do primeiro paint (sem flash da assinatura pronta)
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-pen]'))
    const lengths = paths.map((p) => p.getTotalLength())
    const total = lengths.reduce((a, b) => a + b, 0)

    paths.forEach((p, i) => {
      // +1 no vão: evita um pontinho do próximo dash quando o traço está completo
      p.style.strokeDasharray = `${lengths[i]} ${lengths[i] + 1}`
    })

    const render = (progress: number) => {
      let remaining = progress * total
      paths.forEach((p, i) => {
        const len = lengths[i]
        const drawn = Math.min(Math.max(remaining, 0), len)
        remaining -= len
        p.style.strokeDashoffset = `${len - drawn}`
        // traço de comprimento zero com ponta redonda ainda vira um ponto — esconde
        p.style.visibility = drawn > 0 ? 'visible' : 'hidden'
      })
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const targetFromScroll = () => {
      const vh = window.innerHeight
      if (vh === 0) return 0
      return clamp01((window.scrollY / vh - start) / (end - start))
    }

    let target = targetFromScroll()
    let current = target
    let frame = 0
    let last = 0

    // A caneta persegue o scroll com atraso exponencial (independe do FPS)
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      current += (target - current) * (1 - Math.exp(-dt / lag))
      if (Math.abs(target - current) < 0.0005) current = target
      render(current)
      frame = current === target ? 0 : requestAnimationFrame(tick)
    }

    const onScroll = () => {
      target = targetFromScroll()
      if (reduceMotion) {
        current = target
        render(current)
        return
      }
      if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    render(current)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [svgRef, start, end, lag])
}
