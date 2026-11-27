import { useRef } from 'react'
import { useTopoLines } from '../hooks/useTopoLines'

/**
 * Curvas de nível (line art topográfico) passando ao fundo — referência:
 * landonorris.com. Desenhadas ao vivo num <canvas> criado pelo hook (num worker,
 * fora da thread principal): o relevo se transforma devagar e desliza na
 * diagonal (ver useTopoLines).
 */
export function TopoLines() {
  const ref = useRef<HTMLDivElement>(null)
  useTopoLines(ref)

  // a cor das linhas vem de `color` (text-ink); a intensidade (opacidade do
  // canvas) é controlada pelo hook — some no fim de "Sobre mim"
  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 text-ink" />
}
