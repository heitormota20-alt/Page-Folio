import { type CSSProperties, useRef } from 'react'
import { useToolkitScene } from '../hooks/useToolkitScene'

const TITLE_LINES = ['Minhas ferramentas', 'de criação']

/*
  Ferramentas. PROVISÓRIAS: lista típica de design/growth até termos a do Heitor.
  Cada cartão mostra uma sigla nas cores da marca (não usa os logos oficiais);
  para trocar por logos reais, coloque os SVGs em public/ferramentas/ e passe `logo`.

  x: centro horizontal (fração da largura) · depth: 0 longe … 1 perto ·
  delay: quando entra (fração da cena) · size: × unidade base ·
  rot: inclinação · spin: quanto gira ao longo da subida (graus)
*/
const TOOLS: {
  name: string
  mark: string
  bg: string
  fg: string
  x: number
  depth: number
  delay: number
  size: number
  rot: number
  spin: number
  logo?: string
}[] = [
  { name: 'Figma', mark: 'Fg', bg: '#1e1e1e', fg: '#a259ff', x: 0.2, depth: 0.8, delay: 0.0, size: 1, rot: -14, spin: 40 },
  { name: 'Photoshop', mark: 'Ps', bg: '#001e36', fg: '#31a8ff', x: 0.78, depth: 0.9, delay: 0.02, size: 1.1, rot: 10, spin: -30 },
  { name: 'Illustrator', mark: 'Ai', bg: '#330000', fg: '#ff9a00', x: 0.46, depth: 0.85, delay: 0.05, size: 1.05, rot: -18, spin: 50 },
  { name: 'Canva', mark: 'Cv', bg: 'linear-gradient(135deg,#00c4cc,#7d2ae8)', fg: '#fff', x: 0.08, depth: 0.7, delay: 0.09, size: 0.9, rot: 16, spin: -45 },
  { name: 'WordPress', mark: 'Wp', bg: '#21759b', fg: '#fff', x: 0.62, depth: 0.95, delay: 0.12, size: 1.1, rot: -8, spin: 35 },
  { name: 'Notion', mark: 'N', bg: '#191919', fg: '#fff', x: 0.34, depth: 0.4, delay: 0.15, size: 0.75, rot: 12, spin: -25 },
  { name: 'Webflow', mark: 'Wf', bg: '#146ef5', fg: '#fff', x: 0.9, depth: 0.75, delay: 0.19, size: 0.95, rot: -20, spin: 55 },
  { name: 'Meta Ads', mark: 'Me', bg: '#0866ff', fg: '#fff', x: 0.26, depth: 0.9, delay: 0.24, size: 1.05, rot: 8, spin: -40 },
  { name: 'Google Ads', mark: 'Ad', bg: '#4285f4', fg: '#fff', x: 0.55, depth: 0.7, delay: 0.28, size: 0.95, rot: -12, spin: 30 },
  { name: 'Analytics', mark: 'GA', bg: '#e37400', fg: '#fff', x: 0.12, depth: 0.85, delay: 0.32, size: 1, rot: 18, spin: -50 },
  { name: 'Hotjar', mark: 'Hj', bg: '#ff3c00', fg: '#fff', x: 0.72, depth: 0.45, delay: 0.36, size: 0.8, rot: -6, spin: 25 },
  { name: 'Shopify', mark: 'Sh', bg: '#95bf47', fg: '#fff', x: 0.42, depth: 0.9, delay: 0.4, size: 1.1, rot: 14, spin: -35 },
  { name: 'CapCut', mark: 'Cc', bg: '#000', fg: '#fff', x: 0.86, depth: 0.8, delay: 0.45, size: 1, rot: -16, spin: 45 },
  { name: 'ChatGPT', mark: 'AI', bg: '#10a37f', fg: '#fff', x: 0.6, depth: 0.65, delay: 0.5, size: 0.9, rot: 10, spin: -30 },
]

/**
 * Seção "Minhas ferramentas de criação" — cena fixa (ver useToolkitScene): fundo
 * escuro (tema da seção), título apagado no centro e cartões das ferramentas
 * subindo amontoados, rodopiando, por cima dele.
 */
