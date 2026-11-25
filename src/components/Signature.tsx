import { type RefObject, useEffect, useId, useRef } from 'react'
import { SIGNATURE } from './signature-paths'
import { useSignatureDraw } from '../hooks/useSignatureDraw'
import { SCALE_END } from '../hooks/useHeroScrollScale'

/** Começa a escrever logo que o card começa a encolher… */
const DRAW_START = 0.12
/** …e termina quando ele pousa (mesmo ponto da trava de scroll). */
const DRAW_END = SCALE_END

// Área das máscaras = viewBox (o padrão -10%/120% conta a partir de 0,0 e cortaria a base)
const [VB_X, VB_Y, VB_W, VB_H] = SIGNATURE.viewBox.split(' ').map(Number)

/** Retângulo de cantos arredondados como path (para o recorte "fora do card"). */
function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  )
}

/**
 * Mantém os dois recortes alinhados ao card da hero (que encolhe e depois sobe):
 * dentro do card a assinatura é branca; o que transborda usa a cor do texto da
 * página (text-ink) — branco puro sobre o fundo claro sumiria.
 */
function useCardClip(
  svgRef: RefObject<SVGSVGElement | null>,
  cardRef: RefObject<HTMLElement | null>,
  insideRef: RefObject<SVGRectElement | null>,
  outsideRef: RefObject<SVGPathElement | null>,
) {
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const svg = svgRef.current
      const card = cardRef.current
      const inside = insideRef.current
      const outside = outsideRef.current
      const ctm = svg?.getScreenCTM()
      if (!svg || !card || !inside || !outside || !ctm) return
      const inv = ctm.inverse()
      const r = card.getBoundingClientRect() // inclui o scale/translate do card
      const a = new DOMPoint(r.left, r.top).matrixTransform(inv)
      const b = new DOMPoint(r.right, r.bottom).matrixTransform(inv)
      // raio visual = border-radius do card × escala atual, convertido p/ unidades do SVG
      const scale = r.width / (card.offsetWidth || 1)
      const radius = (parseFloat(card.style.borderRadius) || 0) * scale * inv.a
      const w = b.x - a.x
      const h = b.y - a.y
      inside.setAttribute('x', `${a.x}`)
      inside.setAttribute('y', `${a.y}`)
      inside.setAttribute('width', `${w}`)
      inside.setAttribute('height', `${h}`)
      inside.setAttribute('rx', `${radius}`)
      // tudo menos o card: retângulo enorme + card, com evenodd
      outside.setAttribute(
        'd',
        `M-1e5 -1e5H1e5V1e5H-1e5Z${roundedRect(a.x, a.y, w, h, radius)}`,
      )
    }
    // em rAF: lê o card depois do handler de scroll que o transforma
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [svgRef, cardRef, insideRef, outsideRef])
}

/**
 * Cada traço da assinatura é um contorno preenchido (`shape`) revelado por uma
 * máscara: a caneta (`pen`, a linha central) é desenhada dentro da <mask> com
 * stroke-dashoffset, então o pincel aparece na ordem e direção da escrita.
 *
 * Os traços são desenhados duas vezes, com as mesmas máscaras: em branco
 * recortado ao card e em `text-ink` recortado ao resto — a assinatura pode ser
 * bem maior que o card e transbordar dele.
 */
export function Signature({
  cardRef,
  className = '',
}: {
  cardRef: RefObject<HTMLElement | null>
  className?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const insideRef = useRef<SVGRectElement>(null)
  const outsideRef = useRef<SVGPathElement>(null)
  // useId pode trazer caracteres que quebram url(#…)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  useSignatureDraw(ref, { start: DRAW_START, end: DRAW_END })
  useCardClip(ref, cardRef, insideRef, outsideRef)

  const strokes = SIGNATURE.strokes.map((s, i) => (
    <path key={i} d={s.shape} fillRule="evenodd" mask={`url(#${uid}-pen-${i})`} />
  ))

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
        <clipPath id={`${uid}-inside`} clipPathUnits="userSpaceOnUse">
          <rect ref={insideRef} />
        </clipPath>
        <clipPath id={`${uid}-outside`} clipPathUnits="userSpaceOnUse">
          <path ref={outsideRef} clipRule="evenodd" />
        </clipPath>
        {/* sombra só na parte branca (sobre o vídeo) — no fundo claro viraria borrão */}
        <filter id={`${uid}-shadow`} x="-10%" y="-20%" width="120%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="14" floodColor="#041018" floodOpacity="0.55" />
        </filter>
      </defs>

      <g clipPath={`url(#${uid}-inside)`} fill="#fff" filter={`url(#${uid}-shadow)`}>
        {strokes}
      </g>
      <g clipPath={`url(#${uid}-outside)`} className="text-ink" fill="currentColor">
        {strokes}
      </g>
    </svg>
  )
}
