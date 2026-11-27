import { type CSSProperties, useRef } from 'react'
import { useToolkitScene } from '../hooks/useToolkitScene'

const TITLE_LINES = ['Minhas ferramentas', 'de criação']

/*
  Ferramentas do Heitor, em ícones 3D: public/ferramentas/<icon>.webp, 640×640 com
  fundo transparente, todos na mesma escala. Saem da folha
  assets/design/ferramentas-3d.jpeg pelo scripts/cut-tool-icons.py.

  A arte desenha os 8 no MESMO ângulo (a lateral 3D sempre à direita, levemente
  inclinados). Para não parecerem todos virados para o mesmo lado, `rot` alterna
  bem entre horário e anti-horário (a lateral aparece em direções diferentes) e
  `flip` espelha os ícones simétricos — só o Claude: letras e logos assimétricos
  ficariam ao contrário.

  x: centro horizontal (fração da largura) · depth: 0 longe … 1 perto ·
  delay: quando entra (fração da cena) · size: × unidade base ·
  rot: inclinação no meio da subida · spin: quanto gira ao longo da subida (graus,
  segue a rolagem) · turn: segundos por volta da rotação contínua (CSS, independe
  da rolagem; negativo = anti-horário)
*/
const TOOLS: {
  name: string
  icon: string
  x: number
  depth: number
  delay: number
  size: number
  rot: number
  spin: number
  turn: number
  flip?: boolean
}[] = [
  { name: 'Photoshop', icon: 'photoshop', x: 0.22, depth: 0.85, delay: 0.0, size: 1.1, rot: -22, spin: 30, turn: 14 },
  { name: 'Figma', icon: 'figma', x: 0.76, depth: 0.9, delay: 0.06, size: 1.05, rot: 22, spin: -30, turn: -11 },
  { name: 'After Effects', icon: 'after-effects', x: 0.5, depth: 0.8, delay: 0.12, size: 1.1, rot: 30, spin: -24, turn: 16 },
  { name: 'Canva', icon: 'canva', x: 0.14, depth: 0.6, delay: 0.18, size: 0.95, rot: -20, spin: 34, turn: -13 },
  { name: 'Blender', icon: 'blender', x: 0.84, depth: 0.8, delay: 0.24, size: 1.05, rot: 26, spin: -36, turn: 12 },
  { name: 'Illustrator', icon: 'illustrator', x: 0.56, depth: 0.85, delay: 0.3, size: 1.1, rot: -26, spin: 26, turn: -15 },
  { name: 'Claude', icon: 'claude', x: 0.28, depth: 0.9, delay: 0.36, size: 1.05, rot: 14, spin: -30, turn: 10, flip: true },
  { name: 'CapCut', icon: 'capcut', x: 0.7, depth: 0.7, delay: 0.43, size: 1, rot: -16, spin: 32, turn: -12 },
]

/**
 * Seção "Minhas ferramentas de criação" — cena fixa (ver useToolkitScene): fundo
 * azul (tema padrão da página), título no centro e os ícones 3D das
 * ferramentas subindo amontoados, rodopiando, por cima dele.
 */