export function Toolkit() {
  const sceneRef = useRef<HTMLDivElement>(null)
  useToolkitScene(sceneRef)

  return (
    // -mt-[45vh]: o título entra enquanto as peças dos Arquivos saem.
    // data-theme: a página volta ao escuro quando esta seção chega a 60% da tela.
    <section id="ferramentas" data-theme="dark" data-theme-at="0.6" className="-mt-[45vh] motion-reduce:mt-0">
      {/* Palco alto: 100vh de entrada + 200vh com o painel parado na tela */}
      <div ref={sceneRef} className="relative h-[300vh] motion-reduce:h-auto">
        <div className="pointer-events-none sticky top-0 grid h-[100svh] place-items-center overflow-hidden px-6 sm:px-10 motion-reduce:static motion-reduce:h-auto motion-reduce:gap-12 motion-reduce:overflow-visible motion-reduce:py-24">
          {/*
            Título apagado, na fonte do "PAGE FÓLIO". No celular a 1ª linha quebra
            ("MINHAS / FERRAMENTAS") e o tamanho é o que faz "FERRAMENTAS" caber
            (≈ 9,3× a fonte); do sm em diante, "MINHAS FERRAMENTAS" numa linha (≈ 15,2×).
          */}
          <h2 className="font-heading relative z-10 flow-root text-center text-[length:min(clamp(1.9rem,5.4vw,5rem),calc((100vw_-_3rem)/9.8))] leading-[1.06] tracking-[-0.01em] text-title/45 uppercase [grid-area:1/1] sm:text-[length:min(clamp(1.9rem,5.4vw,5rem),calc((100vw_-_5rem)/15.8))] motion-reduce:[grid-area:auto]">
            {TITLE_LINES.map((line) => (
              <span key={line} className="-my-[0.14em] block overflow-hidden py-[0.14em] sm:whitespace-nowrap">
                <span data-line="" className="block will-change-transform">
                  {line}
                </span>
              </span>
            ))}
          </h2>

          {/* Para leitores de tela: a lista fica estável (a camada animada some e volta) */}
          <ul className="sr-only">
            {TOOLS.map((t) => (
              <li key={t.name}>{t.name}</li>
            ))}
          </ul>

          {/* Camada dos cartões: posicionados pelo JS */}
          <ul
            aria-hidden="true"
            className="absolute inset-0 motion-reduce:static motion-reduce:flex motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-4"
            style={{ '--u': 'clamp(84px, 9.5vw, 160px)' } as CSSProperties}
          >
            {TOOLS.map((t) => {
              const near = t.depth >= 0.6
              const style: CSSProperties = {
                width: `calc(var(--u) * ${t.size})`,
                fontSize: `calc(var(--u) * ${t.size} * 0.2)`, // tudo dentro escala com o cartão
                zIndex: near ? 20 : 0,
                filter: t.depth < 0.5 ? 'blur(1.5px)' : undefined,
                opacity: t.depth < 0.5 ? 0.75 : 1,
                visibility: 'hidden',
              }
              return (
                <li
                  key={t.name}
                  data-piece=""
                  data-x={t.x}
                  data-depth={t.depth}
                  data-delay={t.delay}
                  data-rot={t.rot}
                  data-spin={t.spin}
                  className="absolute top-0 left-0 will-change-transform motion-reduce:visible! motion-reduce:static"
                  style={style}
                >
                  <div className="rounded-[18%] bg-white p-[10%] pb-[7%] shadow-[0_22px_40px_-14px_rgba(0,0,0,0.55)]">
                    <div
                      className="grid aspect-square place-items-center rounded-[22%]"
                      style={{ background: t.bg }}
                    >
                      {t.logo ? (
                        <img src={t.logo} alt="" className="h-[62%] w-[62%] object-contain" />
                      ) : (
                        <span className="text-[1.7em] leading-none font-bold tracking-tight" style={{ color: t.fg }}>
                          {t.mark}
                        </span>
                      )}
                    </div>
                    <p className="mt-[8%] truncate text-center text-[0.5em] leading-none font-semibold text-[#0b1a24]">
                      {t.name}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
