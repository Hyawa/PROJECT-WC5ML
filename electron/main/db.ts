import { DatabaseSync } from 'node:sqlite'
import { app } from 'electron'
import path from 'node:path'
import type { Exercise, Session, Workout } from '../../src/lib/types'
import {
  DEFAULT_EXERCISES,
  SCHEMA_SQL,
  rowToExercise,
  rowToWorkoutExercise,
  type ExerciseRow,
  type WorkoutExerciseRow,
} from '../../src/db/schema'
import type { DbRequest } from '../../src/db/api'

let db: DatabaseSync | null = null

function getDb(): DatabaseSync {
  if (db) return db
  db = new DatabaseSync(path.join(app.getPath('userData'), 'forja.db'))
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(SCHEMA_SQL)
  return db
}

/* ---------- Helpers ---------- */

function createExerciseRow(data: Omit<Exercise, 'id'>): Exercise {
  const id = crypto.randomUUID()
  getDb()
    .prepare(
      `INSERT INTO exercises (id, name, mode, sets, reps, time_sec, rest_sec, uses_bar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, data.name, data.mode, data.sets, data.reps ?? null, data.timeSec ?? null, data.restSec, data.usesBar ? 1 : 0, new Date().toISOString())
  return { ...data, id }
}

function seedExercises(): void {
  for (const ex of DEFAULT_EXERCISES) createExerciseRow(ex)
}

function saveWorkoutRows(workout: Workout): void {
  const d = getDb()
  d.exec('BEGIN')
  try {
    d.prepare(`INSERT OR REPLACE INTO workouts (id, name, created_at) VALUES (?, ?, ?)`).run(
      workout.id,
      workout.name,
      workout.createdAt,
    )
    d.prepare(`DELETE FROM workout_exercises WHERE workout_id = ?`).run(workout.id)
    for (let i = 0; i < workout.exercises.length; i += 1) {
      const ex = workout.exercises[i]
      d.prepare(
        `INSERT INTO workout_exercises (workout_id, position, exercise_id, name, mode, sets, reps, time_sec, rest_sec, uses_bar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        workout.id,
        i,
        ex.exerciseId ?? null,
        ex.name,
        ex.mode,
        ex.sets,
        ex.reps ?? null,
        ex.timeSec ?? null,
        ex.restSec,
        ex.usesBar ? 1 : 0,
      )
    }
    d.exec('COMMIT')
  } catch (error) {
    d.exec('ROLLBACK')
    throw error
  }
}

/* ---------- Handlers ---------- */

export function handleDbRequest(request: DbRequest): unknown {
  const d = getDb()

  switch (request.op) {
    case 'reset': {
      // Apenas em desenvolvimento/testes — nunca no app empacotado
      if (app.isPackaged) throw new Error('reset indisponível no app empacotado')
      d.exec('DELETE FROM sessions; DELETE FROM workout_exercises; DELETE FROM workouts; DELETE FROM exercises;')
      seedExercises()
      return true
    }

    case 'importLegacy': {
      // Migra dados do MVP (localStorage) para o SQLite, apenas se o banco estiver vazio
      const { workouts, sessions } = request.data
      const count = d.prepare('SELECT COUNT(*) AS n FROM workouts').get() as unknown as { n: number }
      const sessionCount = d.prepare('SELECT COUNT(*) AS n FROM sessions').get() as unknown as { n: number }
      if (count.n > 0 || sessionCount.n > 0) return false
      for (const workout of workouts ?? []) saveWorkoutRows(workout)
      for (const session of sessions ?? []) {
        d.prepare(
          `INSERT OR REPLACE INTO sessions (id, workout_id, workout_name, finished_at, duration_sec, payload)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(session.id, session.workoutId, session.workoutName, session.finishedAt, session.durationSec, JSON.stringify(session))
      }
      return true
    }

    case 'listExercises': {
      if ((d.prepare('SELECT COUNT(*) AS n FROM exercises').get() as unknown as { n: number }).n === 0) seedExercises()
      const rows = d.prepare(`SELECT * FROM exercises ORDER BY name ASC`).all() as unknown as ExerciseRow[]
      return rows.map(rowToExercise)
    }

    case 'createExercise':
      return createExerciseRow(request.data)

    case 'updateExercise': {
      const ex = request.data
      d.prepare(
        `UPDATE exercises SET name = ?, mode = ?, sets = ?, reps = ?, time_sec = ?, rest_sec = ?, uses_bar = ? WHERE id = ?`,
      ).run(ex.name, ex.mode, ex.sets, ex.reps ?? null, ex.timeSec ?? null, ex.restSec, ex.usesBar ? 1 : 0, ex.id)
      return true
    }

    case 'deleteExercise':
      d.prepare(`DELETE FROM exercises WHERE id = ?`).run(request.id)
      return true

    case 'listWorkouts': {
      const workoutRows = d.prepare(`SELECT * FROM workouts ORDER BY created_at ASC`).all() as unknown as { id: string; name: string; created_at: string }[]
      const exerciseRows = d.prepare(`SELECT * FROM workout_exercises ORDER BY workout_id ASC, position ASC`).all() as unknown as WorkoutExerciseRow[]
      const byWorkout = new Map<string, WorkoutExerciseRow[]>()
      for (const row of exerciseRows) {
        const list = byWorkout.get(row.workout_id) ?? []
        list.push(row)
        byWorkout.set(row.workout_id, list)
      }
      return workoutRows.map((w) => ({
        id: w.id,
        name: w.name,
        createdAt: w.created_at,
        exercises: (byWorkout.get(w.id) ?? []).map(rowToWorkoutExercise),
      }))
    }

    case 'saveWorkout':
      saveWorkoutRows(request.data)
      return true

    case 'deleteWorkout':
      d.prepare(`DELETE FROM workouts WHERE id = ?`).run(request.id)
      return true

    case 'listSessions': {
      const rows = d.prepare(`SELECT payload FROM sessions ORDER BY finished_at DESC`).all() as unknown as { payload: string }[]
      return rows.map((r) => JSON.parse(r.payload) as Session)
    }

    case 'addSession': {
      const s = request.data
      d.prepare(
        `INSERT OR REPLACE INTO sessions (id, workout_id, workout_name, finished_at, duration_sec, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(s.id, s.workoutId, s.workoutName, s.finishedAt, s.durationSec, JSON.stringify(s))
      return true
    }

    case 'deleteSession':
      d.prepare(`DELETE FROM sessions WHERE id = ?`).run(request.id)
      return true

    default: {
      const exhaustive: never = request
      throw new Error(`Op desconhecida: ${JSON.stringify(exhaustive)}`)
    }
  }
}
