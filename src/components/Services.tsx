import { Fragment, useRef } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

// Uma linha por item — quebra fixa: "No que eu posso" / "te ajudar"
const TITLE_LINES = ['No que eu posso', 'te ajudar']

// Conteúdo provisório — trocar pelos serviços reais.
const SERVICES = [
  {
    title: 'Experimentação e testes A/B',
    text: 'Da hipótese à leitura dos dados: desenho o teste, implemento e digo o que de fato mudou o resultado.',
  },
  {
    title: 'Otimização de conversão',
    text: 'Diagnóstico do funil de ponta a ponta e priorização do que mais move a métrica — antes de redesenhar qualquer tela.',
  },
  {
    title: 'Design de produto',
    text: 'Fluxos, protótipos e interfaces pensados para o usuário chegar mais rápido ao valor do produto.',
  },
  {
    title: 'Growth e ativação',
    text: 'Onboarding, retenção e monetização guiados por dados, com ganhos que se sustentam depois do teste.',
  },
]

/**
 * Terceira seção. Sem fundo próprio: fica sobre as curvas de nível contínuas e
 * entra logo abaixo do card da hero, que sobe junto com a página.
 */
export function Services() {
  const ref = useRef<HTMLElement>(null)
  useScrollReveal(ref)

  return (
    <section ref={ref} id="ajuda" className="px-6 pt-4 pb-28 sm:px-10 sm:pb-40">
      {/*
        Mesma tipografia do "PAGE FÓLIO" da primeira dobra (Zen Dots, caixa alta,
        mesmo tamanho). min(): em telas estreitas, encolhe até "NO QUE EU POSSO"
        caber numa linha (a linha mede ≈ 12,6× o tamanho da fonte).
      */}
      <h2
        data-reveal-words=""
        className="font-heading text-center text-[length:min(clamp(2rem,7.5vw,6.5rem),calc((100vw_-_5rem)/13))] leading-[1.06] tracking-[-0.01em] text-white uppercase"
      >
        {TITLE_LINES.map((line) => (
          <span key={line} className="block whitespace-nowrap">
            {line.split(' ').map((word, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span data-word="">{word}</span>
              </Fragment>
            ))}
          </span>
        ))}
      </h2>

      <ol className="mx-auto mt-16 max-w-5xl sm:mt-24">
        {SERVICES.map((s, i) => (
          <li
            key={s.title}
            data-reveal=""
            className="grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-3 border-t border-white/10 py-8 sm:grid-cols-[5rem_1fr_1.1fr] sm:gap-x-10 sm:py-11"
          >
            <span className="pt-1 text-sm text-white/40 tabular-nums sm:pt-2">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-white sm:text-3xl">{s.title}</h3>
            <p className="col-start-2 text-[15px] leading-relaxed text-white/60 sm:col-start-3 sm:pt-1.5 sm:text-base">
              {s.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
