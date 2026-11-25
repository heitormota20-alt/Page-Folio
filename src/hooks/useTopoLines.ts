import { type RefObject, useEffect } from 'react'

/** Tamanho da célula da grade, em px de tela (resolução das curvas). */
const CELL = 8
/** Quantas curvas de nível — menos curvas = linhas mais espaçadas. */
const LEVELS = 9
/** Distância entre curvas, em desvios-padrão do relevo. */
const LEVEL_GAP = 0.5
/** Escala do relevo: tamanho de referência das formas, em px. */
const SCALE = 1500
/** As curvas "passam" devagar na diagonal (px/s). */
const DRIFT_X = 6
const DRIFT_Y = 3.5
/** Limite de quadros — o movimento é lento (≈0,25px por quadro), 24fps sobra. */
const FPS = 24

interface Wave {
  ax: number // frequência angular em x (rad/px)
  ay: number // frequência angular em y (rad/px)
  amp: number
  phase: number
  speed: number // velocidade de fase (rad/s): faz o relevo se transformar
}

/** PRNG determinístico: o desenho é sempre o mesmo ao recarregar. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Relevo = soma de ondas (cossenos) em direções aleatórias. Amplitude cai com a
 * frequência (formas grandes dominam); cada onda anda numa velocidade de fase
 * própria → as curvas de nível se transformam devagar.
 */
function makeWaves(seed: number): { waves: Wave[]; sigma: number } {
  const rand = mulberry32(seed)
  const waves: Wave[] = []
  let power = 0
  for (let i = 0; i < 26; i++) {
    const k = 1 + rand() * 3.2 // ciclos por SCALE
    const dir = rand() * Math.PI * 2
    const amp = k ** -1.9 * (0.6 + rand() * 0.4)
    waves.push({
      ax: ((2 * Math.PI * k) / SCALE) * Math.cos(dir),
      ay: ((2 * Math.PI * k) / SCALE) * Math.sin(dir),
      amp,
      phase: rand() * Math.PI * 2,
      speed: (0.04 + rand() * 0.07) * (rand() < 0.5 ? -1 : 1),
    })
    power += (amp * amp) / 2
  }
  return { waves, sigma: Math.sqrt(power) }
}

/**
 * Desenha curvas de nível animadas (line art topográfico) num <canvas>.
 * É o fundo da página inteira; só não roda no topo (scroll 0), onde a hero
 * cobre a tela. Com prefers-reduced-motion, desenha um quadro parado.
 */
export function useTopoLines(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const { waves, sigma } = makeWaves(7)
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
        // deslocar o relevo por (DRIFT·t) = somar −a·DRIFT·t na fase
        const ph = wv.phase + wv.speed * t - (wv.ax * DRIFT_X + wv.ay * DRIFT_Y) * t
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
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    let frame = 0
    let last = 0

    // No topo a hero cobre a tela inteira: não há fundo à vista
    const isVisible = () => window.scrollY > 0

    const loop = (now: number) => {
      frame = 0
      if (!isVisible()) return // para; o scroll religa
      if (now - last >= 1000 / FPS - 1) {
        last = now
        render((now - t0) / 1000)
      }
      frame = requestAnimationFrame(loop)
    }

    const start = () => {
      if (reduceMotion || frame || !isVisible()) return
      frame = requestAnimationFrame(loop)
    }

    const onResize = () => {
      resize()
      render((performance.now() - t0) / 1000)
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
