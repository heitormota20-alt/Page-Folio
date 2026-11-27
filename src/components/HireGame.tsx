import { type PointerEvent as RPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HIRE_GLYPHS, HIRE_VIEWBOX, type HireNode } from './hire-glyphs'

/*
  Jogo da caneta do rodapé (inspirado em bezier.method.ac): vetorizar "CONTRATE-ME"
  na Anton. Cada letra aparece como uma guia grossa com os nós marcados; o visitante
  refaz o contorno com a caneta — clique cria um nó de canto (reta), arrastar cria
  um nó de curva com as alças (espelhadas, como na caneta do Illustrator/Figma) — e
  fecha clicando no primeiro nó. O próximo nó pulsa; o clique "gruda" nele se cair
  perto (não é preciso ser designer). Arrastando perto da alça certa, ela encaixa;
  longe, fica a do visitante — e a precisão da letra mostra isso.

  Letra fechada (todos os contornos): ela é preenchida. Dá para desfazer (botão ou
  Ctrl/⌘+Z), recomeçar e pedir "vetorizar o resto". Em telas estreitas a câmera
  acompanha a letra atual; no fim, mostra a palavra inteira.
*/

type Node = { x: number; y: number; ix: number; iy: number; ox: number; oy: number }
const toNode = (n: HireNode): Node => ({ x: n[0], y: n[1], ix: n[2], iy: n[3], ox: n[4], oy: n[5] })

const W = HIRE_VIEWBOX.width
const H = HIRE_VIEWBOX.height

/** Todos os contornos, em ordem: cada um é uma etapa do jogo. */
const STEPS = HIRE_GLYPHS.flatMap((g, glyph) => g.contours.map((c) => ({ glyph, nodes: c.map(toNode) })))
const TOTAL_NODES = STEPS.reduce((s, st) => s + st.nodes.length, 0)

/** Caixa de cada letra (para a câmera). */
const GLYPH_BOX = HIRE_GLYPHS.map((g) => {
  const xs = g.contours.flatMap((c) => c.map((n) => n[0]))
  return { x0: Math.min(...xs), x1: Math.max(...xs) }
})

const hasHandles = (n: Node) => n.ix !== 0 || n.iy !== 0 || n.ox !== 0 || n.oy !== 0

function seg(a: Node, b: Node) {
  if (a.ox === 0 && a.oy === 0 && b.ix === 0 && b.iy === 0) return `L${b.x} ${b.y}`
  return `C${a.x + a.ox} ${a.y + a.oy} ${b.x + b.ix} ${b.y + b.iy} ${b.x} ${b.y}`
}
function pathD(nodes: Node[], closed: boolean) {
  if (!nodes.length) return ''
  let d = `M${nodes[0].x} ${nodes[0].y}`
  for (let i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i])
  if (closed && nodes.length > 1) d += seg(nodes[nodes.length - 1], nodes[0]) + 'Z'
  return d
}
const IDEAL_D = HIRE_GLYPHS.map((g) => g.contours.map((c) => pathD(c.map(toNode), true)).join(''))

/** Precisão das alças de um contorno (0–1), ou null se ele só tem retas. */
function accuracy(placed: Node[], ideal: Node[]) {
  let sum = 0
  let count = 0
  ideal.forEach((id, i) => {
    if (!hasHandles(id)) return
    const p = placed[i]
    const ref = Math.hypot(id.ix, id.iy) + Math.hypot(id.ox, id.oy)
    const err = Math.hypot(p.ix - id.ix, p.iy - id.iy) + Math.hypot(p.ox - id.ox, p.oy - id.oy)
    sum += Math.min(1, err / ref)
    count++
  })
  return count ? 1 - sum / count : null
}

interface Done {
  glyph: number
  d: string
  acc: number | null
}
interface State {
  step: number
  placed: Node[]
  done: Done[]
}
const START: State = { step: 0, placed: [], done: [] }

/** Fecha o contorno atual e passa para o próximo. */
function closeContour(s: State): State {
  const st = STEPS[s.step]
  return {
    step: s.step + 1,
    placed: [],
    done: [...s.done, { glyph: st.glyph, d: pathD(s.placed, true), acc: accuracy(s.placed, st.nodes) }],
  }
}

/** Raio (px de tela) em que o clique gruda no próximo nó. */
const SNAP_PX = 30
/** Arrasto menor que isso (px) é um clique. */
const CLICK_PX = 6
/** Alças menores que isso (px de tela) encaixam sozinhas — não dá para arrastar tão pouco. */
const SMALL_HANDLE_PX = 14

const PEN_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M3 3l5 13 4-4 6 6 3-3-6-6 4-4z' fill='%230b1a24' stroke='white' stroke-width='1.5' stroke-linejoin='round'/></svg>\") 3 3, crosshair"

