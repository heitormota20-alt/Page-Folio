import { Services } from './Services'

const PROJECTS = [
  {
    year: '2026',
    title: 'Checkout em 1 etapa',
    kind: 'Teste A/B · E-commerce',
    result: '+18% conversão',
    blurb:
      'Redução de 3 telas para 1. Validado em 40 mil sessões antes de virar padrão da loja.',
  },
  {
    year: '2025',
    title: 'Onboarding guiado',
    kind: 'Teste de ativação · SaaS',
    result: '+31% ativação D7',
    blurb:
      'Fluxo interativo no lugar do tour estático. Ganho sustentado depois de 3 meses.',
  },
  {
    year: '2025',
    title: 'Paywall dinâmico',
    kind: 'Teste de preço · App',
    result: '+12% receita/usuário',
    blurb:
      'Oferta montada a partir do comportamento da sessão, sem penalizar retenção.',
  },
]

const ABOUT = [
  'Product designer focado em experimentação e growth.',
  'Rodo testes de ponta a ponta: hipótese, protótipo, implementação e leitura de dados.',
  'Só entra no portfólio o que foi medido e sustentou o resultado.',
]

export function Sections() {
  return (
    // Sem fundo próprio: o conteúdo corre sobre o fundo fixo (curvas de nível),
    // então não há bloco opaco subindo nem corte entre a segunda dobra e as seções.
    <div className="relative z-[2] text-ink">
      <Services />
      <section id="sobre" className="border-t border-ink/10 px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-[1fr_1.4fr] sm:gap-16">
          <h2 className="text-[12px] font-medium tracking-[0.22em] text-ink/50 uppercase">
            Sobre mim
          </h2>
          <div className="space-y-5">
            {ABOUT.map((line) => (
              <p key={line} className="text-lg leading-relaxed text-ink/80 sm:text-xl">
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="projetos" className="border-t border-ink/10 px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[12px] font-medium tracking-[0.22em] text-ink/50 uppercase">
            Projetos
          </h2>
          <ul className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
            {PROJECTS.map((p) => (
              <li
                key={p.title}
                className="grid grid-cols-1 gap-3 py-8 sm:grid-cols-[4rem_1fr_1fr] sm:gap-8"
              >
                <span className="text-sm text-ink/40">{p.year}</span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink/45">{p.kind}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink sm:text-xl">{p.result}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">{p.blurb}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contatos" className="border-t border-ink/10 px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[12px] font-medium tracking-[0.22em] text-ink/50 uppercase">
            Contatos
          </h2>
          <a
            href="mailto:ola@pagefolio.com"
            className="font-heading mt-8 block text-[1.5rem] break-all lowercase hover:text-ink/70 sm:text-[2.5rem]"
          >
            ola@pagefolio.com
          </a>
          <div className="mt-10 flex flex-row flex-wrap gap-x-8 gap-y-3 text-sm text-ink/55">
            <a href="#" className="hover:text-ink">LinkedIn</a>
            <a href="#" className="hover:text-ink">GitHub</a>
            <a href="#" className="hover:text-ink">Read.cv</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-heading text-[13px] text-ink/55 uppercase">Page Fólio</span>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
