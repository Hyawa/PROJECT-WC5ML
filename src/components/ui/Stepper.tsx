import { Minus, Plus } from 'lucide-react'

export function Stepper({
  label,
  value,
  onChange,
  step,
  suffix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step: number
  suffix?: string
}) {
  return (
    <div className='rounded-xl border border-border bg-white/5 px-2 py-1.5 text-center'>
      <p className='text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground'>{label}</p>
      <div className='mt-0.5 flex items-center justify-center gap-1'>
        <button
          onClick={() => onChange(value - step)}
          aria-label={`Diminuir ${label}`}
          className='grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground'
        >
          <Minus className='size-3.5' />
        </button>
        <span className='min-w-10 text-center text-sm font-bold tabular-nums'>
          {value}
          {suffix ? <span className='text-[0.65rem] font-semibold text-muted-foreground'>{suffix}</span> : null}
        </span>
        <button
          onClick={() => onChange(value + step)}
          aria-label={`Aumentar ${label}`}
          className='grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground'
        >
          <Plus className='size-3.5' />
        </button>
      </div>
    </div>
  )
}
