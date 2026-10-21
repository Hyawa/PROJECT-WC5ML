import { fmtClock } from '@/lib/format'

export function RingTimer({
  remaining,
  total,
  label,
  tone = 'primary',
}: {
  remaining: number
  total: number
  label: string
  tone?: 'primary' | 'muted'
}) {
  const R = 90
  const C = 2 * Math.PI * R
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const stroke = tone === 'primary' ? 'stroke-primary' : 'stroke-muted-foreground/50'

  return (
    <div className='relative grid place-items-center py-2'>
      <svg width='220' height='220' viewBox='0 0 220 220' className='-rotate-90'>
        <circle cx='110' cy='110' r={R} fill='none' className='stroke-white/10' strokeWidth='12' />
        <circle
          cx='110'
          cy='110'
          r={R}
          fill='none'
          className={stroke}
          strokeWidth='12'
          strokeLinecap='round'
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
      </svg>
      <div className='absolute flex flex-col items-center'>
        <span className='text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground'>{label}</span>
        <span className='mt-1 text-5xl font-bold tabular-nums text-foreground'>{fmtClock(remaining)}</span>
      </div>
    </div>
  )
}
