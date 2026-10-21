export type ExerciseMode = 'reps' | 'time'

export interface Exercise {
  id: string
  name: string
  /** Contagem por repetições ou por tempo (prancha, corrida no lugar...) */
  mode: ExerciseMode
  sets: number
  /** Alvo em repetições (quando mode = 'reps') */
  reps?: number
  /** Alvo em segundos (quando mode = 'time') */
  timeSec?: number
  /** Descanso após cada série, em segundos */
  restSec: number
  /** Exercício que usa a barra fixa */
  usesBar: boolean
  /** Referência ao exercício original da biblioteca (cópia dentro de um treino) */
  exerciseId?: string
}

export interface Workout {
  id: string
  name: string
  createdAt: string
  exercises: Exercise[]
}

/* Registro de uma série realizada no treino */
export interface SetRecord {
  /** Alvo da série, para comparação no histórico */
  targetReps?: number
  targetTimeSec?: number
  /** O que foi efetivamente feito */
  doneReps?: number
  doneTimeSec?: number
}

export interface SessionExercise {
  name: string
  mode: ExerciseMode
  sets: SetRecord[]
}

export interface Session {
  id: string
  workoutId: string
  workoutName: string
  finishedAt: string
  /** Duração total do treino, em segundos */
  durationSec: number
  exercises: SessionExercise[]
}
