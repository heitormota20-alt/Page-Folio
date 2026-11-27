import * as React from "react"

/**
 * HelixRibbonHero — a portfolio hero on a flat colour field. The name lands
 * letter by letter beside a small portrait; scrolling pulls the two lines of
 * the name apart while a ribbon of project images, bent around a helix,
 * rises through the screen and spins past. When it has gone, the projects
 * land in the closing layout: a captioned grid of the first six, or a
 * horizontal track of all of them that scrolls sideways as the page scrolls.
 *
 * The section pins its stage for "screens" screen heights of scroll (plus the
 * track's width, with the track). "height" is the stage height and must be a
 * definite length (default 100svh). autoPlay (off by default) runs the scroll
 * story on a loop for an unattended preview; the first wheel, touch, key or
 * scroll hands control back.
 *
 * Adapted from the 21st.dev component: `aspect` sets the card proportion
 * (the original was fixed at 3:2), `showNav` hides the built-in top bar when
 * the page already has one, `headingAs` picks the heading level, `closing`
 * picks grid or track, and `closingTitle` brings the headline back over it.
 */

export type HelixProject = {
  /** Image, in the proportion given by `aspect`. */
  src: string
  /** Caption of the card in the closing layout. */
  title: string
  /** Shown after the title in the track's caption ("TITLE, YEAR"). */
  year?: string
  /** Clickable in the track: calls `onOpen` (e.g. to show its details). */
  openable?: boolean
  /**
   * Animated piece: plays (muted, looping) in the track while on screen. `src` is
   * still its poster — the ribbon's slices are backgrounds and need an image.
   */
  video?: string
}

export type HelixLineFont = {
  /** CSS font-family list. The face must be loaded by the page. */
  family: string
  style?: "normal" | "italic"
  weight?: number
  /** Font size relative to the first line's. */
  scale?: number
  color?: string
  /** Keep the headline's capitals (default false: the text as written). */
  uppercase?: boolean
}

