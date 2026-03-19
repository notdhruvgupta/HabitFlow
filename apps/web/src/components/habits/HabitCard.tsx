import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import type { Habit } from '@habitflow/shared'
import { useLogHabit } from '@/hooks/queries'
import { format } from 'date-fns'

interface Props {
  habit: Habit
  date?: string
}

export function HabitCard({ habit, date }: Props) {
  const today    = date ?? format(new Date(), 'yyyy-MM-dd')
  const navigate = useNavigate()
  const logMutation = useLogHabit(habit.id)
  const [checking, setChecking] = useState(false)

  const completed = habit.todayCompleted ?? false

  async function handleCheck(e: React.MouseEvent) {
    e.stopPropagation()
    if (checking) return
    setChecking(true)
    try {
      await logMutation.mutateAsync({ loggedDate: today, completed: !completed, value: 1 })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      onClick={() => navigate(`/habits/${habit.id}`)}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100
                 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all duration-150
                 group animate-fade-in"
    >
      {/* Colour dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: habit.color }}
      />

      {/* Title + streak */}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate transition-colors', completed ? 'text-gray-400 line-through' : 'text-gray-900')}>
          {habit.title}
        </p>
        {habit.streak && habit.streak.currentStreak > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            🔥 {habit.streak.currentStreak} day streak
          </p>
        )}
      </div>

      {/* Category badge */}
      {habit.category && (
        <span
          className="badge text-xs shrink-0 hidden sm:inline-flex"
          style={{ background: habit.category.color + '22', color: habit.category.color }}
        >
          {habit.category.name}
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={handleCheck}
        disabled={checking}
        className={clsx(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0',
          'transition-all duration-150 active:scale-90',
          completed
            ? 'border-brand-400 bg-brand-400 text-white animate-pop'
            : 'border-gray-200 group-hover:border-brand-400',
        )}
      >
        {completed && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  )
}
