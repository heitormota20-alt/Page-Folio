import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const LINKS = [
  { label: 'Sobre mim', href: '#sobre' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Contatos', href: '#contatos' },
]

/** Recolhe no hambúrguer depois desta fração do viewport de scroll (2ª dobra)… */
const COLLAPSE_AT = 0.25
/** …e volta a abrir abaixo desta (folga evita piscar no limite). */
const EXPAND_AT = 0.18

const EASE = 'cubic-bezier(0.77, 0, 0.18, 1)'
const STAGGER = 55 // ms entre um botão e outro

const glass =
  'border border-white/10 bg-white/5 text-white/90 backdrop-blur-md hover:border-white/25 hover:bg-white/12 hover:text-white'

/**
 * No topo: os três botões. Na segunda dobra, eles deslizam até o canto e se
 * recolhem dentro de um único botão hambúrguer; clicar nele faz os botões
 * saírem de novo (e o ícone vira um X).
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const collapsed = scrolled && !open

  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const burgerRef = useRef<HTMLButtonElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  // distância de cada botão até o centro do hambúrguer + recuo quando aberto
  const [geo, setGeo] = useState({ dx: LINKS.map(() => 0), shift: 0 })

  useEffect(() => {
    const onScroll = () => {
      const r = window.scrollY / (window.innerHeight || 1)
      setScrolled((prev) => (prev ? r > EXPAND_AT : r > COLLAPSE_AT))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // de volta ao topo, o estado "aberto" deixa de existir
  useEffect(() => {
    if (!scrolled) setOpen(false)
  }, [scrolled])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Mede no layout (offsetLeft ignora transform), no load das fontes e no resize
  useLayoutEffect(() => {
    const measure = () => {
      const burger = burgerRef.current
      const row = rowRef.current
      if (!burger || !row) return
      const target = burger.offsetLeft + burger.offsetWidth / 2
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0
      setGeo({
        dx: linkRefs.current.map((a) => (a ? target - (a.offsetLeft + a.offsetWidth / 2) : 0)),
        shift: burger.offsetWidth + gap,
      })
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-10 flex flex-row items-center justify-end px-3 py-3 sm:px-6 sm:py-6">
      <nav id="menu" className="relative">
        <div
          ref={rowRef}
          inert={collapsed}
          className="flex flex-row items-center gap-1.5 sm:gap-3"
        >
          {LINKS.map((link, i) => {
            const delay = (LINKS.length - 1 - i) * STAGGER // o mais perto do canto vai primeiro
            const transform = collapsed
              ? `translateX(${geo.dx[i]}px) scale(0.3)`
              : open
                ? `translateX(${-geo.shift}px)`
                : 'none'
            return (
              <a
                key={link.href}
                ref={(el) => {
                  linkRefs.current[i] = el
                }}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  transform,
                  opacity: collapsed ? 0 : 1,
                  transitionProperty: 'transform, opacity, background-color, border-color, color',
                  transitionDuration: `560ms, ${collapsed ? 260 : 320}ms, 200ms, 200ms, 200ms`,
                  transitionTimingFunction: `${EASE}, ease, ease, ease, ease`,
                  // recolhendo: some quando chega no canto; abrindo: aparece já saindo
                  transitionDelay: `${delay}ms, ${collapsed ? delay + 260 : delay}ms, 0ms, 0ms, 0ms`,
                }}
                className={`rounded-lg px-3 py-2.5 text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase motion-reduce:transition-none sm:rounded-xl sm:px-6 sm:py-3.5 sm:text-[13px] sm:tracking-[0.14em] ${glass}`}
              >
                {link.label}
              </a>
            )
          })}
        </div>

        {/* Hambúrguer — nasce onde os botões se recolhem */}
        <button
          ref={burgerRef}
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="menu"
          inert={!scrolled}
          onClick={() => setOpen((v) => !v)}
          style={{
            transform: scrolled ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.4)',
            opacity: scrolled ? 1 : 0,
            pointerEvents: scrolled ? 'auto' : 'none', // invisível no topo: não cobre o "Contatos"
            transitionProperty: 'transform, opacity, background-color, border-color',
            transitionDuration: '420ms, 300ms, 200ms, 200ms',
            transitionTimingFunction: `${EASE}, ease, ease, ease`,
            // aparece quando os botões terminam de chegar; some na hora ao voltar ao topo
            transitionDelay: scrolled ? '300ms, 300ms, 0ms, 0ms' : '0ms, 0ms, 0ms, 0ms',
          }}
          className={`absolute top-1/2 right-0 grid size-[34px] place-items-center rounded-lg motion-reduce:transition-none sm:size-[46px] sm:rounded-xl ${glass}`}
        >
          <span aria-hidden="true" className="relative block h-3 w-4 sm:h-3.5 sm:w-5">
            {[0, 1, 2].map((k) => (
              <span
                key={k}
                className="absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-[transform,opacity,top] duration-300 ease-out motion-reduce:transition-none"
                style={{
                  top: open ? '50%' : `${k * 50}%`,
                  transform: `translateY(-50%) ${open && k !== 1 ? `rotate(${k === 0 ? 45 : -45}deg)` : ''}`,
                  opacity: open && k === 1 ? 0 : 1,
                }}
              />
            ))}
          </span>
        </button>
      </nav>
    </header>
  )
}
