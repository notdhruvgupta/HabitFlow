import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'

export const analyticsRouter = Router()
analyticsRouter.use(authenticate)

// GET /analytics/overview?date=2026-03-19
analyticsRouter.get('/overview', async (req, res) => {
  const { userId } = req as AuthRequest
  const date = req.query.date
    ? new Date(req.query.date as string)
    : new Date()
  const dateStr = date.toISOString().split('T')[0]

  const [totalHabits, logsToday, streaks] = await Promise.all([
    prisma.habit.count({ where: { userId, isArchived: false } }),
    prisma.habitLog.findMany({
      where: { userId, loggedDate: new Date(dateStr), completed: true },
      select: { id: true },
    }),
    prisma.streak.findMany({
      where: { habit: { userId, isArchived: false } },
      select: { currentStreak: true, longestStreak: true },
    }),
  ])

  // Weekly completion rate (last 7 days)
  const weekAgo = new Date(date)
  weekAgo.setDate(weekAgo.getDate() - 6)
  const [weekLogs, weekTotal] = await Promise.all([
    prisma.habitLog.count({ where: { userId, completed: true, loggedDate: { gte: weekAgo, lte: date } } }),
    prisma.habitLog.count({ where: { userId, loggedDate: { gte: weekAgo, lte: date } } }),
  ])

  return res.json({
    totalHabits,
    completedToday: logsToday.length,
    longestStreak: Math.max(0, ...streaks.map((s) => s.longestStreak)),
    weeklyRate: weekTotal > 0 ? Math.round((weekLogs / weekTotal) * 100) / 100 : 0,
  })
})

// GET /analytics/habits/:id?from=&to=&granularity=day
analyticsRouter.get('/habits/:id', async (req, res) => {
  const { userId } = req as AuthRequest
  const { id } = req.params
  const from = req.query.from ? new Date(req.query.from as string) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d })()
  const to   = req.query.to   ? new Date(req.query.to   as string) : new Date()

  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return res.status(404).json({ error: 'Habit not found' })

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { habitId: id, snapshotDate: { gte: from, lte: to } },
    orderBy: { snapshotDate: 'asc' },
  })

  // If no snapshots yet, compute on-the-fly from logs
  let data = snapshots
  if (snapshots.length === 0) {
    const logs = await prisma.habitLog.findMany({
      where: { habitId: id, loggedDate: { gte: from, lte: to } },
      orderBy: { loggedDate: 'asc' },
    })
    data = logs.map((l) => ({
      id: l.id,
      userId,
      habitId: id,
      snapshotDate: l.loggedDate,
      completionCount: l.completed ? 1 : 0,
      completionRate: l.completed ? 1 : 0,
      totalDays: 1,
      createdAt: l.createdAt,
    }))
  }

  // Best day of week
  const dayTotals: Record<string, { count: number; total: number }> = {}
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  for (const snap of data) {
    const d = days[new Date(snap.snapshotDate).getDay()]
    if (!dayTotals[d]) dayTotals[d] = { count: 0, total: 0 }
    dayTotals[d].count += snap.completionCount
    dayTotals[d].total += snap.totalDays
  }
  const bestDay = Object.entries(dayTotals).sort((a, b) => (b[1].count / (b[1].total || 1)) - (a[1].count / (a[1].total || 1)))[0]?.[0] ?? null

  const avgRate = data.length > 0
    ? Math.round((data.reduce((s, x) => s + x.completionRate, 0) / data.length) * 100) / 100
    : 0

  return res.json({ habitId: id, snapshots: data, bestDayOfWeek: bestDay, avgCompletionRate: avgRate })
})

// GET /analytics/heatmap?year=2026
analyticsRouter.get('/heatmap', async (req, res) => {
  const { userId } = req as AuthRequest
  const year = parseInt(req.query.year as string) || new Date().getFullYear()
  const from = new Date(`${year}-01-01`)
  const to   = new Date(`${year}-12-31`)

  const logs = await prisma.habitLog.groupBy({
    by: ['loggedDate'],
    where: { userId, loggedDate: { gte: from, lte: to } },
    _count: { _all: true },
    _sum:   { value: true },
  })

  const completedByDate = await prisma.habitLog.groupBy({
    by: ['loggedDate'],
    where: { userId, loggedDate: { gte: from, lte: to }, completed: true },
    _count: { _all: true },
  })

  const completedMap = new Map(completedByDate.map((r) => [r.loggedDate.toISOString().split('T')[0], r._count._all]))
  const totalMap     = new Map(logs.map((r) => [r.loggedDate.toISOString().split('T')[0], r._count._all]))

  const days: { date: string; completedCount: number; totalCount: number }[] = []
  const cursor = new Date(from)
  while (cursor <= to) {
    const dateStr = cursor.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      completedCount: completedMap.get(dateStr) ?? 0,
      totalCount:     totalMap.get(dateStr)     ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return res.json({ year, days })
})
