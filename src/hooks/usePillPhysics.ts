import { type RefObject, useEffect } from 'react'

/*
  Pílulas de "No que eu posso te ajudar".

  1. Física 2D: cada pílula é uma cápsula (segmento + raio) com rotação. Quando
     a área entra na tela, elas caem uma a uma e se empilham; com o mouse dá para
     arrastar e arremessar (no toque, um toque dá um peteleco). Impulsos
     sequenciais com acúmulo (estável para pilhas), vários contatos por par e
     correção de posição. Sem bibliotecas.
  2. Organização pela rolagem: com a cena presa na tela, a física congela e, a
     cada trecho de rolagem, um cursor colorido entra, agarra uma pílula (as de
     cima da pilha primeiro), leva até o seu lugar no layout final ([data-slot])
     endireitando-a, solta e sai. Tudo é função do progresso da rolagem: rolando
     de volta, desfaz; no começo da cena, a física volta.
*/

interface Body {
  el: HTMLElement
  x: number // centro (px do container)
  y: number
  a: number // ângulo (rad)
  vx: number
  vy: number
  w: number // velocidade angular (rad/s)
  hw: number // meia largura e meia altura do elemento
  hh: number
  hl: number // meio comprimento do segmento
  r: number // raio
  im: number // 1 / massa
  ii: number // 1 / inércia
  active: boolean
}

interface Contact {
  A: Body
  B: Body | null // null = parede/chão
  nx: number // normal de A para B
  ny: number
  px: number // ponto de contato
  py: number
  pen: number
  jn: number // impulso acumulado (normal / atrito)
  jt: number
  bias: number // velocidade de quique desejada
}

const GRAVITY = 2600 // px/s²
const SUBSTEPS = 3
const ITERATIONS = 10
const RESTITUTION = 0.18
const FRICTION = 0.55
const SLOP = 0.6
const DROP_GAP = 0.11 // s entre uma pílula e a próxima
const MAX_SPEED = 3200

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function endpoints(b: Body) {
  const cx = Math.cos(b.a) * b.hl
  const cy = Math.sin(b.a) * b.hl
  return [b.x - cx, b.y - cy, b.x + cx, b.y + cy] as const
}

/** Pontos mais próximos entre os segmentos p1q1 e p2q2 (Ericson, 5.1.9). */
function closestSegSeg(
  p1x: number, p1y: number, q1x: number, q1y: number,
  p2x: number, p2y: number, q2x: number, q2y: number,
) {
  const d1x = q1x - p1x, d1y = q1y - p1y
  const d2x = q2x - p2x, d2y = q2y - p2y
  const rx = p1x - p2x, ry = p1y - p2y
  const a = d1x * d1x + d1y * d1y
  const e = d2x * d2x + d2y * d2y
  const f = d2x * rx + d2y * ry
  let s = 0
  let t = 0
  if (a > 1e-6 || e > 1e-6) {
    if (a <= 1e-6) {
      t = clamp01(f / e)
    } else {
      const c = d1x * rx + d1y * ry
      if (e <= 1e-6) {
        s = clamp01(-c / a)
      } else {
        const b = d1x * d2x + d1y * d2y
        const denom = a * e - b * b
        s = denom > 1e-6 ? clamp01((b * f - c * e) / denom) : 0
        t = (b * s + f) / e
        if (t < 0) {
          t = 0
          s = clamp01(-c / a)
        } else if (t > 1) {
          t = 1
          s = clamp01((b - c) / a)
        }
      }
    }
  }
  return [p1x + d1x * s, p1y + d1y * s, p2x + d2x * t, p2y + d2y * t] as const
}

function closestOnSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay
  const L = dx * dx + dy * dy
  const t = L > 1e-6 ? clamp01(((px - ax) * dx + (py - ay) * dy) / L) : 0
  return [ax + dx * t, ay + dy * t] as const
}

function pushContact(out: Contact[], A: Body, B: Body | null, cax: number, cay: number, cbx: number, cby: number, rA: number, rB: number) {
  const dx = cbx - cax, dy = cby - cay
  const d = Math.hypot(dx, dy)
  const pen = rA + rB - d
  if (pen <= 0) return
  const nx = d > 1e-6 ? dx / d : 0
  const ny = d > 1e-6 ? dy / d : 1
  const px = cax + nx * (rA - pen / 2)
  const py = cay + ny * (rA - pen / 2)
  // contatos quase no mesmo ponto: um só
  for (const c of out) if (c.A === A && c.B === B && Math.abs(c.px - px) + Math.abs(c.py - py) < 6) return
  out.push({ A, B, nx, ny, px, py, pen, jn: 0, jt: 0, bias: 0 })
}

