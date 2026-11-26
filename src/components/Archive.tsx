const GRADIENTS = [
  ['#0d1f40', '#1a3a7a'],
  ['#1a0a2e', '#3d1b6b'],
  ['#0d2a1a', '#1a5c35'],
  ['#2a0a0d', '#6b1b20'],
  ['#0d2a2a', '#1b5c5c'],
  ['#1a1a0d', '#4a4a1b'],
]

type Piece = {
  title: string
  year: string
  src?: string
  alt?: string
}

// Todas as artes são posts 4:5 (1080×1350), então todo bloco usa essa proporção.
const ASPECT = '1080 / 1350'

const PIECES: Piece[] = [
  { title: 'Overclock', year: '2024', src: '/arquivos/overclock-avaliacao.jpg', alt: 'Social media Overclock — Avaliação' },
  { title: 'Overclock', year: '2024', src: '/arquivos/overclock-unico.jpg',    alt: 'Social media Overclock — Por que é único?' },
  { title: 'Em breve',  year: '—' },
  { title: 'Em breve',  year: '—' },
  { title: 'Em breve',  year: '—' },
  { title: 'Em breve',  year: '—' },
  { title: 'Em breve',  year: '—' },
  { title: 'Em breve',  year: '—' },
]

// 4 colunas: col 0 → [0,4], col 1 → [1,5], col 2 → [2,6], col 3 → [3,7]
const COLUMNS = [0, 1, 2, 3].map(ci => [PIECES[ci], PIECES[ci + 4]])

function Card({ piece, gradIndex }: { piece: Piece; gradIndex: number }) {
  const [from, to] = GRADIENTS[gradIndex % GRADIENTS.length]
  return (
    <div
      className="group relative overflow-hidden bg-[#0b1a24]"
      style={{ aspectRatio: ASPECT }}
    >
      {piece.src ? (
        <img
          src={piece.src}
          alt={piece.alt ?? piece.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
        />
      )}

      {/* gradiente de leitura */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

      {/* label */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-4">
        <span className="text-[13px] font-semibold text-white">{piece.title}</span>
        <span className="text-[11px] text-white/50">{piece.year}</span>
      </div>
    </div>
  )
}

export function Archive() {
  return (
    <section id="arquivos" data-theme="light" data-theme-at="0.5" className="px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-7xl">

        {/* Título */}
        <h2 className="mb-16 flow-root text-center uppercase">
          <span className="-my-[0.14em] block overflow-hidden py-[0.14em] whitespace-nowrap">
            <span className="block font-['Anton',sans-serif] text-[length:min(clamp(2.75rem,10vw,9rem),calc((100vw_-_3rem)/7))] leading-[0.95] tracking-[-0.005em] text-title/45">
              Arquivos
            </span>
          </span>
          <span className="-my-[0.14em] block overflow-hidden py-[0.14em] whitespace-nowrap">
            <span className="block font-['Instrument_Serif',serif] text-[length:min(clamp(3rem,11vw,10rem),calc((100vw_-_3rem)/6))] leading-[0.9] italic normal-case text-[#FF606A]">
              Visuais
            </span>
          </span>
        </h2>

        {/* Desktop — 4 colunas com offset alternado */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 lg:gap-6">
          {COLUMNS.map((col, ci) => (
            <div
              key={ci}
              className={`flex flex-col gap-4 lg:gap-6${ci % 2 === 1 ? ' mt-20' : ''}`}
            >
              {col.map((piece, pi) => (
                <Card key={pi} piece={piece} gradIndex={ci * 2 + pi} />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile — 2 colunas */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {PIECES.map((piece, i) => (
            <Card key={i} piece={piece} gradIndex={i} />
          ))}
        </div>

      </div>
    </section>
  )
}
