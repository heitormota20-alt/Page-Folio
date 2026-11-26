import { useRef } from 'react'
import { usePillPhysics } from '../hooks/usePillPhysics'

// Conteúdo provisório — trocar pelos serviços reais. Seis: no layout final ficam
// 3 em cima e 3 embaixo (ROWS).
const SERVICES = [
  'Testes A/B',
  'Otimização de conversão',
  'Design de produto',
  'Growth',
  'Landing pages',
  'UX/UI design',
]
const ROWS = [SERVICES.slice(0, 3), SERVICES.slice(3)]

/** Etiquetas e cores dos cursores (estilo multiplayer do Figma), em rodízio. */
const CURSORS = [
  { label: 'Design', color: '#FFD60A', ink: '#1a1400' },
  { label: 'Growth', color: '#FF5FA2', ink: '#fff' },
  { label: 'Dados', color: '#2EE59D', ink: '#00261a' },
  { label: 'UX', color: '#FF8A3D', ink: '#fff' },
  { label: 'Produto', color: '#34D3FF', ink: '#00222e' },
  { label: 'Testes', color: '#C6FF3D', ink: '#1a2400' },
]

/** Visual da pílula — o mesmo nas pílulas soltas e nos "lugares" do layout final. */
const PILL =
  "rounded-full border-[1.5px] border-[#0b1a24] bg-white px-[1.2em] py-[0.4em] font-['Instrument_Serif',serif] text-[length:clamp(1.1rem,2.3vw,2.6rem)] leading-none whitespace-nowrap text-[#0b1a24]"

/** Seta de cursor + etiqueta colorida. A ponta da seta é o canto (0, 0) do elemento. */
function Cursor({ label, color, ink }: (typeof CURSORS)[number]) {
  return (
    <>
      <svg width="28" height="30" viewBox="0 0 22 24" className="block drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
        <path d="M1.5 1.5 20 10.2l-8.1 2.3-3.6 8.2Z" fill={color} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span
        className="absolute top-[24px] left-[19px] rounded-full px-3 py-1.5 text-[12px] leading-none font-semibold whitespace-nowrap shadow-[0_2px_6px_rgba(0,0,0,0.2)] sm:text-[13px]"
        style={{ background: color, color: ink }}
      >
        {label}
      </span>
    </>
  )
}

/**
 * Terceira seção, no estilo da referência ("ALL YOUR design needs"): no azul da
 * segunda dobra, título em duas vozes — Anton (a mesma do "PORTFÓLIO") e um
 * itálico serifado — e os serviços em pílulas.
 *
 * É uma cena presa na tela (palco de 320vh): as pílulas caem e se empilham com
 * física (dá para arrastar); conforme a rolagem avança, cursores coloridos entram,
 * agarram cada pílula — as de cima da pilha primeiro — e a levam ao seu lugar no
 * layout final (3 em cima, 3 embaixo, centralizado); por fim o texto e o botão
 * sobem por baixo delas. Rolando de volta, tudo se desfaz.
 * Ver usePillPhysics.
 *
 * As cores vêm do tema da página (text-ink / bg-ink / text-page): quando a
 * página vira branca na seção seguinte, o texto escurece junto.
 */
export function Services() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const pileRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  usePillPhysics(pileRef, { sceneRef, layoutRef, revealRef: ctaRef })

  return (
    // data-topo-end: as curvas de nível do fundo seguem até o fim desta seção
    <section id="ajuda" data-topo-end="">
      <div ref={sceneRef} className="relative h-[320vh] motion-reduce:h-auto">
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-6 pt-[16vh] sm:px-10 lg:px-16 motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-[100svh]">
          <header>
            <h2 className="text-center text-ink">
              <span className="block font-['Anton',sans-serif] text-[length:clamp(3rem,8.6vw,9.5rem)] leading-[0.95] tracking-[-0.005em] uppercase">
                No que eu posso
              </span>
              <span className="-mt-[0.04em] block font-['Instrument_Serif',serif] text-[length:clamp(3.4rem,9.6vw,10.5rem)] leading-[0.9] italic text-[#FF606A]">
                te ajudar
              </span>
            </h2>
          </header>

          {/* Para leitores de tela: a lista de serviços (as pílulas são só visuais) */}
          <ul className="sr-only">
            {SERVICES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          {/*
            Área das pílulas: a pilha (física) e o layout final — 3 em cima, 3
            embaixo ([data-slot], invisíveis: marcam onde cada pílula vai parar) e,
            com um respiro, o texto + o botão, que sobem de baixo quando os cursores
            terminam. Com movimento reduzido, o layout final aparece direto.
          */}
          <div
            ref={pileRef}
            className="relative mt-auto h-[60svh] min-h-[340px] w-full sm:h-[54svh] motion-reduce:h-auto motion-reduce:min-h-0"
          >
            <div
              ref={layoutRef}
              className="absolute inset-0 flex flex-col items-center justify-end pb-[7vh] motion-reduce:static motion-reduce:py-16"
            >
              <div aria-hidden="true" className="invisible flex flex-col items-center gap-3 sm:gap-4 motion-reduce:visible">
                {ROWS.map((row) => (
                  <div key={row[0]} className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    {row.map((s) => (
                      <span key={s} data-slot="" className={PILL}>
                        {s}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              <div ref={ctaRef} className="mt-[5vh] flex max-w-[36rem] flex-col items-center text-center">
                <p className="text-[13px] leading-relaxed text-balance text-ink/80 sm:text-[15px]">
                  Design e experimentação em um só lugar — do primeiro teste ao produto validado,
                  com decisões guiadas por dados.
                </p>
                <a
                  href="#contatos"
                  className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-[11px] font-semibold tracking-[0.14em] text-page uppercase transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  Agende uma conversa
                </a>
              </div>
            </div>

            {SERVICES.map((s) => (
              <span
                key={s}
                data-pill=""
                aria-hidden="true"
                className={`${PILL} absolute top-0 left-0 cursor-grab touch-pan-y shadow-[0_10px_24px_-12px_rgba(0,10,40,0.55)] select-none will-change-transform motion-reduce:hidden`}
              >
                {s}
              </span>
            ))}

            {SERVICES.map((s, i) => (
              <div
                key={s}
                data-cursor=""
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 z-30 opacity-0 will-change-transform motion-reduce:hidden"
              >
                <Cursor {...CURSORS[i % CURSORS.length]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
