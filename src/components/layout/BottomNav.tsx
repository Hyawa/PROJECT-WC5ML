import { Dumbbell, History, ListChecks } from 'lucide-react'

export type Tab = 'workouts' | 'exercises' | 'history'

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: 'workouts', label: 'Treinos', icon: ListChecks },
  { id: 'exercises', label: 'Exercícios', icon: Dumbbell },
  { id: 'history', label: 'Histórico', icon: History },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur'>
      <div className='mx-auto flex max-w-md items-stretch justify-around px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2'>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex min-w-20 flex-col items-center gap-0.5 rounded-xl px-3 pb-1.5 pt-1.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className='size-5' strokeWidth={active ? 2.4 : 2} />
              <span className='text-[0.7rem] font-semibold tracking-wide'>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
