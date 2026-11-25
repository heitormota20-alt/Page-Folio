import { type RefObject, useEffect } from 'react'

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
/** Passa um pouco do ponto e volta — o "assentar" das cartas. */
const easeOutBack = (t: number, s = 1.25) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2

/** Inércia: tempo (s) que o movimento leva para alcançar a rolagem. */
const LAG = 0.14

// Linha do tempo da cena fixa (progresso 0–1 enquanto ela está parada na tela)
const CARDS_START = 0.1 // título sozinho no centro até aqui
const CARD_DURATION = 0.42 // tempo de voo de cada card
// cada card ainda tem `data-delay` (0–0,18) → o último assenta em ~0,7; o resto é pausa
const TITLE_FADE: [number, number] = [0.18, 0.44]

const LINE_STAGGER = 0.22
/** Os cards partem de quanto abaixo do lugar (fração da altura da tela). */
const START_DROP = 0.8
/** Começam agrupados: fração da distância até o centro que é "puxada" para dentro. */
const START_GATHER = 0.55
/** Inclinação inicial = inclinação final × isto. */
const START_TILT = 4

interface Card {
  el: HTMLElement
  rot: number
  y: number
  delay: number
  cx: number // centro do card em relação ao centro do grupo (px)
}

/**
 * Cena da seção "No que eu posso te ajudar" (referência: vídeo enviado).
 *
 * O palco (`sceneRef`) é alto; dentro dele, um painel sticky de 100svh fica
 * parado na tela. Dois progressos, os dois com inércia (LAG):
 *  - entrada: enquanto o painel sobe até parar, as linhas do título ([data-line])
 *    sobem por trás das suas janelas;
 *  - cena: com o painel parado, cada [data-card] voa de baixo em arco (x e y com
 *    curvas diferentes), girando de START_TILT× a inclinação até `data-rot`,
 *    passa um pouco do ponto e assenta em `data-y`; o título ([data-title]) sobe
 *    de leve e se apaga por baixo deles. Depois, pausa com tudo assentado.
 *
 * Com prefers-reduced-motion não há cena: o layout fica estático (ver classes
 * motion-reduce: em Services.tsx) e nenhum transform é aplicado.
 */
export function useServicesScene(sceneRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lines = Array.from(scene.querySelectorAll<HTMLElement>('[data-line]'))
    const title = scene.querySelector<HTMLElement>('[data-title]')
    const group = scene.querySelector<HTMLElement>('[data-cards]')
    const cards: Card[] = Array.from(scene.querySelectorAll<HTMLElement>('[data-card]')).map(
      (el) => ({
        el,
        rot: Number(el.dataset.rot) || 0,
        y: Number(el.dataset.y) || 0,
        delay: Number(el.dataset.delay) || 0,
        cx: 0,
      }),
    )

    let vh = window.innerHeight || 1
    const layout = () => {
      vh = window.innerHeight || 1
      const half = (group?.clientWidth ?? 0) / 2
      for (const c of cards) c.cx = c.el.offsetLeft + c.el.offsetWidth / 2 - half
    }

    // alvos (direto da rolagem) e valores suavizados (o que é desenhado)
    let entryTarget = 0
    let sceneTarget = 0
    let entry = 0
    let prog = 0

    const measure = () => {
      const r = scene.getBoundingClientRect()
      entryTarget = clamp01((vh - r.top) / vh) // 0: palco na borda de baixo · 1: painel parou
      sceneTarget = clamp01(-r.top / Math.max(1, r.height - vh)) // 0→1 enquanto parado
    }

    const render = () => {
      // título: linhas sobem durante a entrada
      const lp = clamp01(entry / 0.85)
      const span = 1 - LINE_STAGGER * (lines.length - 1)
      lines.forEach((line, i) => {
        const e = easeOutCubic(clamp01((lp - i * LINE_STAGGER) / span))
        line.style.transform = e < 1 ? `translate3d(0, ${(1 - e) * 125}%, 0)` : ''
      })

      // título: sobe um pouco e se apaga enquanto os cards o cobrem
      if (title) {
        const f = easeInOutSine(clamp01((prog - TITLE_FADE[0]) / (TITLE_FADE[1] - TITLE_FADE[0])))
        title.style.opacity = `${1 - f}`
        title.style.transform = f ? `translate3d(0, ${-f * vh * 0.06}px, 0) scale(${1 - f * 0.05})` : ''
      }

      // cards: voo em arco, giro e assentamento
      for (const c of cards) {
        const t = clamp01((prog - CARDS_START - c.delay) / CARD_DURATION)
        const ty = easeOutBack(t) // passa do ponto e volta
        const tx = easeInOutSine(t) // abre para os lados em outro ritmo → arco
        const tr = easeOutCubic(t)
        const x = -c.cx * START_GATHER * (1 - tx)
        const y = c.y + (1 - ty) * vh * START_DROP
        const rot = c.rot * (START_TILT - (START_TILT - 1) * tr)
        const scale = 0.88 + 0.12 * tr
        c.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`
      }
    }

    // inércia exponencial, independente do FPS; o loop para quando alcança
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const k = 1 - Math.exp(-dt / LAG)
      entry += (entryTarget - entry) * k
      prog += (sceneTarget - prog) * k
      if (Math.abs(entryTarget - entry) < 1e-4) entry = entryTarget
      if (Math.abs(sceneTarget - prog) < 1e-4) prog = sceneTarget
      render()
      frame = entry === entryTarget && prog === sceneTarget ? 0 : requestAnimationFrame(tick)
    }
    const onScroll = () => {
      measure()
      if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }
    const onResize = () => {
      layout()
      onScroll()
    }

    layout()
    measure()
    entry = entryTarget
    prog = sceneTarget
    render()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
    }
  }, [sceneRef])
}
