import { type CSSProperties, useId, useRef } from 'react'
import { useArchiveScene } from '../hooks/useArchiveScene'

const TITLE_LINES = ['Arquivos', 'Visuais']

/*
  Peças da seção. PROVISÓRIAS: enquanto não houver as artes reais, cada peça é um
  "pôster" abstrato nas cores `from`/`to`/`accent`. Para usar uma arte real, passe
  `src` (ex.: '/arquivos/peca-01.jpg', com o arquivo em public/arquivos/).

  x: centro horizontal (fração da largura) · depth: 0 longe … 1 perto ·
  delay: quando entra (fração da cena) · size: × unidade base · ratio: largura/altura
*/
type Piece = {
  x: number
  depth: number
  delay: number
  size: number
  rot: number
} & (
  | { kind: 'art'; ratio: number; from: string; to: string; accent: string; src?: string; alt?: string }
  | { kind: 'folder' }
)

const PIECES: Piece[] = [
  { kind: 'art', x: 0.16, depth: 0.9, delay: 0.0, size: 1.15, rot: -4, ratio: 0.8, from: '#14532d', to: '#22c55e', accent: '#fef08a' },
  { kind: 'art', x: 0.8, depth: 0.4, delay: 0.03, size: 0.75, rot: 3, ratio: 1, from: '#c2410c', to: '#fdba74', accent: '#7c2d12' },
  { kind: 'folder', x: 0.92, depth: 0.8, delay: 0.06, size: 0.5, rot: 8 },
  { kind: 'art', x: 0.36, depth: 0.65, delay: 0.1, size: 0.95, rot: -2, ratio: 0.8, from: '#991b1b', to: '#ef4444', accent: '#fde68a' },
  { kind: 'art', x: 0.66, depth: 0.95, delay: 0.15, size: 1.2, rot: 4, ratio: 0.8, from: '#4c1d95', to: '#a78bfa', accent: '#f5d0fe' },
  { kind: 'folder', x: 0.07, depth: 0.5, delay: 0.18, size: 0.42, rot: -10 },
  { kind: 'art', x: 0.9, depth: 0.3, delay: 0.21, size: 0.7, rot: -3, ratio: 0.5625, from: '#a16207', to: '#fde047', accent: '#422006' },
  { kind: 'art', x: 0.22, depth: 0.6, delay: 0.27, size: 0.9, rot: 2, ratio: 1, from: '#134e4a', to: '#2dd4bf', accent: '#ecfeff' },
  { kind: 'folder', x: 0.48, depth: 0.3, delay: 0.3, size: 0.36, rot: 6 },
  { kind: 'art', x: 0.55, depth: 0.85, delay: 0.33, size: 1.05, rot: -5, ratio: 0.8, from: '#1e3a8a', to: '#60a5fa', accent: '#e0f2fe' },
  { kind: 'art', x: 0.08, depth: 0.35, delay: 0.4, size: 0.7, rot: 4, ratio: 0.8, from: '#9d174d', to: '#f472b6', accent: '#fff1f2' },
  { kind: 'folder', x: 0.74, depth: 0.9, delay: 0.43, size: 0.55, rot: -7 },
  { kind: 'art', x: 0.82, depth: 0.75, delay: 0.47, size: 1.0, rot: -2, ratio: 0.8, from: '#78350f', to: '#d97706', accent: '#fffbeb' },
  { kind: 'art', x: 0.4, depth: 0.5, delay: 0.55, size: 0.8, rot: 3, ratio: 0.5625, from: '#0b1a24', to: '#1e3a4a', accent: '#d9f99d' },
  { kind: 'folder', x: 0.24, depth: 0.6, delay: 0.58, size: 0.46, rot: 9 },
]

/** Número de cada peça de arte (as pastas não contam): "Peça 01", "Peça 02"… */
const ART_NUMBER = PIECES.reduce<number[]>((acc, p, i) => {
  acc[i] = p.kind === 'art' ? acc.filter(Boolean).length + 1 : 0
  return acc
}, [])

