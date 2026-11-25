import { type RefObject, useEffect, useRef } from 'react'
import { SCALE_END } from './useHeroScrollScale'
import { LEVEL_GAP, LEVELS, WAVE_COUNT, makeWaves, topoTime, wavePhase } from './topo'

/*
  Fundo da home no estilo do landonorris.com, em WebGL2:
  - curvas de nível: o MESMO relevo do fundo da segunda dobra (./topo, soma de
    ondas), no mesmo instante — ao encolher, o card continua o padrão da página;
  - "manchas de terreno" (patamares entre curvas, em dois tons) só no rastro do
    cursor — que some rápido, como lá (dissipação 0.96 por quadro). Com o mouse
    parado por 2 s, um cursor invisível faz um zigue-zague pela tela (o
    "idleState" deles) e deixa o mesmo rastro;
  - perto do cursor em movimento, o próprio relevo se desloca;
  - a palavra "PORTFÓLIO" desenhada no mesmo shader: onde há mancha ela fica
    azul, e ondula (distorção líquida), mais forte perto do rastro do mouse.
  A palavra é rasterizada num canvas 2D na mesma posição do <text> do SVG
  (que continua no DOM como referência de layout e fallback sem WebGL2).
*/

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

// Rastro do mouse: decai a cada quadro e recebe um "pincel" no segmento percorrido
const TRAIL_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_prev;
uniform vec2 u_texel;    // 1 / tamanho da textura do rastro
uniform vec2 u_res;      // tamanho do card em px CSS
uniform vec2 u_a;        // mouse no quadro anterior (px CSS, y para baixo)
uniform vec2 u_b;        // mouse agora
uniform float u_radius;
uniform float u_strength;
uniform float u_decay;
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  // difusão: o rastro se espalha um pouco a cada quadro (como fluido) e decai
  float prev = texture(u_prev, v_uv).r * 0.6
    + (texture(u_prev, v_uv + vec2(u_texel.x, 0.0)).r + texture(u_prev, v_uv - vec2(u_texel.x, 0.0)).r
     + texture(u_prev, v_uv + vec2(0.0, u_texel.y)).r + texture(u_prev, v_uv - vec2(0.0, u_texel.y)).r) * 0.1;
  prev *= u_decay;
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y) * u_res;
  float d = segDist(p, u_a, u_b);
  float s = exp(-(d * d) / (u_radius * u_radius)) * u_strength;
  o = vec4(clamp(max(prev, s), 0.0, 1.0), 0.0, 0.0, 1.0);
}`

const MAIN_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
uniform vec2 u_res;        // canvas em px do dispositivo
uniform float u_dpr;
uniform float u_time;
uniform vec2 u_mouse;      // cursor (real ou o invisível), px CSS
uniform float u_pace;      // 0–1: velocidade do cursor, suavizada
uniform float u_flow;      // 0–1: liga a distorção (0 com reduced motion)
uniform vec4 u_waves[${WAVE_COUNT}]; // relevo: (ax, ay, amp/σ, fase agora) de cada onda
uniform sampler2D u_trail;
uniform sampler2D u_word;
uniform float u_wordAlpha; // some ao rolar
uniform float u_rise;      // 0–1: entrada (a palavra sobe da linha de base)
uniform float u_riseDist;  // px do dispositivo
uniform float u_clipY;     // linha de base + descendente, px do dispositivo

// Simplex noise 3D — Ashima Arts / Stefan Gustavson (MIT)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

const vec3 PAPER = vec3(1.0);
const vec3 FILL_A = vec3(0.949, 0.949, 0.937);
const vec3 FILL_B = vec3(0.910, 0.910, 0.894);
const vec3 INK = vec3(0.133);
const vec3 BLUE_A = vec3(0.0, 0.212, 0.698);   // #0036b2
const vec3 BLUE_B = vec3(0.075, 0.290, 0.800);
const float LEVEL_GAP = ${LEVEL_GAP.toFixed(3)};   // curvas a cada meio desvio-padrão
const float HALF_LEVELS = ${((LEVELS - 1) / 2).toFixed(1)}; // 9 curvas: −4…4

void main() {
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);   // px do dispositivo, y para baixo
  vec2 css = px / u_dpr;
  vec2 p = css / 620.0;
  float t = u_time;   // já vem multiplicado pela velocidade (SPEED.field)

  // o cursor em movimento empurra o relevo (perto dele; o resto recua um pouco)
  float cursor = clamp(1.0 - distance(css, u_mouse) / (u_res.y / u_dpr * 0.35), -0.75, 1.0) * u_pace;
  vec2 q = css + cursor * 110.0;

  // relevo (em desvios-padrão) e as 9 curvas de nível (~1px CSS, antialias por fwidth)
  float field = 0.0;
  for (int i = 0; i < ${WAVE_COUNT}; i++) {
    vec4 w = u_waves[i];
    field += w.z * cos(w.x * q.x + w.y * q.y + w.w);
  }
  float f = field / LEVEL_GAP;               // curvas nos inteiros
  float fw = max(fwidth(f), 1e-4);
  float dl = abs(f - floor(f + 0.5)) / fw;
  float lineW = 0.5 * u_dpr;
  float line = (1.0 - smoothstep(lineW - 0.6, lineW + 0.6, dl)) * step(abs(floor(f + 0.5)), HALF_LEVELS);

  // manchas: só onde o rastro do cursor está forte, com borda orgânica
  float trail = texture(u_trail, v_uv).r;
  float edge = snoise(vec3(p * 2.6, t * 2.2)) * 0.16;
  float c = trail * 1.2 + edge;
  float patchMask = smoothstep(0.43, 0.47, c);
  float terrace = mod(floor(f), 2.0);                // patamares alternados entre as curvas

  vec3 col = mix(PAPER, mix(FILL_A, FILL_B, terrace), patchMask);
  col = mix(col, INK, line * 0.15);

  // palavra: distorção líquida (ruído de fluxo), mais forte no rastro
  vec2 flow = vec2(snoise(vec3(p * 1.7, t * 3.2 + 5.0)), snoise(vec3(p * 1.7 + 7.3, t * 3.2)));
  float amp = (3.0 + 30.0 * trail + 6.0 * u_pace) * u_dpr * u_flow;
  vec2 wp = px + flow * amp + vec2(0.0, (1.0 - u_rise) * u_riseDist);
  float a = texture(u_word, wp / u_res).a;
  a *= step(px.y, u_clipY) * u_wordAlpha;
  float paint = smoothstep(0.40, 0.45, c);
  vec3 wordCol = mix(INK, mix(BLUE_A, BLUE_B, terrace * 0.7), paint);
  col = mix(col, wordCol, a);

  o = vec4(col, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s)
    gl.deleteShader(s)
    throw new Error(`shader: ${log}`)
  }
  return s
}

function program(gl: WebGL2RenderingContext, frag: string) {
  const p = gl.createProgram()!
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag))
  gl.bindAttribLocation(p, 0, 'a_pos')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(p)}`)
  const loc = (name: string) => gl.getUniformLocation(p, name)
  return { p, loc }
}

