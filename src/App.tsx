import { ScrubVideo } from './components/ScrubVideo'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Sections } from './components/Sections'
import { useLenis } from './hooks/useLenis'

export default function App() {
  useLenis()

  return (
    <>
      <ScrubVideo />

      <Navbar />

      <main className="relative z-[2]">
        <Hero />
        <Sections />
      </main>
    </>
  )
}
