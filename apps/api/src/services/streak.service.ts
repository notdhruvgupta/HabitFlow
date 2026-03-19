import { prisma } from '../lib/prisma'
import { cacheStreak } from '../lib/redis'

/**
 * Recalculates and persists the streak for a given habit.
 * Called whenever a HabitLog is created, updated, or deleted.
 */
export async function recalculateStreak(habitId: string): Promise<void> {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    select: { targetDays: true, frequency: true },
  })
  if (!habit) return

  // Fetch all completed logs sorted descending
  const logs = await prisma.habitLog.findMany({
    where: { habitId, completed: true },
    orderBy: { loggedDate: 'desc' },
    select: { loggedDate: true },
  })

  if (logs.length === 0) {
    await upsertStreak(habitId, 0, 0, null, null)
    return
  }

  const dates = logs.map((l) => toDateStr(l.loggedDate))
  const today = toDateStr(new Date())

  let currentStreak = 0
  let longestStreak = 0
  let streak = 0
  let prev: string | null = null

  for (const date of dates) {
    if (prev === null) {
      // Most recent log — only count current streak if today or yesterday
      const diff = daysBetween(date, today)
      if (diff <= 1) {
        streak = 1
        currentStreak = 1
      } else {
        streak = 1
        currentStreak = 0
      }
    } else {
      const diff = daysBetween(date, prev)
      if (diff === 1) {
        streak++
        if (currentStreak > 0) currentStreak++
      } else {
        longestStreak = Math.max(longestStreak, streak)
        streak = 1
      }
    }
    prev = date
  }

  longestStreak = Math.max(longestStreak, streak)
  currentStreak = currentStreak === 0 ? 0 : currentStreak

  const lastCompletedDate = logs[0].loggedDate
  const streakStart = currentStreak > 0
    ? new Date(addDays(lastCompletedDate, -(currentStreak - 1)))
    : null

  await upsertStreak(habitId, currentStreak, longestStreak, lastCompletedDate, streakStart)
  await cacheStreak(habitId, currentStreak, longestStreak)
}

async function upsertStreak(
  habitId: string,
  current: number,
  longest: number,
  lastDate: Date | null,
  startDate: Date | null,
) {
  await prisma.streak.upsert({
    where:  { habitId },
    create: { habitId, currentStreak: current, longestStreak: longest, lastCompletedDate: lastDate ?? undefined, streakStartDate: startDate ?? undefined },
    update: { currentStreak: current, longestStreak: longest, lastCompletedDate: lastDate ?? undefined, streakStartDate: startDate ?? undefined },
  })
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(earlier).getTime()
  const b = new Date(later).getTime()
  return Math.round(Math.abs(b - a) / 86_400_000)
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
