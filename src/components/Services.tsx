import { useRef } from 'react'
import { usePillPhysics } from '../hooks/usePillPhysics'

// Conteúdo provisório — trocar pelos serviços reais (uma pílula por item).
const SERVICES = [
  'Testes A/B',
  'Otimização de conversão',
  'Design de produto',
  'Growth',
  'Landing pages',
  'UX/UI design',
  'Pesquisa com usuários',
  'Prototipação',
  'Onboarding',
  'Análise de dados',
  'Sites',
  'Apps',
]

/**
 * Terceira seção, no estilo da referência ("ALL YOUR design needs"): no azul da
 * segunda dobra, título em duas vozes — Anton (a mesma do "PORTFÓLIO") e um
 * itálico serifado —, texto curto + botão à direita e, embaixo, os serviços em
 * pílulas que caem e se empilham com física (usePillPhysics; dá para arrastar).
 *
 * As cores vêm do tema da página (text-ink / bg-ink / text-page): quando a
 * página vira branca na seção seguinte, o texto escurece junto.
 */
export function Services() {
  const pileRef = useRef<HTMLDivElement>(null)
  usePillPhysics(pileRef)

  return (
    <section id="ajuda" className="relative overflow-x-clip">
      <div className="flex min-h-[100svh] flex-col px-6 pt-[16vh] sm:px-10 lg:px-16">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <h2 className="text-ink">
            <span className="block font-['Anton',sans-serif] text-[length:clamp(3rem,8.6vw,9.5rem)] leading-[0.95] tracking-[-0.005em] uppercase">
              No que eu posso
            </span>
            <span className="-mt-[0.04em] block font-['Instrument_Serif',serif] text-[length:clamp(3.4rem,9.6vw,10.5rem)] leading-[0.9] italic">
              te ajudar
            </span>
          </h2>

          <div className="max-w-[19rem] lg:pt-[1.2vw]">
            <p className="text-[13px] leading-relaxed text-ink/80 sm:text-sm">
              Design e experimentação em um só lugar — do primeiro teste ao produto validado, com
              decisões guiadas por dados.
            </p>
            <a
              href="#contatos"
              className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-[11px] font-semibold tracking-[0.14em] text-page uppercase transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              Agende uma conversa
            </a>
          </div>
        </header>

        {/* Para leitores de tela: a lista de serviços (as pílulas são só visuais) */}
        <ul className="sr-only">
          {SERVICES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        {/*
          Área da física: as pílulas caem de cima e se empilham no fundo da seção.
          Com movimento reduzido, ficam paradas lado a lado (motion-reduce:*).
        */}
        <div
          ref={pileRef}
          aria-hidden="true"
          className="relative mt-auto h-[46svh] min-h-[300px] w-full motion-reduce:flex motion-reduce:h-auto motion-reduce:min-h-0 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-3 motion-reduce:py-16"
        >
          {SERVICES.map((s) => (
            <span
              key={s}
              data-pill=""
              className="absolute top-0 left-0 cursor-grab touch-pan-y rounded-full border-[1.5px] border-[#0b1a24] bg-white px-[1.2em] py-[0.4em] font-['Instrument_Serif',serif] text-[length:clamp(1.15rem,2.4vw,2.6rem)] leading-none whitespace-nowrap text-[#0b1a24] shadow-[0_10px_24px_-12px_rgba(0,10,40,0.55)] select-none will-change-transform motion-reduce:static"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
