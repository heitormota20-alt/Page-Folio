import { useRef } from 'react'
import { ScrubVideo } from './ScrubVideo'
import { useHeroScrollScale } from '../hooks/useHeroScrollScale'

export function Hero() {
  const cardRef    = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const textRef    = useRef<HTMLDivElement>(null)

  useHeroScrollScale(cardRef, overlayRef, textRef)

  return (
    <div
      ref={cardRef}
      className="fixed inset-0 z-[1] overflow-hidden will-change-transform"
    >
      <ScrubVideo />

      {/* Overlay de cor do bg — sobe levemente para integrar ao fundo */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-[3] bg-[#081722]"
        style={{ opacity: 0 }}
      />

      <section
        id="top"
        className="relative z-[2] flex min-h-[100svh] flex-col justify-center px-6 sm:px-10 lg:px-16"
      >
        {/* Texto que some conforme o card encolhe, deixando só o avatar */}
        <div
          ref={textRef}
          className="max-w-[46rem] [text-shadow:0_2px_30px_rgba(4,16,24,0.55)]"
        >
          <p className="mb-5 flex flex-row items-center gap-3 sm:mb-7 sm:gap-4">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-white/55 sm:w-16" />
            <span className="text-[10px] font-medium tracking-[0.16em] text-white/80 uppercase sm:text-[13px] sm:tracking-[0.22em]">
              Seja muito bem vindo ao:
            </span>
          </p>

          <h1 className="font-heading text-[clamp(2rem,7.5vw,6.5rem)] leading-[1.06] tracking-[-0.01em] text-white uppercase">
            <span className="block">Page</span>
            <span className="block">Fólio</span>
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-white/85 sm:mt-9 sm:text-base">
            Aqui é o lugar onde você irá encontrar os meus principais projetos de
            teste e projetos validados que obtiveram a maior performance.
          </p>
        </div>
      </section>
    </div>
  )
}
