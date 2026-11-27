import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** O que aparece no pop-up de uma arte (todos os textos são do Heitor). */
export interface ArtInfo {
  /** Para quem foi feita. */
  client?: string
  /** Ano em que a arte foi feita. */
  year?: string
  /** Um descritivo leve: o que é a peça. */
  description?: string
  /** O intuito: para que o projeto serviu. */
  purpose?: string
  /** O quanto ele foi valioso para o cliente. */
  value?: string
}

interface Props {
  title: string
  info: ArtInfo
  /** A imagem clicada: o pop-up abre ao lado dela e o foco volta para ela ao fechar. */
  anchor: HTMLElement
  onClose: () => void
}

const GAP = 16
const MARGIN = 16
/** Abaixo disso, vira uma folha no pé da tela. */
const SHEET_BELOW = 720
/** Rolou mais que isso desde que abriu: fecha (a imagem já saiu do lugar). */
const SCROLL_CLOSE_PX = 40

const LABEL = 'flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.22em] text-white/60 uppercase'
const DOT = 'size-1.5 shrink-0 rounded-full bg-[#FF606A]'
const DD = 'mt-1.5 text-[14px] font-semibold'
/** Campo ainda sem texto. */
const EMPTY = 'font-normal text-white/40 italic'

function Field({ label, children }: { label: string; children?: string }) {
  return (
    <div>
      <p className={LABEL}>
        <span className={DOT} />
        {label}
      </p>
      {children ? (
        <p className="mt-1.5 text-[14px] leading-[1.55] text-white/90">{children}</p>
      ) : (
        <p className={`mt-1.5 text-[14px] leading-[1.55] ${EMPTY}`}>A preencher</p>
      )}
    </div>
  )
}

/**
 * Pop-up de uma arte de "Arquivos Visuais" (abre ao clicar na imagem): fundo
 * azul da página, cliente, ano, um descritivo leve, o intuito e o valor para o
 * cliente. Abre ao lado da imagem (à direita; sem espaço, à esquerda); em telas
 * estreitas, como uma folha no pé da tela. Fecha no ×, com Esc, clicando fora ou
 * rolando a página. Vai para o <body> (portal): dentro da seção, que tem
 * transformações, o position: fixed não seria relativo à tela.
 */
export function ArtPopup({ title, info, anchor, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const [sheet, setSheet] = useState(false)

  // posição: ao lado da imagem, dentro da tela
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (vw < SHEET_BELOW) {
      setSheet(true)
      return
    }
    const r = anchor.getBoundingClientRect()
    const w = el.offsetWidth
    const h = el.offsetHeight
    let left = r.right + GAP
    if (left + w > vw - MARGIN) left = r.left - GAP - w
    if (left < MARGIN) left = Math.min(Math.max(r.left + r.width / 2 - w / 2, MARGIN), vw - MARGIN - w)
    const top = Math.min(Math.max(r.top, MARGIN), vh - MARGIN - h)
    setPos({ left, top })
  }, [anchor])

  // foco no × ao abrir; Esc, clique fora e rolagem fecham
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const y0 = window.scrollY
    const close = (refocus: boolean) => {
      onClose()
      if (refocus) anchor.focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!ref.current?.contains(t) && !anchor.contains(t)) close(false)
    }
    const onScroll = () => {
      if (Math.abs(window.scrollY - y0) > SCROLL_CLOSE_PX) close(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll)
    }
  }, [anchor, onClose])

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="art-popup-title"
      className={`art-pop fixed z-[60] rounded-[22px] bg-[#0036b2] p-6 text-white shadow-[0_28px_70px_-16px_rgba(0,20,80,0.55)] ${
        sheet ? 'right-4 bottom-4 left-4' : 'w-[min(340px,calc(100vw-2rem))]'
      }`}
      // antes de medir: transparente (não "hidden" — escondido não recebe o foco)
      style={sheet ? undefined : pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, opacity: 0 }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={() => {
          onClose()
          anchor.focus({ preventScroll: true })
        }}
        aria-label="Fechar"
        className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white hover:text-[#0036b2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
        </svg>
      </button>

      <h3 id="art-popup-title" className="pr-10 font-['Anton',sans-serif] text-[30px] leading-none tracking-[0.005em] uppercase">
        {title}
      </h3>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-white/15 py-4">
        <div>
          <dt className={LABEL}>
            <span className={DOT} />
            Cliente
          </dt>
          <dd className={DD}>{info.client || <span className={EMPTY}>A preencher</span>}</dd>
        </div>
        <div>
          <dt className={LABEL}>
            <span className={DOT} />
            Ano
          </dt>
          <dd className={DD}>{info.year || <span className={EMPTY}>A preencher</span>}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-4">
        <Field label="Sobre a peça">{info.description}</Field>
        <Field label="Intuito">{info.purpose}</Field>
        <Field label="Valor para o cliente">{info.value}</Field>
      </div>
    </div>,
    document.body,
  )
}
