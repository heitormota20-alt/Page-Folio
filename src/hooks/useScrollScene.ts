import { type RefObject, useEffect } from 'react'

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/** Inércia: tempo (s) que o movimento leva para alcançar a rolagem. */
const LAG = 0.14

export interface SceneFrame {
  /** 0 com o palco entrando pela borda de baixo · 1 quando o painel sticky para. */
  entry: number
  /** 0 → 1 enquanto o painel está parado na tela. */
  prog: number
  vh: number
}

export interface SceneHandlers {
  /** Medidas que só mudam com o tamanho da tela. */
  layout?: () => void
  render: (frame: SceneFrame) => void
}

/** Sobe as linhas [data-line] por trás das janelas (overflow-hidden), uma após a outra. */
export function riseLines(lines: HTMLElement[], p: number, stagger = 0.22) {
  const span = 1 - stagger * (lines.length - 1)
  lines.forEach((line, i) => {
    const e = easeOutCubic(clamp01((p - i * stagger) / span))
    // 125% da própria altura = totalmente escondida abaixo da janela
    line.style.transform = e < 1 ? `translate3d(0, ${(1 - e) * 125}%, 0)` : ''
  })
}

export interface FloatOptions {
  /** Quanto da cena cada peça leva para atravessar a tela, na profundidade média. */
  baseDuration?: number
  /** Balanço lateral máximo (px) das peças de perto. */
  sway?: number
  /** Oscilação da inclinação (graus) ao longo da subida. */
  wobble?: number
}

/**
 * Peças que sobem flutuando pela tela ([data-piece]), cada uma no seu tempo
 * (`data-delay`, fração da cena) e profundidade (`data-depth` 0–1: perto anda
 * mais rápido), centradas em `data-x` (fração da largura do painel), com
 * inclinação `data-rot` e, opcionalmente, giro `data-spin` (graus ao longo da
 * travessia — as peças "rodopiam"). Velocidade constante: parallax.
 */
export function floatPieces(scene: HTMLElement, opts: FloatOptions = {}) {
  const { baseDuration = 0.55, sway = 16, wobble = 2.5 } = opts
  const pieces = Array.from(scene.querySelectorAll<HTMLElement>('[data-piece]')).map((el, i) => ({
    el,
    x: Number(el.dataset.x) || 0.5,
    depth: Number(el.dataset.depth) || 0.5,
    delay: Number(el.dataset.delay) || 0,
    rot: Number(el.dataset.rot) || 0,
    spin: Number(el.dataset.spin) || 0,
    phase: i * 1.7,
    w: 0,
    h: 0,
  }))
  let panelW = 0

  return {
    layout() {
      panelW = (pieces[0]?.el.offsetParent as HTMLElement | null)?.clientWidth ?? window.innerWidth
      for (const p of pieces) {
        p.w = p.el.offsetWidth
        p.h = p.el.offsetHeight
      }
    },
    render(prog: number, vh: number) {
      for (const p of pieces) {
        const duration = baseDuration / (0.7 + 0.6 * p.depth)
        const t = (prog - p.delay) / duration
        if (t <= 0 || t >= 1) {
          p.el.style.visibility = 'hidden' // fora da tela: nem pinta
          continue
        }
        p.el.style.visibility = 'visible'
        // de logo abaixo da tela até sumir por cima
        const y = (1 - t) * (vh + 40) - t * (p.h + 40)
        const dx = Math.sin(t * Math.PI * 1.4 + p.phase) * sway * p.depth
        const x = p.x * panelW - p.w / 2 + dx
        const rot = p.rot + Math.sin(t * Math.PI + p.phase) * wobble + (t - 0.5) * p.spin
        p.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`
      }
    },
  }
}

/**
 * Base das "cenas fixas": um palco alto (`sceneRef`) com um painel sticky de
 * 100svh dentro. Calcula os dois progressos a partir da rolagem e os suaviza com
 * inércia (LAG); o rAF só roda enquanto o valor desenhado não alcançou o alvo.
 *
 * `setup` recebe o palco e devolve os handlers — deve ser estável (definido fora
 * do componente). Com prefers-reduced-motion não faz nada: cada cena traz um
 * layout estático via classes motion-reduce:.
 */
export function useScrollScene(
  sceneRef: RefObject<HTMLElement | null>,
  setup: (scene: HTMLElement) => SceneHandlers,
) {
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { layout, render } = setup(scene)
    let vh = window.innerHeight || 1

    // alvos (direto da rolagem) e valores suavizados (o que é desenhado)
    let entryTarget = 0
    let progTarget = 0
    let entry = 0
    let prog = 0

    const measure = () => {
      const r = scene.getBoundingClientRect()
      entryTarget = clamp01((vh - r.top) / vh)
      progTarget = clamp01(-r.top / Math.max(1, r.height - vh))
    }
    const draw = () => render({ entry, prog, vh })

    let frame = 0
    let last = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const k = 1 - Math.exp(-dt / LAG)
      entry += (entryTarget - entry) * k
      prog += (progTarget - prog) * k
      if (Math.abs(entryTarget - entry) < 1e-4) entry = entryTarget
      if (Math.abs(progTarget - prog) < 1e-4) prog = progTarget
      draw()
      frame = entry === entryTarget && prog === progTarget ? 0 : requestAnimationFrame(tick)
    }
    const onScroll = () => {
      measure()
      if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }
    const onResize = () => {
      vh = window.innerHeight || 1
      layout?.()
      onScroll()
    }

    layout?.()
    measure()
    entry = entryTarget
    prog = progTarget
    draw()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
    }
  }, [sceneRef, setup])
}