function makeTarget(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { tex, fbo }
}

/** Medidas da palavra no design (quadro 1920 × 1080), as mesmas do <text> do SVG. */
const WORD = { text: 'PORTFÓLIO', x: -21.4, baseline: 824, size: 526, spacing: -8.3, descent: 14 }

/** Ritmo do efeito — ajuste aqui. Tempos em segundos. */
const SPEED = {
  /** quão rápido o relevo (curvas, manchas, ondulação da palavra) se transforma */
  field: 0.2,
  /** vida do rastro: 0.4 s ≈ a dissipação 0.96/quadro do landonorris (some rápido) */
  trail: 0.4,
  /** mouse parado por este tempo → entra o cursor invisível (lá: 2 s; 2,5 s ao abrir) */
  idleDelay: 2,
  idleDelayFirst: 1.2,
}

/**
 * Cursor invisível do modo parado (o "idleState" do landonorris): em 2,5 s desce
 * em zigue-zague, espera 1,5 s, volta em 2,5 s e descansa 3 s (ciclo de 9,5 s).
 * Devolve a posição em fração da tela (0–1) ou null quando está parado.
 */
function idleCursor(t: number): { x: number; y: number } | null {
  const c = t % 9.5
  let k: number
  if (c < 2.5) k = c / 2.5
  else if (c < 4) return null
  else if (c < 6.5) k = 1 - (c - 4) / 2.5
  else return null
  const kx = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2 // power1.inOut
  const nx = -Math.cos(kx * Math.PI * 4) * 0.75
  const ny = Math.cos(k * Math.PI) * 0.5
  return { x: 0.5 + nx * 0.5, y: 0.5 - ny * 0.5 }
}

interface Options {
  cardRef: RefObject<HTMLElement | null>
  /** o "palco" da tipografia (.hero-type): posição/escala da palavra e opacidade ao rolar */
  stageRef: RefObject<HTMLElement | null>
  ready: boolean
}

