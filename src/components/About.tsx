import { type CSSProperties, useRef } from 'react'
import { useEnterFlag } from '../hooks/useEnterFlag'
import { AboutPops } from './about-pops'
import { CV_FILENAME, CV_URL, PROFILES } from './profiles'

/** Lado esquerdo (o "H1" da seção), em duas vozes como os outros títulos. */
const TITLE = ['Prazer,', 'sou o Heitor']
/** Cargo, logo abaixo do título — de propósito com pouco destaque. */
const ROLE = 'Designer Gráfico Pleno'

/** Lado direito (o "H2"): a apresentação, no texto do Heitor. */
const INTRO =
  'Mais de 5 anos criando soluções visuais que comunicam, convertem e ficam na memória. Formado em Design Gráfico pela FAM, com base técnica em Desenvolvimento Front-end pela UNINOVE. Acompanho cada projeto do conceito criativo à entrega final.'

/** Atraso da entrada de cada peça do texto (CSS `--i`). */
const delay = (s: number) => ({ '--i': `${s}s` }) as CSSProperties

/**
 * "Sobre mim" — no branco (tema claro, como a home do design), em duas colunas:
 * à esquerda o Heitor em 3D desenhando com a caneta
 * (public/sobre/heitor-desenhando.webp, 919 × 939, recortado de
 * assets/design/heitorzinho.png), grande, encostado na borda e apoiado na base;
 * à direita, centralizados na altura, o título (Anton + Instrument Serif itálico
 * coral, como nas outras seções), o cargo discreto, a apresentação numa fonte de
 * leitura (Sora) e os botões (currículo + perfis).
 *
 * Do lg em diante: a imagem ocupa no máximo a metade esquerda (50vw, ou o que cabe
 * em 90% da altura) e os textos ficam na coluna da direita, que começa depois do
 * meio — nunca se encostam. Abaixo do lg, tudo empilhado e centralizado, com o
 * personagem embaixo.
 *
 * Entrada (CSS .about-in*, .about-char e .about-pop no index.css), repetida a cada
 * chegada: quando a seção aparece ([data-shown]), o texto vem da direita — as linhas
 * do título deslizando dentro das suas janelas, depois cargo, texto e botões; quando
 * o personagem aparece ([data-in] na caixa dele), ele entra de leve pela esquerda e
 * os elementos de design saem de trás dele (about-pops.tsx). Marcadores separados:
 * no celular o personagem fica bem abaixo do texto.
 */
export function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  useEnterFlag(sectionRef, 'shown', 0.25)
  useEnterFlag(boxRef, 'in', 0.3)

  return (
    // data-theme: a página fica branca quando esta seção chega a 60% da tela.
    // data-topo-end: as curvas de nível do fundo (o grafismo) seguem até o fim desta
    // seção — no branco, na cor "ink" do tema — e se apagam quando ela sai.
    // data-topo-dim: aqui elas ficam bem mais claras (40% da intensidade), para não
    // competir com o personagem e os elementos.
    <section
      ref={sectionRef}
      id="sobre"
      data-pause-offscreen=""
      data-theme="light"
      data-theme-at="0.6"
      data-topo-end=""
      data-topo-dim="0.4"
      className="relative overflow-hidden"
    >
      <div className="relative mx-auto flex max-w-[1600px] flex-col items-center px-6 pt-24 sm:px-10 lg:grid lg:min-h-[100svh] lg:max-w-none lg:grid-cols-2 lg:items-center lg:gap-x-12 lg:px-16 lg:pt-0">
        <div className="relative z-10 flex max-w-md flex-col items-center text-center lg:col-start-2 lg:max-w-[34rem] lg:items-start lg:py-20 lg:text-left">
          {/*
            Cada linha do título numa janela (overflow-hidden), por onde ela entra da
            direita; as folgas em em (no tamanho da linha) não deixam cortar a vírgula,
            o itálico nem as ascendentes.
          */}
          <h2 className="text-ink">
            <span className="-mx-[0.1em] -my-[0.14em] block overflow-hidden px-[0.1em] py-[0.14em] text-[length:clamp(3rem,6vw,7.5rem)]">
              <span
                className="about-in-line font-['Anton',sans-serif] leading-[0.95] tracking-[-0.005em] uppercase"
                style={delay(0)}
              >
                {TITLE[0]}
              </span>
            </span>
            <span className="-mx-[0.1em] -my-[0.14em] block overflow-hidden px-[0.1em] py-[0.14em] text-[length:clamp(3.4rem,6.6vw,8.3rem)]">
              <span
                className="about-in-line -mt-[0.04em] font-['Instrument_Serif',serif] leading-[0.95] whitespace-nowrap text-[#FF606A] italic"
                style={delay(0.1)}
              >
                {TITLE[1]}
              </span>
            </span>
          </h2>
          <p className="about-in mt-4 text-[12px] font-semibold tracking-[0.22em] text-ink/50 uppercase" style={delay(0.25)}>
            {ROLE}
          </p>
          <p
            className="about-in mt-3 text-[length:clamp(1rem,1.3vw,1.35rem)] leading-normal font-light text-pretty text-ink/90"
            style={delay(0.35)}
          >
            {INTRO}
          </p>
          {/* Currículo (CTA no azul da página) + perfis, na mesma altura (42px) */}
          <div className="about-in mt-7 flex items-center gap-3" style={delay(0.47)}>
            <a
              href={CV_URL}
              download={CV_FILENAME}
              className="inline-flex h-[42px] items-center gap-2.5 rounded-full bg-[#0036b2] px-6 text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-white uppercase transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0036b2]"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8.5M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />
              </svg>
              Baixar currículo
            </a>
            {PROFILES.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.label} (abre em nova aba)`}
                title={p.label}
                className="grid size-[42px] shrink-0 place-items-center rounded-full border-[1.5px] border-ink/20 bg-white text-ink transition duration-200 hover:-translate-y-0.5 hover:border-[#0036b2] hover:bg-[#0036b2] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0036b2]"
              >
                <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d={p.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/*
          Personagem: apoiado na base (a arte some num fade embaixo). No lg, encostado
          na borda esquerda, com a largura que cabe na metade da tela e em 90% da altura
          — a mão com a caneta chega à borda, como na referência. A caixa é um
          container (@container): os elementos de trás medem as distâncias em cqw.
          mt-20 no empilhado: espaço para os elementos que saem por cima da cabeça.
        */}
        <div
          ref={boxRef}
          className="@container relative mt-20 w-[min(112%,620px)] max-w-none lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[min(50vw,calc(90svh*919/939))]"
        >
          <AboutPops />
          <img
            src="/sobre/heitor-desenhando.webp"
            alt="Avatar 3D de Heitor Mota desenhando com uma caneta digital"
            width={919}
            height={939}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="about-char relative z-[2] block w-full select-none"
          />
        </div>
      </div>
    </section>
  )
}
