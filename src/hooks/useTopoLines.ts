import { type RefObject, useEffect } from 'react'
import { topoEpoch, topoTime } from './topo'
import { createTopoLoop } from './topo-render'

/** Intensidade das linhas (opacidade do canvas) enquanto aparecem por inteiro. */
const BASE_OPACITY = 0.14
/**
 * As linhas seguem da segunda dobra até "Sobre mim" (no azul e no branco, na cor
 * "ink" do tema) e se apagam quando a última seção marcada com [data-topo-end]
 * sai: inteiras com o fim dela abaixo da tela, apagadas quando o fim chega a
 * FADE_OUT_END da altura da tela. Apagadas, o desenho para.
 */
const FADE_OUT_END = 0.5
/** A troca de tema leva 0,8 s (transição de --color-ink no index.css) — a cor é relida nesse tempo. */
const THEME_FADE_MS = 1000

/** Quem desenha: um worker (OffscreenCanvas) ou, sem suporte, a própria página. */
interface Driver {
  size(w: number, h: number, dpr: number): void
  color(c: string): void
  run(on: boolean): void
  destroy(): void
}

function workerDriver(canvas: HTMLCanvasElement, reduce: boolean, onFail: () => void): Driver | null {
  if (!('transferControlToOffscreen' in canvas) || typeof Worker === 'undefined') return null
  let worker: Worker | undefined
  try {
    worker = new Worker(new URL('./topo.worker.ts', import.meta.url), { type: 'module' })
    const off = canvas.transferControlToOffscreen()
    worker.postMessage({ type: 'init', canvas: off, epoch: topoEpoch(), reduce }, [off])
  } catch {
    worker?.terminate()
    return null
  }
  const w = worker
  w.addEventListener('message', (e) => e.data?.type === 'fail' && onFail())
  w.addEventListener('error', onFail)
  return {
    size: (width, height, dpr) => w.postMessage({ type: 'size', w: width, h: height, dpr }),
    color: (value) => w.postMessage({ type: 'color', value }),
    run: (on) => w.postMessage({ type: 'run', on }),
    destroy: () => w.terminate(),
  }
}

function localDriver(canvas: HTMLCanvasElement, reduce: boolean): Driver | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const loop = createTopoLoop(ctx, () => topoTime(), reduce)
  return { size: loop.size, color: loop.color, run: loop.run, destroy: loop.stop }
}

function makeCanvas(host: HTMLElement) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0'
  host.appendChild(canvas)
  return canvas
}

/**
 * Curvas de nível animadas (line art topográfico) no fundo da página inteira —
 * relevo em ./topo (o mesmo do fundo da home), desenho em ./topo-render.
 *
 * O desenho roda num worker (fora da thread principal); aqui só se mede, ao
 * rolar, a intensidade (opacidade do canvas) e se há o que desenhar — no topo
 * (scroll 0) a hero cobre a tela, e depois de "Sobre mim" as linhas já sumiram.
 * A cor vem da `color` do host (text-ink) e é relida só na troca de tema. Sem
 * OffscreenCanvas, o mesmo laço roda na página. Com prefers-reduced-motion, um
 * quadro parado.
 *
 * O canvas é criado aqui (e não no JSX): transferControlToOffscreen só vale uma
 * vez por canvas, e o StrictMode monta o efeito duas vezes.
 */
export function useTopoLines(hostRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let canvas = makeCanvas(host)
    let driver: Driver | null = null
    let running = false
    let color = ''
    let w = 0
    let h = 0
    let dpr = 0

    // 1 → 0 enquanto o fim da seção [data-topo-end] sobe do pé da tela até FADE_OUT_END.
    // Com mais de uma marcada, vale a última (hoje: Sobre mim, depois de Services).
    const fade = () => {
      const vh = window.innerHeight || 1
      const ends = document.querySelectorAll('[data-topo-end]')
      const end = ends[ends.length - 1]
      if (!end) return 1
      const bottom = end.getBoundingClientRect().bottom / vh
      return Math.min(Math.max((bottom - FADE_OUT_END) / (1 - FADE_OUT_END), 0), 1)
    }
    // Seções com [data-topo-dim="0.4"] pedem linhas mais claras: a intensidade vai a
    // esse fator na proporção da tela que a seção ocupa (gradual ao rolar).
    const dim = () => {
      const vh = window.innerHeight || 1
      let k = 1
      for (const el of document.querySelectorAll<HTMLElement>('[data-topo-dim]')) {
        const r = el.getBoundingClientRect()
        const cover = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh
        const v = Number(el.dataset.topoDim)
        if (cover > 0 && v >= 0 && v < 1) k = Math.min(k, 1 - (1 - v) * cover)
      }
      return k
    }

    // ao rolar: intensidade e liga/desliga
    const update = () => {
      const f = fade()
      canvas.style.opacity = `${BASE_OPACITY * f * dim()}`
      const on = window.scrollY > 0 && f > 0
      if (on !== running) {
        running = on
        driver?.run(on)
      }
    }
    const readColor = () => {
      const c = getComputedStyle(canvas).color
      if (c !== color) {
        color = c
        driver?.color(c)
      }
    }
    const resize = () => {
      const cw = host.clientWidth
      const ch = host.clientHeight
      const d = Math.min(window.devicePixelRatio || 1, 2)
      if (cw === w && ch === h && d === dpr) return
      w = cw
      h = ch
      dpr = d
      driver?.size(w, h, dpr)
    }
    // estado inteiro para um desenho novo (montagem ou troca para a página)
    const sync = () => {
      color = ''
      w = h = dpr = 0
      running = false
      readColor()
      resize()
      update()
    }

    const mount = (preferWorker: boolean) => {
      driver = preferWorker ? workerDriver(canvas, reduce, () => fallback()) : null
      if (!driver && preferWorker) {
        // o canvas pode já ter sido transferido: um novo para a página
        canvas.remove()
        canvas = makeCanvas(host)
      }
      driver ??= localDriver(canvas, reduce)
      sync()
    }
    const fallback = () => {
      driver?.destroy()
      canvas.remove()
      canvas = makeCanvas(host)
      mount(false)
    }
    mount(true)

    // troca de tema: a cor das linhas acompanha a transição
    let colorFrame = 0
    let colorUntil = 0
    const colorTick = () => {
      readColor()
      colorFrame = performance.now() < colorUntil ? requestAnimationFrame(colorTick) : 0
    }
    const mo = new MutationObserver(() => {
      colorUntil = performance.now() + THEME_FADE_MS
      if (!colorFrame) colorFrame = requestAnimationFrame(colorTick)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const ro = new ResizeObserver(() => {
      resize()
      update()
    })
    ro.observe(host)
    window.addEventListener('scroll', update, { passive: true })

    return () => {
      window.removeEventListener('scroll', update)
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(colorFrame)
      driver?.destroy()
      canvas.remove()
    }
  }, [hostRef])
}
