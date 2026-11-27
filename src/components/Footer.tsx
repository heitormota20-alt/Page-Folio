import { type CSSProperties, useMemo, useRef, useState } from 'react'
import { useEnterFlag } from '../hooks/useEnterFlag'
import { topoPath } from '../hooks/topo-path'
import { HireGame } from './HireGame'
import { CV_FILENAME, CV_URL, EMAIL, LINKEDIN_URL, PROFILES } from './profiles'
import { SIGNATURE } from './signature-paths'

/** A frase grande, em duas vozes. PROVISÓRIA — trocar pela do Heitor. */
const HEADLINE = ['Vamos criar', 'algo memorável.']

/** As seções (o início fica com o menu do topo e o "voltar ao topo"). */
const PAGES = [
  { label: 'Serviços', href: '#ajuda' },
  { label: 'Arquivos', href: '#arquivos' },
  { label: 'Ferramentas', href: '#ferramentas' },
  { label: 'Sobre mim', href: '#sobre' },
]

const SOCIAL = [
  { label: 'LinkedIn', href: LINKEDIN_URL },
  ...PROFILES.map(({ label, href }) => ({ label, href })),
  { label: 'E-mail', href: `mailto:${EMAIL}` },
]

/** Links da faixa do pé do cartão: Sora, maiúsculas pequenas e espaçadas. */
const LINK =
  'inline-flex items-center gap-1.5 text-[12.5px] leading-[2.2] font-semibold tracking-[0.12em] text-white/90 uppercase transition-colors duration-200 hover:text-[#FF606A] focus-visible:text-[#FF606A] focus-visible:outline-none'

/** Quadro do desenho das curvas (o SVG cobre o cartão com `slice`). */
const TOPO_W = 1600
const TOPO_H = 1000

/** Atraso da entrada de cada peça (CSS `--i`). */
const delay = (s: number) => ({ '--i': `${s}s` }) as CSSProperties

/**
 * Rodapé no estilo do de landonorris.com: um cartão grande no azul da página, com
 * as curvas de nível, uma aba no topo e cantos arredondados, sobre a moldura branca
 * (com um brilho coral embaixo). No centro, a frase em duas vozes (Anton +
 * Instrument Serif itálico coral) com a assinatura "Heitor M" em coral por cima. No
 * meio, de ponta a ponta, o jogo da caneta: vetorizar "CONTRATE-ME" (HireGame.tsx, inspirado em
 * bezier.method.ac) — terminado, o "Fale comigo" pulsa. Embaixo, uma faixa com os
 * links (páginas à esquerda, redes à direita) e, abaixo, os botões Fale comigo
 * (coral) e Currículo (branco). Fora do cartão, o © e
 * "voltar ao topo".
 *
 * Entrada ao chegar ([data-shown], CSS .foot-* no index.css): a frase sobe, a
 * assinatura se escreve da esquerda para a direita, o jogo e o resto aparecem.
 * Tudo em fluxo no cartão (frase, jogo, links e botões no pé): nada se sobrepõe em
 * tela nenhuma.
 */
