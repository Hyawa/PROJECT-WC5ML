import { useEffect, useRef, useState } from 'react'
import { Check, Plus, Play, X, Zap } from 'lucide-react'
import type { Session, SetRecord, Workout } from '@/lib/types'
import { clone, uid, useData } from '@/lib/store'
import { fmtClock, fmtDuration } from '@/lib/format'
import { beepDone, beepTick, vibrate } from '@/lib/audio'
import { useCountdown } from '@/lib/hooks/useCountdown'
import { RingTimer } from './RingTimer'

type Phase = 'idle' | 'work' | 'rest' | 'done'
interface Cursor {
  exIdx: number
  setIdx: number
}

export function SessionRunner({ workout, onExit }: { workout: Workout; onExit: () => void }) {
  const { addSession } = useData()
  const exercises = workout.exercises
  const [done, setDone] = useState<SetRecord[][]>(() => exercises.map(() => []))
  const [cur, setCur] = useState<Cursor>({ exIdx: 0, setIdx: 0 })
  const [phase, setPhase] = useState<Phase>('idle')
  const [confirmExit, setConfirmExit] = useState(false)

  const timer = useCountdown()
  const startRef = useRef(Date.now())
  const startedRef = useRef(false)
  const curRef = useRef(cur)
  curRef.current = cur

  // Bipes dos últimos 3 segundos
  useEffect(() => {
    if (!timer.running) return
    if (timer.remaining >= 1 && timer.remaining <= 3) {
      beepTick()
      vibrate(60)
    }
  }, [timer.remaining, timer.running])

  const totalSets = exercises.reduce((n, ex) => n + ex.sets, 0)
  const doneSets = done.reduce((n, sets) => n + sets.length, 0)
  const setStarted = () => (startedRef.current = true)
  const started = startedRef.current

  /** Avança o cursor para a próxima série/exercício e inicia o descanso. */
  const advanceAfterSet = (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx]
    const nextSet = setIdx + 1
    const nextCursor: Cursor =
      nextSet < ex.sets ? { exIdx, setIdx: nextSet } : exercises[exIdx + 1] ? { exIdx: exIdx + 1, setIdx: 0 } : { exIdx: -1, setIdx: -1 }

    if (nextCursor.exIdx === -1) {
      finishSession()
      return
    }
    if (ex.restSec <= 0) {
      setPhase('idle')
      setCur(nextCursor)
      return
    }
    setPhase('rest')
    setCur(nextCursor)
    timer.start(ex.restSec, () => setPhase('idle'))
  }

  const finishSession = () => {
    timer.stop()
    setPhase('done')
  }

  /** Registra a série atual e segue o fluxo. */
  const completeSet = (record: SetRecord) => {
    const { exIdx, setIdx } = curRef.current
    setStarted() // ref (sem re-render)
    setDone((prev) => prev.map((sets, i) => (i === exIdx ? [...sets, record] : sets)))
    advanceAfterSet(exIdx, setIdx)
  }

  // Série por repetições
  const markRepsSet = () => {
    const ex = exercises[cur.exIdx]
    beepDone()
    vibrate([80, 50, 80])
    completeSet({ targetReps: ex.reps, doneReps: ex.reps })
  }

  // Série por tempo (cronômetro da série)
  const startTimeSet = () => {
    const ex = exercises[cur.exIdx]
    const targetTime = ex.timeSec ?? 0
    setStarted()
    setPhase('work')
    timer.start(targetTime, () => {
      beepDone()
      vibrate([80, 50, 80])
      const { exIdx, setIdx } = curRef.current
      setDone((prev) =>
        prev.map((sets, i) => (i === exIdx ? [...sets, { targetTimeSec: targetTime, doneTimeSec: targetTime }] : sets)),
      )
      advanceAfterSet(exIdx, setIdx)
    })
  }

  const skipRest = () => {
    timer.stop()
    setPhase('idle')
  }

  const saveAndExit = () => {
    const durationSec = Math.round((Date.now() - startRef.current) / 1000)
    const session: Session = {
      id: uid(),
      workoutId: workout.id,
      workoutName: workout.name,
      finishedAt: new Date().toISOString(),
      durationSec,
      exercises: exercises
        .map((ex, i) => ({ name: ex.name, mode: ex.mode, sets: clone(done[i]) }))
        .filter((e) => e.sets.length > 0),
    }
    addSession(session)
    onExit()
  }

  /* ---------- Telas ---------- */

  if (phase === 'done') {
    const totalReps = done.flat().reduce((n, s) => n + (s.doneReps ?? 0), 0)
    const totalTime = done.flat().reduce((n, s) => n + (s.doneTimeSec ?? 0), 0)
    const durationSec = Math.round((Date.now() - startRef.current) / 1000)
    return (
      <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
        <div className='mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10 text-center'>
          <div className='grid size-16 place-items-center justify-self-center rounded-full bg-primary/15 text-primary'>
            <Zap className='size-8 fill-current' />
          </div>
          <h2 className='mt-4 text-2xl font-bold'>Treino concluído! 🎖️</h2>
          <p className='mt-1 text-sm text-muted-foreground'>{workout.name}</p>

          <div className='mt-6 grid grid-cols-3 gap-2'>
            <SummaryCard value={String(doneSets)} label='séries' />
            <SummaryCard value={String(totalReps)} label='reps' />
            <SummaryCard value={fmtDuration(durationSec)} label='duração' />
          </div>
          {totalTime > 0 && (
            <p className='mt-2 text-xs text-muted-foreground'>{fmtDuration(totalTime)} em exercícios cronometrados</p>
          )}

          <div className='mt-8 flex flex-col gap-2'>
            <button
              onClick={saveAndExit}
              className='flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
            >
              <Check className='size-4' /> Salvar no histórico
            </button>
            <button
              onClick={onExit}
              className='rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground'
            >
              Descartar treino
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ex = exercises[cur.exIdx]
  if (!ex) {
    // Esquema estranho (treino vazio): aborta
    onExit()
    return null
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
      <div className='mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8'>
        {/* Cabeçalho */}
        <header className='flex items-center gap-3 py-3'>
          <button
            onClick={() => (started ? setConfirmExit(true) : onExit())}
            aria-label='Sair do treino'
            className='grid size-9 place-items-center rounded-xl border border-border bg-secondary text-secondary-foreground'
          >
            <X className='size-4' />
          </button>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold'>{workout.name}</p>
            <p className='text-xs text-muted-foreground'>
              {doneSets}/{totalSets} séries • {cur.exIdx + 1}/{exercises.length} exercícios
            </p>
          </div>
        </header>

        {/* Barra de progresso geral */}
        <div className='h-1.5 overflow-hidden rounded-full bg-white/10'>
          <div
            className='h-full rounded-full bg-primary transition-[width] duration-300'
            style={{ width: `${(doneSets / Math.max(1, totalSets)) * 100}%` }}
          />
        </div>

        <p className='mt-2 text-center text-xs text-muted-foreground'>
          {ex.usesBar ? 'Barra fixa' : 'Peso do corpo'} • {' '}
          {doneSets > 0 || started ? 'treino em andamento' : 'primeira série'}
        </p>

        {/* Card do exercício atual */}
        <div className='mt-4 flex flex-col items-center rounded-3xl border border-border bg-card p-6'>
          <p className='text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground'>
            Exercício {cur.exIdx + 1} de {exercises.length}
          </p>
          <h2 className='mt-2 text-center text-2xl font-bold leading-tight'>{ex.name}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Série {cur.setIdx + 1} de {ex.sets}
          </p>

          {phase === 'rest' ? (
            <>
              <RingTimer remaining={timer.remaining} total={ex.restSec} label='Descanso' tone='muted' />
              <div className='flex w-full gap-2'>
                <button
                  onClick={() => timer.addSeconds(15)}
                  className='flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-accent active:scale-[0.98]'
                >
                  <Plus className='size-4' /> 15 s
                </button>
                <button
                  onClick={skipRest}
                  className='flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
                >
                  Pular descanso →
                </button>
              </div>
            </>
          ) : phase === 'work' ? (
            <>
              <RingTimer remaining={timer.remaining} total={ex.timeSec ?? 0} label='Agora!' />
              <button
                onClick={() => {
                  timer.stop()
                  setPhase('idle')
                }}
                className='rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-destructive'
              >
                Cancelar série
              </button>
            </>
          ) : (
            <>
              <div className='my-4 flex flex-col items-center'>
                <span className='text-6xl font-bold tabular-nums text-primary'>
                  {ex.mode === 'time' ? fmtClock(ex.timeSec ?? 0) : ex.reps}
                </span>
                <span className='mt-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                  {ex.mode === 'time' ? 'segure / faça' : 'reps'}
                </span>
              </div>
              {ex.mode === 'time' ? (
                <button
                  onClick={startTimeSet}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
                >
                  <Play className='size-5 fill-current' /> Iniciar série ({fmtClock(ex.timeSec ?? 0)})
                </button>
              ) : (
                <button
                  onClick={markRepsSet}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]'
                >
                  <Check className='size-5' /> Série feita
                </button>
              )}
              <p className='mt-3 text-xs text-muted-foreground'>Descanso de {fmtClock(ex.restSec)} após a série</p>
            </>
          )}
        </div>

        {/* Próximos exercícios */}
        <div className='mt-4 space-y-1.5 text-sm'>
          {exercises.slice(cur.exIdx + 1).map((next, i) => (
            <div key={next.id} className='flex items-center justify-between rounded-xl border border-border bg-card/60 px-3 py-2'>
              <span className='truncate text-muted-foreground'>
                {cur.exIdx + 2 + i}. {next.name}
              </span>
              <span className='ml-2 shrink-0 text-xs text-muted-foreground'>
                {next.sets} × {next.mode === 'time' ? `${next.timeSec} s` : `${next.reps} reps`}
              </span>
            </div>
          ))}
        </div>

        {/* Confirmação de saída */}
        {confirmExit && (
          <div className='fixed inset-0 z-50 grid place-items-center bg-black/60 p-6'>
            <div className='w-full max-w-72 rounded-2xl border border-border bg-card p-5 text-center'>
              <p className='font-semibold'>Sair do treino?</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Você já completou {doneSets} séries. Ao sair, o treino não será salvo.
              </p>
              <div className='mt-4 flex gap-2'>
                <button
                  onClick={() => setConfirmExit(false)}
                  className='flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground'
                >
                  Continuar
                </button>
                <button onClick={onExit} className='flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold'>
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <div className='rounded-2xl border border-border bg-card px-2 py-4 text-center'>
      <p className='text-xl font-bold tabular-nums text-primary'>{value}</p>
      <p className='mt-0.5 text-xs text-muted-foreground'>{label}</p>
    </div>
  )
}
