import { useState } from 'react'
import { CalendarX2, Trash2 } from 'lucide-react'
import type { Session } from '@/lib/types'
import { dayLabel, fmtDuration } from '@/lib/format'
import { useData } from '@/lib/store'
import { StatsBar } from './StatsBar'

export function HistoryPage() {
  const { sessions, deleteSession } = useData()
  const sorted = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))

  // Agrupa por dia (do mais recente para o mais antigo)
  const groups: { label: string; sessions: Session[] }[] = []
  for (const session of sorted) {
    const label = dayLabel(session.finishedAt)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.sessions.push(session)
    else groups.push({ label, sessions: [session] })
  }

  return (
    <div className='flex flex-col gap-4'>
      <StatsBar sessions={sorted} />

      {sorted.length === 0 ? (
        <EmptyHistory />
      ) : (
        groups.map((group) => (
          <section key={group.label}>
            <h2 className='mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'>{group.label}</h2>
            <div className='flex flex-col gap-2'>
              {group.sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  const { deleteSession } = useData()
  const [armed, setArmed] = useState(false)
  const setsDone = session.exercises.reduce((n, ex) => n + ex.sets.length, 0)
  const repsDone = session.exercises.reduce((n, ex) => n + ex.sets.reduce((m, s) => m + (s.doneReps ?? 0), 0), 0)

  const parts = [`${setsDone} séries`]
  if (repsDone > 0) parts.push(`${repsDone} reps`)
  parts.push(fmtDuration(session.durationSec))

  const time = new Date(session.finishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className='flex items-stretch gap-2'>
      <div className='flex-1 rounded-2xl border border-border bg-card px-4 py-3'>
        <div className='flex items-center justify-between gap-2'>
          <p className='truncate text-sm font-semibold text-foreground'>{session.workoutName}</p>
          <span className='shrink-0 text-xs tabular-nums text-muted-foreground'>{time}</span>
        </div>
        <p className='mt-0.5 text-xs text-muted-foreground'>{parts.join(' · ')}</p>
      </div>
      <button
        aria-label='Excluir registro'
        onClick={() => {
          if (armed) {
            void deleteSession(session.id)
            return
          }
          setArmed(true)
          window.setTimeout(() => setArmed(false), 2500)
        }}
        className={`grid w-10 shrink-0 place-items-center rounded-xl border transition active:scale-[0.98] ${
          armed ? 'border-destructive/60 bg-destructive/20 text-destructive' : 'border-border bg-secondary text-muted-foreground hover:text-destructive'
        }`}
      >
        <Trash2 className='size-4' />
      </button>
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center'>
      <div className='grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary'>
        <CalendarX2 className='size-7' />
      </div>
      <div>
        <p className='font-semibold text-foreground'>Sem treinos registrados</p>
        <p className='mt-1 max-w-64 text-sm leading-6 text-muted-foreground'>
          Quando você completar um treino, ele aparece aqui para acompanhar seu progresso.
        </p>
      </div>
      <p className='text-xs text-muted-foreground'>Crie um treino na aba “Treinos” e toque em Treinar.</p>
    </div>
  )
}
