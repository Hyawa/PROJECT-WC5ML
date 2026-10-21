import { useState } from 'react'
import { ChevronRight, ClipboardList, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import type { Workout } from '@/lib/types'
import { useData } from '@/lib/store'
import { estimateWorkoutSeconds, fmtDuration } from '@/lib/format'

export function WorkoutList({
  workouts,
  onOpenEditor,
  onRun,
  onCreate,
}: {
  workouts: Workout[]
  onOpenEditor: (workout: Workout) => void
  onRun: (workout: Workout) => void
  onCreate: () => void
}) {
  if (workouts.length === 0) return <EmptyState onCreate={onCreate} />
  return (
    <div className='flex flex-col gap-3'>
      <button
        onClick={onCreate}
        className='flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 active:scale-[0.99]'
      >
        <Plus className='size-4' /> Novo treino
      </button>

      {workouts.map((w) => (
        <WorkoutCard key={w.id} workout={w} onOpenEditor={onOpenEditor} onRun={onRun} />
      ))}
    </div>
  )
}

function WorkoutCard({
  workout,
  onOpenEditor,
  onRun,
}: {
  workout: Workout
  onOpenEditor: (workout: Workout) => void
  onRun: (workout: Workout) => void
}) {
  const totalSets = workout.exercises.reduce((n, ex) => n + ex.sets, 0)
  const estimate = estimateWorkoutSeconds(workout.exercises)
  const usesBar = workout.exercises.some((ex) => ex.usesBar)

  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <button onClick={() => onOpenEditor(workout)} className='flex w-full items-center justify-between gap-2 text-left'>
        <div>
          <h3 className='text-base font-semibold text-foreground'>{workout.name}</h3>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {workout.exercises.length} exercício{workout.exercises.length === 1 ? '' : 's'} · {totalSets} séries · ~{fmtDuration(
              estimate,
            )}
            {usesBar && ' · barra fixa'}
          </p>
        </div>
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
      </button>

      {workout.exercises.length > 0 && (
        <div className='mt-3 flex items-stretch gap-2'>
          <button
            onClick={() => onRun(workout)}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
          >
            <Play className='size-4 fill-current' /> Treinar
          </button>
          <button
            onClick={() => onOpenEditor(workout)}
            aria-label='Editar'
            className='grid w-11 place-items-center rounded-xl border border-border bg-secondary text-secondary-foreground transition hover:bg-accent active:scale-[0.98]'
          >
            <Pencil className='size-4' />
          </button>
          <DeleteButton workoutId={workout.id} />
        </div>
      )}
    </div>
  )
}

/** Excluir exige dois toques (evita apagar sem querer). */
function DeleteButton({ workoutId }: { workoutId: string }) {
  const [armed, setArmed] = useState(false)
  const { deleteWorkout } = useData()
  return (
    <button
      onClick={() => {
        if (armed) {
          void deleteWorkout(workoutId)
          return
        }
        setArmed(true)
        window.setTimeout(() => setArmed(false), 2500)
      }}
      aria-label='Excluir treino'
      className={`grid w-11 place-items-center rounded-xl border transition active:scale-[0.98] ${
        armed ? 'border-destructive/60 bg-destructive/20 text-destructive' : 'border-border bg-secondary text-muted-foreground hover:text-destructive'
      }`}
    >
      <Trash2 className='size-4' />
    </button>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center'>
      <div className='grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary'>
        <ClipboardList className='size-7' />
      </div>
      <div>
        <p className='font-semibold text-foreground'>Nenhum treino por aqui</p>
        <p className='mt-1 max-w-60 text-sm leading-6 text-muted-foreground'>
          Monte seu primeiro treino com o peso do corpo e a barra fixa.
        </p>
      </div>
      <button
        onClick={onCreate}
        className='flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
      >
        <Plus className='size-4' /> Criar treino
      </button>
    </div>
  )
}
