import { useRef } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Sections } from './components/Sections'
import { Marquee } from './components/Marquee'
import { TopoLines } from './components/TopoLines'
import { useLenis } from './hooks/useLenis'
import { useScrollLock } from './hooks/useScrollLock'
import { usePageThemes } from './hooks/usePageTheme'
import { useScrollExit } from './hooks/useHeroScrollScale'
import { usePauseOffscreen } from './hooks/usePauseOffscreen'

export default function App() {
  useLenis()
  useScrollLock()
  usePageThemes() // tema claro/escuro por seção (data-theme)
  usePauseOffscreen() // animações infinitas param fora da tela ([data-pause-offscreen])

  const marqueeRef = useRef<HTMLDivElement>(null)
  useScrollExit(marqueeRef)

  return (
    <>
      {/* Fundo contínuo da página inteira: cor + curvas de nível */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-page">
        <TopoLines />
      </div>

      {/* Letreiro da segunda dobra — depois do pouso, sobe junto com o card */}
      <div
        ref={marqueeRef}
        data-pause-offscreen=""
        className="pointer-events-none fixed inset-0 z-0 flex flex-col justify-center gap-8 overflow-hidden"
      >
        <Marquee text="Uma frase legalzinha que um dinzainer diria" direction="left" speed={24} />
        <Marquee text="Uma frase legalzinha que um dinzainer diria" direction="right" speed={18} />
      </div>

      <Hero />
      <Navbar />

      {/*
        Spacer = SCALE_END(50vh) + 100vh = 150vh.
        No pouso do card (scroll = 50vh) as seções estão na borda de baixo da
        tela; dali em diante card, letreiro e seções sobem juntos — sem corte.
      */}
      <div className="h-[150vh]" aria-hidden="true" />
      <Sections />
    </>
  )
}
