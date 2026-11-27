import type { CSSProperties, ReactNode } from 'react'

/*
  Elementos de design que saem de trás do personagem em "Sobre mim" (ref.: o
  Heitor desenhando cercado de ferramentas). Ficam numa camada ATRÁS da imagem:
  começam pequenos, escondidos atrás do rosto (ORIGIN), e quando a seção entra na
  tela ([data-in] no <section>) voam até o seu lugar em volta da cabeça, um após o
  outro, com um leve quique; depois flutuam. Saindo da tela, voltam para trás dele.
  A animação é CSS (.about-pop, em index.css).

  Medidas em fração da caixa da imagem (919 × 939): x da largura, y da altura, w
  (largura do elemento) da largura. As posições evitam o título e o texto da coluna
  da direita em qualquer tela: nada passa de ~1,02 da largura, e nada sobe mais que
  ~0,09 da altura acima da imagem (no 16:9 a imagem começa a 10% do topo da seção).
*/

const INK = '#3b404c'
const BLUE = '#2f6bff'
/** De onde todos saem: o rosto (centro da cabeça). */
const ORIGIN = { x: 0.78, y: 0.35 }
/** altura ÷ largura da caixa da imagem */
const RATIO = 939 / 919

function TextTool() {
  const corners = [
    [12, 12],
    [88, 12],
    [12, 88],
    [88, 88],
  ]
  return (
    <svg viewBox="0 0 100 100" className="block h-auto w-full">
      <rect x="12" y="12" width="76" height="76" fill="none" stroke={INK} strokeWidth="4" />
      {corners.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 7} y={y - 7} width="14" height="14" rx="2" fill="#fff" stroke={INK} strokeWidth="3.5" />
      ))}
      <path d="M28 28H72V44H66L64 37H55V70L61 71V76H39V71L45 70V37H36L34 44H28Z" fill={INK} />
    </svg>
  )
}

/** Barra de ferramentas vertical (tipo a do Photoshop), com ícones simplificados. */
function Toolbar() {
  const c = '#cfd4de'
  return (
    <svg viewBox="0 0 44 240" className="block h-auto w-full">
      <rect x="1" y="1" width="42" height="238" rx="9" fill="#2a2e37" />
      <circle cx="15" cy="11" r="2" fill="#4a505d" />
      <circle cx="22" cy="11" r="2" fill="#4a505d" />
      <circle cx="29" cy="11" r="2" fill="#4a505d" />
      <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 28l10 5-4.5 1.3L20.5 39z" fill={c} />
        <rect x="15" y="49" width="14" height="12" strokeDasharray="2.5 2.5" />
        <ellipse cx="22" cy="80" rx="7.5" ry="5" />
        <path d="M17 97v12h12M15 101h12v12" />
        <path d="M28 120l-7 8" strokeWidth="2.5" />
        <path d="M21 128c-2 0-4 2-4.5 4.5 2.5 0 4.5-1.5 4.5-4.5z" fill={c} />
        <path d="M16 152l7-7 6 6-7 7h-6z" />
        <path d="M16 168h12M22 168v12" strokeWidth="2.5" />
        <path d="M22 190l5 9-2 5h-6l-2-5z" fill={c} />
        <circle cx="21" cy="219" r="5" />
        <path d="M25 223l4 4" strokeWidth="2.5" />
      </g>
    </svg>
  )
}

/** Caneta de bézier: a curva com as âncoras e as alças azuis, e a pena embaixo. */
function PenTool() {
  return (
    <svg viewBox="0 0 120 120" className="block h-auto w-full">
      <path d="M14 62C22 40 40 36 60 36C80 36 98 40 106 62" fill="none" stroke={BLUE} strokeWidth="3" />
      <path d="M30 31L90 41" stroke="#8aa6ff" strokeWidth="2" />
      <circle cx="30" cy="31" r="5" fill="#fff" stroke={BLUE} strokeWidth="2.5" />
      <circle cx="90" cy="41" r="5" fill="#fff" stroke={BLUE} strokeWidth="2.5" />
      <circle cx="14" cy="62" r="5.5" fill="#8aa6ff" />
      <circle cx="106" cy="62" r="5.5" fill="#8aa6ff" />
      <rect x="55" y="31" width="10" height="10" fill={BLUE} />
      <path d="M60 46L74 74L68 100H52L46 74Z" fill="#2f333d" />
      <path d="M60 50V68" stroke="#fff" strokeWidth="2" />
      <circle cx="60" cy="70" r="3" fill="#fff" />
      <rect x="50" y="100" width="20" height="12" rx="2" fill="#2f333d" />
    </svg>
  )
}

