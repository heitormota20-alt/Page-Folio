import { type CSSProperties, type RefObject, useEffect, useRef } from 'react'
import { AboutPops } from './about-pops'

/**
 * Currículo para download. Coloque o PDF em public/ com este nome (ou troque o
 * caminho); `download` sugere o nome do arquivo salvo.
 */
const CV_URL = '/curriculo-heitor-mota.pdf'
const CV_FILENAME = 'Curriculo-Heitor-Mota.pdf'

/** Lado esquerdo (o "H1" da seção), em duas vozes como os outros títulos. */
const TITLE = ['Prazer,', 'sou o Heitor']
/** Cargo, logo abaixo do título — de propósito com pouco destaque. */
const ROLE = 'Designer Gráfico Pleno'

/**
 * Perfis, em botões redondos ao lado do "Baixar currículo". Ícones: Simple Icons
 * (CC0). PREENCHER: os links dos perfis do Heitor (por ora, a página inicial de
 * cada site).
 */
const PROFILES = [
  {
    label: 'GitHub',
    href: 'https://github.com/',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    label: 'Behance',
    href: 'https://www.behance.net/',
    path: 'M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z',
  },
]

/** Lado direito (o "H2"): a apresentação, no texto do Heitor. */
const INTRO =
  'Mais de 5 anos criando soluções visuais que comunicam, convertem e ficam na memória. Formado em Design Gráfico pela FAM, com base técnica em Desenvolvimento Front-end pela UNINOVE. Acompanho cada projeto do conceito criativo à entrega final.'

/**
 * Marca o elemento com o atributo `data-<flag>` quando `ratio` dele está na tela, e
 * tira quando ele sai por completo — a entrada se repete a cada chegada. Com
 * movimento reduzido o CSS já mostra tudo no lugar, sem animação.
 */
function useEnterFlag(ref: RefObject<HTMLElement | null>, flag: string, ratio: number) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= ratio) el.dataset[flag] = ''
        else if (!entry.isIntersecting) delete el.dataset[flag]
      },
      { threshold: [0, ratio] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, flag, ratio])
}

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
