import { useId, useRef } from 'react'
import { SIGNATURE } from './signature-paths'
import { useSignatureDraw } from '../hooks/useSignatureDraw'
import { SCALE_END } from '../hooks/useHeroScrollScale'

/** Começa a escrever logo que o card começa a encolher… */
const DRAW_START = 0.12
/** …e termina quando ele pousa (mesmo ponto da trava de scroll). */
const DRAW_END = SCALE_END

// Área das máscaras = viewBox (o padrão -10%/120% conta a partir de 0,0 e cortaria a base)
const [VB_X, VB_Y, VB_W, VB_H] = SIGNATURE.viewBox.split(' ').map(Number)

/**
 * Cada traço da assinatura é um contorno preenchido (`shape`) revelado por uma
 * máscara: a caneta (`pen`, a linha central) é desenhada dentro da <mask> com
 * stroke-dashoffset, então o pincel aparece na ordem e direção da escrita.
 */
export function Signature({ className = '' }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  // useId pode trazer caracteres que quebram url(#…)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  useSignatureDraw(ref, { start: DRAW_START, end: DRAW_END })

  return (
    <svg
      ref={ref}
      viewBox={SIGNATURE.viewBox}
      role="img"
      aria-label="Assinatura de Heitor M."
      className={`overflow-visible ${className}`}
    >
      <defs>
        {SIGNATURE.strokes.map((s, i) => (
          <mask
            key={i}
            id={`${uid}-pen-${i}`}
            maskUnits="userSpaceOnUse"
            x={VB_X}
            y={VB_Y}
            width={VB_W}
            height={VB_H}
          >
            <path
              data-pen=""
              d={s.pen}
              fill="none"
              stroke="#fff"
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        ))}
      </defs>
      {SIGNATURE.strokes.map((s, i) => (
        <path
          key={i}
          d={s.shape}
          fill="currentColor"
          fillRule="evenodd"
          mask={`url(#${uid}-pen-${i})`}
        />
      ))}
    </svg>
  )
}
