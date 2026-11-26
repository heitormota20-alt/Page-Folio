import { type RefObject, useEffect, useId, useRef, useState } from 'react'
import { CHARACTER_BOX } from './hero-layout'
import { Signature } from './Signature'
import { useHeroScrollScale, useScrollExit } from '../hooks/useHeroScrollScale'
import { useHeroField } from '../hooks/useHeroField'

const [CX, CY, CW, CH] = CHARACTER_BOX
/** Posição do personagem no quadro do design, em % (o palco escala junto). */
const CHARACTER_STYLE = {
  left: `${(CX / 1920) * 100}%`,
  top: `${(CY / 1080) * 100}%`,
  width: `${(CW / 1920) * 100}%`,
  height: `${(CH / 1080) * 100}%`,
}

/** Espera fontes e imagem antes da entrada — sem pulo de fonte nem personagem pela metade. */
function useHeroReady(imgRef: RefObject<HTMLImageElement | null>) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const img = imgRef.current
    const fonts = document.fonts
      ? Promise.all([document.fonts.load('100px Anton'), document.fonts.load('300 40px Inter')])
      : Promise.resolve()
    const image = img ? img.decode().catch(() => undefined) : Promise.resolve()
    // rede lenta: não segura a página em branco mais que isso
    const timeout = new Promise((r) => setTimeout(r, 2500))
    Promise.race([Promise.all([fonts, image]), timeout]).then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [imgRef])
  return ready
}

/**
 * Home — recriada do design (Home.psd / assets/design) em código: "PORTFÓLIO"
 * em Anton atrás e o avatar na frente, num quadro de 1920 × 1080 que escala com
 * a tela (classes .hero-* no index.css). O fundo e a palavra são um shader
 * (useHeroField): curvas de nível com manchas que seguem o mouse, como no
 * landonorris.com — onde a mancha passa, a palavra fica azul e ondula.
 *
 * Ao rolar, o card encolhe, a tipografia some, a home esmaece sob um véu da cor
 * da página e a assinatura (branca) é escrita por cima.
 */
export function Hero() {
  const cardRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const signatureLayerRef = useRef<HTMLDivElement>(null)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ready = useHeroReady(imgRef)

  useHeroScrollScale(cardRef, overlayRef, textRef)
  useScrollExit(signatureLayerRef)
  useHeroField(canvasRef, { cardRef, stageRef, ready })

  return (
    <>
      <div
        ref={cardRef}
        data-ready={ready || undefined}
        className="hero-card fixed inset-0 z-[1] overflow-hidden bg-white will-change-transform"
      >
        <section id="top" className="absolute inset-0">
          <h1 className="sr-only">Seja bem vindo ao meu portfólio</h1>

          {/* Fundo + "PORTFÓLIO" (WebGL) */}
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

          {/*
            Tipografia (some ao rolar). Com WebGL, o <text> do SVG fica invisível —
            serve de referência de layout e de fallback.
          */}
          <div ref={textRef} className="absolute inset-0">
            <div ref={stageRef} className="hero-type" aria-hidden="true">
              <p className="hero-greeting hero-fade font-['Inter',sans-serif] leading-none font-light whitespace-nowrap text-[#FF606A] uppercase">
                Seja bem vindo ao meu
              </p>
              <svg viewBox="0 0 1920 1080" className="absolute inset-0 h-full w-full overflow-visible">
                <defs>
                  {/* a palavra sobe de trás da linha de base */}
                  <clipPath id={`${uid}-word`}>
                    <rect x="-200" y="0" width="2320" height="836" />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${uid}-word)`}>
                  <text
                    className="hero-word"
                    x="-21.4"
                    y="824"
                    fill="#222"
                    style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 526, letterSpacing: -8.3 }}
                  >
                    PORTFÓLIO
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Personagem na frente de tudo */}
          <div className="hero-art pointer-events-none">
            <img
              ref={imgRef}
              src="/home/personagem.webp"
              alt="Avatar 3D de Heitor Mota"
              width={CW}
              height={CH}
              decoding="async"
              fetchPriority="high"
              className="hero-character absolute max-w-none select-none"
              style={CHARACTER_STYLE}
              draggable={false}
            />
          </div>

          {/* Elementos decorativos — acima do personagem */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">

            {/* Hashtag — esquerda, sobrepondo o "P" do PORTFÓLIO */}
            <div className="hero-float hero-float-a absolute" style={{ left: '-1%', top: '26%' }}>
              <svg style={{ width: 'calc(var(--ut) * 220)', height: 'auto' }} viewBox="181 47 130 132" fill="none">
                <path d="M232,62 C228,100 222,135 214,168" stroke="#FF606A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M274,58 C270,98 263,132 256,162" stroke="#FF606A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M196,100 C230,96 265,94 300,93" stroke="#FF606A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M192,136 C226,133 258,131 292,130" stroke="#FF606A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Seta curva — direita, sobrepondo o "LIO" do PORTFÓLIO */}
            <div className="hero-float hero-float-c absolute" style={{ right: '-2%', top: '6%' }}>
              <svg style={{ width: 'calc(var(--ut) * 240)', height: 'auto' }} viewBox="669 105 120 156" fill="none">
                <path d="M676,150 C700,112 782,118 780,178 C778,214 752,236 716,236" stroke="#FF606A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M736,216 L716,236 L738,254" stroke="#FF606A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Seta loop — centro-esquerda inferior, parcialmente cortada */}
            <div className="hero-float hero-float-b absolute" style={{ left: '26%', bottom: '-12%' }}>
              <svg style={{ width: 'calc(var(--ut) * 230)', height: 'auto' }} viewBox="158 411 131 94" fill="none">
                <path d="M182,498 C165,470 175,432 205,425 C232,418 240,448 222,462 C205,476 195,450 215,438 C240,422 265,440 282,455" stroke="#FF606A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M259,461 L282,455 L276,432" stroke="#FF606A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Selo circular — canto inferior direito */}
            <div className="hero-float hero-float-d absolute hidden sm:block" style={{ right: '3%', bottom: '6%' }}>
              <svg style={{ width: 'calc(var(--ut) * 120)', height: 'auto' }} viewBox="718 343 154 154" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="hero-circ" d="M795,420 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0"/>
                </defs>
                <circle cx="795" cy="420" r="70" fill="#FF606A"/>
                <text fontFamily="Arial Black, Helvetica, sans-serif" fontWeight="900" fontSize="10" letterSpacing="0.6" fill="#fff">
                  <textPath href="#hero-circ" startOffset="0">GET STARTED OF FREE • GET STARTED OF FREE •</textPath>
                </text>
                <g fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M768,448 C778,430 786,410 790,400 C793,392 786,390 784,398 C782,410 790,430 800,428 C810,426 815,405 822,398"/>
                  <path d="M808,398 L822,398 L822,412"/>
                </g>
              </svg>
            </div>

          </div>
        </section>

        {/* Véu da cor da página: ao encolher, a home esmaece para a assinatura ter leitura */}
        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px bg-page"
          style={{ opacity: 0 }}
        />
      </div>

      {/*
        Assinatura escrita pelo scroll — numa camada própria, fora do card (que tem
        overflow-hidden), para ser bem maior que ele e transbordar, como na
        referência. Centrada no card; depois do pouso sobe junto com ele.
      */}
      <div
        ref={signatureLayerRef}
        className="pointer-events-none fixed inset-0 z-[3] flex items-center justify-center"
      >
        <Signature cardRef={cardRef} className="w-[92vw] translate-y-[4%] sm:w-[72vw]" />
      </div>
    </>
  )
}
