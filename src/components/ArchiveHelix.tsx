import { useCallback, useState } from 'react'
import HelixRibbonHero, { type HelixProject } from './ui/helix-ribbon-hero'
import { ArtPopup, type ArtInfo } from './ArtPopup'

/*
  "Arquivos Visuais" com o template Helix Ribbon (components/ui).
  A versão anterior continua em Archive.tsx; para voltar, troque o import em Sections.tsx.

  As três primeiras são as artes reais (a terceira, animada: `video`). As outras
  nove são PROVISÓRIAS (fotos do Unsplash, recortadas em 4:5 pela própria URL) só
  para encher a fita no teste; troque pelas artes do Heitor em public/arquivos/
  conforme chegarem (cada arte real entra no lugar de uma provisória: 12 no total).

  Arte com `info` vira clicável na faixa (com um "+" no canto) e abre o pop-up
  azul (ArtPopup): cliente, ano, um descritivo leve, o intuito (para que serviu)
  e o valor para o cliente. Campo vazio aparece como "A preencher".
*/
type Art = HelixProject & { info?: ArtInfo }

const ARTS: Art[] = [
  {
    src: '/arquivos/overclock-avaliacao.webp',
    title: 'Overclock',
    year: '2024',
    // PROVISÓRIO — descritivo e intuito tirados da própria arte; o Heitor ajusta e preenche o valor
    info: {
      client: 'Overclock',
      year: '2024',
      description: 'Post para as redes sociais que convida quem já provou o Overclock a deixar sua avaliação.',
      purpose: 'Gerar avaliações de clientes e prova social para a marca.',
      value: '',
    },
  },
  {
    src: '/arquivos/overclock-unico.webp',
    title: 'Overclock',
    year: '2024',
    // PROVISÓRIO — idem
    info: {
      client: 'Overclock',
      year: '2024',
      description: 'Post para as redes sociais que responde "Por que Overclock é único?", com os diferenciais do produto em destaque.',
      purpose: 'Apresentar os diferenciais do produto e fortalecer a marca.',
      value: '',
    },
  },
  {
    // arte animada: o vídeo toca na faixa; a imagem (um quadro dele) é o pôster e
    // o que aparece na fita da hélice
    src: '/arquivos/copie.webp',
    video: '/arquivos/copie.mp4',
    title: 'Copie',
    // PROVISÓRIO — o descritivo é o que se vê na peça; cliente, ano, intuito e valor: o Heitor preenche
    info: {
      description:
        'Pôster animado de tipografia cinética: a palavra "COPIE" troca de fonte a cada quadro, sobre a ilustração de um rapaz numa fotocopiadora: "Até virar meu".',
    },
  },
]

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1080&h=1350&fit=crop&q=70&auto=format`

const PLACEHOLDERS: Art[] = [
  '1618005182384-a83a8bd57fbe',
  '1557672172-298e090bd0f1',
  '1614850523459-c2f4c699c52e',
  '1541701494587-cb58502866ab',
  '1620641788421-7a1c342ea42e',
  '1579546929518-9e396f3cc809',
  '1634017839464-5c339ebe3cb4',
  '1550859492-d5da9d8e45f3',
  '1604871000636-074fa5117945',
].map((id) => ({ src: unsplash(id), title: 'Em breve' }))

const PROJECTS: Art[] = [...ARTS, ...PLACEHOLDERS].map((a) => ({ ...a, openable: Boolean(a.info) }))

export function ArchiveHelix() {
  const [open, setOpen] = useState<{ art: Art; anchor: HTMLElement } | null>(null)
  // clicar de novo na mesma imagem fecha
  const onOpen = useCallback(
    (project: HelixProject, anchor: HTMLElement) =>
      setOpen((cur) => (cur?.anchor === anchor ? null : { art: project as Art, anchor })),
    [],
  )
  const onClose = useCallback(() => setOpen(null), [])

  return (
    /*
      data-theme="light": a página fica branca quando a seção chega à metade da
      tela — o palco é transparente e corre sobre o fundo fixo (com as curvas de
      nível, que seguem até o fim de "Sobre mim"), com o texto na cor "ink" do tema
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
        projects={PROJECTS}
        onOpen={onOpen}
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
      {open?.art.info && (
        <ArtPopup key={open.art.src} title={open.art.title} info={open.art.info} anchor={open.anchor} onClose={onClose} />
      )}
    </div>
  )
}
