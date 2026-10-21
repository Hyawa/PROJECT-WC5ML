import type { Session, Workout } from './types'

const WORKOUTS_KEY = 'wc5ml.workouts.v1'
const SESSIONS_KEY = 'wc5ml.sessions.v1'

function safeParse<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function loadWorkouts(): Workout[] {
  return safeParse<Workout>(localStorage.getItem(WORKOUTS_KEY))
}

export function saveWorkouts(workouts: Workout[]): void {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts))
}

export function loadSessions(): Session[] {
  return safeParse<Session>(localStorage.getItem(SESSIONS_KEY))
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}
