import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Exercise, Session, Workout } from './types'
import { getDb } from '@/db/client'
import type { DbApi } from '@/db/api'

interface DataState {
  ready: boolean
  exercises: Exercise[]
  workouts: Workout[]
  sessions: Session[]
}

interface DataContextValue extends DataState {
  db: DbApi
  reload(): Promise<void>
  createExercise(data: Omit<Exercise, 'id'>): Promise<Exercise>
  updateExercise(exercise: Exercise): Promise<void>
  deleteExercise(id: string): Promise<void>
  saveWorkout(workout: Workout): Promise<void>
  deleteWorkout(id: string): Promise<void>
  addSession(session: Session): Promise<void>
  deleteSession(id: string): Promise<void>
}

const Ctx = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ ready: false, exercises: [], workouts: [], sessions: [] })
  const dbRef = useRef<DbApi | null>(null)

  const reload = useCallback(async () => {
    const db = (dbRef.current ??= await getDb())
    const [exercises, workouts, sessions] = await Promise.all([db.listExercises(), db.listWorkouts(), db.listSessions()])
    setState({ ready: true, exercises, workouts, sessions })
  }, [])

  useEffect(() => {
    let cancelled = false
    reload().catch((error) => console.error('Falha ao carregar dados:', error)).finally(() => {
      if (!cancelled) setState((prev) => ({ ...prev, ready: true }))
    })
    return () => {
      cancelled = true
    }
  }, [reload])

  const value = useMemo<DataContextValue | null>(() => {
    if (!state.ready) return null
    const db = dbRef.current
    if (!db) return null
    return {
      ...state,
      db,
      reload,
      createExercise: (data) => db.createExercise(data).then((created) => reload().then(() => created)),
      updateExercise: (exercise) => db.updateExercise(exercise).then(() => reload()),
      deleteExercise: (id) => db.deleteExercise(id).then(() => reload()),
      saveWorkout: (workout) => db.saveWorkout(workout).then(() => reload()),
      deleteWorkout: (id) => db.deleteWorkout(id).then(() => reload()),
      addSession: (session) => db.addSession(session).then(() => reload()),
      deleteSession: (id) => db.deleteSession(id).then(() => reload()),
    }
  }, [state, reload])

  if (!value) {
    // Enquanto o SQLite carrega, evita renderizar as telas com listas vazias
    return createElement('div', { className: 'grid min-h-dvh place-items-center' }, null)
  }

  return createElement(Ctx.Provider, { value }, children)
}

export function useData(): DataContextValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('useData deve ser usado dentro de <DataProvider>')
  return value
}

/* ---------- Helpers ---------- */

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
