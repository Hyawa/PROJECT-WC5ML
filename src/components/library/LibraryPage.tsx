import { useMemo, useState } from 'react'
import { Dumbbell, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { Exercise } from '@/lib/types'
import { useData, uid } from '@/lib/store'
import { ExerciseEditor } from './ExerciseEditor'

/** Aba "Exercícios": CRUD completo da biblioteca. */
export function LibraryPage() {
  const { exercises, deleteExercise } = useData()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exercises
    return exercises.filter((ex) => ex.name.toLowerCase().includes(term))
  }, [exercises, search])

  return (
    <div className='flex flex-col gap-3'>
      <button
        onClick={() => setCreating(true)}
        className='flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 active:scale-[0.99]'
      >
        <Plus className='size-4' /> Novo exercício
      </button>

      {exercises.length > 6 && (
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar exercício'
            className='w-full rounded-xl border border-border bg-white/5 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60'
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-10 text-center'>
          <div className='grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary'>
            <Dumbbell className='size-6' />
          </div>
          <p className='font-semibold text-foreground'>{search ? 'Nenhum exercício encontrado' : 'Biblioteca vazia'}</p>
          <p className='max-w-64 text-sm text-muted-foreground'>
            {search ? 'Tente outro termo de busca.' : 'Crie seus próprios exercícios de peso do corpo e barra fixa.'}
          </p>
        </div>
      ) : (
        filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onEdit={() => setEditing(ex)} onDelete={() => void deleteExercise(ex.id)} />
        ))
      )}

      {(creating || editing) && (
        <ExerciseEditor
          initial={editing}
          onDone={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <div className='flex items-center justify-between gap-2'>
        <div className='min-w-0'>
          <h3 className='truncate text-base font-semibold text-foreground'>{exercise.name}</h3>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {exercise.sets} séries ×{' '}
            {exercise.mode === 'time' ? `${exercise.timeSec ?? 0} s` : `${exercise.reps ?? 0} reps`} · descanso {exercise.restSec} s
            {exercise.usesBar && ' · barra fixa'}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1.5'>
          <button
            onClick={onEdit}
            aria-label={`Editar exercício ${exercise.name}`}
            className='grid size-9 place-items-center rounded-xl border border-border bg-secondary text-secondary-foreground transition hover:bg-accent active:scale-[0.98]'
          >
            <Pencil className='size-4' />
          </button>
          <TwoTapDelete onDelete={onDelete} name={exercise.name} />
        </div>
      </div>
    </div>
  )
}

/** Excluir exige dois toques (evita apagar sem querer). */
function TwoTapDelete({ onDelete, name }: { onDelete: () => void; name: string }) {
  const [armed, setArmed] = useState(false)
  return (
    <button
      aria-label={`Excluir exercício ${name}`}
      onClick={() => {
        if (armed) {
          onDelete()
          return
        }
        setArmed(true)
        window.setTimeout(() => setArmed(false), 2500)
      }}
      className={`grid size-9 place-items-center rounded-xl border transition active:scale-[0.98] ${
        armed ? 'border-destructive/60 bg-destructive/20 text-destructive' : 'border-border bg-secondary text-muted-foreground hover:text-destructive'
      }`}
    >
      <Trash2 className='size-4' />
    </button>
  )
}

export function newExerciseId(): string {
  return uid()
}