export interface HelixRibbonHeroProps {
  /** Stage height. Must be a definite length. */
  height?: string
  /** Screen heights of scroll the story takes. */
  screens?: number
  /** First line of the headline. */
  greeting?: string
  /** Second line, set under the first. */
  name?: string
  /** Set the second line in another face (e.g. a serif italic) instead of Anton. */
  nameFont?: HelixLineFont
  /** Small picture beside the first line. Leave out for type only. */
  portrait?: string
  portraitAlt?: string
  /** Up to twelve ride the ribbon; the first six fill the closing grid, all of them the track. */
  projects?: HelixProject[]
  /**
   * What the projects land in after the ribbon: "grid" (six, captioned) or
   * "track" (all of them, scattered at different sizes and heights, scrolling
   * sideways with a little parallax).
   */
  closing?: "grid" | "track"
  /** Bring the headline back, stacked, over the closing layout (at the track's start). */
  closingTitle?: boolean
  /** Card width / height: 1.5 for 3:2 screenshots, 0.8 for 4:5 posts. */
  aspect?: number
  brand?: string
  links?: { label: string; href: string }[]
  cta?: { label: string; href: string }
  /** Show the built-in top bar. Turn off when the page has its own menu (the space stays reserved). */
  showNav?: boolean
  /** Heading level of the headline: h1 for a page hero, h2 for a section. */
  headingAs?: "h1" | "h2"
  /** Small label beside the headline. */
  count?: string
  bio?: string
  scrollHint?: string
  /** Field colour. */
  background?: string
  /** Type colour. */
  foreground?: string
  autoPlay?: boolean
  /** Click on an `openable` project in the track (the button is `el`). */
  onOpen?: (project: HelixProject, el: HTMLElement) => void
  /** Google Fonts stylesheet, or null to bring your own Anton and Inter Tight. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Anton&family=Inter+Tight:wght@500;600;700&display=swap"

// #region motion
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** 0 before a, 1 after b, linear between. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)

/** Scroll windows of the story, 0 to 1 over the pin. */
export const PHASE = {
  bio: [0, 0.06],
  split: [0.08, 0.36],
  helix: [0.02, 0.62],
  grid: [0.53, 0.63],
  /** the headline's lines come back over the closing layout (closingTitle) */
  closingTitle: [0.54, 0.68],
  gridStagger: 0.026,
  gridScroll: [0.8, 1],
  /** track: cards fly in from the right, the first few staggered */
  trackFly: [0.53, 0.64],
  trackStagger: 0.02,
  /** track: sideways travel starts here (story progress)… */
  trackStart: 0.7,
  /** …and, after the last card, the stage holds this many screen heights */
  trackHold: 0.25,
  /** reduced motion: fades in place instead */
  calmOut: [0.04, 0.2],
  calmIn: [0.42, 0.58],
}

/** Cards per helix turn, and the turn's rise in card heights. */
export const HELIX = { perTurn: 7, slices: 4, pitch: 1.34, tiltZ: -17, tiltX: -9 }

/**
 * The track's organic arrangement, repeated every six cards. Sizes are card
 * heights in units of the stage (U); lanes keep the cards apart vertically —
 * a top and a bottom card may share columns (overlap: how far along the
 * previous card the next one starts), a centre card stands alone (gap, in U).
 * jy nudges the card within its lane (fraction of the free height), depth is
 * its parallax speed (1 = the scroll's), vy a slow vertical drift (px).
 */
export const TRACK: {
  lane: "top" | "bottom" | "center"
  h: number
  jy: number
  gap: number
  overlap?: number
  depth: number
  vy: number
}[] = [
  { lane: "top", h: 0.38, jy: 0.02, gap: 0.12, depth: 1, vy: -22 },
  { lane: "bottom", h: 0.3, jy: 0, gap: 0.1, overlap: 0.62, depth: 0.975, vy: 18 },
  { lane: "center", h: 0.56, jy: -0.02, gap: 0.11, depth: 1.055, vy: -12 },
  { lane: "top", h: 0.3, jy: 0.05, gap: 0.12, depth: 0.975, vy: 24 },
  { lane: "bottom", h: 0.34, jy: 0.03, gap: 0.1, overlap: 0.6, depth: 0.99, vy: -18 },
  { lane: "center", h: 0.48, jy: 0.03, gap: 0.11, depth: 1.03, vy: 14 },
]

/** Headline lines slide apart: line one right, line two left, by this fraction of the width. */
export function headline(p: number) {
  const t = easeInOut(seg(p, PHASE.split[0], PHASE.split[1]))
  return { l1: t, l2: -t, gone: t >= 1 }
}

/** Where the ribbon is: rise 0 = hidden below, 1 = gone above; spin in radians. */
export function helix(p: number) {
  const t = seg(p, PHASE.helix[0], PHASE.helix[1])
  return { rise: easeSine(t) * 0.35 + t * 0.65, spin: -0.85 * Math.PI + t * 2.1 * Math.PI, t }
}

/** Landing progress of grid card i. */
export function gridCard(p: number, i: number) {
  const a = PHASE.grid[0] + i * PHASE.gridStagger
  return easeOut(seg(p, a, a + (PHASE.grid[1] - PHASE.grid[0])))
}

export function gridScroll(p: number) {
  return easeInOut(seg(p, PHASE.gridScroll[0], PHASE.gridScroll[1]))
}

/** Autoplay: play forward, hold on the grid, rewind, rest on the hero, repeat. */
export const AUTO = { play: 10000, hold: 2400, rewind: 3400, rest: 1600 }
export function autoProgress(ms: number) {
  const cycle = AUTO.play + AUTO.hold + AUTO.rewind + AUTO.rest
  const m = ((ms % cycle) + cycle) % cycle
  if (m < AUTO.play) return easeSine(m / AUTO.play)
  if (m < AUTO.play + AUTO.hold) return 1
  if (m < AUTO.play + AUTO.hold + AUTO.rewind) return 1 - easeSine((m - AUTO.play - AUTO.hold) / AUTO.rewind)
  return 0
}
// #endregion

const CSS = [
  ".hrh-root{position:relative;width:100%;isolation:isolate}",
  ".hrh-root img{max-width:none;display:block}",
  ".hrh-stage{position:sticky;top:0;overflow:hidden;color:var(--hrh-fg);background:var(--hrh-bg);--hrh-g:clamp(16px,2.2vw,32px);font-family:'Inter Tight',ui-sans-serif,system-ui,sans-serif}",
  ".hrh-view{position:absolute;inset:0;perspective-origin:50% 50%}",
  ".hrh-scene{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}",
  ".hrh-screw,.hrh-group{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}",
  ".hrh-slice{position:absolute;left:0;top:0;transform-origin:0 0;background-repeat:no-repeat;backface-visibility:hidden}",
  ".hrh-line{position:absolute;left:0;top:0;margin:0;white-space:nowrap;font-family:Anton,Impact,'Arial Narrow',sans-serif;font-weight:400;line-height:1;letter-spacing:-0.005em;text-transform:uppercase}",
  ".hrh-ch{display:inline-block}",
  ".hrh-port{position:absolute;left:0;top:0;overflow:hidden;background:#1c1c1c}",
  ".hrh-root:not([data-ready=true]) .hrh-view,.hrh-root:not([data-ready=true]) .hrh-count,.hrh-root:not([data-ready=true]) .hrh-fade{visibility:hidden}",
  ".hrh-root[data-ready=true] .hrh-ch{animation:hrh-rise .7s cubic-bezier(.2,.75,.2,1) both}",
  ".hrh-root[data-ready=true] .hrh-port{animation:hrh-port .8s cubic-bezier(.2,.75,.2,1) .32s both}",
  ".hrh-port img{width:100%;height:100%;object-fit:cover}",
  ".hrh-root[data-ready=true] .hrh-fade{animation:hrh-fade .7s ease-out .55s both}",
  ".hrh-nav{position:absolute;left:0;right:0;top:0;z-index:6;display:flex;align-items:center;justify-content:space-between;padding:var(--hrh-g);padding-top:calc(var(--hrh-g) * .7);padding-bottom:calc(var(--hrh-g) * .7);background:var(--hrh-bg);font-size:13px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;line-height:1}",
  ".hrh-nav[data-hidden=true]{visibility:hidden !important}",
  ".hrh-nav a{color:inherit;text-decoration:none}",
  ".hrh-nav a:hover{opacity:.7}",
  ".hrh-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:.7em;white-space:nowrap}",
  ".hrh-links span{opacity:.75}",
  ".hrh-foot{position:absolute;left:0;right:0;bottom:0;z-index:4;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:var(--hrh-g)}",
  ".hrh-bio{margin:0;max-width:24em;font-size:clamp(14px,1.3vw,19px);font-weight:600;line-height:1.22;letter-spacing:-0.01em}",
  ".hrh-hint{font-size:13px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;line-height:1;white-space:nowrap}",
  ".hrh-count{position:absolute;left:0;top:0;z-index:3;font-size:13px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;line-height:1;white-space:nowrap}",
  ".hrh-grid{position:absolute;inset:0;z-index:5;pointer-events:none}",
  ".hrh-card{position:absolute;left:0;top:0;opacity:0}",
  ".hrh-card-img{position:relative;overflow:hidden;background:#eee}",
  ".hrh-card-img img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}",
  ".hrh-gtitle{position:absolute;left:0;top:0;width:100%;z-index:5;pointer-events:none;opacity:0}",
  ".hrh-track{position:absolute;inset:0;z-index:5;pointer-events:none}",
  ".hrh-titem{position:absolute;left:0;top:0;opacity:0;will-change:transform}",
  ".hrh-titem-img{position:relative;overflow:hidden;background:#eee}",
  ".hrh-titem-img img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}",
  ".hrh-titem-btn{display:block;padding:0;margin:0;border:0;font:inherit;color:inherit;cursor:pointer;pointer-events:auto}",
  ".hrh-titem-img video{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}",
  ".hrh-titem-btn img,.hrh-titem-btn video{transition:transform .6s cubic-bezier(.22,1,.36,1)}",
  ".hrh-titem-btn:hover img,.hrh-titem-btn:focus-visible img,.hrh-titem-btn:hover video,.hrh-titem-btn:focus-visible video{transform:scale(1.04)}",
  ".hrh-titem-btn:focus-visible{outline:2px solid currentColor;outline-offset:4px}",
  ".hrh-plus{position:absolute;right:10px;bottom:10px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0036b2;color:#fff;font-size:20px;font-weight:400;line-height:1;box-shadow:0 6px 16px -4px rgba(0,20,80,.5);transition:transform .35s cubic-bezier(.22,1,.36,1)}",
  ".hrh-titem-btn:hover .hrh-plus,.hrh-titem-btn:focus-visible .hrh-plus{transform:rotate(90deg) scale(1.08)}",
  ".hrh-tcap{display:block;height:21px;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;line-height:11px;white-space:nowrap}",
  ".hrh-gt1,.hrh-gt2{display:block;width:max-content;margin:0 auto;white-space:nowrap}",
  ".hrh-gt1{font-family:Anton,Impact,'Arial Narrow',sans-serif;font-weight:400;line-height:.95;letter-spacing:-0.005em;text-transform:uppercase}",
  ".hrh-gt2{margin-top:-0.04em;line-height:.9}",
  ".hrh-cap{display:flex;justify-content:space-between;padding-top:10px;font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;line-height:1}",
  "@keyframes hrh-rise{from{transform:translateY(60%);filter:blur(12px);opacity:0}60%{opacity:1}to{transform:none;filter:blur(0);opacity:1}}",
  "@keyframes hrh-port{from{clip-path:inset(0 0 100% 0);filter:blur(8px)}to{clip-path:inset(0 0 0 0);filter:blur(0)}}",
  "@keyframes hrh-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  "@media (max-width:719px){.hrh-links{display:none}}",
  "@media (prefers-reduced-motion:reduce){.hrh-root[data-ready=true] .hrh-ch,.hrh-root[data-ready=true] .hrh-port,.hrh-root[data-ready=true] .hrh-fade{animation:none}}",
].join("\n")

const px = (v: number) => v.toFixed(2) + "px"

function prefersReduced() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function HelixRibbonHero({
  height = "100svh",
  screens = 5,
  greeting = "Hello",
  name = "World",
  nameFont,
  portrait,
  portraitAlt = "",
  projects = [],
  closing = "grid",
  closingTitle = false,
  aspect = 1.5,
  brand = "",
  links = [],
  cta,
  showNav = true,
  headingAs = "h1",
  count = "",
  bio = "",
  scrollHint = "Scroll down",
  background = "#f2140c",
  foreground = "#f7f3ee",
  autoPlay = false,
  onOpen,
  fontHref = FONT_HREF,
  className,
}: HelixRibbonHeroProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const viewRef = React.useRef<HTMLDivElement | null>(null)
  const groupRef = React.useRef<HTMLDivElement | null>(null)
  const screwRef = React.useRef<HTMLDivElement | null>(null)
  const l1Ref = React.useRef<HTMLHeadingElement | null>(null)
  const l2Ref = React.useRef<HTMLDivElement | null>(null)
  const portRef = React.useRef<HTMLDivElement | null>(null)
  const countRef = React.useRef<HTMLDivElement | null>(null)
  const footRef = React.useRef<HTMLDivElement | null>(null)
  const gridRef = React.useRef<HTMLDivElement | null>(null)
  const navRef = React.useRef<HTMLElement | null>(null)
  const gtRef = React.useRef<HTMLDivElement | null>(null)
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  // The ribbon's lower end leaves the screen last, while the grid lands, so
  // the grid's six sit at its upper end and are gone before their tiles arrive.
  const ribbon = projects.slice(0, 12).reverse()
  const isTrack = closing === "track"
  const tiles = isTrack ? [] : projects.slice(0, 6)
  const trackItems = isTrack ? projects : []
  const [ready, setReady] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  // a stable key, so a nameFont object literal doesn't re-run the layout every render
  const nameFontKey = nameFont ? JSON.stringify(nameFont) : ""
  const nameFontCss = nameFont
    ? (nameFont.style ?? "normal") + " " + (nameFont.weight ?? 400) + " 100px " + nameFont.family
    : ""

  // Lay out once the faces are in (or after 2.5 s without them), so the
  // headline is measured once and its intro plays once.
  React.useEffect(() => {
    setReduced(prefersReduced())
    let live = true
    const go = () => live && setReady(true)
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    const t = window.setTimeout(go, 2500)
    if (fonts) {
      const loads = [fonts.load("400 100px Anton"), fonts.load("700 13px 'Inter Tight'")]
      if (nameFontCss) loads.push(fonts.load(nameFontCss))
      Promise.all(loads)
        .catch(() => undefined)
        .then(go)
    } else go()
    return () => {
      live = false
      window.clearTimeout(t)
    }
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const view = viewRef.current
    const group = groupRef.current
    const screw = screwRef.current
    const l1 = l1Ref.current
    const l2 = l2Ref.current
    const port = portRef.current
    const countEl = countRef.current
    const foot = footRef.current
    const grid = gridRef.current
    const nav = navRef.current
    const gt = gtRef.current // optional: the headline again, over the closing layout
    const gt1 = gt?.firstElementChild as HTMLElement | null | undefined
    const gt2 = gt?.lastElementChild as HTMLElement | null | undefined
    const track = trackRef.current // the track, or the grid: one of the two is rendered
    // port is optional: without a portrait the headline is type only
    if (!ready || !root || !stage || !view || !group || !screw || !l1 || !l2 || !countEl || !foot || !nav || (!grid && !track)) return
    const slices = Array.from(screw.children) as HTMLDivElement[]
    const cards = grid ? (Array.from(grid.children) as HTMLDivElement[]) : []
    const titems = track ? (Array.from(track.children) as HTMLDivElement[]) : []
    // videos in the track play only while their item is shown and the scene is on
    // screen (preload="none": nothing downloads before the first play)
    const tvideos = titems.map((el) => el.querySelector("video"))
    const hasVideo = tvideos.some(Boolean)
    let sceneOn = true
    const syncVideos = () => {
      if (!hasVideo) return
      for (let i = 0; i < tvideos.length; i++) {
        const v = tvideos[i]
        if (!v) continue
        const show = !reduced && sceneOn && titems[i].style.visibility === "visible"
        if (show && v.paused) v.play().catch(() => {})
        else if (!show && !v.paused) v.pause()
      }
    }
    const n = ribbon.length
    const S = HELIX.slices

    // ---- layout, redone on resize and when the fonts land ----
    const L = {
      W: 0, H: 0, R: 0, cw: 0, ch: 0, pitch: 0, dTheta: 0, persp: 0, zHead: 0,
      cols: 3, slot: [] as { x: number; y: number }[], tw: 0, th: 0, gridH: 0, top: 0, g: 0,
      titleH: 0, titleGap: 0, titleW: 0, titleX: 0, titleY: 0,
      // scroll: the story runs over storyRun px, the whole pin over run px
      storyRun: 1, run: 1, travel: 0, U: 0,
      items: [] as { x: number; y: number; w: number; h: number; depth: number; vy: number }[],
    }
    const layout = () => {
      const W = stage.clientWidth
      const H = stage.clientHeight
      if (!W || !H) return
      L.W = W
      L.H = H
      const mobile = W < 720
      const g = parseFloat(getComputedStyle(foot).paddingLeft) || 24
      L.g = g

      // helix — cards keep the area of the original 3:2 card whatever their
      // proportion, so tall posts don't tower over the scene
      const U = Math.max(Math.min(W, H * 1.6), H * 0.62)
      L.cw = U * 0.4 * Math.sqrt(aspect / 1.5)
      L.ch = L.cw / aspect
      L.dTheta = (Math.PI * 2) / HELIX.perTurn
      L.R = L.cw / L.dTheta
      L.pitch = L.ch * HELIX.pitch
      L.persp = U * 1.05
      view.style.perspective = px(L.persp)
      const sw = 2 * L.R * Math.sin(L.dTheta / S / 2)
      const dy = (L.pitch * (L.dTheta / S)) / (Math.PI * 2)
      const skew = (Math.atan2(dy, sw) * 180) / Math.PI
      // two faces per slice, both readable: the back one is turned round and
      // shows the mirror segment, so the ribbon never shows reversed text
      for (let k = 0; k < slices.length; k++) {
        const back = k % 2
        const i = Math.floor(k / (2 * S))
        const j = Math.floor(k / 2) % S
        const a = i * L.dTheta + (j + 0.5) * (L.dTheta / S)
        const y = -(L.pitch * a) / (Math.PI * 2)
        const el = slices[k]
        // 1px of overlap each side hides the anti-aliasing hairline at every seam
        el.style.width = px(sw + 2)
        el.style.height = px(L.ch)
        el.style.backgroundSize = px(sw * S) + " " + px(L.ch)
        el.style.backgroundPosition = px(1 - (back ? S - 1 - j : j) * sw) + " 0px"
        el.style.transform =
          "rotateY(" + ((a * 180) / Math.PI).toFixed(3) + "deg) translate3d(" + px(-sw / 2 - 1) + "," + px(y - L.ch / 2 + dy / 2) + "," + px(L.R) + ") skewY(" + (-skew).toFixed(3) + "deg)" + (back ? " translateX(" + px(sw + 2) + ") rotateY(180deg)" : "")
      }

      // headline: measured at 100px, then fitted. It sits a little behind the
      // ribbon's front so the near cards pass in front of it; its layout is
      // enlarged by exactly what the perspective takes away, so it renders 1:1.
      L.zHead = -L.R * 0.45
      const s = L.persp / (L.persp - L.zHead)
      l1.style.fontSize = "100px"
      l2.style.fontSize = "100px"
      const w1 = l1.offsetWidth
      const w2 = l2.offsetWidth
      // Anton's cap height and its baseline in a line-height: 1 box, as
      // fractions of the font size (measured from rendered ink).
      const cap = 0.86
      const base = 0.925
      // the second line, in another face, is measured: cap height from the
      // ink of an "H", baseline from a probe sitting on it
      let cap2 = cap
      let base2 = base
      const scale2 = nameFont?.scale ?? 1
      if (nameFont) {
        const probe = document.createElement("span")
        probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline"
        l2.appendChild(probe)
        base2 = probe.offsetTop / 100
        l2.removeChild(probe)
        const ctx = document.createElement("canvas").getContext("2d")
        if (ctx) {
          ctx.font = nameFontCss
          const ink = ctx.measureText("H").actualBoundingBoxAscent / 100
          if (ink > 0) cap2 = ink
        }
      }
      const lead1 = l1.querySelector("[data-lead]") as HTMLElement | null
      const o2 = lead1 ? lead1.offsetWidth / 100 : 0.5
      const pw = port ? cap * 0.8 : 0
      const gap = port ? 0.06 : 0
      const lg = cap * 0.1
      const bw = Math.max(w1 / 100 + gap + pw, o2 + (w2 / 100) * scale2)
      const bh = cap + lg + cap2 * scale2
      const f = Math.min((mobile ? 0.9 : 0.8) * W / bw, (mobile ? 0.36 : 0.47) * H / bh)
      const f2 = f * scale2
      const capH = cap * f
      const capH2 = cap2 * f2
      const left = -(bw * f) / 2 + (mobile ? 0 : W * 0.015)
      const topY = H * (mobile ? -0.08 : -0.06) - (bh * f) / 2
      const place = (el: HTMLElement, x: number, capTop: number, size: number, c: number, b: number) => {
        el.style.fontSize = px(size / s)
        el.dataset.x = String(x / s)
        el.dataset.y = String((capTop + c * size - b * size) / s)
      }
      place(l1, left, topY, f, cap, base)
      place(l2, left + o2 * f, topY + capH + lg * f, f2, cap2, base2)
      if (port) {
        port.style.width = px((pw * f) / s)
        port.style.height = px(capH / s)
        port.dataset.x = String((left + (w1 / 100 + gap) * f) / s)
        port.dataset.y = String(topY / s)
      }
      // the count sits on the second line's baseline, left of it (under it on phones)
      const ch = countEl.offsetHeight
      const baseline2 = topY + capH + lg * f + capH2
      if (mobile) {
        countEl.style.left = px(W / 2 + left)
        countEl.style.top = px(H / 2 + baseline2 + 22)
      } else {
        countEl.style.left = px(W / 2 + left)
        countEl.style.top = px(H / 2 + baseline2 - ch)
      }

      // grid — as wide as the columns allow, but never taller than the space
      // under the top bar, and centred across the stage
      const cols = mobile ? 2 : 3
      const gx = mobile ? 12 : Math.round(g * 0.9)
      const gy = mobile ? 22 : Math.round(g * 1.2)
      const navH = nav.offsetHeight
      const capRow = 22
      const rows = Math.max(1, Math.ceil(tiles.length / cols))
      L.cols = cols
      // the grid title, stacked and centred, at section-title size (8.6% of the
      // width, 48–152px) and kept inside the width. It rides above the grid,
      // which is still sized to fit the screen on its own: the title shows as
      // the cards land and leaves over the top as the grid scrolls into view.
      L.titleH = 0
      L.titleGap = 0
      L.titleW = 0
      if (gt && gt1 && gt2) {
        // on the track the title is a block at its start, as wide as its longer line
        gt.style.width = track ? "max-content" : ""
        gt1.style.fontSize = "100px"
        gt2.style.fontSize = px(100 * scale2)
        const wMax = Math.max(gt1.offsetWidth, gt2.offsetWidth) / 100
        const ft = Math.min(Math.min(152, Math.max(48, W * 0.086)), ((W - 2 * g) * (track && !mobile ? 0.6 : 0.85)) / wMax)
        gt1.style.fontSize = px(ft)
        gt2.style.fontSize = px(ft * scale2)
        L.titleH = gt.offsetHeight
        L.titleW = gt.offsetWidth
        L.titleGap = mobile ? 18 : Math.round(g * 1.1)
      }
      L.top = navH + (mobile ? 12 : g * 0.6)
      const avail = H - L.top - g
      const twByWidth = (W - 2 * g - (cols - 1) * gx) / cols
      const thByHeight = (avail - rows * capRow - (rows - 1) * gy) / rows
      L.tw = Math.max(40, Math.min(twByWidth, thByHeight * aspect))
      L.th = L.tw / aspect
      L.gridH = rows * (L.th + capRow) + (rows - 1) * gy
      const x0 = (W - (cols * L.tw + (cols - 1) * gx)) / 2
      L.slot = tiles.map((_, i) => ({ x: x0 + (i % cols) * (L.tw + gx), y: Math.floor(i / cols) * (L.th + capRow + gy) }))
      cards.forEach((c) => {
        const img = c.firstElementChild as HTMLElement
        img.style.width = px(L.tw)
        img.style.height = px(L.th)
        c.style.width = px(L.tw)
      })

      // track — the title, then the cards in TRACK's lanes, left to right;
      // the pin grows by however far the track reaches past the screen
      L.storyRun = Math.max(1, screens * H)
      if (track) {
        // the stage height, but on a tall phone screen cards are sized by the
        // width instead, so they don't shrink to stamps in an empty column
        const U = Math.min(H, W * 1.9)
        L.U = U
        const top = L.top + 24 // room for the first caption under the top bar
        const bottom = H - g
        const band = bottom - top
        const start = Math.max(2 * g, W * 0.07)
        L.titleX = start
        L.titleY = top + (band - L.titleH) * 0.45
        let x = L.titleW ? start + L.titleW + U * 0.14 : start
        L.items = []
        for (let i = 0; i < titems.length; i++) {
          const sl = TRACK[i % TRACK.length]
          const h = sl.h * U
          const w = h * aspect
          const prev = L.items[i - 1]
          if (prev) x = sl.overlap ? prev.x + prev.w * sl.overlap : prev.x + prev.w + sl.gap * U
          const free = band - h
          const y =
            sl.lane === "top" ? top + sl.jy * free : sl.lane === "bottom" ? bottom - h - sl.jy * free : top + free / 2 + sl.jy * free
          L.items.push({ x, y, w, h, depth: sl.depth, vy: (sl.vy * U) / 900 })
          const el = titems[i]
          const img = el.lastElementChild as HTMLElement
          el.style.width = px(w)
          img.style.width = px(w)
          img.style.height = px(h)
        }
        const last = L.items[L.items.length - 1]
        const right = last ? last.x + last.w + Math.max(2 * g, W * 0.08) : W
        L.travel = Math.max(0, right - W)
        L.run = PHASE.trackStart * L.storyRun + L.travel + PHASE.trackHold * H
        root.style.height = px(H + L.run)
      } else {
        L.run = L.storyRun
        root.style.height = "calc(" + height + " * " + (screens + 1) + ")"
      }
      draw(true)
    }

    // ---- per frame ----
    let cur = 0
    let goal = 0
    const shade = new Float32Array(slices.length).fill(-1)
    const draw = (force?: boolean) => {
      const { W, H } = L
      if (!W) return
      // cur is progress over the whole pin; the story's phases read p, which
      // reaches 1 after storyRun px (the whole pin, with the grid)
      const scrolled = cur * L.run
      const p = Math.min(1, scrolled / L.storyRun)
      const calm = reduced

      // headline + chrome
      const hd = headline(p)
      const out = calm ? 1 - seg(p, PHASE.calmOut[0], PHASE.calmOut[1]) : 1
      const shift = W * 0.95
      const z = L.zHead
      const s = L.persp / (L.persp - z)
      const setHead = (el: HTMLElement, dx: number) => {
        const x = Number(el.dataset.x) + dx / s
        const y = Number(el.dataset.y)
        el.style.transform = "translate3d(" + px(x) + "," + px(y) + "," + px(z) + ")"
        el.style.opacity = calm ? String(out) : hd.gone ? "0" : "1"
      }
      setHead(l1, calm ? 0 : hd.l1 * shift)
      if (port) setHead(port, calm ? 0 : hd.l1 * shift)
      setHead(l2, calm ? 0 : hd.l2 * shift)
      const bioT = calm ? 1 - out : seg(p, PHASE.bio[0], PHASE.bio[1])
      foot.style.opacity = String(1 - bioT)
      foot.style.transform = "translateY(" + px(bioT * 40) + ")"
      const cT = calm ? 1 - out : seg(p, PHASE.split[0], PHASE.split[0] + 0.08)
      countEl.style.opacity = String(1 - cT)
      countEl.style.transform = "translateX(" + px(-cT * 30) + ")"

      // helix
      const hx = helix(p)
      if (calm || hx.t <= 0 || hx.t >= 1) {
        group.style.visibility = "hidden"
      } else {
        group.style.visibility = "visible"
        const span = (L.pitch * ((n - 1) * L.dTheta)) / (Math.PI * 2)
        const reach = H / 2 + span / 2 + L.ch * 1.6
        const rise = reach - hx.rise * 2 * reach
        const phi = hx.spin
        const screwY = -(L.pitch * phi) / (Math.PI * 2)
        const centre = -(span / 2) + screwY
        group.style.transform =
          "translate3d(" + px(-W * 0.04) + "," + px(rise - centre) + "," + px(-L.R) + ") rotateZ(" + HELIX.tiltZ + "deg) rotateX(" + HELIX.tiltX + "deg)"
        screw.style.transform = "rotateY(" + ((phi * 180) / Math.PI).toFixed(3) + "deg) translateY(" + px(screwY) + ")"
        for (let k = 0; k < slices.length; k++) {
          const i = Math.floor(k / (2 * S))
          const j = Math.floor(k / 2) % S
          const a = i * L.dTheta + (j + 0.5) * (L.dTheta / S) + phi
          const c = k % 2 ? -Math.cos(a) : Math.cos(a)
          if (c < -0.05) continue
          const b = 0.66 + 0.34 * Math.max(0, c)
          if (force || Math.abs(b - shade[k]) > 0.015) {
            shade[k] = b
            slices[k].style.filter = "brightness(" + b.toFixed(3) + ")"
          }
        }
      }

      // grid
      const scrollY = gridScroll(p)
      const avail = H - L.top - L.g
      // with a title, land low enough for all of it to show under the top bar
      const landY = Math.max(H * 0.4, L.titleH ? L.top + L.titleH + L.titleGap : 0)
      const endY = L.gridH <= avail ? L.top + (avail - L.gridH) / 2 : H - L.g - L.gridH
      const baseY = landY + (endY - landY) * scrollY

      // track: how far it has travelled sideways
      const tx = track && L.travel > 0 ? clamp01((scrolled - PHASE.trackStart * L.storyRun) / L.travel) * L.travel : 0

      // closing title: over the grid it rides just above it; on the track it
      // is the first thing on it. Its lines come back from the sides they left
      // by — the first from the right, the second from the left
      if (gt && gt1 && gt2) {
        const tt = calm ? seg(p, PHASE.calmIn[0], PHASE.calmIn[1]) : easeOut(seg(p, PHASE.closingTitle[0], PHASE.closingTitle[1]))
        gt.style.opacity = String(calm ? tt : Math.min(1, tt * 2))
        gt.style.transform = track
          ? "translate(" + px(L.titleX - tx) + "," + px(L.titleY) + ")"
          : "translateY(" + px(baseY - L.titleGap - L.titleH) + ")"
        const k = calm ? 0 : 1 - tt
        gt1.style.transform = "translateX(" + px(k * W * 0.6) + ")"
        gt2.style.transform = "translateX(" + px(-k * W * 0.6) + ")"
        const blur = k > 0.01 ? "blur(" + (k * 8).toFixed(2) + "px)" : ""
        gt1.style.filter = blur
        gt2.style.filter = blur
      }

      for (let i = 0; i < cards.length; i++) {
        const el = cards[i]
        const slot = L.slot[i]
        const t = calm ? seg(p, PHASE.calmIn[0], PHASE.calmIn[1]) : gridCard(p, i)
        if (t <= 0) {
          el.style.opacity = "0"
          continue
        }
        const img = el.firstElementChild as HTMLElement
        const cap = el.lastElementChild as HTMLElement
        if (calm) {
          el.style.opacity = String(t)
          el.style.transform = "translate(" + px(slot.x) + "," + px(baseY + slot.y) + ")"
          img.style.width = px(L.tw)
          img.style.height = px(L.th)
          cap.style.opacity = "1"
          continue
        }
        // from the top edge, where the ribbon left, larger and tipped back
        const k = 1 - t
        const grow = 1 + 0.4 * k
        const w = L.tw * grow
        const h = L.th * grow
        // each card arrives from its own side, so none crosses a landed one:
        // the first row from the left, the top and the right, later rows from below
        const row = Math.floor(i / L.cols)
        const col = i % L.cols
        const sx = slot.x - (w - L.tw) / 2
        const sy = baseY + slot.y
        let fromX = sx
        let fromY = sy
        if (row > 0) fromY = H + h * 0.1
        else if (col === 0) fromX = -w * 1.05
        else if (col === L.cols - 1) fromX = W + w * 0.05
        else fromY = -h * 1.05
        const x = sx + (fromX - sx) * k
        const y = sy + (fromY - sy) * k
        img.style.width = px(w)
        img.style.height = px(h)
        el.style.width = px(w)
        el.style.opacity = String(Math.min(1, t * 3))
        img.style.filter = k > 0.01 ? "blur(" + (k * 7).toFixed(2) + "px)" : ""
        el.style.transform = "translate(" + px(x) + "," + px(y) + ") perspective(" + px(L.persp) + ") rotateX(" + (k * 16).toFixed(2) + "deg)"
        cap.style.opacity = String(seg(t, 0.8, 1))
      }

      // track cards: they slide in from the right as the ribbon leaves, then
      // travel left with the scroll. Each drifts a little off the scroll's pace
      // (depth) and height (vy) by how far it is from the middle of the screen,
      // so the strip breathes instead of moving as one plate.
      for (let i = 0; i < titems.length; i++) {
        const el = titems[i]
        const it = L.items[i]
        if (!it) continue
        const a = PHASE.trackFly[0] + Math.min(i, 4) * PHASE.trackStagger
        const t = calm ? seg(p, PHASE.calmIn[0], PHASE.calmIn[1]) : easeOut(seg(p, a, a + PHASE.trackFly[1] - PHASE.trackFly[0]))
        const base = it.x - tx
        const rel = (base + it.w / 2) / W - 0.5
        const k = calm ? 0 : 1 - t
        const x = base + (calm ? 0 : rel * W * (it.depth - 1)) + k * W * 0.35
        const y = it.y + (calm ? 0 : rel * it.vy)
        // off screen (or not in yet): skip the work
        if (t <= 0 || x > W + 40 || x + it.w < -40) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden"
          continue
        }
        el.style.visibility = "visible"
        el.style.opacity = String(calm ? t : Math.min(1, t * 2))
        // the caption row (21px) sits above the image's top edge
        el.style.transform = "translate3d(" + px(x) + "," + px(y - 21) + ",0)"
        el.style.filter = k > 0.01 ? "blur(" + (k * 6).toFixed(2) + "px)" : ""
      }
      syncVideos()
    }

    // ---- scroll, autoplay, loop ----
    const target = () => {
      const r = root.getBoundingClientRect()
      const run = r.height - stage.offsetHeight
      return run > 0 ? clamp01(-r.top / run) : 0
    }
    // autoplay only from the top of the scene, and never under reduced motion
    let auto = autoPlay && !reduced && target() < 0.002
    let autoT0 = -1
    const INTRO = 1400
    const stop = () => {
      if (!auto) return
      auto = false
      goal = target()
    }
    let raf = 0
    let last = performance.now()
    const start = last
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (auto) {
        if (now - start > INTRO) {
          if (autoT0 < 0) autoT0 = now
          goal = autoProgress(now - autoT0)
        } else goal = 0
      } else goal = target()
      const prev = cur
      if (reduced) cur = goal
      else {
        const k = 1 - Math.exp(-dt / (auto ? 40 : 110))
        cur += (goal - cur) * k
        if (Math.abs(goal - cur) < 0.00005) cur = goal
      }
      if (cur !== prev || auto) draw()
      // settled (caught up with the scroll, no autoplay): sleep until the next scroll
      raf = visible && (auto || cur !== goal) ? requestAnimationFrame(tick) : 0
    }
    const wake = () => {
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    // the loop sleeps while the scene is off screen
    let visible = true
    const io = new IntersectionObserver((es) => {
      visible = es[es.length - 1].isIntersecting
      sceneOn = visible
      syncVideos()
      wake()
    })
    io.observe(root)
    const onUser = () => {
      stop()
      wake()
    }
    const onScroll = () => {
      if (auto && Math.abs(target() - 0) > 0.002) stop()
      wake()
    }
    window.addEventListener("wheel", onUser, { passive: true })
    window.addEventListener("touchstart", onUser, { passive: true })
    window.addEventListener("keydown", onUser)
    window.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(stage)
    layout()
    cur = auto ? 0 : target()
    draw(true)
    root.setAttribute("data-ready", "true")
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("wheel", onUser)
      window.removeEventListener("touchstart", onUser)
      window.removeEventListener("keydown", onUser)
      window.removeEventListener("scroll", onScroll)
    }
  }, [ready, reduced, autoPlay, aspect, screens, greeting, name, nameFontKey, !!portrait, closing, closingTitle, ribbon.length, tiles.length, trackItems.length])

  const letters = (text: string, delay0: number) =>
    Array.from(text).map((c, i) => (
      <span key={i} className="hrh-ch" style={{ animationDelay: delay0 + i * 0.045 + "s" }}>
        {c === " " ? <span style={{ display: "inline-block", width: "0.12em" }} /> : c}
      </span>
    ))
  const firstWord = greeting.split(" ")[0]
  const restWords = greeting.slice(firstWord.length)
  const Heading = headingAs
  const nameStyle: React.CSSProperties | undefined = nameFont && {
    fontFamily: nameFont.family,
    fontStyle: nameFont.style ?? "normal",
    fontWeight: nameFont.weight ?? 400,
    color: nameFont.color,
    textTransform: nameFont.uppercase ? "uppercase" : "none",
    letterSpacing: "normal",
  }

  return (
    <section
      ref={rootRef}
      className={"hrh-root" + (className ? " " + className : "")}
      style={{ height: "calc(" + height + " * " + (screens + 1) + ")", ["--hrh-bg" as string]: background, ["--hrh-fg" as string]: foreground }}
      aria-label={greeting + " " + name}
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}</style>
      <div ref={stageRef} className="hrh-stage" style={{ height, width: "100%" }}>
        <div ref={viewRef} className="hrh-view">
          <div className="hrh-scene">
            <Heading ref={l1Ref} className="hrh-line" aria-label={greeting + " " + name}>
              <span data-lead="" style={{ display: "inline-block" }}>
                {letters(firstWord + " ", 0.08)}
              </span>
              {letters(restWords.trimStart(), 0.08 + (firstWord.length + 1) * 0.045)}
            </Heading>
            {portrait && (
              <div ref={portRef} className="hrh-port">
                <img src={portrait} alt={portraitAlt} width={480} height={600} style={{ maxWidth: "none" }} draggable={false} />
              </div>
            )}
            <div ref={l2Ref} className="hrh-line" aria-hidden="true" style={nameStyle}>
              {letters(name, 0.3)}
            </div>
            <div ref={groupRef} className="hrh-group" aria-hidden="true" style={{ visibility: "hidden" }}>
              <div ref={screwRef} className="hrh-screw">
                {ribbon.flatMap((pr, i) =>
                  Array.from({ length: HELIX.slices * 2 }, (_, j) => (
                    <div key={i + "-" + j} className="hrh-slice" style={{ backgroundImage: "url(" + JSON.stringify(pr.src) + ")" }} />
                  )),
                )}
              </div>
            </div>
          </div>
        </div>

        <div ref={countRef} className="hrh-count">
          <span className="hrh-fade" style={{ display: "block" }}>
            {count}
          </span>
        </div>

        {closingTitle && (
          <div ref={gtRef} className="hrh-gtitle" aria-hidden="true">
            <span className="hrh-gt1">{greeting}</span>
            <span className="hrh-gt2" style={nameStyle}>
              {name}
            </span>
          </div>
        )}

        {isTrack ? (
          <div ref={trackRef} className="hrh-track">
            {trackItems.map((pr, i) => (
              <figure key={i} className="hrh-titem" style={{ margin: 0 }}>
                <figcaption className="hrh-tcap">
                  {pr.title}
                  {pr.year ? ", " + pr.year : ""}
                </figcaption>
                {/* the image box stays the item's last child: layout() sizes it */}
                {onOpen && pr.openable ? (
                  <button
                    type="button"
                    className="hrh-titem-img hrh-titem-btn"
                    aria-haspopup="dialog"
                    aria-label={"Ver detalhes: " + pr.title + (pr.year ? ", " + pr.year : "")}
                    onClick={(e) => onOpen(pr, e.currentTarget)}
                  >
                    {pr.video ? (
                      <video src={pr.video} poster={pr.src} muted loop playsInline preload="none" aria-hidden="true" />
                    ) : (
                      <img src={pr.src} alt="" width={720} height={Math.round(720 / aspect)} style={{ maxWidth: "none" }} draggable={false} />
                    )}
                    <span className="hrh-plus" aria-hidden="true">+</span>
                  </button>
                ) : (
                  <div className="hrh-titem-img">
                    {/* eager: the ribbon has already fetched them as backgrounds */}
                    {pr.video ? (
                      <video src={pr.video} poster={pr.src} muted loop playsInline preload="none" aria-label={pr.title} />
                    ) : (
                      <img src={pr.src} alt={pr.title} width={720} height={Math.round(720 / aspect)} style={{ maxWidth: "none" }} draggable={false} />
                    )}
                  </div>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <div ref={gridRef} className="hrh-grid">
            {tiles.map((pr, i) => (
              <div key={i} className="hrh-card">
                <div className="hrh-card-img">
                  <img src={pr.src} alt={pr.title} width={720} height={Math.round(720 / aspect)} style={{ maxWidth: "none" }} loading="lazy" draggable={false} />
                </div>
                <div className="hrh-cap" style={{ opacity: 0 }}>
                  <span>{pr.title}</span>
                  <span>
                    {i + 1}/{tiles.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={footRef} className="hrh-foot">
          <p className="hrh-bio hrh-fade">{bio}</p>
          <span className="hrh-hint hrh-fade">{scrollHint}</span>
        </div>

        {/* Hidden, the bar still takes its height: the grid lands below where it would be. */}
        <nav
          ref={navRef}
          className="hrh-nav hrh-fade"
          aria-label="Main"
          aria-hidden={!showNav || undefined}
          inert={!showNav}
          data-hidden={!showNav || undefined}
        >
          <a href="#">{brand || " "}</a>
          <div className="hrh-links">
            {links.map((l, i) => (
              <React.Fragment key={l.label}>
                {i > 0 && <span aria-hidden="true">/</span>}
                <a href={l.href}>{l.label}</a>
              </React.Fragment>
            ))}
          </div>
          {cta ? <a href={cta.href}>{cta.label}</a> : <span />}
        </nav>
      </div>
    </section>
  )
}
