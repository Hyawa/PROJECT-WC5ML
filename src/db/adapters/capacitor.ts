import { Capacitor } from '@capacitor/core'
import type { DbApi } from '../api'
import type { Exercise, Session, Workout } from '@/lib/types'
import {
  DEFAULT_EXERCISES,
  SCHEMA_SQL,
  rowToExercise,
  rowToWorkoutExercise,
  type ExerciseRow,
  type WorkoutExerciseRow,
} from '../schema'

const DB_NAME = 'forja'

/** Verdadeiro quando rodando como app nativo (Android/iOS) com o plugin disponível. */
export function isCapacitorNative(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'web' && Capacitor.getPlatform() !== 'electron'
  } catch {
    return false
  }
}

/** Adaptador mobile: SQLite nativo via @capacitor-community/sqlite. */
export async function createCapacitorAdapter(): Promise<DbApi> {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  await db.open()

  const run = (statement: string, values?: unknown[]) => db.run(statement, (values ?? []) as [...unknown[]])
  const query = async <T>(statement: string, values?: unknown[]): Promise<T[]> => {
    const result = await db.query(statement, (values ?? []) as [...unknown[]])
    return ((result as { values?: unknown[] })?.values ?? []) as T[]
  }

  // Schema idempotente + seed da biblioteca em banco vazio
  await db.execute(SCHEMA_SQL, true)
  const total = await query<{ n: number }>('SELECT COUNT(*) AS n FROM exercises')
  if (!total[0] || total[0].n === 0) {
    for (const ex of DEFAULT_EXERCISES) {
      await run(
        `INSERT INTO exercises (id, name, mode, sets, reps, time_sec, rest_sec, uses_bar, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), ex.name, ex.mode, ex.sets, ex.reps ?? null, ex.timeSec ?? null, ex.restSec, ex.usesBar ? 1 : 0, new Date().toISOString()],
      )
    }
  }

  const insertWorkoutExercises = async (workout: Workout): Promise<void> => {
    await run(`DELETE FROM workout_exercises WHERE workout_id = ?`, [workout.id])
    for (let i = 0; i < workout.exercises.length; i += 1) {
      const ex = workout.exercises[i]
      await run(
        `INSERT INTO workout_exercises (workout_id, position, exercise_id, name, mode, sets, reps, time_sec, rest_sec, uses_bar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [workout.id, i, ex.exerciseId ?? null, ex.name, ex.mode, ex.sets, ex.reps ?? null, ex.timeSec ?? null, ex.restSec, ex.usesBar ? 1 : 0],
      )
    }
  }

  return {
    async reset() {
      const statements = ['DELETE FROM sessions', 'DELETE FROM workout_exercises', 'DELETE FROM workouts', 'DELETE FROM exercises']
      for (const statement of statements) await run(statement)
      for (const ex of DEFAULT_EXERCISES) {
        await run(
          `INSERT INTO exercises (id, name, mode, sets, reps, time_sec, rest_sec, uses_bar, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), ex.name, ex.mode, ex.sets, ex.reps ?? null, ex.timeSec ?? null, ex.restSec, ex.usesBar ? 1 : 0, new Date().toISOString()],
        )
      }
    },

    async listExercises() {
      const rows = await query<ExerciseRow>('SELECT * FROM exercises ORDER BY name ASC')
      return rows.map(rowToExercise)
    },

    async createExercise(data) {
      const id = crypto.randomUUID()
      await run(
        `INSERT INTO exercises (id, name, mode, sets, reps, time_sec, rest_sec, uses_bar, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.name, data.mode, data.sets, data.reps ?? null, data.timeSec ?? null, data.restSec, data.usesBar ? 1 : 0, new Date().toISOString()],
      )
      return { ...data, id }
    },

    async updateExercise(data) {
      await run(
        `UPDATE exercises SET name = ?, mode = ?, sets = ?, reps = ?, time_sec = ?, rest_sec = ?, uses_bar = ? WHERE id = ?`,
        [data.name, data.mode, data.sets, data.reps ?? null, data.timeSec ?? null, data.restSec, data.usesBar ? 1 : 0, data.id],
      )
    },

    async deleteExercise(id) {
      await run(`DELETE FROM exercises WHERE id = ?`, [id])
    },

    async listWorkouts() {
      const headers = await query<{ id: string; name: string; created_at: string }>('SELECT * FROM workouts ORDER BY created_at ASC')
      const rows = await query<WorkoutExerciseRow>('SELECT * FROM workout_exercises ORDER BY workout_id ASC, position ASC')
      const byWorkout = new Map<string, WorkoutExerciseRow[]>()
      for (const row of rows) {
        const list = byWorkout.get(row.workout_id) ?? []
        list.push(row)
        byWorkout.set(row.workout_id, list)
      }
      return headers.map((w) => ({
        id: w.id,
        name: w.name,
        createdAt: w.created_at,
        exercises: (byWorkout.get(w.id) ?? []).map(rowToWorkoutExercise),
      }))
    },

    async saveWorkout(workout) {
      await run(`INSERT OR REPLACE INTO workouts (id, name, created_at) VALUES (?, ?, ?)`, [workout.id, workout.name, workout.createdAt])
      await insertWorkoutExercises(workout)
    },

    async deleteWorkout(id) {
      await run(`DELETE FROM workouts WHERE id = ?`, [id])
    },

    async listSessions() {
      const rows = await query<{ payload: string }>('SELECT payload FROM sessions ORDER BY finished_at DESC')
      return rows.map((r) => JSON.parse(r.payload) as Session)
    },

    async addSession(session) {
      await run(
        `INSERT OR REPLACE INTO sessions (id, workout_id, workout_name, finished_at, duration_sec, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [session.id, session.workoutId, session.workoutName, session.finishedAt, session.durationSec, JSON.stringify(session)],
      )
    },

    async deleteSession(id) {
      await run(`DELETE FROM sessions WHERE id = ?`, [id])
    },
  }
}
