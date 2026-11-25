import { type RefObject, useEffect } from 'react'
import { SCALE_END } from './useHeroScrollScale'
import { LEVELS, LEVEL_GAP, makeWaves, topoTime, wavePhase } from './topo'

/** Intensidade das linhas (opacidade do canvas) enquanto aparecem por inteiro. */
const BASE_OPACITY = 0.14
/**
 * Na segunda dobra as linhas vão sumindo: inteiras até o pouso do card
 * (SCALE_END) e apagadas por completo em FADE_OUT_END (frações de viewport de
 * scroll). Apagadas, o desenho para.
 */
const FADE_OUT_START = SCALE_END
const FADE_OUT_END = 1.0

/** Tamanho da célula da grade, em px de tela (resolução das curvas). */
const CELL = 8
/** Limite de quadros — o movimento é lento (≈0,25px por quadro), 24fps sobra. */
const FPS = 24

/**
 * Desenha curvas de nível animadas (line art topográfico) num <canvas> — relevo
 * em ./topo (o mesmo do fundo da home).
 * É o fundo da página inteira; só não roda no topo (scroll 0), onde a hero
 * cobre a tela. Com prefers-reduced-motion, desenha um quadro parado.
 */
export function useTopoLines(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const { waves, sigma } = makeWaves()
    const levels = Array.from(
      { length: LEVELS },
      (_, i) => (i - (LEVELS - 1) / 2) * LEVEL_GAP * sigma,
    )

    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let field = new Float32Array(0)
    let cx = new Float32Array(0)
    let sx = new Float32Array(0)
    let cy = new Float32Array(0)
    let sy = new Float32Array(0)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / CELL) + 1
      rows = Math.ceil(h / CELL) + 1
      field = new Float32Array(cols * rows)
      cx = new Float32Array(cols)
      sx = new Float32Array(cols)
      cy = new Float32Array(rows)
      sy = new Float32Array(rows)
    }

    // cos(ax·x + ay·y + φ) = cos(ax·x + φ)·cos(ay·y) − sin(ax·x + φ)·sin(ay·y)
    // → tabelas por coluna e por linha; a grade toda sai com 2 multiplicações por onda.
    const computeField = (t: number) => {
      field.fill(0)
      for (const wv of waves) {
        const ph = wavePhase(wv, t)
        for (let c = 0; c < cols; c++) {
          const a = wv.ax * c * CELL + ph
          cx[c] = Math.cos(a) * wv.amp
          sx[c] = Math.sin(a) * wv.amp
        }
        for (let r = 0; r < rows; r++) {
          const a = wv.ay * r * CELL
          cy[r] = Math.cos(a)
          sy[r] = Math.sin(a)
        }
        for (let r = 0; r < rows; r++) {
          const row = r * cols
          const cyr = cy[r]
          const syr = sy[r]
          for (let c = 0; c < cols; c++) field[row + c] += cx[c] * cyr - sx[c] * syr
        }
      }
    }

    // Marching squares: um segmento por célula cruzada pela curva de nível.
    // Laço quente (≈ células × níveis por quadro): sem closures nem alocação.
    const drawLevel = (lv: number) => {
      for (let r = 0; r < rows - 1; r++) {
        const y0 = r * CELL
        const y1 = y0 + CELL
        for (let c = 0; c < cols - 1; c++) {
          const i = r * cols + c
          const tl = field[i]
          const tr = field[i + 1]
          const bl = field[i + cols]
          const br = field[i + cols + 1]
          const idx = (tl > lv ? 8 : 0) | (tr > lv ? 4 : 0) | (br > lv ? 2 : 0) | (bl > lv ? 1 : 0)
          if (idx === 0 || idx === 15) continue
          const x0 = c * CELL
          const x1 = x0 + CELL
          // pontos nas arestas (interpolação linear) — calculados só se usados
          switch (idx) {
            case 1: case 14:
              ctx.moveTo(x0, y0 + ((lv - tl) / (bl - tl)) * CELL)
              ctx.lineTo(x0 + ((lv - bl) / (br - bl)) * CELL, y1)
              break
            case 2: case 13:
              ctx.moveTo(x0 + ((lv - bl) / (br - bl)) * CELL, y1)
              ctx.lineTo(x1, y0 + ((lv - tr) / (br - tr)) * CELL)
              break
            case 3: case 12:
              ctx.moveTo(x0, y0 + ((lv - tl) / (bl - tl)) * CELL)
              ctx.lineTo(x1, y0 + ((lv - tr) / (br - tr)) * CELL)
              break
            case 4: case 11:
              ctx.moveTo(x0 + ((lv - tl) / (tr - tl)) * CELL, y0)
              ctx.lineTo(x1, y0 + ((lv - tr) / (br - tr)) * CELL)
              break
            case 6: case 9:
              ctx.moveTo(x0 + ((lv - tl) / (tr - tl)) * CELL, y0)
              ctx.lineTo(x0 + ((lv - bl) / (br - bl)) * CELL, y1)
              break
            case 7: case 8:
              ctx.moveTo(x0, y0 + ((lv - tl) / (bl - tl)) * CELL)
              ctx.lineTo(x0 + ((lv - tl) / (tr - tl)) * CELL, y0)
              break
            default: {
              // 5 / 10 — sela: o centro decide como ligar
              const left = y0 + ((lv - tl) / (bl - tl)) * CELL
              const top = x0 + ((lv - tl) / (tr - tl)) * CELL
              const bottom = x0 + ((lv - bl) / (br - bl)) * CELL
              const right = y0 + ((lv - tr) / (br - tr)) * CELL
              if ((idx === 5) === (tl + tr + bl + br) / 4 > lv) {
                ctx.moveTo(x0, left); ctx.lineTo(top, y0)
                ctx.moveTo(bottom, y1); ctx.lineTo(x1, right)
              } else {
                ctx.moveTo(x0, left); ctx.lineTo(bottom, y1)
                ctx.moveTo(top, y0); ctx.lineTo(x1, right)
              }
            }
          }
        }
      }
    }

    const render = (t: number) => {
      computeField(t)
      ctx.clearRect(0, 0, w, h)
      ctx.beginPath()
      for (const lv of levels) drawLevel(lv)
      // cor das linhas = `color` do canvas (text-ink) — lida a cada quadro para
      // acompanhar a transição de tema
      ctx.strokeStyle = getComputedStyle(canvas).color
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let last = 0

    // 1 → 0 ao longo da segunda dobra (ver FADE_OUT_*)
    const fade = () => {
      const r = window.scrollY / (window.innerHeight || 1)
      return 1 - Math.min(Math.max((r - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START), 0), 1)
    }
    const applyFade = () => {
      canvas.style.opacity = `${BASE_OPACITY * fade()}`
    }

    // No topo a hero cobre a tela inteira; depois da segunda dobra as linhas já
    // sumiram — nos dois casos não há o que desenhar
    const isVisible = () => window.scrollY > 0 && fade() > 0

    const loop = (now: number) => {
      frame = 0
      if (!isVisible()) return // para; o scroll religa
      if (now - last >= 1000 / FPS - 1) {
        last = now
        render(topoTime(now))
      }
      frame = requestAnimationFrame(loop)
    }

    // Movimento reduzido: quadro parado (t = 0), redesenhado só ao rolar —
    // por ~1s, para acompanhar a transição de cor do tema
    let settleUntil = 0
    const still = (now: number) => {
      frame = 0
      render(0)
      if (now < settleUntil) frame = requestAnimationFrame(still)
    }

    const start = () => {
      applyFade()
      if (fade() === 0) return // apagadas: nada a desenhar
      if (reduceMotion) {
        settleUntil = performance.now() + 1000
        if (!frame) frame = requestAnimationFrame(still)
        return
      }
      if (frame || !isVisible()) return
      frame = requestAnimationFrame(loop)
    }

    const onResize = () => {
      resize()
      render(reduceMotion ? 0 : topoTime())
    }

    onResize()
    start()
    window.addEventListener('scroll', start, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', start)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
    }
  }, [canvasRef])
}
