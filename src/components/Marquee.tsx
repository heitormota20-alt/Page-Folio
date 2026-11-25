const REPEAT = 4

interface MarqueeProps {
  text: string
  speed?: number
  direction?: 'left' | 'right'
}

export function Marquee({ text, speed = 20, direction = 'left' }: MarqueeProps) {
  const content = Array(REPEAT).fill(text).join(' · ') + ' · '
  const anim = direction === 'left' ? 'marquee-left' : 'marquee-right'

  return (
    <div className="overflow-hidden whitespace-nowrap select-none w-full">
      <div
        className="inline-flex"
        style={{ animation: `${anim} ${speed}s linear infinite` }}
      >
        <span className="font-heading text-[clamp(3.5rem,10vw,9rem)] leading-none text-ink/20 uppercase">
          {content}
        </span>
        <span
          aria-hidden="true"
          className="font-heading text-[clamp(3.5rem,10vw,9rem)] leading-none text-ink/20 uppercase"
        >
          {content}
        </span>
      </div>
    </div>
  )
}
