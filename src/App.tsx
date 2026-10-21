import { useState } from 'react'
import { BottomNav, type Tab } from '@/components/layout/BottomNav'
import { WorkoutList } from '@/components/workout/WorkoutList'
import { WorkoutEditor } from '@/components/workout/WorkoutEditor'
import { SessionRunner } from '@/components/session/SessionRunner'
import { HistoryPage } from '@/components/history/HistoryPage'
import { LibraryPage } from '@/components/library/LibraryPage'
import { DataProvider, useData } from '@/lib/store'
import type { Workout } from '@/lib/types'

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}

function Shell() {
  const { ready, workouts } = useData()
  const [tab, setTab] = useState<Tab>('workouts')
  const [editing, setEditing] = useState<{ workout: Workout | null } | null>(null)
  const [running, setRunning] = useState<Workout | null>(null)

  if (!ready) {
    return (
      <div className='grid min-h-dvh place-items-center'>
        <p className='animate-pulse text-sm font-bold tracking-[0.3em] text-primary'>FORJA</p>
      </div>
    )
  }

  if (running) {
    return <SessionRunner workout={running} onExit={() => setRunning(null)} />
  }

  if (editing) {
    return (
      <WorkoutEditor
        key={editing.workout?.id ?? 'new'}
        workout={editing.workout}
        onClose={() => setEditing(null)}
      />
    )
  }

  return (
    <div className='mx-auto max-w-md px-4 pb-28'>
      <header className='py-4'>
        <h1 className='text-xl font-extrabold tracking-[0.3em] text-primary'>FORJA</h1>
        <p className='text-xs text-muted-foreground'>treinos de calistenia</p>
      </header>

      {tab === 'workouts' && (
        <WorkoutList
          workouts={workouts}
          onOpenEditor={(workout) => setEditing({ workout })}
          onRun={(workout) => setRunning(workout)}
          onCreate={() => setEditing({ workout: null })}
        />
      )}
      {tab === 'exercises' && <LibraryPage />}
      {tab === 'history' && <HistoryPage />}

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
