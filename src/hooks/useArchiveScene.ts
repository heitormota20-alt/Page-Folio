import type { RefObject } from 'react'
import { clamp01, floatPieces, riseLines, type SceneHandlers, useScrollScene } from './useScrollScene'

/**
 * Cena "Arquivos Visuais" (referência: vídeo enviado): o título grande e apagado
 * sobe e para no centro; com o painel parado, as peças ([data-piece]) e pastas
 * sobem flutuando por toda a tela, cada uma no seu tempo (`data-delay`) e na sua
 * profundidade (`data-depth`: perto = maior, mais rápida e na frente do título;
 * longe = menor, mais lenta, desfocada e atrás dele), com um leve balanço.
 */
function setup(scene: HTMLElement): SceneHandlers {
  const lines = Array.from(scene.querySelectorAll<HTMLElement>('[data-line]'))
  const pieces = floatPieces(scene, { baseDuration: 0.55, sway: 16, wobble: 2.5 })

  return {
    layout: pieces.layout,
    render({ entry, prog, vh }) {
      riseLines(lines, clamp01(entry / 0.85))
      pieces.render(prog, vh)
    },
  }
}

export function useArchiveScene(sceneRef: RefObject<HTMLElement | null>) {
  useScrollScene(sceneRef, setup)
}
