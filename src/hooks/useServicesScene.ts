import type { RefObject } from 'react'
import {
  clamp01,
  easeInOutSine,
  easeOutBack,
  easeOutCubic,
  riseLines,
  type SceneHandlers,
  useScrollScene,
} from './useScrollScene'

// Linha do tempo da cena fixa (progresso 0–1 enquanto ela está parada na tela)
const CARDS_START = 0.1 // título sozinho no centro até aqui
const CARD_DURATION = 0.42 // tempo de voo de cada card
// cada card ainda tem `data-delay` (0–0,18) → o último assenta em ~0,7; o resto é pausa
const TITLE_FADE: [number, number] = [0.18, 0.44]

/** Os cards partem de quanto abaixo do lugar (fração da altura da tela). */
const START_DROP = 0.8
/** Começam agrupados: fração da distância até o centro que é "puxada" para dentro. */
const START_GATHER = 0.55
/** Inclinação inicial = inclinação final × isto. */
const START_TILT = 4

/**
 * Cena da seção "No que eu posso te ajudar" (referência: vídeo enviado).
 *  - entrada: as linhas do título ([data-line]) sobem por trás das janelas;
 *  - cena parada: cada [data-card] voa de baixo em arco (x e y com curvas
 *    diferentes), girando de START_TILT× a inclinação até `data-rot`, passa um
 *    pouco do ponto e assenta em `data-y`; o título ([data-title]) sobe de leve e
 *    se apaga por baixo deles. Depois, pausa com tudo assentado.
 */
function setup(scene: HTMLElement): SceneHandlers {
  const lines = Array.from(scene.querySelectorAll<HTMLElement>('[data-line]'))
  const title = scene.querySelector<HTMLElement>('[data-title]')
  const group = scene.querySelector<HTMLElement>('[data-cards]')
  const cards = Array.from(scene.querySelectorAll<HTMLElement>('[data-card]')).map((el) => ({
    el,
    rot: Number(el.dataset.rot) || 0,
    y: Number(el.dataset.y) || 0,
    delay: Number(el.dataset.delay) || 0,
    cx: 0, // centro do card em relação ao centro do grupo (px)
  }))

  return {
    layout() {
      const half = (group?.clientWidth ?? 0) / 2
      for (const c of cards) c.cx = c.el.offsetLeft + c.el.offsetWidth / 2 - half
    },
    render({ entry, prog, vh }) {
      riseLines(lines, clamp01(entry / 0.85))

      if (title) {
        const f = easeInOutSine(clamp01((prog - TITLE_FADE[0]) / (TITLE_FADE[1] - TITLE_FADE[0])))
        title.style.opacity = `${1 - f}`
        title.style.transform = f ? `translate3d(0, ${-f * vh * 0.06}px, 0) scale(${1 - f * 0.05})` : ''
      }

      for (const c of cards) {
        const t = clamp01((prog - CARDS_START - c.delay) / CARD_DURATION)
        const ty = easeOutBack(t) // passa do ponto e volta
        const tx = easeInOutSine(t) // abre para os lados em outro ritmo → arco
        const tr = easeOutCubic(t)
        const x = -c.cx * START_GATHER * (1 - tx)
        const y = c.y + (1 - ty) * vh * START_DROP
        const rot = c.rot * (START_TILT - (START_TILT - 1) * tr)
        const scale = 0.88 + 0.12 * tr
        c.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`
      }
    },
  }
}

export function useServicesScene(sceneRef: RefObject<HTMLElement | null>) {
  useScrollScene(sceneRef, setup)
}
