import type { DbApi } from '../api'
import type { Exercise, Session, Workout } from '@/lib/types'
import { DEFAULT_EXERCISES } from '../schema'

/**
 * Adaptador de desenvolvimento para navegador (sem Electron/Capacitor).
 * Mantém a mesma semântica dos adaptadores SQLite, usando localStorage.
 */
const EXERCISES_KEY = 'wc5ml.local.exercises'
const WORKOUTS_KEY = 'wc5ml.workouts.v1'
const SESSIONS_KEY = 'wc5ml.sessions.v1'

function readArray<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeArray(key: string, value: unknown[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function readWorkouts(): Workout[] {
  return readArray<Workout>(WORKOUTS_KEY)
}

export function createLocalAdapter(): DbApi {
  if (readArray<Exercise>(EXERCISES_KEY).length === 0) {
    // Seed da biblioteca padrão
    writeArray(
      EXERCISES_KEY,
      DEFAULT_EXERCISES.map((ex) => ({ ...ex, id: crypto.randomUUID() })),
    )
  }

  return {
    async reset() {
      writeArray(EXERCISES_KEY, DEFAULT_EXERCISES.map((ex) => ({ ...ex, id: crypto.randomUUID() })))
      writeArray(WORKOUTS_KEY, [])
      writeArray(SESSIONS_KEY, [])
    },

    async listExercises() {
      return readArray<Exercise>(EXERCISES_KEY).sort((a, b) => a.name.localeCompare(b.name))
    },

    async createExercise(data) {
      const exercise: Exercise = { ...data, id: crypto.randomUUID() }
      writeArray(EXERCISES_KEY, [...readArray<Exercise>(EXERCISES_KEY), exercise])
      return exercise
    },

    async updateExercise(data) {
      writeArray(EXERCISES_KEY, readArray<Exercise>(EXERCISES_KEY).map((ex) => (ex.id === data.id ? data : ex)))
    },

    async deleteExercise(id) {
      writeArray(EXERCISES_KEY, readArray<Exercise>(EXERCISES_KEY).filter((ex) => ex.id !== id))
    },

    async listWorkouts() {
      return readWorkouts()
    },

    async saveWorkout(workout) {
      writeArray(WORKOUTS_KEY, [...readWorkouts().filter((w) => w.id !== workout.id), workout])
    },

    async deleteWorkout(id) {
      writeArray(WORKOUTS_KEY, readWorkouts().filter((w) => w.id !== id))
    },

    async listSessions() {
      return readArray<Session>(SESSIONS_KEY).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    },

    async addSession(session) {
      writeArray(SESSIONS_KEY, [session, ...readArray<Session>(SESSIONS_KEY)])
    },

    async deleteSession(id) {
      writeArray(SESSIONS_KEY, readArray<Session>(SESSIONS_KEY).filter((s) => s.id !== id))
    },
  }
}