/** Pôster abstrato provisório (no lugar da arte real). */
function PlaceholderArt({ from, to, accent, n }: { from: string; to: string; accent: string; n: number }) {
  return (
    <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}>
      <div
        className="absolute top-[12%] -right-[18%] aspect-square w-[78%] rounded-full opacity-90"
        style={{ background: accent }}
      />
      <span className="absolute top-[6%] left-[8%] text-[9px] font-semibold tracking-[0.16em] text-white/80 uppercase">
        Peça {String(n).padStart(2, '0')}
      </span>
      <div className="absolute right-[10%] bottom-[9%] left-[8%] space-y-[6%]">
        <div className="h-[0.9em] w-[70%] rounded-sm" style={{ background: accent }} />
        <div className="h-[0.9em] w-[45%] rounded-sm bg-white/70" />
      </div>
    </div>
  )
}

/** Pasta azul flutuante (decorativa). */
function FolderIcon() {
  const id = `f${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true" className="block w-full drop-shadow-[0_10px_18px_rgba(37,99,235,0.35)]">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path d="M8 14a8 8 0 0 1 8-8h28l10 10h50a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8Z" fill={`url(#${id}-b)`} />
      <path d="M4 34a8 8 0 0 1 8-8h96a8 8 0 0 1 8 8l-4 48a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8Z" fill={`url(#${id}-f)`} />
      <path d="M14 34h92" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Seção "Arquivos Visuais" — cena fixa (ver useArchiveScene): título grande e
 * apagado no centro; peças e pastas sobem flutuando em profundidades diferentes.
 */
export function Archive() {
  const sceneRef = useRef<HTMLDivElement>(null)
  useArchiveScene(sceneRef)

  return (
    // -mt-[45vh]: começa por baixo do fim da cena anterior — o título entra
    // enquanto os cards dos serviços saem, sem vão vazio entre as duas cenas
    <section id="arquivos" className="-mt-[45vh] motion-reduce:mt-0">
      {/* Palco alto: 100vh de entrada + 220vh com o painel parado na tela */}
      <div ref={sceneRef} className="relative h-[320vh] motion-reduce:h-auto">
        <div className="pointer-events-none sticky top-0 grid h-[100svh] place-items-center overflow-hidden px-6 sm:px-10 motion-reduce:static motion-reduce:h-auto motion-reduce:gap-12 motion-reduce:overflow-visible motion-reduce:py-24">
          {/*
            Título bem apagado (como na referência), na fonte do "PAGE FÓLIO".
            min(): no celular encolhe até "ARQUIVOS" caber (≈ 6,7× o tamanho da fonte).
          */}
          <h2 className="font-heading relative z-10 flow-root text-center text-[length:min(clamp(2.75rem,10vw,9rem),calc((100vw_-_3rem)/7))] leading-[1.02] tracking-[-0.01em] text-title/45 uppercase [grid-area:1/1] motion-reduce:[grid-area:auto]">
            {TITLE_LINES.map((line) => (
              <span key={line} className="-my-[0.14em] block overflow-hidden py-[0.14em] whitespace-nowrap">
                <span data-line="" className="block will-change-transform">
                  {line}
                </span>
              </span>
            ))}
          </h2>

          {/* Camada das peças: ocupa o painel todo; cada peça é posicionada pelo JS */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 motion-reduce:static motion-reduce:flex motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-6"
            style={{ '--u': 'clamp(96px, 13vw, 230px)' } as CSSProperties}
          >
            {PIECES.map((p, i) => {
              const near = p.depth >= 0.6
              const style: CSSProperties = {
                width: `calc(var(--u) * ${p.size})`,
                // longe: atrás do título, desfocada e mais clara · perto: na frente
                zIndex: near ? 20 : 0,
                filter: p.depth < 0.45 ? 'blur(1.5px)' : undefined,
                opacity: p.depth < 0.45 ? 0.8 : 1,
                visibility: 'hidden',
              }
              return (
                <div
                  key={i}
                  data-piece=""
                  data-x={p.x}
                  data-depth={p.depth}
                  data-delay={p.delay}
                  data-rot={p.rot}
                  className="absolute top-0 left-0 will-change-transform motion-reduce:visible! motion-reduce:static"
                  style={style}
                >
                  {p.kind === 'folder' ? (
                    <FolderIcon />
                  ) : (
                    <div
                      className="relative overflow-hidden rounded-[10px] shadow-[0_24px_40px_-16px_rgba(11,26,36,0.45)]"
                      style={{ aspectRatio: p.ratio }}
                    >
                      {p.src ? (
                        <img src={p.src} alt={p.alt ?? ''} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <PlaceholderArt from={p.from} to={p.to} accent={p.accent} n={ART_NUMBER[i]} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
