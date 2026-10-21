import { useState } from 'react'
import { X } from 'lucide-react'
import type { Exercise, ExerciseMode } from '@/lib/types'
import { useData } from '@/lib/store'
import { Stepper } from '@/components/ui/Stepper'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/**
 * Editor de exercício da biblioteca (CRUD).
 * - `initial === null` → criação
 * - `onDone(saved)` é chamado com o exercício salvo, ou sem argumento no cancelamento.
 */
export function ExerciseEditor({ initial, onDone }: { initial: Exercise | null; onDone: (saved?: Exercise) => void }) {
  const { createExercise, updateExercise } = useData()
  const isNew = initial === null
  const [draft, setDraft] = useState<Exercise>(
    initial ?? { id: '', name: '', mode: 'reps', sets: 3, reps: 10, restSec: 60, usesBar: false },
  )
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const dirty =
    draft.name.trim() !== '' ||
    (isNew ? draft.sets !== 3 || draft.reps !== 10 || draft.restSec !== 60 || draft.usesBar : true)

  const finish = async () => {
    const name = draft.name.trim()
    if (name === '') {
      setConfirmDiscard(true)
      return
    }
    setSaving(true)
    const data = { name, mode: draft.mode, sets: draft.sets, reps: draft.reps, timeSec: draft.timeSec, restSec: draft.restSec, usesBar: draft.usesBar }
    try {
      if (isNew) {
        const created = await createExercise(data)
        onDone(created)
      } else {
        await updateExercise({ ...draft, name })
        onDone(draft)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
      <div className='mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10'>
        <header className='sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur'>
          <button
            onClick={() => (dirty ? setConfirmDiscard(true) : onDone())}
            aria-label='Fechar'
            className='grid size-9 place-items-center rounded-xl border border-border bg-secondary text-secondary-foreground'
          >
            <X className='size-4' />
          </button>
          <h2 className='flex-1 text-base font-semibold'>{isNew ? 'Novo exercício' : 'Editar exercício'}</h2>
          <button
            onClick={finish}
            disabled={saving}
            className='rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60'
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </header>

        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder='Nome do exercício (ex.: flexão com apoio)'
          className='w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-base font-semibold text-foreground outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60'
        />

        {/* Modo: reps ou tempo */}
        <div className='mt-4 flex rounded-xl bg-secondary p-0.5'>
          {(
            [
              { id: 'reps', label: 'Repetições' },
              { id: 'time', label: 'Tempo' },
            ] satisfies { id: ExerciseMode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDraft((d) => ({ ...d, mode: opt.id }))}
              className={`flex-1 rounded-[0.6rem] py-2 text-xs font-semibold transition ${
                draft.mode === opt.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setDraft((d) => ({ ...d, usesBar: !d.usesBar }))}
            className={`my-0.5 ml-1 rounded-[0.6rem] px-3 text-xs font-semibold transition ${
              draft.usesBar ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
            aria-pressed={draft.usesBar}
          >
            Barra
          </button>
        </div>

        <div className='mt-4 grid grid-cols-3 gap-2'>
          <Stepper label='Séries' value={draft.sets} onChange={(sets) => setDraft((d) => ({ ...d, sets: clamp(sets, 1, 20) }))} step={1} />
          {draft.mode === 'reps' ? (
            <Stepper
              label='Reps'
              value={draft.reps ?? 10}
              onChange={(reps) => setDraft((d) => ({ ...d, reps: clamp(reps, 1, 200) }))}
              step={1}
            />
          ) : (
            <Stepper
              label='Tempo'
              value={draft.timeSec ?? 60}
              suffix='s'
              onChange={(timeSec) => setDraft((d) => ({ ...d, timeSec: clamp(timeSec, 5, 600) }))}
              step={15}
            />
          )}
          <Stepper
            label='Descanso'
            value={draft.restSec}
            suffix='s'
            onChange={(restSec) => setDraft((d) => ({ ...d, restSec: clamp(restSec, 0, 300) }))}
            step={15}
          />
        </div>

        {confirmDiscard && (
          <div className='fixed inset-0 z-50 grid place-items-center bg-black/60 p-6'>
            <div className='w-full max-w-72 rounded-2xl border border-border bg-card p-5 text-center'>
              <p className='font-semibold'>Descartar alterações?</p>
              <p className='mt-1 text-sm text-muted-foreground'>O exercício não será salvo.</p>
              <div className='mt-4 flex gap-2'>
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className='flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold'
                >
                  Continuar editando
                </button>
                <button onClick={() => onDone()} className='flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-white'>
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
