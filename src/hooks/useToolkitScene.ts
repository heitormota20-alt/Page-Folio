import type { RefObject } from 'react'
import { clamp01, floatPieces, riseLines, type SceneHandlers, useScrollScene } from './useScrollScene'

/**
 * Cena "Minhas ferramentas de criação" (referência: "My Creative Toolkit" no
 * vídeo): o título apagado sobe e para no centro; com o painel parado, os
 * cartões das ferramentas sobem amontoados pela parte de baixo, cada um
 * rodopiando (`data-spin`) no seu ângulo, passam por cima do título e saem pelo
 * alto.
 */
function setup(scene: HTMLElement): SceneHandlers {
  const lines = Array.from(scene.querySelectorAll<HTMLElement>('[data-line]'))
  const tiles = floatPieces(scene, { baseDuration: 0.5, sway: 22, wobble: 0 })

  return {
    layout: tiles.layout,
    render({ entry, prog, vh }) {
      riseLines(lines, clamp01(entry / 0.85))
      tiles.render(prog, vh)
    },
  }
}

export function useToolkitScene(sceneRef: RefObject<HTMLElement | null>) {
  useScrollScene(sceneRef, setup)
}
