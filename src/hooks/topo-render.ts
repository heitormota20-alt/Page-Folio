import { LEVELS, LEVEL_GAP, makeWaves, wavePhase } from './topo'

/** Tamanho da célula da grade, em px de tela (resolução das curvas). */
const CELL = 8
/** Limite de quadros — o movimento é lento (≈0,25px por quadro), 24fps sobra. */
const FPS = 24

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/**
 * Desenho das curvas de nível animadas (line art topográfico) num contexto 2D —
 * o da página ou o de um worker (OffscreenCanvas). Relevo em ./topo.
 */
function createRenderer(ctx: Ctx2D) {
  const { waves, sigma } = makeWaves()
  const levels = Array.from({ length: LEVELS }, (_, i) => (i - (LEVELS - 1) / 2) * LEVEL_GAP * sigma)

  let w = 0
  let h = 0
  let cols = 0
  let rows = 0
  let field = new Float32Array(0)
  let cx = new Float32Array(0)
  let sx = new Float32Array(0)
  let cy = new Float32Array(0)
  let sy = new Float32Array(0)

  const resize = (width: number, height: number, dpr: number) => {
    w = width
    h = height
    ctx.canvas.width = Math.round(w * dpr)
    ctx.canvas.height = Math.round(h * dpr)
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

  const render = (t: number, color: string) => {
    if (!cols) return
    computeField(t)
    ctx.clearRect(0, 0, w, h)
    ctx.beginPath()
    for (const lv of levels) drawLevel(lv)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  return { resize, render }
}

export interface TopoLoop {
  /** Tamanho em px CSS e densidade — redesenha (mudar o tamanho apaga o canvas). */
  size(w: number, h: number, dpr: number): void
  /** Cor das linhas (a `color` do tema). */
  color(c: string): void
  /** Liga/desliga a animação (desligada, não gasta nada). */
  run(on: boolean): void
  stop(): void
}

/**
 * O laço das curvas: desenha a FPS enquanto ligado. Com movimento reduzido, um
 * quadro parado (t = 0), redesenhado quando mudam o tamanho ou a cor. `clock`
 * devolve o tempo do relevo em segundos — o mesmo topoTime() da página, também
 * dentro do worker (curvas e fundo da home andam juntos).
 */
export function createTopoLoop(ctx: Ctx2D, clock: () => number, reduce: boolean): TopoLoop {
  const r = createRenderer(ctx)
  let color = 'rgba(0, 0, 0, 0)'
  let on = false
  let timer = 0
  let last = -Infinity
  const draw = () => r.render(reduce ? 0 : clock(), color)

  // rAF onde houver (página; workers do Chrome e do Firefox); senão, temporizador
  const hasRaf = typeof requestAnimationFrame === 'function'
  const next = (cb: () => void): number => (hasRaf ? requestAnimationFrame(cb) : setTimeout(cb, 1000 / FPS))
  const cancel = (id: number) => (hasRaf ? cancelAnimationFrame(id) : clearTimeout(id))

  const loop = () => {
    timer = 0
    if (!on) return
    const now = performance.now()
    if (now - last >= 1000 / FPS - 1) {
      last = now
      draw()
    }
    timer = next(loop)
  }

  return {
    size(w, h, dpr) {
      r.resize(w, h, dpr)
      draw()
    },
    color(c) {
      if (c === color) return
      color = c
      if (reduce) draw()
    },
    run(v) {
      on = v && !reduce
      if (on && !timer) {
        last = -Infinity
        timer = next(loop)
      } else if (!on && timer) {
        cancel(timer)
        timer = 0
      }
    },
    stop() {
      on = false
      if (timer) cancel(timer)
      timer = 0
    },
  }
}
