# Page Fólio

Landing page de tela cheia com vídeo de fundo controlado pelo movimento horizontal
do mouse (e do toque). O vídeo nunca toca — só é posicionado com `currentTime`.

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
│   └── design/                   # mockup da home
├── public/
│   └── personagem.mp4            # vídeo all-intra servido pelo site
├── scripts/prepare-video.mjs     # gera public/personagem.mp4
├── src/
│   ├── components/               # ScrubVideo, Navbar, Hero, Sections
│   ├── hooks/                    # useVideoScrub, useLenis
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
- `useSignatureDraw.ts` — distribui o progresso pelo comprimento total das canetas
  e faz a caneta perseguir o scroll com um leve atraso (`lag`, o equivalente ao
  `scrub` do GSAP). Com `prefers-reduced-motion`, sem atraso.

## Curvas de nível no fundo — `src/components/TopoLines.tsx`

Line art topográfico atrás do letreiro (referência: landonorris.com), desenhado
ao vivo num `<canvas>` por `src/hooks/useTopoLines.ts`:

- o relevo é uma soma de ondas (cossenos em direções aleatórias, seed fixa);
  cada onda anda numa velocidade própria → as curvas se transformam devagar, e
  o conjunto desliza na diagonal (`DRIFT_X/Y`);
- curvas de nível por marching squares; `LEVELS` / `LEVEL_GAP` controlam o
  espaçamento, `SCALE` o tamanho das formas;
- 24 fps e só enquanto o fundo aparece (entre a hero encolher e as seções
  cobrirem a tela). Com `prefers-reduced-motion`, um quadro parado.

## Fluxo contínuo e terceira seção — `src/components/Services.tsx`

Não há bloco opaco subindo sobre a segunda dobra: o fundo (cor + curvas de nível)
é um só, fixo, para a página inteira, e as seções não têm fundo próprio. Depois do
pouso do card (`SCALE_END`), o card (`useHeroScrollScale`) e o letreiro
(`useScrollExit`) sobem junto com a página, e "No que eu posso te ajudar" entra
logo abaixo.

`useScrollReveal` amarra a revelação à rolagem (avança e volta): as palavras de
`[data-reveal-words]` acendem em sequência e cada `[data-reveal]` sobe e aparece
ao entrar na tela. A lista de serviços em `Services.tsx` é provisória.

## Menu — `src/components/Navbar.tsx`

No topo, três botões. Passando de 25% do viewport de scroll (segunda dobra), eles
deslizam até o canto e se recolhem num botão hambúrguer; ao voltar acima de 18%,
abrem de novo. Clicar no hambúrguer faz os botões saírem (o ícone vira X); clicar
num link, no X ou apertar Esc recolhe. Só CSS transitions (transform/opacity).

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
