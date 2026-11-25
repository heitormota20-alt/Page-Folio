// Relevo das curvas de nível — o mesmo padrão no fundo da página (useTopoLines,
// canvas 2D) e no fundo da home (useHeroField, shader). Os dois leem o tempo de
// topoTime(), então o desenho é idêntico e anda junto.

/** Escala do relevo: tamanho de referência das formas, em px. */
export const SCALE = 1500
/** Quantas curvas de nível — menos curvas = linhas mais espaçadas. */
export const LEVELS = 9
/** Distância entre curvas, em desvios-padrão do relevo. */
export const LEVEL_GAP = 0.5
/** As curvas "passam" devagar na diagonal (px/s). */
export const DRIFT_X = 6
export const DRIFT_Y = 3.5
/** Semente: o desenho é sempre o mesmo ao recarregar. */
export const SEED = 7
/** Número de ondas somadas. */
export const WAVE_COUNT = 26

export interface Wave {
  ax: number // frequência angular em x (rad/px)
  ay: number // frequência angular em y (rad/px)
  amp: number
  phase: number
  speed: number // velocidade de fase (rad/s): faz o relevo se transformar
}

/** PRNG determinístico. */
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
export function makeWaves(seed = SEED): { waves: Wave[]; sigma: number } {
  const rand = mulberry32(seed)
  const waves: Wave[] = []
  let power = 0
  for (let i = 0; i < WAVE_COUNT; i++) {
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

/** Fase da onda no instante t: anda + desliza o relevo por (DRIFT·t). */
export function wavePhase(w: Wave, t: number) {
  return w.phase + w.speed * t - (w.ax * DRIFT_X + w.ay * DRIFT_Y) * t
}

const T0 = performance.now()
/** Relógio comum do relevo, em segundos. */
export function topoTime(now = performance.now()) {
  return (now - T0) / 1000
}
