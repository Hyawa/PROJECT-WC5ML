import type { Exercise } from '@/lib/types'

/**
 * Schema compartilhado por TODOS os adaptadores (Electron node:sqlite,
 * Capacitor nativo e localStorage de desenvolvimento).
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('reps','time')),
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER,
  time_sec INTEGER,
  rest_sec INTEGER NOT NULL DEFAULT 60,
  uses_bar INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  workout_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  exercise_id TEXT,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER,
  time_sec INTEGER,
  rest_sec INTEGER NOT NULL,
  uses_bar INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workout_id, position),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  workout_id TEXT,
  workout_name TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  payload TEXT NOT NULL
);
`

/** Biblioteca inicial semeada em um banco vazio. */
export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Flexão', mode: 'reps', sets: 4, reps: 10, restSec: 60, usesBar: false },
  { name: 'Flexão inclinada', mode: 'reps', sets: 3, reps: 12, restSec: 60, usesBar: false },
  { name: 'Flexão diamante', mode: 'reps', sets: 3, reps: 8, restSec: 60, usesBar: false },
  { name: 'Barra fixa', mode: 'reps', sets: 4, reps: 5, restSec: 90, usesBar: true },
  { name: 'Remada invertida', mode: 'reps', sets: 3, reps: 10, restSec: 75, usesBar: true },
  { name: 'Abdominal', mode: 'reps', sets: 3, reps: 15, restSec: 45, usesBar: false },
  { name: 'Elevação de pernas', mode: 'reps', sets: 3, reps: 10, restSec: 45, usesBar: false },
  { name: 'Prancha', mode: 'time', sets: 3, timeSec: 60, restSec: 45, usesBar: false },
  { name: 'Prancha lateral', mode: 'time', sets: 3, timeSec: 30, restSec: 45, usesBar: false },
  { name: 'Agachamento', mode: 'reps', sets: 4, reps: 20, restSec: 60, usesBar: false },
  { name: 'Afundo', mode: 'reps', sets: 3, reps: 10, restSec: 60, usesBar: false },
  { name: 'Panturrilha', mode: 'reps', sets: 3, reps: 20, restSec: 30, usesBar: false },
  { name: 'Burpee', mode: 'reps', sets: 3, reps: 8, restSec: 75, usesBar: false },
  { name: 'Polichinelo', mode: 'time', sets: 3, timeSec: 45, restSec: 30, usesBar: false },
  { name: 'Corrida no lugar', mode: 'time', sets: 3, timeSec: 60, restSec: 30, usesBar: false },
  { name: 'Escalador', mode: 'time', sets: 3, timeSec: 40, restSec: 45, usesBar: false },
]

/* ---------- Mapeamento linha ↔ objeto (snake_case ↔ camelCase) ---------- */

export interface ExerciseRow {
  id: string
  name: string
  mode: string
  sets: number
  reps: number | null
  time_sec: number | null
  rest_sec: number
  uses_bar: number
}

export function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    mode: row.mode as Exercise['mode'],
    sets: row.sets,
    reps: row.reps ?? undefined,
    timeSec: row.time_sec ?? undefined,
    restSec: row.rest_sec,
    usesBar: row.uses_bar === 1,
  }
}

export interface WorkoutExerciseRow {
  workout_id: string
  position: number
  exercise_id: string | null
  name: string
  mode: string
  sets: number
  reps: number | null
  time_sec: number | null
  rest_sec: number
  uses_bar: number
}

export function rowToWorkoutExercise(row: WorkoutExerciseRow): Exercise {
  return {
    id: row.exercise_id ?? `${row.workout_id}-${row.position}`,
    exerciseId: row.exercise_id ?? undefined,
    name: row.name,
    mode: row.mode as Exercise['mode'],
    sets: row.sets,
    reps: row.reps ?? undefined,
    timeSec: row.time_sec ?? undefined,
    restSec: row.rest_sec,
    usesBar: row.uses_bar === 1,
  }
}
