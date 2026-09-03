const LINKS = [
  { label: 'Sobre mim', href: '#sobre' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Contatos', href: '#contatos' },
]

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex flex-row items-center justify-end px-3 py-3 sm:px-6 sm:py-6">
      <nav className="flex flex-row items-center gap-1.5 sm:gap-3">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap text-white/90 uppercase backdrop-blur-md transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white sm:rounded-xl sm:px-6 sm:py-3.5 sm:text-[13px] sm:tracking-[0.14em]"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
