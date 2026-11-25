import type { RefObject } from 'react'
import { clamp01, riseLines, type SceneHandlers, useScrollScene } from './useScrollScene'

/**
 * Quanto da cena cada peça leva para atravessar a tela, na profundidade média.
 * Peças "de perto" (data-depth → 1) andam mais rápido; "de longe", mais devagar.
 */
const BASE_DURATION = 0.55
/** Balanço lateral máximo (px) das peças de perto. */
const SWAY = 16

interface Piece {
  el: HTMLElement
  x: number // centro horizontal, em fração da largura do painel
  depth: number
  delay: number
  rot: number
  phase: number
  w: number
  h: number
}

/**
 * Cena "Arquivos Visuais" (referência: vídeo enviado): o título grande e apagado
 * sobe e para no centro; com o painel parado, as peças ([data-piece]) e pastas
 * sobem flutuando por toda a tela, cada uma no seu tempo (`data-delay`) e na sua
 * profundidade (`data-depth`: perto = maior, mais rápida e na frente do título;
 * longe = menor, mais lenta, desfocada e atrás dele), com um leve balanço.
 */
function setup(scene: HTMLElement): SceneHandlers {
  const lines = Array.from(scene.querySelectorAll<HTMLElement>('[data-line]'))
  const pieces: Piece[] = Array.from(scene.querySelectorAll<HTMLElement>('[data-piece]')).map(
    (el, i) => ({
      el,
      x: Number(el.dataset.x) || 0.5,
      depth: Number(el.dataset.depth) || 0.5,
      delay: Number(el.dataset.delay) || 0,
      rot: Number(el.dataset.rot) || 0,
      phase: i * 1.7,
      w: 0,
      h: 0,
    }),
  )
  let panelW = 0

  return {
    layout() {
      panelW = (pieces[0]?.el.offsetParent as HTMLElement | null)?.clientWidth ?? window.innerWidth
      for (const p of pieces) {
        p.w = p.el.offsetWidth
        p.h = p.el.offsetHeight
      }
    },
    render({ entry, prog, vh }) {
      riseLines(lines, clamp01(entry / 0.85))

      for (const p of pieces) {
        const duration = BASE_DURATION / (0.7 + 0.6 * p.depth)
        const t = (prog - p.delay) / duration
        if (t <= 0 || t >= 1) {
          p.el.style.visibility = 'hidden' // fora da tela: nem pinta
          continue
        }
        p.el.style.visibility = 'visible'
        // de logo abaixo da tela até sumir por cima, em velocidade constante (parallax)
        const y = (1 - t) * (vh + 40) - t * (p.h + 40)
        const sway = Math.sin(t * Math.PI * 1.4 + p.phase) * SWAY * p.depth
        const x = p.x * panelW - p.w / 2 + sway
        const rot = p.rot + Math.sin(t * Math.PI + p.phase) * 2.5
        p.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`
      }
    },
  }
}

export function useArchiveScene(sceneRef: RefObject<HTMLElement | null>) {
  useScrollScene(sceneRef, setup)
}
