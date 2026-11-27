# Page Fólio

Portfólio de Heitor Mota. A home é o design feito no Photoshop (`assets/design/`)
recriado em código: "PORTFÓLIO" em Anton atrás do avatar, sobre um fundo de curvas
de nível cujo rastro do mouse pinta a palavra de azul. Ao rolar, o card encolhe e
a assinatura é escrita.

> A home anterior (vídeo do personagem virando a cabeça com o mouse —
> `ScrubVideo.tsx` + `useVideoScrub.ts`, seções "O núcleo" e "Passo 0" abaixo)
> continua no projeto, mas não é mais usada.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Lenis. Nada além disso — sem
framer-motion, sem GSAP.

Tailwind v4 é instalado com `tailwindcss @tailwindcss/vite`, o plugin `tailwindcss()`
entra em `vite.config.ts` e o CSS começa com `@import 'tailwindcss';`. **Não existe
`tailwind.config.js` nem PostCSS.**

## Estrutura

```
Page-Folio/
├── assets/                       # material bruto — NÃO entra no build
│   ├── video-source/
│   │   ├── character-turning-head.mp4    # fonte (download do Streamable)
│   │   └── character-turning-head.webm   # backup web (VP9), caso o link expire
│   ├── frames/                   # primeiro / último frame do clipe
│   └── design/                   # design da home (PNGs) e os recortes originais
├── public/
│   ├── home/                     # personagem da home (WebP)
│   └── personagem.mp4            # vídeo all-intra (home antiga, sem uso)
├── scripts/prepare-video.mjs     # gera public/personagem.mp4
├── src/
│   ├── components/               # Hero, Signature, Navbar, seções…
│   ├── hooks/                    # useHeroScrollScale, useHeroField, useLenis…
│   ├── App.tsx · main.tsx · index.css
└── index.html · vite.config.ts · tsconfig*.json
```

## Passo 0 — o vídeo