export function HireGame({ onComplete }: { onComplete?: (accuracy: number | null) => void }) {
  const [state, setState] = useState<State>(START)
  const history = useRef<State[]>([])
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null)
  const [miss, setMiss] = useState(0)
  const [auto, setAuto] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [unit, setUnit] = useState(W / 1000) // unidades por px de tela
  const [follow, setFollow] = useState(false) // câmera acompanhando a letra (telas estreitas)
  const [vb, setVb] = useState<[number, number, number, number]>([0, 0, W, H])
  const vbRef = useRef(vb)

  const finished = state.step >= STEPS.length
  const step = STEPS[Math.min(state.step, STEPS.length - 1)]
  const nodes = step.nodes
  const expected = state.placed.length < nodes.length ? state.placed.length : 0
  const closing = !finished && state.placed.length === nodes.length

  // cada jogada guarda o estado anterior (fora do updater do setState: no StrictMode
  // ele roda duas vezes e duplicaria o histórico)
  const apply = (next: (s: State) => State) => {
    history.current.push(state)
    setState(next(state))
  }

  // ——— medidas: unidades por px e modo da câmera ———
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(() => {
      const w = box.clientWidth
      setFollow(w < 720)
      const ctm = svgRef.current?.getScreenCTM()
      if (ctm) setUnit(1 / ctm.a)
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // ——— câmera: palavra inteira, ou a letra atual (telas estreitas), com transição ———
  const target = useMemo<[number, number, number, number]>(() => {
    const box = boxRef.current
    if (!follow || finished || !box) return [0, 0, W, H]
    const vw = H * (box.clientWidth / Math.max(1, box.clientHeight))
    const g = GLYPH_BOX[step.glyph]
    const cx = (g.x0 + g.x1) / 2
    const x = Math.min(Math.max(cx - vw / 2, 0), Math.max(0, W - vw))
    return [x, 0, vw, H]
  }, [follow, finished, step.glyph])
  useEffect(() => {
    let frame = 0
    const tick = () => {
      const cur = vbRef.current
      const next = cur.map((v, i) => v + (target[i] - v) * 0.14) as [number, number, number, number]
      const done = next.every((v, i) => Math.abs(v - target[i]) < 1)
      vbRef.current = done ? target : next
      setVb(vbRef.current)
      if (!done) frame = requestAnimationFrame(tick)
      else {
        const ctm = svgRef.current?.getScreenCTM()
        if (ctm) setUnit(1 / ctm.a)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  // ——— fim do jogo ———
  const avg = useMemo(() => {
    const accs = state.done.map((d) => d.acc).filter((a): a is number => a !== null)
    return accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null
  }, [state.done])
  const reported = useRef(false)
  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true
      onComplete?.(avg)
    }
    if (!finished) reported.current = false
  }, [finished, avg, onComplete])

  // ——— vetorizar o resto: os nós certos, um a um ———
  useEffect(() => {
    if (!auto) return
    if (finished) {
      setAuto(false)
      return
    }
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(
      () => {
        setState((s) => {
          if (s.step >= STEPS.length) return s
          const st = STEPS[s.step]
          if (s.placed.length === st.nodes.length) return closeContour(s)
          if (instant) return closeContour({ ...s, placed: st.nodes })
          return { ...s, placed: [...s.placed, st.nodes[s.placed.length]] }
        })
      },
      instant ? 0 : 28,
    )
    return () => clearTimeout(t)
  }, [auto, finished, state])

  // ——— desfazer com o teclado ———
  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (prev) setState(prev)
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !auto) {
        const r = boxRef.current?.getBoundingClientRect()
        if (r && r.bottom > 0 && r.top < window.innerHeight) {
          e.preventDefault()
          undo()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, auto])

  // ——— caneta ———
  const toUser = (e: RPointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }
  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (finished || auto) return
    const p = toUser(e)
    if (!p) return
    const t = nodes[expected]
    if (Math.hypot(p.x - t.x, p.y - t.y) > SNAP_PX * unit) {
      setMiss((m) => m + 1)
      return
    }
    if (closing) {
      apply(closeContour)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ x: t.x, y: t.y, dx: 0, dy: 0 })
  }
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    const p = toUser(e)
    if (!p) return
    setHover(p)
    if (drag) setDrag({ ...drag, dx: p.x - drag.x, dy: p.y - drag.y })
  }
  const onUp = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag) return
    // a alça vem da posição exata em que o botão foi solto (o estado do último
    // movimento pode ainda não ter sido desenhado)
    const p = toUser(e)
    const dx = p ? p.x - drag.x : drag.dx
    const dy = p ? p.y - drag.y : drag.dy
    const ideal = nodes[expected]
    const len = Math.hypot(dx, dy)
    let node: Node
    const refLen = Math.hypot(ideal.ox, ideal.oy) || Math.hypot(ideal.ix, ideal.iy)
    if (!hasHandles(ideal) || refLen < SMALL_HANDLE_PX * unit) {
      // nó de canto (o arrasto não conta), ou alças pequenas demais para arrastar
      // (alguns cantinhos da Anton têm 2–3 px na tela): encaixa o nó certo
      node = { ...ideal }
    } else if (len < CLICK_PX * unit) {
      node = { x: ideal.x, y: ideal.y, ix: 0, iy: 0, ox: 0, oy: 0 } // clicou numa curva: vira reta
    } else {
      // caneta: o arrasto é a alça de saída; a de entrada, espelhada
      const ref = ideal.ox !== 0 || ideal.oy !== 0 ? { x: ideal.ox, y: ideal.oy } : { x: -ideal.ix, y: -ideal.iy }
      const cos = (dx * ref.x + dy * ref.y) / (len * Math.hypot(ref.x, ref.y))
      const ratio = len / Math.hypot(ref.x, ref.y)
      node =
        cos > 0.85 && ratio > 0.4 && ratio < 2.5
          ? { ...ideal } // perto da alça certa: encaixa
          : { x: ideal.x, y: ideal.y, ix: -dx, iy: -dy, ox: dx, oy: dy }
    }
    apply((s) => ({ ...s, placed: [...s.placed, node] }))
    setDrag(null)
  }

  // ——— desenho ———
  const u = unit
  const doneByGlyph = useMemo(() => {
    const m = new Map<number, Done[]>()
    for (const d of state.done) m.set(d.glyph, [...(m.get(d.glyph) ?? []), d])
    return m
  }, [state.done])
  const placedD = pathD(state.placed, false)
  const last = state.placed[state.placed.length - 1]
  const exp = nodes[expected]
  // prévia: do último nó até o cursor (ou até o nó sendo arrastado, já com a curva)
  let preview = ''
  if (!finished && last) {
    if (drag) {
      const n: Node = { x: drag.x, y: drag.y, ix: -drag.dx, iy: -drag.dy, ox: drag.dx, oy: drag.dy }
      preview = `M${last.x} ${last.y}` + seg(last, n)
    } else if (hover) {
      preview = `M${last.x} ${last.y}L${hover.x} ${hover.y}`
    }
  }
  const hintRaw = exp && hasHandles(exp) && !closing ? (exp.ox !== 0 || exp.oy !== 0 ? { x: exp.ox, y: exp.oy } : { x: -exp.ix, y: -exp.iy }) : null
  // alça minúscula: sem dica (o nó encaixa sozinho)
  const hintVec = hintRaw && Math.hypot(hintRaw.x, hintRaw.y) >= SMALL_HANDLE_PX * u ? hintRaw : null
  const glyphsDone = new Set([...doneByGlyph].filter(([g, ds]) => ds.length === HIRE_GLYPHS[g].contours.length).map(([g]) => g))

  return (
    <div className="w-full select-none">
      <div ref={boxRef} className="relative h-[180px] w-full sm:h-auto sm:aspect-[10514/1840]">
        <svg
          ref={svgRef}
          viewBox={vb.join(' ')}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="CONTRATE-ME"
          className="h-full w-full touch-none overflow-visible"
          style={{ cursor: finished || auto ? 'default' : PEN_CURSOR }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={() => setHover(null)}
        >
          {/* Guias: a letra atual mais forte */}
          {HIRE_GLYPHS.map((_, gi) =>
            glyphsDone.has(gi) ? null : (
              <path
                key={`guide-${gi}`}
                d={IDEAL_D[gi]}
                fill="none"
                stroke="#fff"
                strokeOpacity={!finished && gi === step.glyph ? 0.3 : 0.12}
                strokeWidth={7}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}

          {/* Letras prontas: preenchidas; contornos prontos de uma letra em andamento: traço coral */}
          {[...doneByGlyph].map(([g, ds]) =>
            glyphsDone.has(g) ? (
              <path key={`fill-${g}`} className="hire-fill" d={ds.map((d) => d.d).join('')} fill="#fff" />
            ) : (
              ds.map((d, i) => (
                <path key={`part-${g}-${i}`} d={d.d} fill="none" stroke="#FF606A" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
              ))
            ),
          )}

          {!finished && (
            <>
              {/* Nós da guia (os que faltam) */}
              {nodes.map((n, i) =>
                i < state.placed.length && !(closing && i === 0) ? null : (
                  <circle key={`t-${i}`} cx={n.x} cy={n.y} r={3.5 * u} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                ),
              )}
              {/* Dica da alça: arraste até aqui */}
              {hintVec && !drag && (
                <g opacity={0.7}>
                  <line x1={exp.x} y1={exp.y} x2={exp.x + hintVec.x} y2={exp.y + hintVec.y} stroke="#9db7ff" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  <circle cx={exp.x + hintVec.x} cy={exp.y + hintVec.y} r={3.5 * u} fill="#9db7ff" />
                </g>
              )}
              {/* Próximo nó (treme num clique longe); o anel que pulsa fica fora do SVG, logo abaixo */}
              <g key={`exp-${miss}`} className={miss ? 'hire-miss' : undefined} style={{ transformOrigin: `${exp.x}px ${exp.y}px` }}>
                <circle cx={exp.x} cy={exp.y} r={3 * u} fill="#FF606A" />
              </g>

              {/* O que o visitante desenhou */}
              {preview && <path d={preview} fill="none" stroke="#FF606A" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray={drag ? undefined : '5 5'} vectorEffect="non-scaling-stroke" />}
              {placedD && <path d={placedD} fill="none" stroke="#FF606A" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />}
              {state.placed.map((n, i) => (
                <rect key={`a-${i}`} x={n.x - 3.5 * u} y={n.y - 3.5 * u} width={7 * u} height={7 * u} fill="#fff" stroke="#FF606A" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              ))}
              {/* Alças: do nó sendo arrastado, ou do último */}
              {(() => {
                const n = drag ? { x: drag.x, y: drag.y, ix: -drag.dx, iy: -drag.dy, ox: drag.dx, oy: drag.dy } : last
                if (!n || !hasHandles(n)) return null
                return (
                  <g>
                    <line x1={n.x + n.ix} y1={n.y + n.iy} x2={n.x + n.ox} y2={n.y + n.oy} stroke="#9db7ff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    <circle cx={n.x + n.ix} cy={n.y + n.iy} r={3.5 * u} fill="#9db7ff" />
                    <circle cx={n.x + n.ox} cy={n.y + n.oy} r={3.5 * u} fill="#9db7ff" />
                  </g>
                )
              })()}
            </>
          )}
        </svg>
        {/*
          Anel pulsando no próximo nó: em HTML, por cima do SVG, porque animação
          dentro de SVG não roda no compositor (repintaria o jogo a cada quadro).
          A caixa tem a proporção do viewBox (a câmera garante), então a posição
          em % do viewBox cai em cima do nó.
        */}
        {!finished && exp && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${((exp.x - vb[0]) / vb[2]) * 100}%`, top: `${((exp.y - vb[1]) / vb[3]) * 100}%` }}
          >
            <span className="hire-pulse block size-full rounded-full border-2 border-[#FF606A]" />
          </span>
        )}
      </div>

      {/* Instruções, progresso e botões */}
      <div className="mt-4 flex flex-col items-center gap-3 text-center xl:flex-row xl:justify-between xl:text-left">
        <p className="text-[12px] leading-snug text-white/70 sm:text-[13px]">
          {finished ? (
            <>
              <strong className="font-semibold text-white">CONTRATE-ME vetorizado!</strong>
              {avg !== null && <> Precisão das curvas: {Math.round(avg * 100)}%.</>}
            </>
          ) : (
            <>
              Vetorize com a caneta: <strong className="font-semibold text-white">clique</strong> nos pontos,{' '}
              <strong className="font-semibold text-white">arraste</strong> para curvar e feche no primeiro.
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!finished && (
            <span className="mr-1 text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase tabular-nums">
              Letra {step.glyph + 1}/{HIRE_GLYPHS.length} · {state.placed.length}/{nodes.length} nós
            </span>
          )}
          <button
            type="button"
            onClick={undo}
            disabled={auto || history.current.length === 0}
            className="rounded-full border border-white/25 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition hover:border-white disabled:opacity-35"
          >
            Desfazer
          </button>
          <button
            type="button"
            onClick={() => {
              history.current = []
              setAuto(false)
              setState(START)
            }}
            disabled={auto || (state.step === 0 && state.placed.length === 0)}
            className="rounded-full border border-white/25 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition hover:border-white disabled:opacity-35"
          >
            Recomeçar
          </button>
          {!finished && (
            <button
              type="button"
              onClick={() => {
                history.current.push(state)
                setAuto(true)
              }}
              disabled={auto}
              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-[#0036b2] uppercase transition hover:bg-[#FF606A] hover:text-[#0b1a24] disabled:opacity-60"
            >
              Vetorizar o resto pra mim
            </button>
          )}
        </div>
      </div>
      <p className="sr-only">
        Mini-jogo: vetorizar a palavra CONTRATE-ME com a caneta, ponto a ponto ({TOTAL_NODES} nós). Use o botão
        “Vetorizar o resto pra mim” para completar automaticamente.
      </p>
    </div>
  )
}
