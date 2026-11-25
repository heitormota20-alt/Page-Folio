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
 * Ao rolar, o card encolhe, a tipografia some e a assinatura é escrita.
 */
export function Hero() {
  const cardRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const signatureLayerRef = useRef<HTMLDivElement>(null)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ready = useHeroReady(imgRef)

  useHeroScrollScale(cardRef, undefined, textRef)
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
              <p className="hero-greeting hero-fade font-['Inter',sans-serif] leading-none font-light whitespace-nowrap text-[#111] uppercase">
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
        </section>
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
