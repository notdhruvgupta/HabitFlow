import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { CreateLogSchema, UpdateLogSchema } from '@habitflow/shared'
import { recalculateStreak } from '../services/streak.service'

export const logsRouter = Router({ mergeParams: true })
logsRouter.use(authenticate)

// GET /habits/:habitId/logs?from=&to=
logsRouter.get('/', async (req, res) => {
  const { userId }  = req as AuthRequest
  const { habitId } = req.params
  const { from, to } = req.query

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } })
  if (!habit) return res.status(404).json({ error: 'Habit not found' })

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId,
      ...(from || to
        ? {
            loggedDate: {
              ...(from ? { gte: new Date(from as string) } : {}),
              ...(to   ? { lte: new Date(to   as string) } : {}),
            },
          }
        : {}),
    },
    orderBy: { loggedDate: 'desc' },
  })

  return res.json(logs)
})

// POST /habits/:habitId/logs
logsRouter.post('/', validate(CreateLogSchema), async (req, res) => {
  const { userId }  = req as AuthRequest
  const { habitId } = req.params

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } })
  if (!habit) return res.status(404).json({ error: 'Habit not found' })

  const log = await prisma.habitLog.upsert({
    where:  { habitId_loggedDate: { habitId, loggedDate: new Date(req.body.loggedDate) } },
    create: { habitId, userId, ...req.body, loggedDate: new Date(req.body.loggedDate) },
    update: { completed: req.body.completed, value: req.body.value, note: req.body.note },
  })

  await recalculateStreak(habitId)

  const streak = await prisma.streak.findUnique({ where: { habitId } })
  return res.status(201).json({ log, streak })
})

// PATCH /habits/:habitId/logs/:logId
logsRouter.patch('/:logId', validate(UpdateLogSchema), async (req, res) => {
  const { userId } = req as AuthRequest
  const { logId }  = req.params

  const existing = await prisma.habitLog.findFirst({
    where: { id: logId, userId },
  })
  if (!existing) return res.status(404).json({ error: 'Log not found' })

  const log = await prisma.habitLog.update({
    where: { id: logId },
    data:  req.body,
  })
  return res.json(log)
})
