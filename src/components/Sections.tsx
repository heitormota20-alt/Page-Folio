import { About } from './About'
import { Footer } from './Footer'
import { Services } from './Services'
// TESTE: Arquivos Visuais com o template Helix Ribbon. Para voltar, use `import { Archive } from './Archive'` e <Archive />.
import { ArchiveHelix } from './ArchiveHelix'
import { Toolkit } from './Toolkit'

export function Sections() {
  return (
    // Sem fundo próprio: o conteúdo corre sobre o fundo fixo (curvas de nível),
    // então não há bloco opaco subindo nem corte entre a segunda dobra e as seções.
    <div className="relative z-[2] text-ink">
      <Services />
      <ArchiveHelix />
      <Toolkit />
      <About />
      <Footer />
    </div>
  )
}
