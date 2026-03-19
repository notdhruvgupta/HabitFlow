import { format } from 'date-fns'
import { useHabits, useAnalyticsOverview } from '@/hooks/queries'
import { HabitCard } from '@/components/habits/HabitCard'
import { useAuthStore } from '@/store/auth.store'

export function DashboardPage() {
  const user    = useAuthStore((s) => s.user)
  const today   = format(new Date(), 'yyyy-MM-dd')
  const dayName = format(new Date(), 'EEEE, MMMM d')

  const { data: habits, isLoading: habitsLoading } = useHabits()
  const { data: overview } = useAnalyticsOverview(today)

  const completed = habits?.filter((h) => h.todayCompleted).length ?? 0
  const total     = habits?.length ?? 0
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  const incomplete = habits?.filter((h) => !h.todayCompleted) ?? []
  const done       = habits?.filter((h) =>  h.todayCompleted) ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-sm text-gray-400 mb-1">{dayName}</p>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          {pct === 100 ? '🎉 All done!' : `Hey, ${user?.username ?? 'there'}`}
        </h1>
      </div>

      {/* Progress ring + stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
        {/* Progress */}
        <div className="card col-span-2 sm:col-span-1 flex items-center gap-4">
          <ProgressRing pct={pct} size={56} />
          <div>
            <p className="text-xs text-gray-400">Today</p>
            <p className="text-lg font-semibold text-gray-900">{completed}<span className="text-gray-400 font-normal text-sm">/{total}</span></p>
          </div>
        </div>

        <StatCard label="Current streak" value={`${overview?.longestStreak ?? 0}d`} accent />
        <StatCard label="Weekly rate"    value={`${Math.round((overview?.weeklyRate ?? 0) * 100)}%`} />
        <StatCard label="Total habits"   value={String(overview?.totalHabits ?? 0)} />
      </div>

      {/* Habit list */}
      {habitsLoading ? (
        <SkeletonList />
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {incomplete.map((h) => <HabitCard key={h.id} habit={h} date={today} />)}
          {done.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mt-4 mb-1 px-1">Completed</p>
              {done.map((h) => <HabitCard key={h.id} habit={h} date={today} />)}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card flex flex-col gap-1 ${accent ? 'bg-brand-50 border-brand-100' : ''}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-xl font-semibold ${accent ? 'text-brand-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function ProgressRing({ pct, size }: { pct: number; size: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash  = (pct / 100) * circ

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#1D9E75" strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="text-gray-900 font-medium mb-1">No habits yet</p>
      <p className="text-sm text-gray-400">Head to Habits to create your first one.</p>
    </div>
  )
}
