import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'
import type { Exercise, ExerciseMode, Workout } from '@/lib/types'
import { useData, clone, uid } from '@/lib/store'
import { Stepper } from '@/components/ui/Stepper'
import { ExercisePicker } from '@/components/library/ExercisePicker'
import { estimateWorkoutSeconds, fmtDuration } from '@/lib/format'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export function WorkoutEditor({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  const { exercises, saveWorkout } = useData()
  const isNew = workout === null
  const [draft, setDraft] = useState<Workout>(
    workout ?? { id: uid(), name: '', createdAt: new Date().toISOString(), exercises: [] },
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [saving, setSaving] = useState(false)

  // Bloqueia a navegação por scroll do fundo enquanto o picker estiver aberto
  useEffect(() => {
    document.body.style.overflow = pickerOpen || confirmDiscard ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [pickerOpen, confirmDiscard])

  const setExercises = (newExercises: Exercise[]) => setDraft((d) => ({ ...d, exercises: newExercises }))

  const patchExercise = (id: string, patch: Partial<Exercise>) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)) }))

  const moveExercise = (index: number, delta: -1 | 1) =>
    setDraft((d) => {
      const next = [...d.exercises]
      const target = index + delta
      if (target < 0 || target >= next.length) return d
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...d, exercises: next }
    })

  const removeExercise = (id: string) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((ex) => ex.id !== id) }))

  /** A partir da biblioteca (CRUD de exercícios), cria uma cópia ajustável no treino. */
  const pickLibraryExercise = (libraryExercise: Exercise) => {
    const snapshot: Exercise = { ...clone(libraryExercise), id: uid(), exerciseId: libraryExercise.id }
    setDraft((d) => ({ ...d, exercises: [...d.exercises, snapshot] }))
    setPickerOpen(false)
  }

  const finish = async () => {
    const name = draft.name.trim()
    const newExercises = draft.exercises.filter((ex) => ex.name.trim() !== '')
    if (name === '' || newExercises.length === 0) {
      setConfirmDiscard(true)
      return
    }
    setSaving(true)
    try {
      await saveWorkout({ ...clone(draft), name, exercises: newExercises })
    } finally {
      setSaving(false)
    }
    onClose()
  }

  const dirty = draft.name.trim() !== '' || draft.exercises.length > 0

  if (pickerOpen) {
    return <ExercisePicker exercises={exercises} onPick={pickLibraryExercise} onClose={() => setPickerOpen(false)} />
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
      <div className='mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10'>
        {/* Cabeçalho */}
        <header className='sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur'>
          <button
            onClick={() => (dirty ? setConfirmDiscard(true) : onClose())}
            aria-label='Fechar'
            className='grid size-9 place-items-center rounded-xl border border-border bg-secondary text-secondary-foreground'
          >
            <X className='size-4' />
          </button>
          <h2 className='flex-1 text-base font-semibold'>{isNew ? 'Novo treino' : 'Editar treino'}</h2>
          <button
            onClick={finish}
            disabled={saving}
            className='rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60'
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </header>

        {/* Nome do treino */}
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder='Nome do treino (ex.: Treino de manhã)'
          className='w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-base font-semibold text-foreground outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60'
        />
        {draft.exercises.length > 0 && (
          <p className='mt-2 text-xs text-muted-foreground'>
            {draft.exercises.length} exercícios · {draft.exercises.reduce((n, ex) => n + ex.sets, 0)} séries · ~
            {fmtDuration(estimateWorkoutSeconds(draft.exercises))}
          </p>
        )}

        {/* Exercícios do treino */}
        <div className='mt-4 flex flex-col gap-3'>
          {draft.exercises.length === 0 && (
            <p className='rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground'>
              Adicione exercícios da biblioteca para montar o treino.
            </p>
          )}
          {draft.exercises.map((ex, index) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={index}
              total={draft.exercises.length}
              onPatch={(patch) => patchExercise(ex.id, patch)}
              onMove={(delta) => moveExercise(index, delta)}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}
        </div>

        <button
          onClick={() => setPickerOpen(true)}
          className='mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 active:scale-[0.99]'
        >
          <Plus className='size-4' /> Adicionar exercício
        </button>

        {/* Confirmação de descarte */}
        {confirmDiscard && (
          <div className='fixed inset-0 z-50 grid place-items-center bg-black/60 p-6'>
            <div className='w-full max-w-72 rounded-2xl border border-border bg-card p-5 text-center'>
              <p className='font-semibold'>Descartar alterações?</p>
              <p className='mt-1 text-sm text-muted-foreground'>O treino não será salvo.</p>
              <div className='mt-4 flex gap-2'>
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className='flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold'
                >
                  Continuar editando
                </button>
                <button onClick={() => onClose()} className='flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-white'>
                  Descartar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise,
  index,
  total,
  onPatch,
  onMove,
  onRemove,
}: {
  exercise: Exercise
  index: number
  total: number
  onPatch: (patch: Partial<Exercise>) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <div className='flex items-center gap-2'>
        <span className='grid size-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-[0.7rem] font-bold text-primary'>
          {index + 1}
        </span>
        <input
          value={exercise.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder='Exercício'
          className='min-w-0 flex-1 rounded-lg border-none bg-transparent px-1 py-1 font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:bg-white/5'
        />
        <div className='flex shrink-0 items-center gap-1'>
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label='Mover para cima'
            className='grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground disabled:opacity-30'
          >
            <ChevronUp className='size-4' />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label='Mover para baixo'
            className='grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground disabled:opacity-30'
          >
            <ChevronDown className='size-4' />
          </button>
          <button
            onClick={onRemove}
            aria-label='Remover exercício'
            className='grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:text-destructive'
          >
            <Trash2 className='size-4' />
          </button>
        </div>
      </div>

      {/* Modo: reps ou tempo */}
      <div className='mt-3 flex rounded-xl bg-secondary p-0.5'>
        {(
          [
            { id: 'reps', label: 'Repetições' },
            { id: 'time', label: 'Tempo' },
          ] satisfies { id: ExerciseMode; label: string }[]
        ).map((opt) => (
          <button
            key={opt.id}
            onClick={() => onPatch({ mode: opt.id })}
            className={`flex-1 rounded-[0.6rem] py-1.5 text-xs font-semibold transition ${
              exercise.mode === opt.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => onPatch({ usesBar: !exercise.usesBar })}
          className={`my-0.5 ml-1 rounded-[0.6rem] px-3 text-xs font-semibold transition ${
            exercise.usesBar ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          }`}
          aria-pressed={exercise.usesBar}
        >
          Barra
        </button>
      </div>

      <div className='mt-3 grid grid-cols-3 gap-2'>
        <Stepper label='Séries' value={exercise.sets} onChange={(sets) => onPatch({ sets: clamp(sets, 1, 20) })} step={1} />
        {exercise.mode === 'reps' ? (
          <Stepper label='Reps' value={exercise.reps ?? 10} onChange={(reps) => onPatch({ reps: clamp(reps, 1, 200) })} step={1} />
        ) : (
          <Stepper
            label='Tempo'
            value={exercise.timeSec ?? 60}
            suffix='s'
            onChange={(timeSec) => onPatch({ timeSec: clamp(timeSec, 5, 600) })}
            step={15}
          />
        )}
        <Stepper label='Descanso' value={exercise.restSec} suffix='s' onChange={(restSec) => onPatch({ restSec: clamp(restSec, 0, 300) })} step={15} />
      </div>
    </div>
  )
}
