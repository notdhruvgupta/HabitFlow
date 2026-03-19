import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHabits, useDeleteHabit, useArchiveHabit, useCategories } from '@/hooks/queries'
import type { Habit } from '@habitflow/shared'
import { NewHabitModal } from '@/components/habits/NewHabitModal'

// ─── Habits Page ──────────────────────────────────────────────────────────────

export function HabitsPage() {
  const navigate = useNavigate()
  const { data: habits, isLoading } = useHabits()
  const { data: categories }        = useCategories()
  const deleteHabit  = useDeleteHabit()
  const archiveHabit = useArchiveHabit()

  const [filter, setFilter] = useState<string>('all')
  const [showNewHabit, setShowNewHabit] = useState(false)

  const filtered = habits?.filter((h) =>
    filter === 'all' ? true : h.categoryId === filter
  ) ?? []

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <NewHabitModal open={showNewHabit} onClose={() => setShowNewHabit(false)} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Habits</h1>
        <button
          onClick={() => setShowNewHabit(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New habit
        </button>
      </div>

      {/* Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <FilterPill label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          {categories.map((c: any) => (
            <FilterPill
              key={c.id}
              label={c.name}
              active={filter === c.id}
              color={c.color}
              onClick={() => setFilter(c.id)}
            />
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No habits in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((h) => (
            <HabitSettingsCard
              key={h.id}
              habit={h}
              onEdit={() => navigate(`/habits/${h.id}`)}
              onArchive={() => archiveHabit.mutate({ id: h.id, isArchived: !h.isArchived })}
              onDelete={() => {
                if (confirm(`Delete "${h.title}"? This cannot be undone.`)) {
                  deleteHabit.mutate(h.id)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export function AnalyticsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>
      <div className="card flex items-center justify-center py-16 text-gray-400">
        <p className="text-sm">Analytics dashboard — connect your data to see insights.</p>
      </div>
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate()
  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
      <div className="card">
        <p className="text-sm text-gray-400">Profile, notifications, and account management coming soon.</p>
        <button className="btn-danger mt-4" onClick={() => navigate('/login')}>Log out</button>
      </div>
    </div>
  )
}

// ─── Habit Settings Card ──────────────────────────────────────────────────────

function HabitSettingsCard({
  habit, onEdit, onArchive, onDelete,
}: {
  habit: Habit
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: habit.color }} />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p className="text-sm font-medium text-gray-900 truncate">{habit.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{habit.frequency.toLowerCase()}</p>
      </div>
      {habit.isArchived && <span className="badge bg-gray-100 text-gray-500 text-xs">Archived</span>}
      <div className="flex items-center gap-1">
        <button onClick={onArchive} className="btn-ghost px-2 py-1.5 text-xs">
          {habit.isArchived ? 'Restore' : 'Archive'}
        </button>
        <button onClick={onDelete} className="btn-danger px-2 py-1.5 text-xs">Delete</button>
      </div>
    </div>
  )
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-brand-400 text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
      style={active && color ? { background: color } : undefined}
    >
      {label}
    </button>
  )
}