function wall(out: Contact[], A: Body, nx: number, ny: number, px: number, py: number, pen: number) {
  out.push({ A, B: null, nx, ny, px, py, pen, jn: 0, jt: 0, bias: 0 })
}

function collide(bodies: Body[], W: number, H: number) {
  const out: Contact[] = []
  for (let i = 0; i < bodies.length; i++) {
    const A = bodies[i]
    if (!A.active) continue
    const [a1x, a1y, a2x, a2y] = endpoints(A)
    // chão e paredes (pontas do segmento como círculos; normal fixa, mesmo se afundar)
    for (const [ex, ey] of [[a1x, a1y], [a2x, a2y]] as const) {
      if (ey + A.r > H) wall(out, A, 0, 1, ex, H, ey + A.r - H)
      if (ex - A.r < 0) wall(out, A, -1, 0, 0, ey, A.r - ex)
      if (ex + A.r > W) wall(out, A, 1, 0, W, ey, ex + A.r - W)
    }
    for (let k = i + 1; k < bodies.length; k++) {
      const B = bodies[k]
      if (!B.active) continue
      const reach = A.hl + A.r + B.hl + B.r
      if (Math.abs(A.x - B.x) > reach || Math.abs(A.y - B.y) > reach) continue
      const [b1x, b1y, b2x, b2y] = endpoints(B)
      const [c1x, c1y, c2x, c2y] = closestSegSeg(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y)
      pushContact(out, A, B, c1x, c1y, c2x, c2y, A.r, B.r)
      // pontas contra o segmento do outro: 2 contatos quando deitadas lado a lado
      for (const [ex, ey] of [[a1x, a1y], [a2x, a2y]] as const) {
        const [qx, qy] = closestOnSeg(ex, ey, b1x, b1y, b2x, b2y)
        pushContact(out, A, B, ex, ey, qx, qy, A.r, B.r)
      }
      for (const [ex, ey] of [[b1x, b1y], [b2x, b2y]] as const) {
        const [qx, qy] = closestOnSeg(ex, ey, a1x, a1y, a2x, a2y)
        pushContact(out, A, B, qx, qy, ex, ey, A.r, B.r)
      }
    }
  }
  return out
}

/** Aplica o impulso (jx, jy) no ponto (px, py) do corpo. */
function impulse(b: Body, jx: number, jy: number, px: number, py: number, sign: number) {
  b.vx += sign * jx * b.im
  b.vy += sign * jy * b.im
  b.w += sign * ((px - b.x) * jy - (py - b.y) * jx) * b.ii
}

function relVel(c: Contact) {
  const { A, B, px, py } = c
  let vx = -(A.vx - A.w * (py - A.y))
  let vy = -(A.vy + A.w * (px - A.x))
  if (B) {
    vx += B.vx - B.w * (py - B.y)
    vy += B.vy + B.w * (px - B.x)
  }
  return [vx, vy] as const
}

function effMass(c: Contact, dx: number, dy: number) {
  const { A, B, px, py } = c
  const rnA = (px - A.x) * dy - (py - A.y) * dx
  let k = A.im + A.ii * rnA * rnA
  if (B) {
    const rnB = (px - B.x) * dy - (py - B.y) * dx
    k += B.im + B.ii * rnB * rnB
  }
  return k
}

