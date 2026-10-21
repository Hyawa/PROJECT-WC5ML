import type { Exercise, Session, Workout } from '@/lib/types'

/**
 * Contrato único de acesso a dados, implementado pelos adaptadores:
 * - Electron (desktop): IPC → SQLite no processo main (node:sqlite)
 * - Capacitor (Android): plugin nativo @capacitor-community/sqlite
 * - Navegador (dev): localStorage
 */
export interface DbApi {
  /** Limpa todas as tabelas e re-semeia a biblioteca (APENAS dev/testes) */
  reset(): Promise<void>
  listExercises(): Promise<Exercise[]>
  createExercise(data: Omit<Exercise, 'id'>): Promise<Exercise>
  updateExercise(data: Exercise): Promise<void>
  deleteExercise(id: string): Promise<void>
  listWorkouts(): Promise<Workout[]>
  saveWorkout(data: Workout): Promise<void>
  deleteWorkout(id: string): Promise<void>
  listSessions(): Promise<Session[]>
  addSession(data: Session): Promise<void>
  deleteSession(id: string): Promise<void>
}

export type DbRequest =
  | { op: 'reset' }
  | { op: 'listExercises' }
  | { op: 'createExercise'; data: Omit<Exercise, 'id'> }
  | { op: 'updateExercise'; data: Exercise }
  | { op: 'deleteExercise'; id: string }
  | { op: 'listWorkouts' }
  | { op: 'saveWorkout'; data: Workout }
  | { op: 'deleteWorkout'; id: string }
  | { op: 'listSessions' }
  | { op: 'addSession'; data: Session }
  | { op: 'deleteSession'; id: string }
  | { op: 'importLegacy'; data: { workouts?: Workout[] | null; sessions?: Session[] | null } }
