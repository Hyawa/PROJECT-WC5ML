/** Semanas começam na segunda-feira. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function dateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** "Hoje", "Ontem" ou "dia/mês". */
export function dayLabel(iso: string): string {
  const today = dateKey(new Date())
  const yesterday = dateKey(new Date(Date.now() - 86_400_000))
  const key = dateKey(iso)
  if (key === today) return 'Hoje'
  if (key === yesterday) return 'Ontem'
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/** "ter., 20/10 · 18:42" */
export function fmtDateTime(iso: string): string {
  const text = new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return text.replace('.', '')
}

/** "0:45" para cronômetros. */
export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** "45 s", "12 min", "1 h 05 min" */
export function fmtDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  if (s < 60) return `${s} s`
  const hours = Math.floor(s / 3600)
  const minutes = Math.round((s % 3600) / 60)
  if (minutes === 60) return `${hours + 1} h`
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${String(minutes).padStart(2, '0')} min`
}

/** Estimativa de duração de um treino (~4 s por rep + descansos). */
export function estimateWorkoutSeconds(exercises: { mode: string; sets: number; reps?: number; timeSec?: number; restSec: number }[]): number {
  return exercises.reduce((total, ex) => {
    const workPerSet = ex.mode === 'time' ? (ex.timeSec ?? 0) : Math.min((ex.reps ?? 0) * 4, 120)
    return total + ex.sets * (workPerSet + ex.restSec)
  }, 0)
}