export function Footer() {
  const cardRef = useRef<HTMLDivElement>(null)
  useEnterFlag(cardRef, 'shown', 0.3)
  const topo = useMemo(() => topoPath(TOPO_W, TOPO_H, 5), [])
  const [hired, setHired] = useState(false)
  const year = new Date().getFullYear()

  return (
    <footer
      id="contatos"
      data-pause-offscreen=""
      className="relative px-3 pt-16 sm:px-4 [background:linear-gradient(to_bottom,transparent_35%,rgb(255_96_106/0.16))]"
    >
      <div className="relative">
        {/* A aba no topo do cartão */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          className="absolute -top-[39px] left-1/2 h-10 w-[240px] -translate-x-1/2 text-[#0036b2] sm:w-[400px]"
        >
          <path d="M0 40C40 40 40 0 70 0H330C360 0 360 40 400 40Z" fill="currentColor" />
        </svg>

        {/*
          O cartão: conteúdo em fluxo (nada posicionado por altura), então nada se
          sobrepõe em tela nenhuma — se faltar altura, o cartão cresce. No mínimo, a
          altura da tela.
        */}
        <div
          ref={cardRef}
          className="relative isolate flex min-h-[calc(100svh-6.5rem)] flex-col items-center overflow-hidden rounded-[28px] bg-[#0036b2] px-6 pt-12 pb-7 text-white sm:px-10 lg:px-16 lg:pt-[clamp(1.75rem,4.5svh,4rem)]"
        >
          {/* Curvas de nível — o mesmo relevo do fundo da página, parado, em vetor, bem discretas */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${TOPO_W} ${TOPO_H}`}
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
          >
            <path d={topo} fill="none" stroke="#fff" strokeOpacity="0.09" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Alto: a frase, com a assinatura */}
          <div className="relative z-[1] flex flex-col items-center text-center">
            {/* Assinatura: em fluxo, acima da frase, encostando só no alto da 1ª linha */}
            <svg
              aria-hidden="true"
              viewBox={SIGNATURE.viewBox}
              className="foot-sign relative z-[1] -mb-[clamp(1rem,2.1vw,2rem)] w-[min(64%,20rem)] -translate-x-[12%] -rotate-[8deg] text-[#FF606A]"
            >
              {SIGNATURE.strokes.map((s, i) => (
                <path key={i} d={s.shape} fill="currentColor" fillRule="evenodd" />
              ))}
            </svg>
            <h2>
              <span className="block overflow-hidden py-[0.06em] text-[length:clamp(2.8rem,5.4vw,6.8rem)]">
                <span className="foot-line block font-['Anton',sans-serif] leading-[0.95] tracking-[-0.005em] whitespace-nowrap uppercase" style={delay(0)}>
                  {HEADLINE[0]}
                </span>
              </span>
              <span className="-mx-[0.1em] -mt-[0.1em] block overflow-hidden px-[0.1em] pb-[0.12em] text-[length:clamp(3rem,5.9vw,7.4rem)]">
                <span
                  className="foot-line block font-['Instrument_Serif',serif] leading-[0.95] whitespace-nowrap text-[#FF606A] italic"
                  style={delay(0.12)}
                >
                  {HEADLINE[1]}
                </span>
              </span>
            </h2>
          </div>

          {/* O jogo: no lugar do avatar, de ponta a ponta */}
          <div className="foot-fade relative z-[2] mt-12 w-full lg:mt-[clamp(1.25rem,3.5svh,3rem)]" style={delay(0.35)}>
            <HireGame onComplete={() => setHired(true)} />
          </div>

          {/*
            Pé do cartão (empurrado para baixo): os links numa faixa de ponta a ponta,
            com um fio em cima — páginas à esquerda, redes à direita — e, abaixo, os
            dois botões no centro. No celular, os dois grupos empilhados, cada um em 2 × 2.
          */}
          <div className="mt-auto flex w-full flex-col items-center pt-8">
            <nav
              aria-label="Rodapé"
              className="foot-fade flex w-full flex-col items-center gap-y-2 border-t border-white/15 pt-5 lg:flex-row lg:justify-between"
              style={delay(0.6)}
            >
              <ul aria-label="Páginas" className="grid grid-cols-2 justify-items-center gap-x-8 lg:flex lg:flex-wrap lg:justify-start lg:gap-x-5">
                {PAGES.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} className={LINK}>
                      {p.label}
                    </a>
                  </li>
                ))}
              </ul>
              <ul aria-label="Redes" className="grid grid-cols-2 justify-items-center gap-x-8 lg:flex lg:flex-wrap lg:justify-end lg:gap-x-5">
                {SOCIAL.map((s) => {
                  const external = !s.href.startsWith('mailto:')
                  return (
                    <li key={s.label}>
                      <a href={s.href} className={LINK} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {s.label}
                        {external && (
                          <svg aria-hidden="true" width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                            <path d="M3 9 9 3M4 3h5v5" />
                          </svg>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="foot-fade mt-7 flex flex-wrap items-center justify-center gap-3" style={delay(0.7)}>
              <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent('Contato pelo portfólio')}`}
                className={`inline-flex h-[44px] items-center gap-2 rounded-full bg-[#FF606A] px-6 text-[12px] font-semibold tracking-[0.12em] whitespace-nowrap text-[#0b1a24] uppercase transition-[translate,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${hired ? 'hire-cta-on' : ''}`}
              >
                Fale comigo
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9 9 3M4 3h5v5" />
                </svg>
              </a>
              <a
                href={CV_URL}
                download={CV_FILENAME}
                className="inline-flex h-[44px] items-center gap-2 rounded-full bg-white px-6 text-[12px] font-semibold tracking-[0.12em] whitespace-nowrap text-[#0036b2] uppercase transition-[translate,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-[#FF606A] hover:text-[#0b1a24] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v8.5M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />
                </svg>
                Currículo
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-2 py-4 text-[11px] text-ink/70 sm:text-[12px]">
        <span>© {year} Heitor Mota. Todos os direitos reservados.</span>
        <a href="#top" className="font-semibold tracking-[0.12em] whitespace-nowrap uppercase hover:text-ink">
          Voltar ao topo ↑
        </a>
      </div>
    </footer>
  )
}
