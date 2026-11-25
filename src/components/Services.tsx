import { useId, useRef } from 'react'
import { useServicesScene } from '../hooks/useServicesScene'
import { usePageTheme } from '../hooks/usePageTheme'

// Uma linha por item — quebra fixa: "No que eu posso" / "te ajudar"
const TITLE_LINES = ['No que eu posso', 'te ajudar']

type Shape = 'circle' | 'square' | 'triangle' | 'diamond'

// Conteúdo provisório — trocar pelos serviços reais.
// rot: inclinação final (graus) · y: desnível final (px) · delay: atraso no voo
// (fração da cena; 0 = chega primeiro) — cartas desencontradas, como na referência.
const SERVICES: {
  title: string
  from: string
  to: string
  shape: Shape
  rot: number
  y: number
  delay: number
}[] = [
  { title: 'Experimentação e testes A/B', from: '#2563eb', to: '#22d3ee', shape: 'circle', rot: -6, y: 18, delay: 0.1 },
  { title: 'Otimização de conversão', from: '#059669', to: '#34d399', shape: 'square', rot: 4, y: 36, delay: 0 },
  { title: 'Design de produto', from: '#db2777', to: '#fb7185', shape: 'triangle', rot: -3, y: 4, delay: 0.17 },
  { title: 'Growth e ativação', from: '#ea580c', to: '#facc15', shape: 'diamond', rot: 5, y: 22, delay: 0.06 },
]

const CARD_BG = '#0c0f13'

/** Círculo em gradiente com anéis concêntricos e uma forma preta no centro. */
function ServiceIcon({ from, to, shape }: { from: string; to: string; shape: Shape }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="w-[76%]">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id})`} />
      {[42, 36, 30, 24].map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" />
      ))}
      <g fill={CARD_BG}>
        {shape === 'circle' && <circle cx="50" cy="50" r="10" />}
        {shape === 'square' && <rect x="40.5" y="40.5" width="19" height="19" rx="2" />}
        {shape === 'triangle' && <path d="M50 38.5 62 60H38Z" />}
        {shape === 'diamond' && <path d="M50 37.5 62.5 50 50 62.5 37.5 50Z" />}
      </g>
    </svg>
  )
}

/**
 * Terceira seção — uma cena fixa na tela (ver useServicesScene): o título sobe e
 * para no centro; os cards voam de baixo em arco, girando, cobrem o título e
 * assentam; a composição fica parada um trecho antes de a cena seguir.
 *
 * -mt-[40vh]: a seção começa por baixo do espaçador do App, para o título entrar
 * logo depois do card da hero (sem vão vazio entre os dois).
 */
export function Services() {
  const sectionRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  useServicesScene(sceneRef)
  // tema claro quando a cena para na tela (o card da hero já saiu)
  usePageTheme(sectionRef, { at: 0.05 })

  return (
    <section ref={sectionRef} id="ajuda" className="-mt-[40vh] motion-reduce:mt-0">
      {/* Palco alto: 100vh de entrada + 160vh com o painel parado na tela */}
      <div ref={sceneRef} className="relative h-[260vh] motion-reduce:h-auto">
        <div className="sticky top-0 grid h-[100svh] place-items-center overflow-hidden px-6 sm:px-10 motion-reduce:static motion-reduce:h-auto motion-reduce:gap-12 motion-reduce:overflow-visible motion-reduce:py-24">
          {/*
            Mesma tipografia do "PAGE FÓLIO" (Zen Dots, caixa alta), um pouco menor.
            min(): em telas estreitas, encolhe até "NO QUE EU POSSO" caber numa linha
            (a linha mede ≈ 12,6× o tamanho da fonte). flow-root: as margens
            negativas das janelas não vazam do h2.
          */}
          <h2
            data-title=""
            className="font-heading flow-root text-center text-[length:min(clamp(1.75rem,5.5vw,5rem),calc((100vw_-_5rem)/13))] leading-[1.06] tracking-[-0.01em] text-title uppercase [grid-area:1/1] motion-reduce:[grid-area:auto]"
          >
            {TITLE_LINES.map((line) => (
              // Janela da linha (overflow-hidden): o texto sobe de baixo para cima
              // por trás dela. py/-my dão folga p/ a perna do Q.
              <span key={line} className="-my-[0.14em] block overflow-hidden py-[0.14em] whitespace-nowrap">
                <span data-line="" className="block will-change-transform">
                  {line}
                </span>
              </span>
            ))}
          </h2>

          {/* Cards — na mesma célula do grid que o título, por cima dele (z-10) */}
          <ul
            data-cards=""
            className="relative z-10 grid w-full max-w-5xl grid-cols-2 gap-3 [grid-area:1/1] sm:gap-4 lg:grid-cols-4 motion-reduce:[grid-area:auto]"
          >
            {SERVICES.map((s) => (
              <li
                key={s.title}
                data-card=""
                data-rot={s.rot}
                data-y={s.y}
                data-delay={s.delay}
                className="will-change-transform motion-reduce:rotate-0"
              >
                <div
                  className="relative aspect-[0.78] overflow-hidden rounded-[18px] shadow-[0_28px_50px_-14px_rgba(11,26,36,0.5)] ring-1 ring-white/5 transition-transform duration-300 ease-out hover:-translate-y-2 sm:rounded-[22px]"
                  style={{ background: CARD_BG }}
                >
                  <div className="absolute inset-x-0 top-0 bottom-[24%] grid place-items-center pt-[6%]">
                    <ServiceIcon from={s.from} to={s.to} shape={s.shape} />
                  </div>
                  <div
                    className="absolute inset-x-0 bottom-0 grid h-[24%] place-items-center px-3 text-center"
                    style={{ background: `linear-gradient(90deg, ${s.from}, ${s.to})` }}
                  >
                    <h3 className="text-[12px] leading-tight font-semibold text-white sm:text-[15px]">
                      {s.title}
                    </h3>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
