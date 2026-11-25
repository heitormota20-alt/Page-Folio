import { useRef } from 'react'
import { useTopoLines } from '../hooks/useTopoLines'

/**
 * Curvas de nível (line art topográfico) passando ao fundo — referência:
 * landonorris.com. Desenhadas ao vivo num <canvas>: o relevo se transforma
 * devagar e desliza na diagonal (ver useTopoLines).
 */
export function TopoLines() {
  const ref = useRef<HTMLCanvasElement>(null)
  useTopoLines(ref)

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      // a cor das linhas vem de `color` (text-ink); a intensidade (opacidade) é
      // controlada pelo hook — some ao longo da segunda dobra
      className="pointer-events-none absolute inset-0 h-full w-full text-ink"
    />
  )
}