Origem: `assets/video-source/character-turning-head.mp4`
(idêntico ao arquivo de https://streamable.com/t1789u — 772.166 bytes, o "original").
Ao lado, `character-turning-head.webm` (VP9, ~166 KB) é o backup caso o link
assinado do Streamable expire.

Reprocessado para **all-intra** (todo frame é keyframe) com o binário estático do
pacote `ffmpeg-static`, via `require('ffmpeg-static')`:

```
npm run prepare:video
```

`x264 -x264-params keyint=1:min-keyint=1:scenecut=0` → cada `seek` é barato e o
scrub não engasga reconstruindo GOP.

### Análise do resultado (`public/personagem.mp4`)

| | valor |
|---|---|
| Duração | **4,000 s** |
| Frames | **96** (24 fps) |
| Keyframes | **96 / 96** |
| Resolução | 1280×720, yuv420p |

Pontas mortas: **nenhuma**. Os dois extremos do clipe já são conteúdo (o personagem
está em quadro no primeiro e no último frame — ver `assets/frames/`), então não há
trecho estático para aparar com `-ss`/`-to -c copy`.

O vídeo é servido de `public/` (mesma origem). Nunca de URL externa.

## Rodar

```
npm install
npm run dev
```

## Fontes

- **Anton** — títulos em maiúsculas ("PORTFÓLIO", "NO QUE EU POSSO", "PRAZER,"…).
- **Instrument Serif** (itálico) — a segunda voz dos títulos, em coral, e as pílulas.
- **Inter** (300) — o "Seja bem vindo ao meu" da home.
- `--font-body`: **Sora** — todo o resto (textos, botões, rótulos).
- `--font-heading` / `.font-heading` (Zen Dots) ficou sem uso — a fonte não é mais
  carregada.

Carregadas via Google Fonts no `index.html`. `body` usa `var(--font-body)`.

## Home — `src/components/Hero.tsx`

Recriação do design (`assets/design/Home.png` e `Home_faixa.png`, 1920 × 1080):

- **Quadro de 1920 × 1080** que escala com a tela (`.hero-card`, `.hero-art`,
  `.hero-type` no `index.css`): tudo é posicionado em coordenadas do design. Em
  paisagem o quadro inteiro cabe e assenta na base; em retrato (celular) o
  personagem fica grande (ombros cortados) e a palavra ocupa a largura logo acima
  da cabeça.
- **"PORTFÓLIO"** — texto de verdade em Anton (SVG `<text>`, tamanho e espaçamento
  medidos no PNG), `#222`. **"SEJA BEM VINDO AO MEU"** — Inter Light. Há um `h1`
  só para leitores de tela.
- **Personagem** — `public/home/personagem.webp`, gerado por
  `scripts/build-character.py`: cor, tons e retoques do recorte do design
  (`assets/design/personagem-recortado.png`) + a nitidez da imagem original do
  avatar (`assets/design/personagem-original.jpeg`, 1,17× maior). Com uma versão
  ampliada do original (ex.: 2× pelo Super Resolution do Photoshop), basta rodar
  `python scripts/build-character.py caminho/do/original`. Posição em
  `hero-layout.ts`.
- **Fundo e palavra (WebGL)** — `useHeroField.ts`, no estilo do landonorris.com:
  - curvas de nível com **o mesmo relevo do fundo da segunda dobra**
    (`hooks/topo.ts`, usado também por `useTopoLines`), no mesmo instante — ao
    encolher, o card continua o padrão da página;
  - "manchas de terreno" (patamares entre as curvas, em dois tons de cinza) só
    no rastro do cursor, que some rápido como lá (≈ 0,4 s; eles usam um fluido
    com dissipação 0,96 por quadro). Com o mouse parado por 2 s, um cursor
    invisível faz um zigue-zague pela tela (o "idleState" deles) e repete a cada
    9,5 s. O cursor em movimento também empurra as curvas perto dele;
  - a palavra "PORTFÓLIO" é desenhada no mesmo shader: onde há mancha ela fica
    azul (`BRAND_BLUE`), e ondula (distorção líquida), mais forte no rastro. Ela
    é rasterizada na posição do `<text>` do SVG, que continua no DOM só como
    referência de layout e fallback sem WebGL2.
  - Ritmo em `SPEED` no topo do arquivo. Com `prefers-reduced-motion`, um quadro
    parado.
- **Entrada** — espera as fontes e a imagem (`data-ready` no card): o
  personagem sobe, a palavra sobe de trás da linha de base e a saudação aparece.
  Com `prefers-reduced-motion`, tudo já aparece pronto.
- **Scroll** — `useHeroScrollScale`: o card encolhe, a tipografia some e a home
  esmaece sob um véu da cor da página (até 72%, como o card acinzentado do
  landonorris) — e a assinatura, branca, é escrita por cima com leitura.

## Assinatura — `src/components/Signature.tsx`

Referência: o efeito `signature_scroll` de landonorris.com (lá é um Rive; aqui é
SVG puro). A assinatura é escrita pelo scroll enquanto o card da hero encolhe —
de `0.12 × vh` até `SCALE_END` (o pouso do card, mesmo ponto da trava de scroll) —
e se apaga ao rolar de volta.

- `signature-paths.ts` — a assinatura "Heitor M" vetorizada da imagem de
  referência, dividida em 8 traços na ordem da escrita. Cada traço tem o
  contorno do pincel (`shape`) e a linha central da caneta (`pen`).
- `Signature.tsx` — cada `shape` fica dentro de uma `<mask>` cuja caneta é
  desenhada com `stroke-dashoffset`: o pincel (com a espessura variável original)
  aparece na ordem e direção em que a mão escreveu.
- A assinatura fica numa camada própria (fora do card, que tem `overflow-hidden`),
  com ~72vw (92vw no celular) — bem maior que o card pousado, transbordando como
  na referência. Os traços são pintados duas vezes: brancos (com sombra) recortados
  ao card esmaecido e em `text-ink` recortados ao resto (o recorte acompanha o
  card a cada quadro).
- `useSignatureDraw.ts` — distribui o progresso pelo comprimento total das canetas
  e faz a caneta perseguir o scroll com um leve atraso (`lag`, o equivalente ao
  `scrub` do GSAP). Com `prefers-reduced-motion`, sem atraso.

## Curvas de nível no fundo — `src/components/TopoLines.tsx`

Line art topográfico atrás do letreiro (referência: landonorris.com), desenhado
ao vivo num `<canvas>` por `src/hooks/useTopoLines.ts` — o desenho
(`topo-render.ts`) roda num **worker** (`topo.worker.ts`, `OffscreenCanvas`), fora
da thread principal; sem suporte, o mesmo laço roda na página:

- o relevo (`src/hooks/topo.ts`, o mesmo do fundo da home) é uma soma de ondas
  (cossenos em direções aleatórias, seed fixa);
  cada onda anda numa velocidade própria → as curvas se transformam devagar, e
  o conjunto desliza na diagonal (`DRIFT_X/Y`);
- curvas de nível por marching squares; `LEVELS` / `LEVEL_GAP` controlam o
  espaçamento, `SCALE` o tamanho das formas;
- as linhas seguem da segunda dobra até "Sobre mim" (no azul e no branco, na
  cor "ink" do tema) e se apagam quando o fim da última seção marcada com
  `data-topo-end` (hoje "Sobre mim") sobe do pé da tela até a metade
  (`FADE_OUT_END`); dali em diante o fundo é liso;
- uma seção com `data-topo-dim="0.4"` deixa as linhas mais claras (esse fator da
  intensidade) na proporção da tela que ocupa — hoje "Sobre mim";
- 24 fps e só enquanto aparecem (entre a hero começar a encolher e sumirem); a
  página só mede ao rolar (opacidade, liga/desliga) e relê a cor só na troca de
  tema. Com `prefers-reduced-motion`, um quadro parado.

## Fluxo contínuo e terceira seção — `src/components/Services.tsx`

Não há bloco opaco subindo sobre a segunda dobra: o fundo (cor + curvas de nível)
é um só, fixo, para a página inteira, e as seções não têm fundo próprio. Depois do
pouso do card (`SCALE_END`), o card (`useHeroScrollScale`) e o letreiro (`Marquee`, em
Anton como o "PORTFÓLIO"; `useScrollExit`) sobem junto com a página, e "No que eu posso te ajudar" entra
logo abaixo.

**Cores depois da primeira dobra:** `--color-page` (fundo) e `--color-ink` (texto,
linhas, letreiro, menu sobre o fundo) no `@theme` de `index.css` — geram
`bg-page`, `text-ink/50`, `border-ink/10`… Segunda dobra (card + assinatura): o
azul da palavra "PORTFÓLIO" `#0036b2` + branco (tema padrão). Claro
(`html.theme-light`): branco `#fff` + azul-marinho `#0b1a24`. Escuro
(`html.theme-dark`): azul-marinho `#081722` + branco. O tema é **por seção**
(`usePageThemes`, no `App`): seções marcadas com `data-theme="blue|light|dark"` e
`data-theme-at` (fração da tela) — vale a última cujo topo já passou desse ponto;
antes de todas, o azul. Hoje: Serviços → azul (padrão), Arquivos → claro (50%),
Ferramentas → azul (60%), Sobre mim → claro (60%). O escuro está sem uso. As variáveis são registradas com `@property`, então
a troca é uma transição de 0,8s de tudo que usa `bg-page` / `text-ink` (o canvas lê
a cor a cada quadro). Volta ao azul ao rolar para cima. Títulos de seção usam
`text-title` (`--color-title`): branco no azul, cinza quente `#84817b` no branco.

As seções em cena fixa usam a base `useScrollScene`: palco alto + painel `sticky`
de 100svh, progresso de entrada e de cena (0–1 com o painel parado), ambos com
inércia, e `riseLines` para a subida das linhas dos títulos.

**"No que eu posso te ajudar"** (referência: "ALL YOUR design needs"): no azul da
segunda dobra, título em duas vozes — "NO QUE EU POSSO" em Anton (a mesma do
"PORTFÓLIO") e "te ajudar" em Instrument Serif itálico — e, embaixo, os serviços em
pílulas (`usePillPhysics.ts`, sem biblioteca). É uma **cena presa na tela** (palco de
320vh):

1. as pílulas caem uma a uma e se empilham com física — cápsulas com rotação,
   atrito e quique; com o mouse dá para arrastar e arremessar (no toque, um
   toque dá um peteleco — arrastar fica para o scroll);
2. conforme a rolagem avança (`ORG_START`–`ORG_END`), a física congela e
   **cursores coloridos** (estilo multiplayer do Figma, etiquetas em `CURSORS`)
   entram, agarram cada pílula — as de cima da pilha primeiro —, levam até o seu
   lugar no layout final endireitando-a, soltam e saem; vários ao mesmo tempo;
3. termina com as 6 pílulas organizadas, 3 em cima e 3 embaixo (`ROWS`), num
   layout centralizado (título, pílulas, texto e botão) — o layout é feito de `[data-slot]` invisíveis, então se
   ajusta à tela (no celular as fileiras quebram) —, e, com um respiro, o texto e
   o botão "Agende uma conversa" sobem por baixo delas (`REVEAL_*`).

Tudo é função da rolagem: rolando de volta, os cursores desfazem e a pilha volta
à física. Com movimento reduzido, as pílulas já aparecem organizadas. A lista
está em `SERVICES` (provisória); leitores de tela recebem uma lista comum.

## Arquivos Visuais — `src/components/Archive.tsx`

Cena fixa (`useArchiveScene`, palco de 320vh): o título grande e apagado
(`text-title/45`) sobe e para no centro; com o painel parado, peças e pastas azuis
sobem flutuando por toda a tela, cada uma no seu tempo (`delay`) e profundidade
(`depth`: perto = maior, mais rápida, na frente do título; longe = menor, mais
lenta, desfocada, atrás dele), com leve balanço. A página passa do azul ao branco
quando a seção chega à metade da tela. **As peças são provisórias** (pôsteres
abstratos): para usar as artes reais, coloque os arquivos em `public/arquivos/` e
passe `src` em cada item de `PIECES`.

**Hoje o site usa `ArchiveHelix.tsx`** (a fita Helix, `components/ui/helix-ribbon-hero.tsx`).
As artes com `info` ficam clicáveis na faixa (um "+" azul no canto) e abrem um
pop-up azul (`ArtPopup.tsx`) ao lado da imagem — no celular, uma folha no pé da
tela — com **cliente, ano, sobre a peça, intuito e valor para o cliente**; campo
vazio aparece como "A preencher". Fecha no ×, Esc, clique fora ou rolando.
Os textos das artes são **provisórios** (tirados da própria arte); campo vazio
aparece como "A preencher".

**Arte animada** (ex.: "Copie"): `video` com o MP4 e `src` com um quadro dele em
WebP — a fita da hélice é feita de fatias de imagem, e o quadro também é o pôster.
Na faixa, o vídeo (mudo, em loop) só baixa e toca enquanto o item está na tela;
com movimento reduzido, fica o pôster. Para preparar um vídeo novo (4:5):
`ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p
-movflags +faststart public/arquivos/nome.mp4` e um quadro com
`ffmpeg -ss 5 -i in.mp4 -frames:v 1 quadro.png` (depois, em WebP).

## Minhas ferramentas de criação — `src/components/Toolkit.tsx`

Cena fixa (`useToolkitScene`, palco de 300vh), no azul padrão da página: título
em duas vozes como Serviços ("MINHAS FERRAMENTAS" em Anton, branco cheio, `text-ink`;
"de criação" em Instrument Serif itálico coral) no centro e os ícones 3D das
ferramentas subindo amontoados pela parte de baixo, rodopiando (`spin`), por cima
dele. Além do giro que segue a rolagem, cada ícone gira sozinho sem parar (CSS,
`turn` = segundos por volta, negativo = anti-horário); a sombra fica numa camada
por fora da rotação, sempre para baixo. Usa o mesmo movimento das peças dos Arquivos (`floatPieces`, em
`useScrollScene`). Ferramentas do Heitor: Photoshop, Figma, After Effects, Canva,
Blender, Illustrator, Claude e CapCut.

Os ícones são `public/ferramentas/<nome>.webp` (640×640, fundo transparente, todos
na mesma escala; a sombra é CSS). Saem da folha `assets/design/ferramentas-3d.jpeg`
(os 8 ícones sobre fundo branco, gerada no Gemini) com
`python scripts/cut-tool-icons.py` — requer numpy, scipy e pillow. Para trocar a
arte, substitua a folha mantendo a ordem (Figma, Canva, After Effects, Photoshop /
Illustrator, CapCut, Blender, Claude) e rode o script de novo; passando uma pasta
como argumento, ele salva também uma prévia dos ícones sobre o azul da página.

## Sobre mim — `src/components/About.tsx`

No branco (tema claro, como a home do design), com as curvas de nível do fundo,
em duas colunas: à esquerda o Heitor em 3D desenhando com a caneta
(`public/sobre/heitor-desenhando.webp`, recortado de
`assets/design/heitorzinho.png`), grande, encostado na borda e apoiado na base; à
direita, centralizados na altura, o título em duas vozes ("PRAZER," em Anton,
"sou o Heitor" em Instrument Serif itálico coral), o cargo discreto ("Designer
Gráfico Pleno"), a apresentação em Sora leve (300), o botão **Baixar currículo** (no azul da
página) e os botões redondos do GitHub e do Behance (`PROFILES` — **faltam os
links**).

Do `lg` em diante a imagem ocupa no máximo a metade esquerda (50vw, ou o que cabe
em 90% da altura) e os textos ficam na coluna da direita — nunca se encostam.
Abaixo do `lg`, tudo empilhado e centralizado, com o personagem embaixo.

**Entrada** (CSS `.about-in*` e `.about-char` no `index.css`), repetida a cada
chegada: quando a seção aparece, o texto vem da direita — as linhas do título
deslizam dentro das suas janelas, depois o cargo, o texto e os botões, um após o
outro (`--i`); quando o personagem aparece, ele entra de leve pela esquerda e, logo
depois, os elementos saem de trás dele. Marcadores separados (`data-shown` na seção,
`data-in` na caixa do personagem): no celular o personagem fica bem abaixo do texto.

**Elementos saindo de trás do personagem** (`about-pops.tsx` + `.about-pop` no
`index.css`): ícones 3D do Photoshop e do Illustrator (os de `public/ferramentas/`)
e, em SVG, a ferramenta de texto, a barra de ferramentas, a caneta de bézier, um
pincel e cursores. Ficam numa camada atrás da imagem: começam pequenos sobre o
rosto (escondidos por ele) e, quando 30% do personagem aparece na tela, voam até o
lugar em volta da cabeça, um após o outro, com um leve quique, e passam a flutuar.
Saindo da tela, voltam para trás dele — a entrada se repete a cada chegada. As
posições (em fração da caixa da imagem, `POPS`) evitam o título e o texto em
qualquer tela. Com movimento reduzido, aparecem parados no lugar.

O botão baixa `public/curriculo-heitor-mota.pdf` (`CV_URL` em `profiles.ts`),
gerado de `curriculo/curriculo.html` por `npm run curriculo` (ver Currículo). O texto da
apresentação (`INTRO`) é o texto do Heitor.

**Atenção:** com "reduzir movimento" ligado no sistema (no Windows: Configurações →
Acessibilidade → Efeitos visuais → Efeitos de animação desligado), os efeitos de
movimento (subida do título, cards, curvas de nível) ficam desligados de propósito.

## Rodapé — `src/components/Footer.tsx`

No estilo do rodapé de landonorris.com, com a identidade do site: um cartão grande no
azul `#0036b2` (cantos arredondados e uma aba no topo) sobre a moldura branca, com
um brilho coral embaixo, e as curvas de nível bem discretas (o mesmo relevo do
fundo, parado e em vetor — `src/hooks/topo-path.ts`). Tudo em fluxo dentro do
cartão (nada posicionado por altura, então nada se sobrepõe; se faltar altura, o
cartão cresce):

- no alto, a frase em duas vozes ("VAMOS CRIAR" em Anton, "algo memorável." em
  Instrument Serif itálico coral — **provisória**, em `HEADLINE`) com a assinatura
  "Heitor M" da home em coral;
- no meio, de ponta a ponta, o **jogo da caneta** (`HireGame.tsx`, inspirado em
  bezier.method.ac): vetorizar "CONTRATE-ME" na Anton. Cada letra é uma guia com os
  nós; clique cria nó de canto, arrastar cria curva (alças espelhadas, como no
  Illustrator/Figma), fecha-se no primeiro nó. O próximo nó pulsa e o clique gruda
  nele se cair perto; arrastando perto da alça certa ela encaixa (alças pequenas
  demais para arrastar encaixam sozinhas). Letra fechada é preenchida; no fim, a
  precisão das curvas e o "Fale comigo" pulsando. Desfazer (botão ou Ctrl/⌘+Z),
  recomeçar e "Vetorizar o resto pra mim". Em telas estreitas a câmera acompanha a
  letra atual. Os contornos (127 nós) vêm de `src/components/hire-glyphs.ts`, gerado
  por `scripts/build-hire-glyphs.py` a partir da Anton (requer fonttools);
- no pé, uma faixa de links com um fio em cima — **Serviços, Arquivos, Ferramentas,
  Sobre mim** à esquerda e **LinkedIn, GitHub, Behance, E-mail** à direita (Sora,
  maiúsculas pequenas) — e, abaixo, os botões **Fale comigo** (coral, abre o
  e-mail) e **Currículo** (branco). Fora do cartão: © e "voltar ao topo".

Ao chegar, a frase sobe, a assinatura se escreve da esquerda para a direita e o
resto aparece (CSS `.foot-*`). No celular, os dois grupos de links ficam empilhados.

O rodapé é o `#contatos` do menu; o botão "Projetos" do menu leva aos Arquivos
Visuais. Os contatos e perfis ficam em `src/components/profiles.ts` (usado também
em "Sobre mim") — é lá que entram os links do GitHub e do Behance.

## Currículo — `curriculo/curriculo.html`

O currículo na identidade visual do site: cabeçalho no azul `#0036b2` com as curvas
de nível (o mesmo relevo de `src/hooks/topo.ts`, desenhado em vetor) e o avatar 3D
da home (`curriculo/avatar.png`, reduzido para o PDF ficar leve), nome em Anton,
cargo em Instrument Serif itálico coral, texto em Sora, habilidades em pílulas e
marcadores coral. Página A4; o texto sai no PDF na ordem de leitura (nome primeiro),
para os sistemas de triagem (ATS) lerem certo — por isso o cabeçalho não usa
elementos posicionados (curvas e avatar são fundos).

Para gerar o PDF: `npm run curriculo` → `public/curriculo-heitor-mota.pdf`, o
arquivo que os botões do site baixam (usa o Chrome; ou defina `CHROME_PATH`).

## Desempenho — regras do site

Com a página parada, nada deve rodar na thread principal (medido com o Chrome
a 4× mais lento: 0–6% em cada seção; a home ~30%, que é o shader dela):

- **laços de animação dormem**: a rolagem suave (`useLenis`) só roda enquanto há
  rolagem; a hero (`useHeroField`) para quando o card sai da tela
  (IntersectionObserver); a hélice de Arquivos dorme parada; cenas e assinatura
  só rodam até alcançar a rolagem. Um rAF eterno obriga o navegador a refazer a
  página a cada quadro e tira as animações CSS da placa de vídeo;
- **nada de ler `scrollY`/medidas a cada quadro** (força refazer o layout) — só
  ao rolar;
- **animações CSS infinitas param fora da tela**: blocos com
  `data-pause-offscreen` (hero, letreiro, ferramentas, sobre mim, rodapé) ganham
  `data-offscreen` (`usePauseOffscreen`); peças escondidas do `floatPieces`
  ganham `data-off` — o CSS pausa as animações dentro deles;
- **filtro (sombra, desfoque) nunca em volta de algo animado** — fica dentro, no
  próprio desenho (a sombra dos ícones é uma cópia desfocada girando junto); nada
  de animação dentro de SVG (o pulso do jogo é um anel em HTML); deslocamentos
  animados em px, não em %;
- sombras coerentes: luz de cima — a sombra cai para baixo na tela, desfazendo a
  inclinação da peça (`--rot` dos ícones, `--r` das peças de Sobre mim).

## Menu — `src/components/Navbar.tsx`

No topo, três botões. Passando de 25% do viewport de scroll (segunda dobra), eles
deslizam até o canto e se recolhem num botão hambúrguer; ao voltar acima de 18%,
abrem de novo. Clicar no hambúrguer faz os botões saírem (o ícone vira X); clicar
num link, no X ou apertar Esc recolhe. Só CSS transitions (transform/opacity).

## Recorte do personagem do vídeo (ferramenta, sem uso no site)

`scripts/cutout-frames.py` gera, a partir de `public/Personagem_Definitivo_scrub.mp4`,
os quadros do personagem SEM o fundo azul (WebP com transparência em
`public/personagem/`, ≈ 6 MB, ~3 min) — base para uma home com conteúdo atrás do
personagem. Requer numpy, pillow e ffmpeg.

## O núcleo — `src/hooks/useVideoScrub.ts`

`useVideoScrub(videoRef, { mapping = 'absolute', sensitivity = 0.8, restAt = 'center' })`.

- **`mapping: 'absolute'` (usado na home)** — a posição X do ponteiro mapeia direto
  no clipe: ponteiro na borda esquerda = primeiro frame (personagem olhando pra
  esquerda), borda direita = último frame. `sensitivity` é a fração do clipe que a
  largura inteira cobre (`1` = clipe inteiro).
- **`mapping: 'relative'`** — o modelo do spec: cada `mousemove`/`touchmove` avança
  `(delta / window.innerWidth) * sensitivity * video.duration` (com `prevX` ancorando
  o primeiro movimento).

Antes do ponteiro se mexer, o playhead descansa em `duration / 2` (`restAt: 'center'`).

Os 10 requisitos (bugs conhecidos de WebKit/Chromium) estão implementados e
comentados no arquivo, requisito por requisito:

1. Clamp por `seekable` (`[start(0), end(último) − 1/30]`), nunca por `duration`; `seekable` relido a cada seek.
2. Nada de `currentTime` com `readyState === 0` — gate `readyState >= 1`, e só confia no evento `seeked`.
3. `seekable` vazio aborta em silêncio → checa `length > 0` e re-tenta no `progress`.
4. `duration` `NaN` antes de `loadedmetadata` → só grava no acumulador se `Number.isFinite`.
5. `prevX` começa `null`; o primeiro movimento só ancora (modo `relative`).
6. Fila de um seek por vez (lock); o próximo só é pedido dentro do handler de `seeked`.
7. Watchdog de 400 ms libera o lock se `seeked` não chegar.
8. Reset do lock em `emptied`, `error`, `abort`, `loadstart`.
9. Guarda contra `window.innerWidth === 0` (iframe).
10. `restAt: 'center'` → no `loadedmetadata` posiciona em `duration / 2` (também aquece o buffer no iOS).

Além disso: `touchmove` suportado; `prevX` reancorado em `blur`, `touchend`,
`touchcancel` e `mouseleave` do documento; todos os listeners removidos no cleanup
do `useEffect` (StrictMode monta duas vezes em dev).
