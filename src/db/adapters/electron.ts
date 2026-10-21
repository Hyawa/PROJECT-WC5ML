import type { DbApi, DbRequest } from '../api'
import type { Exercise, Session, Workout } from '@/lib/types'

/**
 * Adaptador desktop (Electron): repassa para o SQLite do processo main
 * pela ponte window.forja.db (preload), uma requisição por vez.
 */
export function isElectronBridge(): boolean {
  return typeof window !== 'undefined' && typeof (window as Window & { forja?: { db?: unknown } }).forja?.db === 'object'
}

export function createElectronAdapter(): DbApi {
  const bridge = (window as unknown as { forja: { db: { execute: (req: DbRequest) => Promise<unknown> } } }).forja.db
  const execute = (req: DbRequest) => bridge.execute(req) as Promise<unknown>

  // Migra dados do MVP (localStorage) para o SQLite uma única vez
  const ready = (async () => {
    const legacyWorkouts = readLegacy<Workout>('wc5ml.workouts.v1')
    const legacySessions = readLegacy<Session>('wc5ml.sessions.v1')
    if (legacyWorkouts?.length || legacySessions?.length) {
      await execute({ op: 'importLegacy', data: { workouts: legacyWorkouts, sessions: legacySessions } })
      localStorage.removeItem('wc5ml.workouts.v1')
      localStorage.removeItem('wc5ml.sessions.v1')
    }
  })()

  const call = async <T>(req: DbRequest): Promise<T> => {
    await ready
    return (await execute(req)) as T
  }

  return {
    async reset() {
      await call<boolean>({ op: 'reset' })
    },
    listExercises: () => call<Exercise[]>({ op: 'listExercises' }),
    createExercise: (data) => call<Exercise>({ op: 'createExercise', data }),
    updateExercise: (data) => call<void>({ op: 'updateExercise', data }),
    deleteExercise: (id) => call<void>({ op: 'deleteExercise', id }),
    listWorkouts: () => call<Workout[]>({ op: 'listWorkouts' }),
    saveWorkout: (data) => call<void>({ op: 'saveWorkout', data }),
    deleteWorkout: (id) => call<void>({ op: 'deleteWorkout', id }),
    listSessions: () => call<Session[]>({ op: 'listSessions' }),
    addSession: (data) => call<void>({ op: 'addSession', data }),
    deleteSession: (id) => call<void>({ op: 'deleteSession', id }),
  }
}

function readLegacy<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : null
  } catch {
    return null
  }
}
