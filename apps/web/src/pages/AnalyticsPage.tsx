import { useState } from 'react'
import { format, getDay } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useHeatmap, useAnalyticsOverview, useHabits } from '@/hooks/queries'
import { Spinner } from '@/components/ui'
import clsx from 'clsx'

export function AnalyticsPage() {
  const year = new Date().getFullYear()
  const { data: heatmap,  isLoading: heatLoading  } = useHeatmap(year)
  const { data: overview                           } = useAnalyticsOverview()
  const { data: habits                             } = useHabits()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OverviewCard label="Total habits"    value={String(overview?.totalHabits ?? 0)}   />
        <OverviewCard label="Done today"      value={String(overview?.completedToday ?? 0)} />
        <OverviewCard label="Longest streak"  value={`${overview?.longestStreak ?? 0}d`}    accent />
        <OverviewCard label="Weekly rate"     value={`${Math.round((overview?.weeklyRate ?? 0) * 100)}%`} />
      </div>

      {/* Year heatmap */}
      <div className="card">
        <p className="text-sm font-semibold text-gray-900 mb-4">{year} overview</p>
        {heatLoading
          ? <div className="flex justify-center py-8"><Spinner /></div>
          : heatmap && <YearHeatmap days={heatmap.days} />
        }
      </div>

      {/* Per-habit completion bars */}
      {habits && habits.length > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-gray-900 mb-5">Habit comparison</p>
          <HabitComparisonChart habits={habits} />
        </div>
      )}
    </div>
  )
}

// ─── Year Heatmap ─────────────────────────────────────────────────────────────

function YearHeatmap({ days }: { days: { date: string; completedCount: number; totalCount: number }[] }) {
  const [tooltip, setTooltip] = useState<{ date: string; pct: number } | null>(null)

  // Build a map and fill missing days
  const map = new Map(days.map((d) => [d.date, d]))

  // Group into weeks (columns)
  const firstDay = new Date(`${days[0]?.date ?? `${new Date().getFullYear()}-01-01`}`)
  const padStart = (getDay(firstDay) + 6) % 7   // Monday-first offset

  const cells: ({ date: string; pct: number } | null)[] = [
    ...Array(padStart).fill(null),
    ...days.map((d) => ({
      date: d.date,
      pct:  d.totalCount > 0 ? d.completedCount / d.totalCount : -1,
    })),
  ]

  // Chunk into weeks
  const weeks: (typeof cells[number])[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  function cellColor(pct: number): string {
    if (pct < 0)   return '#f3f4f6'   // no data
    if (pct === 0) return '#f3f4f6'
    if (pct < 0.4) return '#9FE1CB'
    if (pct < 0.7) return '#5DCAA5'
    if (pct < 0.9) return '#1D9E75'
    return '#0F6E56'
  }

  return (
    <div className="overflow-x-auto pb-2">
      {/* Month labels */}
      <div className="flex gap-1 mb-1 ml-5">
        {MONTHS.map((m, i) => {
          const col = weeks.findIndex((w) => w.some((c) => c && new Date(c.date).getMonth() === i))
          return (
            <div key={m} className="text-xs text-gray-400" style={{ width: 12, marginLeft: col > 0 && i === 0 ? 0 : 'auto' }}>
              {m}
            </div>
          )
        })}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {['M','','W','','F','','S'].map((d, i) => (
            <div key={i} className="text-xs text-gray-400 h-3 leading-3 w-3 text-right">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="w-3 h-3 rounded-sm cursor-default transition-opacity hover:opacity-80"
                  style={{ background: cell ? cellColor(cell.pct) : 'transparent' }}
                  title={cell ? `${cell.date}: ${cell.pct < 0 ? 'no data' : Math.round(cell.pct * 100) + '%'}` : ''}
                  onMouseEnter={() => cell && setTooltip({ date: cell.date, pct: cell.pct })}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 text-xs text-gray-500">
          {format(new Date(tooltip.date), 'MMM d, yyyy')} —{' '}
          {tooltip.pct < 0 ? 'no habits tracked' : `${Math.round(tooltip.pct * 100)}% completed`}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs text-gray-400">Less</span>
        {['#f3f4f6','#9FE1CB','#5DCAA5','#1D9E75','#0F6E56'].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  )
}

// ─── Habit comparison chart ───────────────────────────────────────────────────

function HabitComparisonChart({ habits }: { habits: any[] }) {
  const sorted = [...habits].sort((a, b) =>
    (b.streak?.currentStreak ?? 0) - (a.streak?.currentStreak ?? 0)
  )

  const chartData = sorted.slice(0, 10).map((h) => ({
    name:   h.title.length > 16 ? h.title.slice(0, 14) + '…' : h.title,
    streak: h.streak?.currentStreak ?? 0,
    color:  h.color,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
      >
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: '#374151' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v: number) => [`${v} days`, 'Current streak']}
          contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', fontSize: 12 }}
          cursor={{ fill: '#f9fafb' }}
        />
        <Bar dataKey="streak" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Overview stat card ───────────────────────────────────────────────────────

function OverviewCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={clsx('card flex flex-col gap-1', accent && 'bg-brand-50 border-brand-100')}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={clsx('text-xl font-semibold', accent ? 'text-brand-600' : 'text-gray-900')}>{value}</p>
    </div>
  )
}
