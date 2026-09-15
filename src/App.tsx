import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Sections } from './components/Sections'
import { Marquee } from './components/Marquee'
import { useLenis } from './hooks/useLenis'
import { useScrollLock } from './hooks/useScrollLock'

export default function App() {
  useLenis()
  useScrollLock()

  return (
    <>
      {/* Fundo fixo da segunda dobra — visível enquanto o hero encolhe */}
      <div className="fixed inset-0 z-0 flex flex-col justify-center gap-8 overflow-hidden bg-[#081722]">
        <Marquee text="LOREM IPSUM" direction="left" speed={24} />
        <Marquee text="LOREM IPSUM" direction="right" speed={18} />
      </div>

      <Hero />
      <Navbar />

      {/*
        Spacer = SCALE_END(50vh) + 100vh = 150vh
        Seções só entram no viewport após o hero terminar de encolher
      */}
      <div className="h-[150vh]" aria-hidden="true" />
      <Sections />
    </>
  )
}