function solve(contacts: Contact[]) {
  for (const c of contacts) {
    const [vx, vy] = relVel(c)
    const vn = vx * c.nx + vy * c.ny
    c.bias = vn < -120 ? -RESTITUTION * vn : 0
  }
  for (let it = 0; it < ITERATIONS; it++) {
    for (const c of contacts) {
      // normal
      let [vx, vy] = relVel(c)
      const vn = vx * c.nx + vy * c.ny
      const kn = effMass(c, c.nx, c.ny)
      const old = c.jn
      c.jn = Math.max(old + (c.bias - vn) / kn, 0)
      const dj = c.jn - old
      if (dj) {
        impulse(c.A, c.nx * dj, c.ny * dj, c.px, c.py, -1)
        if (c.B) impulse(c.B, c.nx * dj, c.ny * dj, c.px, c.py, 1)
      }
      // atrito
      ;[vx, vy] = relVel(c)
      const tx = -c.ny, ty = c.nx
      const vt = vx * tx + vy * ty
      const kt = effMass(c, tx, ty)
      const oldT = c.jt
      const maxT = FRICTION * c.jn
      c.jt = Math.max(-maxT, Math.min(maxT, oldT - vt / kt))
      const dt = c.jt - oldT
      if (dt) {
        impulse(c.A, tx * dt, ty * dt, c.px, c.py, -1)
        if (c.B) impulse(c.B, tx * dt, ty * dt, c.px, c.py, 1)
      }
    }
  }
}

function correct(contacts: Contact[]) {
  for (const c of contacts) {
    const k = c.A.im + (c.B ? c.B.im : 0)
    const corr = (Math.max(c.pen - SLOP, 0) * 0.45) / k
    c.A.x -= c.nx * corr * c.A.im
    c.A.y -= c.ny * corr * c.A.im
    if (c.B) {
      c.B.x += c.nx * corr * c.B.im
      c.B.y += c.ny * corr * c.B.im
    }
  }
}

/** Trecho da cena (progresso 0–1 do palco preso) em que os cursores organizam. */
const ORG_START = 0.1
const ORG_END = 0.82
/** Fração do trecho que cada pílula ocupa (as janelas se sobrepõem: vários cursores juntos). */
const WINDOW = 0.38
/** Texto + botão sobem por baixo do layout neste trecho do progresso da cena. */
const REVEAL_START = 0.76
const REVEAL_END = 0.9
/** Dentro da janela de cada pílula: o cursor chega, carrega, solta e sai. */
const APPROACH = 0.3
const CARRY_END = 0.82

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t * t
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Ângulo em (−π, π]. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

interface Options {
  /** palco alto da cena (o progresso vem da posição dele) */
  sceneRef?: RefObject<HTMLElement | null>
  /** layout final: [data-slot] na mesma ordem das pílulas */
  layoutRef?: RefObject<HTMLElement | null>
  /** aparece (sobe de baixo) quando a organização termina */
  revealRef?: RefObject<HTMLElement | null>
}

interface Pose {
  x: number
  y: number
  a: number
}

