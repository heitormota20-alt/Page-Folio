import { type RefObject, useLayoutEffect } from 'react'

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Desenha a faixa da home uma vez, quando `ready` vira true.
 *
 * Cada `[data-pen]` é a caneta (linha central) de um traço, dentro de uma
 * <mask>: o stroke-dashoffset vai do comprimento total a 0 e revela o contorno.
 * `data-start` / `data-duration` (segundos) definem o ritmo de cada traço.
 */
export function useBandDraw(svgRef: RefObject<SVGSVGElement | null>, ready: boolean) {
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const pens = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-pen]'))
    const items = pens.map((p) => ({
      el: p,
      len: p.getTotalLength(),
      start: Number(p.dataset.start ?? 0),
      duration: Number(p.dataset.duration ?? 1),
    }))

    const render = (time: number) => {
      for (const { el, len, start, duration } of items) {
        const t = Math.min(Math.max((time - start) / duration, 0), 1)
        el.style.strokeDashoffset = `${len * (1 - easeInOutCubic(t))}`
        el.style.visibility = t > 0 ? 'visible' : 'hidden'
      }
    }

    for (const { el, len } of items) el.style.strokeDasharray = `${len} ${len + 1}`

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const end = Math.max(...items.map((i) => i.start + i.duration))

    if (reduceMotion) {
      render(end)
      return
    }
    render(0)
    if (!ready) return

    let frame = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const time = (now - t0) / 1000
      render(time)
      frame = time < end ? requestAnimationFrame(tick) : 0
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [svgRef, ready])
}
