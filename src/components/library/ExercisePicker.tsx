import { useMemo, useState } from 'react'
import { ChevronLeft, Plus, Search, X } from 'lucide-react'
import type { Exercise } from '@/lib/types'
import { ExerciseEditor } from './ExerciseEditor'

/**
 * Escolhe um exercício da biblioteca para adicionar ao treino.
 * Também permite criar um exercício novo na hora (voltando já selecionado).
 */
export function ExercisePicker({
  exercises,
  onPick,
  onClose,
}: {
  exercises: Exercise[]
  onPick: (exercise: Exercise) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exercises
    return exercises.filter((ex) => ex.name.toLowerCase().includes(term))
  }, [exercises, search])

  if (creating) {
    return <ExerciseEditor initial={null} onDone={(saved) => (saved ? onPick(saved) : setCreating(false))} />
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
      <div className='mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10'>
        <header className='sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur'>
          <button
            onClick={onClose}
            aria-label='Fechar seletor'
            className='grid size-9 place-items-center rounded-xl border border-border bg-secondary text-secondary-foreground'
          >
            <X className='size-4' />
          </button>
          <h2 className='flex-1 text-base font-semibold'>Adicionar exercício</h2>
          <button
            onClick={() => setCreating(true)}
            className='flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
          >
            <Plus className='size-3.5' /> Criar novo
          </button>
        </header>

        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar exercício'
            className='w-full rounded-xl border border-border bg-white/5 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60'
          />
        </div>

        <div className='mt-3 flex flex-col gap-2'>
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className='flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-left transition hover:border-primary/50 hover:bg-primary/10 active:scale-[0.99]'
            >
              <span className='min-w-0 flex-1 truncate font-semibold text-foreground'>{ex.name}</span>
              <span className='ml-2 shrink-0 text-xs text-muted-foreground'>
                {ex.sets} × {ex.mode === 'time' ? `${ex.timeSec ?? 0} s` : `${ex.reps ?? 0} reps`}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className='flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-8 text-center'>
              <ChevronLeft className='size-6 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>Nada encontrado. Crie um novo exercício!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