export function Toolkit() {
  const sceneRef = useRef<HTMLDivElement>(null)
  useToolkitScene(sceneRef)

  return (
    // -mt-[45vh]: o título entra enquanto as peças dos Arquivos saem.
    // data-theme: a página volta ao azul (#0036b2) quando esta seção chega a 60% da tela.
    // As curvas de nível do fundo seguem por aqui e por "Sobre mim" (que tem o data-topo-end).
    <section
      id="ferramentas"
      data-theme="blue"
      data-theme-at="0.6"
      className="-mt-[45vh] motion-reduce:mt-0"
    >
      {/* Palco alto: 100vh de entrada + 200vh com o painel parado na tela */}
      <div ref={sceneRef} className="relative h-[300vh] motion-reduce:h-auto">
        <div className="pointer-events-none sticky top-0 grid h-[100svh] place-items-center overflow-hidden px-6 sm:px-10 motion-reduce:static motion-reduce:h-auto motion-reduce:gap-12 motion-reduce:overflow-visible motion-reduce:py-24">
          {/*
            Título em duas vozes, como Serviços: Anton (a do "PORTFÓLIO"), em branco
            cheio, e Instrument Serif itálico coral. Mesmos tamanhos de Serviços.
            No celular a 1ª linha quebra ("MINHAS / FERRAMENTAS"), e o teto garante
            que "FERRAMENTAS" caiba (≈ 5,23× a fonte); do sm em diante fica numa
            linha só ("MINHAS FERRAMENTAS" ≈ 8,39×, cabe com folga a 8,6vw).
          */}
          {/* O tamanho fica na janela (overflow-hidden) para as folgas em em — que
              não deixam cortar acentos, a cedilha e o itálico — seguirem a fonte. */}
          <h2 className="relative z-10 flow-root text-center [grid-area:1/1] motion-reduce:[grid-area:auto]">
            <span className="-my-[0.14em] block overflow-hidden py-[0.14em] text-[length:min(clamp(3rem,8.6vw,9.5rem),calc((100vw_-_3rem)/5.4))] sm:whitespace-nowrap">
              <span
                data-line=""
                className="block font-['Anton',sans-serif] leading-[0.95] tracking-[-0.005em] text-ink uppercase will-change-transform"
              >
                {TITLE_LINES[0]}
              </span>
            </span>
            <span className="-mx-[0.1em] -my-[0.14em] block overflow-hidden px-[0.1em] py-[0.14em] text-[length:clamp(3.4rem,9.6vw,10.5rem)] whitespace-nowrap">
              <span
                data-line=""
                className="-mt-[0.04em] block font-['Instrument_Serif',serif] leading-[0.9] text-[#FF606A] italic will-change-transform"
              >
                {TITLE_LINES[1]}
              </span>
            </span>
          </h2>

          {/* Para leitores de tela: a lista fica estável (a camada animada some e volta) */}
          <ul className="sr-only">
            {TOOLS.map((t) => (
              <li key={t.name}>{t.name}</li>
            ))}
          </ul>

          {/* Camada dos ícones: posicionados pelo JS */}
          <ul
            aria-hidden="true"
            className="absolute inset-0 motion-reduce:static motion-reduce:flex motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-4"
            style={{ '--u': 'clamp(130px, 17vw, 300px)' } as CSSProperties}
          >
            {TOOLS.map((t, i) => {
              const near = t.depth >= 0.6
              // rotação contínua: cada um no seu ritmo, sentido e ponto de partida
              const turnStyle: CSSProperties = {
                animationDuration: `${Math.abs(t.turn)}s`,
                animationDirection: t.turn < 0 ? 'reverse' : 'normal',
                animationDelay: `-${(((i * 0.37) % 1) * Math.abs(t.turn)).toFixed(2)}s`,
              }
              const style: CSSProperties = {
                width: `calc(var(--u) * ${t.size})`,
                zIndex: near ? 20 : 0,
                filter: t.depth < 0.5 ? 'blur(1.5px)' : undefined,
                opacity: t.depth < 0.5 ? 0.75 : 1,
                visibility: 'hidden',
              }
              return (
                <li
                  key={t.name}
                  data-piece=""
                  data-x={t.x}
                  data-depth={t.depth}
                  data-delay={t.delay}
                  data-rot={t.rot}
                  data-spin={t.spin}
                  className="absolute top-0 left-0 will-change-transform motion-reduce:visible! motion-reduce:static"
                  style={style}
                >
                  {/*
                    Três camadas, porque o transform do <li> é do JS (subida + giro da rolagem):
                    a sombra fica por fora da rotação contínua — assim ela continua embaixo
                    do ícone em vez de dar a volta com ele; o espelho fica na imagem.
                    width/height reservam o quadrado antes de carregar (o JS mede a peça).
                  */}
                  <div className="drop-shadow-[0_18px_22px_rgba(0,12,48,0.5)]">
                    <div className="animate-spin motion-reduce:animate-none" style={turnStyle}>
                      <img
                        src={`/ferramentas/${t.icon}.webp`}
                        alt=""
                        width={640}
                        height={640}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className={`block h-auto w-full select-none ${t.flip ? '-scale-x-100' : ''}`}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
