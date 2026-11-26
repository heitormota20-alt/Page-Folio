import HelixRibbonHero, { type HelixProject } from './ui/helix-ribbon-hero'

/*
  TESTE — "Arquivos Visuais" com o template Helix Ribbon (components/ui).
  A versão anterior continua em Archive.tsx; para voltar, troque o import em Sections.tsx.

  As duas primeiras são as artes reais. As outras dez são PROVISÓRIAS (fotos do
  Unsplash, recortadas em 4:5 pela própria URL) só para encher a fita no teste;
  troque pelas artes do Heitor em public/arquivos/ conforme chegarem.
*/
const ARTS: HelixProject[] = [
  { src: '/arquivos/overclock-avaliacao.jpg', title: 'Overclock', year: '2024' },
  { src: '/arquivos/overclock-unico.jpg', title: 'Overclock', year: '2024' },
]

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1080&h=1350&fit=crop&q=70&auto=format`

const PLACEHOLDERS: HelixProject[] = [
  '1618005182384-a83a8bd57fbe',
  '1557672172-298e090bd0f1',
  '1614850523459-c2f4c699c52e',
  '1541701494587-cb58502866ab',
  '1620641788421-7a1c342ea42e',
  '1579546929518-9e396f3cc809',
  '1634017839464-5c339ebe3cb4',
  '1550859492-d5da9d8e45f3',
  '1604871000636-074fa5117945',
  '1563089145-599997674d42',
].map((id) => ({ src: unsplash(id), title: 'Em breve' }))

export function ArchiveHelix() {
  return (
    /*
      data-theme="light": a página fica branca quando a seção chega à metade da
      tela — o palco é transparente e corre sobre o fundo fixo (com as curvas de
      nível, que seguem até o fim do Toolkit), com o texto na cor "ink" do tema
      (escura no branco).
      pb-[45vh]: o Toolkit sobe 45vh por cima da seção anterior (-mt-[45vh]);
      esse respiro faz ele entrar só depois que a faixa termina.
    */
    <div
      id="arquivos"
      data-theme="light"
      data-theme-at="0.5"
      className="pb-[45vh] motion-reduce:pb-0"
    >
      <HelixRibbonHero
        greeting="Arquivos"
        name="Visuais"
        headingAs="h2"
        // "Visuais" como o "te ajudar" de Services: Instrument Serif itálico, coral,
        // ~1,12× o tamanho da linha em Anton (9,6vw ÷ 8,6vw lá)
        nameFont={{ family: "'Instrument Serif', serif", style: 'italic', scale: 9.6 / 8.6, color: '#FF606A' }}
        projects={[...ARTS, ...PLACEHOLDERS]}
        // depois da hélice: faixa lateral orgânica (ref. 4ª seção de landonorris.com),
        // com o título no começo dela. Para voltar à grade 3×2: closing="grid".
        closing="track"
        closingTitle
        aspect={1080 / 1350}
        count={`( ${String(ARTS.length).padStart(2, '0')} artes )`}
        bio="Social media e direção de arte. Uma seleção das peças — as próximas chegam em breve."
        scrollHint="Role para ver"
        showNav={false}
        background="transparent"
        foreground="var(--color-ink)"
      />
    </div>
  )
}
