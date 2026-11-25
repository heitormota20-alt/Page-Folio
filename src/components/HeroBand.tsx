import { type SVGProps, useId, useRef } from 'react'
import { BAND } from './hero-band-paths'
import { BAND_BLUE, CHARACTER_BOX } from './hero-layout'
import { useBandDraw } from '../hooks/useBandDraw'

const [CX, CY, CW, CH] = CHARACTER_BOX
type Key = keyof typeof BAND

/** Segundos depois da entrada: A (atrás) começa, B (na frente) vem logo depois. */
const TIMING: Record<Key, { start: number; duration: number }> = {
  A: { start: 0.45, duration: 1.5 },
  B: { start: 0.8, duration: 1.4 },
}

// área das máscaras maior que o quadro: as pontas da faixa saem dele
const MASK_AREA = { maskUnits: 'userSpaceOnUse', x: -400, y: -400, width: 2720, height: 1880 } as const

/**
 * Um laço da faixa: o path da linha central com a espessura da faixa. Todas as
 * cópias (cor, máscaras, sombra) levam `data-pen` e são desenhadas juntas pelo
 * stroke-dashoffset em `useBandDraw`.
 */
function Stroke({ k, stroke, ...rest }: { k: Key; stroke: string } & SVGProps<SVGPathElement>) {
  return (
    <path
      data-pen=""
      data-start={TIMING[k].start}
      data-duration={TIMING[k].duration}
      d={BAND[k].d}
      fill="none"
      stroke={stroke}
      strokeWidth={BAND[k].width}
      strokeLinejoin="round"
      style={{ visibility: 'hidden' }}
      {...rest}
    />
  )
}

/**
 * Faixa azul que contorna o personagem — inteira em código: dois paths com
 * espessura (A atrás, B na frente), desenhados ao abrir a página. Por cima: a
 * sombra de B sobre A no cruzamento e a sombra suave do personagem na faixa
 * (filtro sobre a própria imagem do personagem).
 */
export function HeroBand({ ready, className = '' }: { ready: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  useBandDraw(ref, ready)

  return (
    <svg
      ref={ref}
      viewBox="0 0 1920 1080"
      aria-hidden="true"
      className={`hero-band absolute inset-0 h-full w-full overflow-visible ${className}`}
    >
      <defs>
        <mask id={`${uid}-on-a`} {...MASK_AREA}>
          <Stroke k="A" stroke="#fff" />
        </mask>
        <mask id={`${uid}-on-band`} {...MASK_AREA}>
          <Stroke k="A" stroke="#fff" />
          <Stroke k="B" stroke="#fff" />
        </mask>
        <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* silhueta do personagem desfocada = sombra */}
        <filter id={`${uid}-char-shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="14" />
        </filter>
      </defs>

      <Stroke k="A" stroke={BAND_BLUE} />
      {/* B projeta uma sombra curta sobre A (só sobre A, não no fundo branco) */}
      <g mask={`url(#${uid}-on-a)`}>
        <Stroke k="B" stroke="#00103a" opacity={0.35} filter={`url(#${uid}-soft)`} />
      </g>
      <Stroke k="B" stroke={BAND_BLUE} />
      <g mask={`url(#${uid}-on-band)`}>
        <image
          href="/home/personagem.webp"
          x={CX}
          y={CY}
          width={CW}
          height={CH}
          opacity="0.45"
          filter={`url(#${uid}-char-shadow)`}
        />
      </g>
    </svg>
  )
}
