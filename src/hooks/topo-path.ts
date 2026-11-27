import { LEVELS, LEVEL_GAP, makeWaves, wavePhase } from './topo'

/**
 * As curvas de nível do site (o mesmo relevo de ./topo) num quadro parado, como um
 * único `d` de <path> SVG — para fundos estáticos em vetor (o cartão do rodapé).
 * Marching squares, um segmento por célula cruzada por cada nível.
 */
export function topoPath(width: number, height: number, cell = 8, t = 0) {
  const { waves, sigma } = makeWaves()
  const cols = Math.ceil(width / cell) + 1
  const rows = Math.ceil(height / cell) + 1
  const f = new Float32Array(cols * rows)
  for (const w of waves) {
    const ph = wavePhase(w, t)
    for (let r = 0; r < rows; r++) {
      const ay = w.ay * r * cell + ph
      for (let c = 0; c < cols; c++) f[r * cols + c] += w.amp * Math.cos(w.ax * c * cell + ay)
    }
  }

  const d: string[] = []
  const seg = (a: number, b: number, e: number, g: number) =>
    d.push(`M${a.toFixed(1)} ${b.toFixed(1)}L${e.toFixed(1)} ${g.toFixed(1)}`)
  for (let n = 0; n < LEVELS; n++) {
    const lv = (n - (LEVELS - 1) / 2) * LEVEL_GAP * sigma
    for (let r = 0; r < rows - 1; r++) {
      const y0 = r * cell
      const y1 = y0 + cell
      for (let c = 0; c < cols - 1; c++) {
        const i = r * cols + c
        const tl = f[i], tr = f[i + 1], bl = f[i + cols], br = f[i + cols + 1]
        const idx = (tl > lv ? 8 : 0) | (tr > lv ? 4 : 0) | (br > lv ? 2 : 0) | (bl > lv ? 1 : 0)
        if (idx === 0 || idx === 15) continue
        const x0 = c * cell
        const x1 = x0 + cell
        const L = () => y0 + ((lv - tl) / (bl - tl)) * cell
        const T = () => x0 + ((lv - tl) / (tr - tl)) * cell
        const B = () => x0 + ((lv - bl) / (br - bl)) * cell
        const R = () => y0 + ((lv - tr) / (br - tr)) * cell
        switch (idx) {
          case 1: case 14: seg(x0, L(), B(), y1); break
          case 2: case 13: seg(B(), y1, x1, R()); break
          case 3: case 12: seg(x0, L(), x1, R()); break
          case 4: case 11: seg(T(), y0, x1, R()); break
          case 6: case 9: seg(T(), y0, B(), y1); break
          case 7: case 8: seg(x0, L(), T(), y0); break
          default:
            // 5 / 10 — sela: o centro decide como ligar
            if ((idx === 5) === (tl + tr + bl + br) / 4 > lv) {
              seg(x0, L(), T(), y0)
              seg(B(), y1, x1, R())
            } else {
              seg(x0, L(), B(), y1)
              seg(T(), y0, x1, R())
            }
        }
      }
    }
  }
  return d.join('')
}