function Brush() {
  return (
    <svg viewBox="0 0 60 60" className="block h-auto w-full">
      <path d="M50 8L30 30" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <path d="M31 27l4 4-4 4-4-4z" fill="#9aa1ae" />
      <path d="M25 35C16 36 11 44 7 54C17 52 25 46 27 38Z" fill={INK} />
    </svg>
  )
}

function Cursor() {
  return (
    <svg viewBox="0 0 24 24" className="block h-auto w-full">
      <path d="M3 2L21 11L12.5 13L9 21Z" fill={INK} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function Icon3D({ src }: { src: string }) {
  return <img src={src} alt="" width={640} height={640} loading="lazy" decoding="async" draggable={false} className="block h-auto w-full select-none" />
}

/** x, y: centro final · w: largura · r: inclinação final (graus) · d: atraso da entrada (s) */
const POPS: { key: string; x: number; y: number; w: number; r: number; d: number; el: ReactNode; flat?: boolean }[] = [
  { key: 'toolbar', x: 0.765, y: 0.08, w: 0.07, r: 20, d: 0.05, el: <Toolbar />, flat: true },
  { key: 'ps', x: 0.29, y: 0.05, w: 0.19, r: -12, d: 0, el: <Icon3D src="/ferramentas/photoshop.webp" /> },
  { key: 'ai', x: 0.93, y: 0, w: 0.17, r: 10, d: 0.12, el: <Icon3D src="/ferramentas/illustrator.webp" /> },
  { key: 'text', x: 0.62, y: -0.02, w: 0.12, r: -6, d: 0.22, el: <TextTool />, flat: true },
  { key: 'pen', x: 0.45, y: -0.03, w: 0.11, r: -8, d: 0.3, el: <PenTool />, flat: true },
  { key: 'brush', x: 0.52, y: 0.08, w: 0.06, r: 20, d: 0.36, el: <Brush />, flat: true },
  { key: 'cursor-a', x: 0.47, y: 0.17, w: 0.04, r: -10, d: 0.4, el: <Cursor />, flat: true },
  { key: 'cursor-b', x: 0.1, y: -0.03, w: 0.04, r: 15, d: 0.46, el: <Cursor />, flat: true },
  { key: 'cursor-c', x: 0.995, y: 0.22, w: 0.035, r: -20, d: 0.5, el: <Cursor />, flat: true },
]

/**
 * A camada dos elementos. Vai dentro da caixa da imagem (que é um container — as
 * distâncias até o rosto usam cqw) e atrás dela (z-index menor que o da imagem).
 */
export function AboutPops() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {POPS.map((p, i) => {
        const style = {
          left: `${p.x * 100}%`,
          top: `${p.y * 100}%`,
          width: `${p.w * 100}cqw`,
          // de onde sai: o rosto, em cqw (1cqw = 1% da largura da caixa)
          '--fx': `${((ORIGIN.x - p.x) * 100).toFixed(2)}cqw`,
          '--fy': `${((ORIGIN.y - p.y) * RATIO * 100).toFixed(2)}cqw`,
          '--r': `${p.r}deg`,
          '--d': `${p.d}s`,
          // flutuação: cada um no seu tempo
          '--fd': `${-(i * 0.7).toFixed(1)}s`,
        } as CSSProperties
        return (
          <div key={p.key} className={`about-pop${p.flat ? ' about-pop-flat' : ''}`} style={style}>
            <div className="about-pop-float">{p.el}</div>
          </div>
        )
      })}
    </div>
  )
}
