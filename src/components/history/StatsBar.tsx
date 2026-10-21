import { CalendarDays, Flame, Trophy } from 'lucide-react'
import type { Session } from '@/lib/types'
import { dateKey, startOfWeek } from '@/lib/format'

export interface SessionStats {
  /** Sequência de dias consecutivos com treino */
  streak: number
  /** Sessões desde segunda-feira da semana atual */
  weekSessions: number
  /** Sessões salvas no total */
  totalSessions: number
  /** Reps acumuladas (séries por unilateral reps) */
  totalReps: number
  /** Séries concluídas no total */
  totalSets: number
}

export function computeStats(sessions: Session[]): SessionStats {
  const daySet = new Set(sessions.map((s) => dateKey(s.finishedAt)))

  let streak = 0
  const cursor = new Date()
  if (!daySet.has(dateKey(cursor))) {
    // Streak quebrada hoje ainda conta se treinou ontem
    cursor.setDate(cursor.getDate() - 1)
  }
  while (daySet.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  const weekStart = startOfWeek(new Date()).getTime()
  const weekSessions = sessions.filter((s) => new Date(s.finishedAt).getTime() >= weekStart).length

  const allSets = sessions.flatMap((s) => s.exercises.flatMap((ex) => ex.sets))
  const totalSets = allSets.length
  const totalReps = allSets.reduce((n, s) => n + (s.doneReps ?? 0), 0)

  return { streak, weekSessions, totalSessions: sessions.length, totalReps, totalSets }
}

export function StatsBar({ sessions }: { sessions: Session[] }) {
  const stats = computeStats(sessions)

  return (
    <div className='grid grid-cols-3 gap-2'>
      <StatCard icon={Flame} value={String(stats.streak)} label='streak (dias)' highlight />
      <StatCard icon={CalendarDays} value={String(stats.weekSessions)} label='esta semana' />
      <StatCard icon={Trophy} value={String(stats.totalSessions)} label='treinos' />
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  highlight = false,
}: {
  icon: typeof Flame
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${
        highlight && value !== '0' ? 'border-primary/40 bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <Icon className={`mx-auto size-4 ${highlight && value !== '0' ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className='mt-1 text-xl font-bold tabular-nums text-foreground'>{value}</p>
      <p className='text-[0.65rem] leading-tight text-muted-foreground'>{label}</p>
    </div>
  )
}
