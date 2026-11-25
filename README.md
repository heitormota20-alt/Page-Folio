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

- `--font-heading`: **Zen Dots** — só o wordmark `PAGE FÓLIO` (e o e-mail / assinatura
  do rodapé). Classe `.font-heading`.
- `--font-body`: **Sora** — todo o resto, incluindo o "olho" `Seja muito bem vindo ao:`.

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
ao vivo num `<canvas>` por `src/hooks/useTopoLines.ts`:

- o relevo (`src/hooks/topo.ts`, o mesmo do fundo da home) é uma soma de ondas
  (cossenos em direções aleatórias, seed fixa);
  cada onda anda numa velocidade própria → as curvas se transformam devagar, e
  o conjunto desliza na diagonal (`DRIFT_X/Y`);
- curvas de nível por marching squares; `LEVELS` / `LEVEL_GAP` controlam o
  espaçamento, `SCALE` o tamanho das formas;
- na segunda dobra as linhas vão sumindo: inteiras até o pouso do card
  (`SCALE_END`), apagadas em 1,0 viewport de scroll (`FADE_OUT_*`) — da terceira
  dobra em diante o fundo é liso;
- 24 fps e só enquanto aparecem (entre a hero começar a encolher e sumirem).
  Com `prefers-reduced-motion`, um quadro parado.

## Fluxo contínuo e terceira seção — `src/components/Services.tsx`

Não há bloco opaco subindo sobre a segunda dobra: o fundo (cor + curvas de nível)
é um só, fixo, para a página inteira, e as seções não têm fundo próprio. Depois do
pouso do card (`SCALE_END`), o card (`useHeroScrollScale`) e o letreiro
(`useScrollExit`) sobem junto com a página, e "No que eu posso te ajudar" entra
logo abaixo.

**Cores depois da primeira dobra:** `--color-page` (fundo) e `--color-ink` (texto,
linhas, letreiro, menu sobre o fundo) no `@theme` de `index.css` — geram
`bg-page`, `text-ink/50`, `border-ink/10`… Segunda dobra (card + assinatura): o
azul da palavra "PORTFÓLIO" `#0036b2` + branco (tema padrão). Claro
(`html.theme-light`): branco `#fff` + azul-marinho `#0b1a24`. Escuro
(`html.theme-dark`): azul-marinho `#081722` + branco. O tema é **por seção**
(`usePageThemes`, no `App`): seções marcadas com `data-theme="light|dark"` e
`data-theme-at` (fração da tela) — vale a última cujo topo já passou desse ponto;
antes de todas, o azul. Hoje: Serviços → claro (5%), Ferramentas → escuro (60%),
Sobre mim → claro (60%). As variáveis são registradas com `@property`, então
a troca é uma transição de 0,8s de tudo que usa `bg-page` / `text-ink` (o canvas lê
a cor a cada quadro). Volta ao azul ao rolar para cima. Títulos de seção usam
`text-title` (`--color-title`): branco no azul, cinza quente `#84817b` no branco.

As seções em cena fixa usam a base `useScrollScene`: palco alto + painel `sticky`
de 100svh, progresso de entrada e de cena (0–1 com o painel parado), ambos com
inércia, e `riseLines` para a subida das linhas dos títulos.

A seção é uma **cena fixa na tela** (`useServicesScene`): um palco de 260vh com um
painel `sticky` de 100svh. Enquanto o painel sobe até parar, as linhas do título
sobem por trás das suas janelas (`overflow-hidden`). Com ele parado (160vh de
rolagem): o título fica sozinho no centro; os 4 cards voam de baixo em arco
(x e y com curvas diferentes), girando de 4× até a inclinação final (`data-rot`),
passam um pouco do ponto (ease-out-back) e assentam desencontrados (`data-y`,
`data-delay`), cobrindo o título, que sobe de leve e se apaga; por fim, a
composição fica parada antes de a cena seguir. Todo o movimento tem inércia
(`LAG`). `-mt-[40vh]` faz o título entrar logo depois do card da hero. Os
serviços dos cards são provisórios.

## Arquivos Visuais — `src/components/Archive.tsx`

Cena fixa (`useArchiveScene`, palco de 320vh): o título grande e apagado
(`text-title/45`) sobe e para no centro; com o painel parado, peças e pastas azuis
sobem flutuando por toda a tela, cada uma no seu tempo (`delay`) e profundidade
(`depth`: perto = maior, mais rápida, na frente do título; longe = menor, mais
lenta, desfocada, atrás dele), com leve balanço. `-mt-[45vh]` faz o título entrar
enquanto os cards dos serviços saem. **As peças são provisórias** (pôsteres
abstratos): para usar as artes reais, coloque os arquivos em `public/arquivos/` e
passe `src` em cada item de `PIECES`.

## Minhas ferramentas de criação — `src/components/Toolkit.tsx`

Cena fixa (`useToolkitScene`, palco de 300vh), no tema escuro: título apagado
(`text-title/45`) no centro e os cartões das ferramentas subindo amontoados pela
parte de baixo, rodopiando (`spin`), por cima dele. Usa o mesmo movimento das
peças dos Arquivos (`floatPieces`, em `useScrollScene`). **A lista de ferramentas
é provisória** e os cartões mostram siglas nas cores das marcas — para logos
reais, SVGs em `public/ferramentas/` e `logo` em cada item de `TOOLS`.

**Atenção:** com "reduzir movimento" ligado no sistema (no Windows: Configurações →
Acessibilidade → Efeitos visuais → Efeitos de animação desligado), os efeitos de
movimento (subida do título, cards, curvas de nível) ficam desligados de propósito.

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