export function useHeroField(canvasRef: RefObject<HTMLCanvasElement | null>, { cardRef, stageRef, ready }: Options) {
  // entrada: o loop lê a hora em que a página ficou pronta
  const readyAt = useRef<number | null>(null)
  const redrawWord = useRef<() => void>(() => {})
  useEffect(() => {
    if (ready && readyAt.current === null) {
      readyAt.current = performance.now()
      redrawWord.current() // fontes já carregadas
    }
  }, [ready])

  useEffect(() => {
    const canvas = canvasRef.current
    const card = cardRef.current
    const stage = stageRef.current
    if (!canvas || !card || !stage) return
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false })
    if (!gl) return // sem WebGL2: fica o <text> do SVG

    let trailProg: ReturnType<typeof program>
    let mainProg: ReturnType<typeof program>
    try {
      trailProg = program(gl, TRAIL_FRAG)
      mainProg = program(gl, MAIN_FRAG)
    } catch (err) {
      console.warn('[hero] WebGL indisponível, usando a palavra estática', err)
      return
    }
    card.dataset.gl = '' // CSS esconde o <text> do SVG

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const { waves, sigma } = makeWaves()
    const waveData = new Float32Array(WAVE_COUNT * 4)
    const wordTex = gl.createTexture()!
    const wordCanvas = document.createElement('canvas')
    let trail = [makeTarget(gl, 4, 4), makeTarget(gl, 4, 4)]
    let W = 0, H = 0, dpr = 1, TW = 0, TH = 0
    let clipY = 0, riseDist = 0

    // ——— palavra rasterizada na posição do palco ———
    const drawWord = () => {
      if (!W) return
      const ut = stage.offsetWidth / 1920
      const left = stage.offsetLeft - stage.offsetWidth / 2 // .hero-type: left 50% + translate -50%
      const top = stage.offsetTop
      const size = WORD.size * ut * dpr
      const x = (left + WORD.x * ut) * dpr
      const base = (top + WORD.baseline * ut) * dpr
      clipY = base + WORD.descent * ut * dpr
      riseDist = size * 1.15
      wordCanvas.width = Math.round(W * dpr)
      wordCanvas.height = Math.round(H * dpr)
      const ctx = wordCanvas.getContext('2d')!
      ctx.clearRect(0, 0, wordCanvas.width, wordCanvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = `${size}px Anton, Impact, sans-serif`
      ctx.textBaseline = 'alphabetic'
      const spacing = WORD.spacing * ut * dpr
      if ('letterSpacing' in CanvasRenderingContext2D.prototype) {
        ctx.letterSpacing = `${spacing}px`
        ctx.fillText(WORD.text, x, base)
      } else {
        // navegador sem letterSpacing no canvas: letra por letra
        let cx = x
        for (const ch of WORD.text) {
          ctx.fillText(ch, cx, base)
          cx += ctx.measureText(ch).width + spacing
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, wordTex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wordCanvas)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
    redrawWord.current = drawWord

    const resize = () => {
      // tamanho de layout do card (sem o scale do scroll)
      W = card.clientWidth
      H = card.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.25) // shader em tela cheia: limita o custo em telas retina
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      TW = Math.max(4, Math.round(W / 4))
      TH = Math.max(4, Math.round(H / 4))
      for (const t of trail) {
        gl.deleteTexture(t.tex)
        gl.deleteFramebuffer(t.fbo)
      }
      trail = [makeTarget(gl, TW, TH), makeTarget(gl, TW, TH)]
      drawWord()
    }
    resize()
    // redesenha já no resize (mudar o tamanho do canvas o apaga)
    const ro = new ResizeObserver(() => {
      resize()
      render(performance.now())
    })
    ro.observe(card)
    document.fonts?.ready.then(drawWord)

    // ——— ponteiro (mouse e toque) em px de layout do card ———
    let pointer: { x: number; y: number } | null = null
    let lastMove = -1e9
    const onPointer = (clientX: number, clientY: number) => {
      const r = card.getBoundingClientRect()
      if (!r.width) return
      const k = W / r.width // desfaz o scale do card
      pointer = { x: (clientX - r.left) * k, y: (clientY - r.top) * k }
      lastMove = performance.now()
    }
    const onMouse = (e: PointerEvent) => onPointer(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => e.touches[0] && onPointer(e.touches[0].clientX, e.touches[0].clientY)
    window.addEventListener('pointermove', onMouse, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })

    // ——— loop ———
    let prevCursor: { x: number; y: number } | null = null
    let wasIdle = false
    let idleStart = 0
    let pace = 0
    let last = performance.now()
    const t0 = last
    let frame = 0

    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      // cursor: o real ou, com o mouse parado, o invisível do modo parado
      const neverMoved = lastMove < 0
      const idle =
        !reduceMotion &&
        (neverMoved
          ? readyAt.current !== null && (now - readyAt.current) / 1000 > SPEED.idleDelayFirst
          : (now - lastMove) / 1000 > SPEED.idleDelay)
      if (idle !== wasIdle) {
        idleStart = now
        prevCursor = null // troca de cursor: não risca a tela de um ponto ao outro
        wasIdle = idle
      }
      let cursor = pointer
      if (idle) {
        const ic = idleCursor((now - idleStart) / 1000)
        cursor = ic ? { x: ic.x * W, y: ic.y * H } : prevCursor // descansando: parado onde está
      }

      // rastro: só com o cursor em movimento, mais forte quanto mais rápido
      const a = prevCursor ?? cursor
      const b = cursor
      const moved = a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 0
      const speed = moved / Math.max(dt, 1e-3)
      pace += (Math.min(speed / 1500, 1) - pace) * (1 - Math.exp(-dt / 0.25))
      gl.useProgram(trailProg.p)
      gl.bindFramebuffer(gl.FRAMEBUFFER, trail[1].fbo)
      gl.viewport(0, 0, TW, TH)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, trail[0].tex)
      gl.uniform1i(trailProg.loc('u_prev'), 0)
      gl.uniform2f(trailProg.loc('u_texel'), 1 / TW, 1 / TH)
      gl.uniform2f(trailProg.loc('u_res'), W, H)
      gl.uniform2f(trailProg.loc('u_a'), a?.x ?? -1e4, a?.y ?? -1e4)
      gl.uniform2f(trailProg.loc('u_b'), b?.x ?? -1e4, b?.y ?? -1e4)
      gl.uniform1f(trailProg.loc('u_radius'), 110 + Math.min(speed, 2500) * 0.04)
      gl.uniform1f(trailProg.loc('u_strength'), moved > 0.5 ? Math.min(1, 0.45 + speed / 1400) : 0)
      gl.uniform1f(trailProg.loc('u_decay'), Math.exp(-dt / SPEED.trail))
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      trail = [trail[1], trail[0]]
      prevCursor = cursor

      // cena
      const rise = readyAt.current === null ? 0 : Math.min(1, Math.max(0, (now - readyAt.current - 100) / 1100))
      const ease = 1 - (1 - rise) ** 3
      const stageOpacity = stage.style.opacity === '' ? 1 : parseFloat(stage.style.opacity)
      gl.useProgram(mainProg.p)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, trail[0].tex)
      gl.uniform1i(mainProg.loc('u_trail'), 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, wordTex)
      gl.uniform1i(mainProg.loc('u_word'), 1)
      gl.uniform2f(mainProg.loc('u_res'), canvas.width, canvas.height)
      gl.uniform1f(mainProg.loc('u_dpr'), dpr)
      gl.uniform1f(mainProg.loc('u_time'), reduceMotion ? 1.4 : ((now - t0) / 1000) * SPEED.field)
      gl.uniform2f(mainProg.loc('u_mouse'), cursor?.x ?? -1e4, cursor?.y ?? -1e4)
      gl.uniform1f(mainProg.loc('u_pace'), reduceMotion ? 0 : pace)
      const tt = reduceMotion ? 0 : topoTime(now)
      waves.forEach((w, i) => {
        waveData[i * 4] = w.ax
        waveData[i * 4 + 1] = w.ay
        waveData[i * 4 + 2] = w.amp / sigma
        waveData[i * 4 + 3] = wavePhase(w, tt)
      })
      gl.uniform4fv(mainProg.loc('u_waves'), waveData)
      gl.uniform1f(mainProg.loc('u_flow'), reduceMotion ? 0 : 1)
      gl.uniform1f(mainProg.loc('u_wordAlpha'), Number.isFinite(stageOpacity) ? stageOpacity : 1)
      gl.uniform1f(mainProg.loc('u_rise'), reduceMotion ? 1 : ease)
      gl.uniform1f(mainProg.loc('u_riseDist'), riseDist)
      gl.uniform1f(mainProg.loc('u_clipY'), clipY)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // só desenha enquanto a home está na tela (o card sobe depois do pouso)
    const visible = () => !document.hidden && window.scrollY < window.innerHeight * (SCALE_END + 1.05)
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (visible()) render(now)
      else last = now
    }
    if (reduceMotion) {
      // um quadro parado; redesenha no resize/scroll (a palavra some ao rolar)
      const still = () => render(performance.now())
      still()
      window.addEventListener('scroll', still, { passive: true })
      ro.disconnect()
      const ro2 = new ResizeObserver(() => {
        resize()
        still()
      })
      ro2.observe(card)
      redrawWord.current = () => {
        drawWord()
        still()
      }
      return () => {
        window.removeEventListener('scroll', still)
        ro2.disconnect()
        window.removeEventListener('pointermove', onMouse)
        window.removeEventListener('touchmove', onTouch)
        window.removeEventListener('touchstart', onTouch)
        delete card.dataset.gl
      }
    }
    render(performance.now()) // primeiro quadro já (canvas sem alpha começaria preto)
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('pointermove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchstart', onTouch)
      delete card.dataset.gl
    }
  }, [canvasRef, cardRef, stageRef])
}
