import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, subMonths, addMonths, startOfWeek, endOfWeek,
} from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useHabit, useHabitLogs, useLogHabit,
  useReminders, useToggleReminder, useHabitAnalytics,
} from '@/hooks/queries'
import { Tabs, Spinner } from '@/components/ui'
import clsx from 'clsx'
import type { HabitLog } from '@habitflow/shared'

type Period = '7d' | '30d' | '90d'

export function HabitDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [calMonth,   setCalMonth]   = useState(new Date())
  const [period,     setPeriod]     = useState<Period>('30d')
  const [activeTab,  setActiveTab]  = useState<'logs' | 'analytics' | 'reminders'>('logs')

  const habitId = id!

  const { data: habit, isLoading: habitLoading } = useHabit(habitId)

  const periodDays  = { '7d': 7, '30d': 30, '90d': 90 }[period]
  const fromDate    = format(new Date(Date.now() - periodDays * 864e5), 'yyyy-MM-dd')
  const toDate      = format(new Date(), 'yyyy-MM-dd')

  const { data: logs }      = useHabitLogs(habitId, format(startOfMonth(calMonth), 'yyyy-MM-dd'), format(endOfMonth(calMonth), 'yyyy-MM-dd'))
  const { data: analytics } = useHabitAnalytics(habitId, fromDate, toDate)
  const { data: reminders } = useReminders(habitId)
  const logMutation         = useLogHabit(habitId)
  const toggleReminder      = useToggleReminder(habitId)

  if (habitLoading) return <PageLoader />
  if (!habit) return <div className="p-8 text-gray-400 text-sm">Habit not found.</div>

  const logMap = new Map<string, HabitLog>((logs ?? []).map((l: HabitLog) => [format(new Date(l.loggedDate), 'yyyy-MM-dd'), l]))

  async function handleDayClick(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const existing = logMap.get(dateStr)
    await logMutation.mutateAsync({
      loggedDate: dateStr,
      completed:  !(existing?.completed ?? false),
      value: 1,
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: habit.color }} />
            <h1 className="text-xl font-semibold text-gray-900">{habit.title}</h1>
          </div>
          {habit.description && <p className="text-sm text-gray-400 mt-1 ml-6">{habit.description}</p>}
          <div className="flex gap-4 mt-3 ml-6">
            <StatPill label="Current streak" value={`${habit.streak?.currentStreak ?? 0}d`} color={habit.color} />
            <StatPill label="Longest"        value={`${habit.streak?.longestStreak ?? 0}d`} />
            <StatPill label="Completion"     value={`${Math.round(((habit as any).completionRate ?? 0) * 100)}%`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'logs',      label: 'Log calendar' },
          { value: 'analytics', label: 'Trend'        },
          { value: 'reminders', label: 'Reminders'    },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {/* ── Log calendar ── */}
        {activeTab === 'logs' && (
          <div className="card">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="btn-ghost p-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <p className="text-sm font-semibold text-gray-900">{format(calMonth, 'MMMM yyyy')}</p>
              <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="btn-ghost p-1.5" disabled={calMonth >= new Date()}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <CalendarGrid month={calMonth} logMap={logMap} habitColor={habit.color} onDayClick={handleDayClick} />
          </div>
        )}

        {/* ── Trend chart ── */}
        {activeTab === 'analytics' && (
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-gray-900">Completion rate</p>
              <Tabs
                tabs={[{ value: '7d', label: '7d' }, { value: '30d', label: '30d' }, { value: '90d', label: '90d' }]}
                active={period}
                onChange={setPeriod}
              />
            </div>

            {!analytics ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.snapshots} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="snapshotDate"
                      tickFormatter={(v) => format(new Date(v), 'MMM d')}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(v) => `${Math.round(v * 100)}%`}
                      domain={[0, 1]}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${Math.round(v * 100)}%`, 'Completion']}
                      labelFormatter={(l) => format(new Date(l), 'MMM d, yyyy')}
                      contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke={habit.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: habit.color }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
                  <MetricPair label="Avg rate"     value={`${Math.round((analytics.avgCompletionRate ?? 0) * 100)}%`} />
                  <MetricPair label="Best day"     value={analytics.bestDayOfWeek ?? '—'} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Reminders ── */}
        {activeTab === 'reminders' && (
          <div className="flex flex-col gap-2">
            {!reminders || reminders.length === 0 ? (
              <div className="card text-center py-10 text-gray-400 text-sm">
                No reminders set for this habit.
              </div>
            ) : (
              reminders.map((r: any) => (
                <div key={r.id} className="card flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{r.time}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {r.days.join(', ')} · {r.channel}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r.isEnabled}
                      onChange={() => toggleReminder.mutate({ reminderId: r.id, isEnabled: !r.isEnabled })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-brand-400 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  month, logMap, habitColor, onDayClick,
}: {
  month: Date
  logMap: Map<string, HabitLog>
  habitColor: string
  onDayClick: (d: Date) => void
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 1 })
  const days  = eachDayOfInterval({ start, end })
  const today = new Date()

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const dateStr  = format(day, 'yyyy-MM-dd')
        const log      = logMap.get(dateStr)
        const isMonth  = day.getMonth() === month.getMonth()
        const isFuture = day > today
        const done     = log?.completed ?? false

        return (
          <button
            key={dateStr}
            disabled={isFuture || !isMonth}
            onClick={() => onDayClick(day)}
            className={clsx(
              'aspect-square rounded-xl text-xs font-medium transition-all',
              !isMonth        && 'opacity-0 pointer-events-none',
              isFuture        && 'text-gray-200 cursor-default',
              isToday(day)    && !done && 'ring-2 ring-brand-400 ring-offset-1',
              done            && 'text-white scale-95 hover:scale-100',
              !done && !isFuture && isMonth && 'text-gray-400 hover:bg-gray-100',
            )}
            style={done ? { background: habitColor } : undefined}
          >
            {format(day, 'd')}
          </button>
        )
      })}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold mt-0.5" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}

function MetricPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-base font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}
