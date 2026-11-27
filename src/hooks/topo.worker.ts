import { createTopoLoop, type TopoLoop } from './topo-render'

/*
  Curvas de nível do fundo num worker: o cálculo do relevo e o desenho (no canvas
  transferido com transferControlToOffscreen) saem da thread principal — rolagem,
  cliques e as outras animações da página não disputam o processador com elas.
  Mensagens (de useTopoLines):
    { type: 'init', canvas, epoch, reduce }  epoch = instante zero de topoTime() (ms, relógio absoluto)
    { type: 'size', w, h, dpr } · { type: 'color', value } · { type: 'run', on }
  Responde { type: 'fail' } se o OffscreenCanvas não tiver contexto 2D (a página
  volta a desenhar sozinha).
*/

let loop: TopoLoop | null = null

self.addEventListener('message', (e: MessageEvent) => {
  const m = e.data
  if (m.type === 'init') {
    const ctx = (m.canvas as OffscreenCanvas).getContext('2d')
    if (!ctx) {
      self.postMessage({ type: 'fail' })
      return
    }
    const epoch = m.epoch as number
    // o mesmo topoTime() da página, no relógio do worker
    loop = createTopoLoop(ctx, () => (performance.timeOrigin + performance.now() - epoch) / 1000, Boolean(m.reduce))
  } else if (loop) {
    if (m.type === 'size') loop.size(m.w, m.h, m.dpr)
    else if (m.type === 'color') loop.color(m.value)
    else if (m.type === 'run') loop.run(m.on)
  }
})