export function usePillPhysics(
  containerRef: RefObject<HTMLElement | null>,
  { sceneRef, layoutRef, revealRef }: Options = {},
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return // CSS mostra as pílulas organizadas

    const els = Array.from(container.querySelectorAll<HTMLElement>('[data-pill]'))
    const cursors = Array.from(container.querySelectorAll<HTMLElement>('[data-cursor]'))
    const slots = layoutRef?.current ? Array.from(layoutRef.current.querySelectorAll<HTMLElement>('[data-slot]')) : []
    const scene = sceneRef?.current ?? null
    const reveal = revealRef?.current ?? null
    const canOrganize = !!scene && slots.length === els.length && cursors.length === els.length
    let W = container.clientWidth
    let H = container.clientHeight
    let frozen = false

    const bodies: Body[] = els.map((el) => {
      el.style.opacity = '0'
      return { el, x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0, hw: 0, hh: 0, hl: 0, r: 0, im: 0, ii: 0, active: false }
    })

    // ——— lugares no layout final (centro de cada [data-slot], em px do container) ———
    let targets: Pose[] = []
    const measureTargets = () => {
      const c = container.getBoundingClientRect()
      targets = slots.map((sl) => {
        const r = sl.getBoundingClientRect()
        return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, a: 0 }
      })
    }

    const measure = () => {
      W = container.clientWidth
      H = container.clientHeight
      for (const b of bodies) {
        const w = b.el.offsetWidth
        const h = b.el.offsetHeight
        b.hw = w / 2
        b.hh = h / 2
        b.r = h / 2
        b.hl = Math.max(0, w / 2 - h / 2)
        const m = (w * h) / 1000
        b.im = 1 / m
        b.ii = 1 / ((m * (w * w + h * h)) / 12)
        if (b.active && !frozen) {
          b.x = Math.min(Math.max(b.x, b.hw), W - b.hw)
          b.y = Math.min(b.y, H - b.r)
        }
      }
      if (canOrganize) measureTargets()
    }

    const place = (b: Body, x: number, y: number, a: number, scale = 1) => {
      b.el.style.transform = `translate3d(${x - b.hw}px, ${y - b.hh}px, 0) rotate(${a}rad)${scale !== 1 ? ` scale(${scale})` : ''}`
    }
    const render = () => {
      for (const b of bodies) if (b.active) place(b, b.x, b.y, b.a)
    }

    // ——— queda: uma a uma, de cima, em posições e ângulos sorteados ———
    let started = false
    let startAt = 0
    const order = bodies.map((_, i) => i).sort(() => Math.random() - 0.5)
    const drop = (b: Body) => {
      const span = Math.max(1, W - 2 * b.hw)
      b.x = b.hw + Math.random() * span
      b.y = -b.hh - 30 - Math.random() * 90
      b.a = (Math.random() - 0.5) * 0.9
      b.vx = (Math.random() - 0.5) * 120
      b.vy = 0
      b.w = (Math.random() - 0.5) * 2
      b.active = true
      b.el.style.opacity = '1'
    }

    // ——— arrastar (mouse) / peteleco (toque) — só com a física ligada ———
    let grab: { b: Body; lx: number; ly: number; tx: number; ty: number; id: number } | null = null

    // ——— organização pela rolagem ———
    let from: Pose[] = []
    let spawned: boolean[] = [] // pílulas que ainda não tinham caído: vêm de baixo da tela
    let rank: number[] = [] // ordem de coleta (de cima da pilha para baixo)
    // direções de entrada/saída de cada cursor (fixas por índice, espalhadas em volta)
    const dirs = bodies.map((_, i) => {
      const ang = i * 2.399963 + 0.6 // ângulo áureo
      return {
        ix: Math.cos(ang),
        iy: Math.sin(ang) * 0.7 - 0.3,
        ox: Math.cos(ang + 2.2),
        oy: Math.sin(ang + 2.2) * 0.7 - 0.3,
      }
    })

    const freeze = () => {
      frozen = true
      if (grab) grab.b.el.style.cursor = ''
      grab = null
      measureTargets()
      spawned = bodies.map((b) => !b.active)
      from = bodies.map((b) =>
        b.active
          ? { x: b.x, y: b.y, a: wrap(b.a) }
          : { x: b.hw + Math.random() * Math.max(1, W - 2 * b.hw), y: H + 260, a: 0 },
      )
      for (const b of bodies) {
        b.vx = b.vy = b.w = 0
        b.active = true
      }
      rank = bodies.map((_, i) => i).sort((i, k) => from[i].y - from[k].y)
    }

    const unfreeze = () => {
      frozen = false
      bodies.forEach((b, i) => {
        b.x = from[i].x
        b.y = from[i].y
        b.a = from[i].a
        b.el.style.zIndex = ''
        if (spawned[i]) {
          // não tinha caído ainda: volta para a fila da queda
          b.active = false
          b.el.style.opacity = '0'
        } else {
          b.el.style.opacity = '1'
        }
      })
      for (const c of cursors) c.style.opacity = '0'
      render()
    }

    /** Pose de cada pílula e de cada cursor para o progresso `org` (0–1) do trecho. */
    const organize = (org: number) => {
      const n = bodies.length
      const span = n > 1 ? (1 - WINDOW) / (n - 1) : 0
      const reach = (Math.hypot(W, H) + 200) * 0.6
      rank.forEach((i, k) => {
        const b = bodies[i]
        const cur = cursors[i]
        const f = from[i]
        const t = targets[i]
        const local = clamp01((org - k * span) / WINDOW)
        // ponto agarrado: no terço esquerdo da pílula
        const lx = -b.hw + Math.min(b.hw * 0.6, 56)
        const grabAt = (x: number, y: number, a: number) => [x + lx * Math.cos(a), y + lx * Math.sin(a)] as const

        let x = f.x
        let y = f.y
        let a = f.a
        let scale = 1
        let cx: number
        let cy: number
        let op: number
        if (local < APPROACH) {
          // o cursor chega de fora da tela até a pílula
          const u = easeInOut(local / APPROACH)
          const [gx, gy] = grabAt(f.x, f.y, f.a)
          cx = lerp(gx + dirs[i].ix * reach, gx, u)
          cy = lerp(gy + dirs[i].iy * reach, gy, u) - Math.sin(u * Math.PI) * 60
          op = local > 0 ? Math.min(1, local / (APPROACH * 0.25)) : 0
        } else if (local < CARRY_END) {
          // carrega: arco suave até o lugar, endireitando; levemente "levantada"
          const v = (local - APPROACH) / (CARRY_END - APPROACH)
          const u = easeInOut(v)
          x = lerp(f.x, t.x, u)
          y = lerp(f.y, t.y, u) - Math.sin(u * Math.PI) * Math.min(140, H * 0.25)
          a = lerp(f.a, 0, easeOut(v))
          scale = 1 + Math.sin(u * Math.PI) * 0.06
          ;[cx, cy] = grabAt(x, y, a)
          op = 1
        } else {
          // solta e sai
          x = t.x
          y = t.y
          a = 0
          const u = easeIn((local - CARRY_END) / (1 - CARRY_END))
          const [gx, gy] = grabAt(x, y, 0)
          cx = lerp(gx, gx + dirs[i].ox * reach, u)
          cy = lerp(gy, gy + dirs[i].oy * reach, u)
          op = 1 - Math.max(0, (u - 0.6) / 0.4)
        }
        // a que ainda não tinha caído só aparece quando o cursor a traz
        b.el.style.opacity = spawned[i] && local < APPROACH ? '0' : '1'
        b.x = x
        b.y = y
        b.a = a
        b.el.style.zIndex = local > 0 && local < 1 ? '20' : ''
        place(b, x, y, a, scale)
        cur.style.opacity = local > 0 && local < 1 ? `${op}` : '0'
        cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      })
    }

    const local = (e: PointerEvent) => {
      const r = container.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top] as const
    }
    const onDown = (e: PointerEvent) => {
      if (frozen) return
      const b = bodies.find((x) => x.el === e.currentTarget)
      if (!b || !b.active) return
      wake()
      const [px, py] = local(e)
      if (e.pointerType !== 'mouse') {
        // toque: um peteleco para cima (o arrastar fica para o scroll da página)
        impulse(b, ((Math.random() - 0.5) * 300) / b.im, -900 / b.im, px, py, 1)
        return
      }
      e.preventDefault()
      b.el.setPointerCapture(e.pointerId)
      const dx = px - b.x
      const dy = py - b.y
      const cos = Math.cos(-b.a)
      const sin = Math.sin(-b.a)
      grab = { b, lx: dx * cos - dy * sin, ly: dx * sin + dy * cos, tx: px, ty: py, id: e.pointerId }
      b.el.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return
      const [px, py] = local(e)
      grab.tx = px
      grab.ty = py
      wake()
    }
    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return
      grab.b.el.style.cursor = ''
      grab = null
    }
    for (const b of bodies) {
      b.el.addEventListener('pointerdown', onDown)
      b.el.addEventListener('pointermove', onMove)
      b.el.addEventListener('pointerup', onUp)
      b.el.addEventListener('pointercancel', onUp)
    }

    // mola do mouse: leva o ponto agarrado até o cursor (impulso com massa efetiva 2×2)
    const pull = (h: number) => {
      if (!grab) return
      const { b } = grab
      const cos = Math.cos(b.a)
      const sin = Math.sin(b.a)
      const rx = grab.lx * cos - grab.ly * sin
      const ry = grab.lx * sin + grab.ly * cos
      const gx = b.x + rx
      const gy = b.y + ry
      const vgx = b.vx - b.w * ry
      const vgy = b.vy + b.w * rx
      const dvx = ((grab.tx - gx) / h) * 0.18 - vgx
      const dvy = ((grab.ty - gy) / h) * 0.18 - vgy
      const k11 = b.im + b.ii * ry * ry
      const k12 = -b.ii * rx * ry
      const k22 = b.im + b.ii * rx * rx
      const det = k11 * k22 - k12 * k12
      const jx = ((k22 * dvx - k12 * dvy) / det) * 0.6
      const jy = ((k11 * dvy - k12 * dvx) / det) * 0.6
      impulse(b, jx, jy, gx, gy, 1)
      b.w *= 0.96
    }

    // ——— passo da física ———
    const step = (dt: number) => {
      const h = dt / SUBSTEPS
      for (let s = 0; s < SUBSTEPS; s++) {
        for (const b of bodies) {
          if (!b.active) continue
          b.vy += GRAVITY * h
          b.vx *= 0.9995
          b.vy *= 0.9995
          b.w *= 0.995
        }
        pull(h)
        solve(collide(bodies, W, H))
        for (const b of bodies) {
          if (!b.active) continue
          const sp = Math.hypot(b.vx, b.vy)
          if (sp > MAX_SPEED) {
            b.vx *= MAX_SPEED / sp
            b.vy *= MAX_SPEED / sp
          }
          b.x += b.vx * h
          b.y += b.vy * h
          b.a += b.w * h
        }
        correct(collide(bodies, W, H))
      }
    }

    // ——— progresso da cena (0–1 com o palco preso), suavizado ———
    const sceneProgress = () => {
      if (!scene) return 0
      const r = scene.getBoundingClientRect()
      const travel = r.height - window.innerHeight
      return travel > 0 ? clamp01(-r.top / travel) : 0
    }
    let prog = sceneProgress()
    // texto + botão: sobem de baixo no fim da organização
    const showReveal = () => {
      if (!reveal) return
      const r = clamp01((prog - REVEAL_START) / (REVEAL_END - REVEAL_START))
      const e = 1 - (1 - r) ** 3
      reveal.style.opacity = `${e}`
      reveal.style.transform = e < 1 ? `translate3d(0, ${(1 - e) * 48}px, 0)` : ''
      reveal.style.pointerEvents = r > 0.5 ? '' : 'none'
      reveal.style.visibility = r > 0 ? '' : 'hidden' // escondido: fora do Tab
    }
    showReveal()
    const orgOf = (p: number) => (canOrganize ? clamp01((p - ORG_START) / (ORG_END - ORG_START)) : 0)

    // ——— loop: só com a área na tela e enquanto algo se mexe ———
    let frame = 0
    let last = 0
    let visible = false
    let calm = 0
    const loop = (now: number) => {
      frame = 0
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now

      const target = sceneProgress()
      prog += (target - prog) * (1 - Math.exp(-dt / 0.1))
      if (Math.abs(target - prog) < 1e-4) prog = target
      const org = orgOf(prog)
      showReveal()

      let busy: boolean
      if (org > 0) {
        if (!frozen) freeze()
        organize(org)
        busy = prog !== target
      } else {
        if (frozen) unfreeze()
        if (started) {
          const t = (now - startAt) / 1000
          order.forEach((i, k) => {
            if (!bodies[i].active && t >= k * DROP_GAP) drop(bodies[i])
          })
        }
        step(dt)
        render()
        const allIn = bodies.every((b) => b.active)
        const moving = bodies.some((b) => b.active && (Math.hypot(b.vx, b.vy) > 6 || Math.abs(b.w) > 0.06))
        busy = moving || !!grab || !allIn || prog !== target
      }
      // dorme quando tudo assentou (sem gastar CPU parado)
      calm = busy ? 0 : calm + 1
      if (visible && calm < 45) frame = requestAnimationFrame(loop)
    }
    const wake = () => {
      calm = 0
      if (!frame && visible) {
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && entry.intersectionRatio >= 0.3 && !started) {
          started = true
          startAt = performance.now()
        }
        if (visible) wake()
      },
      { threshold: [0, 0.3] },
    )
    io.observe(container)
    window.addEventListener('scroll', wake, { passive: true })

    const ro = new ResizeObserver(() => {
      measure()
      if (frozen) organize(orgOf(prog))
      else render()
      wake()
    })
    ro.observe(container)
    document.fonts?.ready.then(() => {
      measure()
      wake()
    })

    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', wake)
      for (const b of bodies) {
        b.el.removeEventListener('pointerdown', onDown)
        b.el.removeEventListener('pointermove', onMove)
        b.el.removeEventListener('pointerup', onUp)
        b.el.removeEventListener('pointercancel', onUp)
        b.el.style.opacity = ''
        b.el.style.transform = ''
        b.el.style.zIndex = ''
      }
      for (const c of cursors) {
        c.style.opacity = ''
        c.style.transform = ''
      }
      if (reveal) {
        reveal.style.opacity = ''
        reveal.style.transform = ''
        reveal.style.pointerEvents = ''
        reveal.style.visibility = ''
      }
    }
  }, [containerRef, sceneRef, layoutRef, revealRef])
}
