import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  CreateHabitSchema,
  UpdateHabitSchema,
  ArchiveHabitSchema,
} from '@habitflow/shared'

export const habitsRouter = Router()
habitsRouter.use(authenticate)

// GET /habits
habitsRouter.get('/', async (req, res) => {
  const { userId } = req as AuthRequest
  const today = new Date().toISOString().split('T')[0]

  const habits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    include: {
      streak: true,
      category: true,
      logs: {
        where: { loggedDate: new Date(today) },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const result = habits.map((h) => ({
    ...h,
    todayCompleted: h.logs[0]?.completed ?? false,
    logs: undefined,
  }))

  return res.json(result)
})

// POST /habits
habitsRouter.post('/', validate(CreateHabitSchema), async (req, res) => {
  const { userId } = req as AuthRequest
  const habit = await prisma.habit.create({
    data: { ...req.body, frequency: req.body.frequency.toUpperCase(), userId },
  })
  // Create empty streak record
  await prisma.streak.create({ data: { habitId: habit.id } })
  return res.status(201).json(habit)
})

// GET /habits/:id
habitsRouter.get('/:id', async (req, res) => {
  const { userId } = req as AuthRequest
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId },
    include: { streak: true, category: true, reminders: true },
  })
  if (!habit) return res.status(404).json({ error: 'Habit not found' })

  const totalLogs = await prisma.habitLog.count({ where: { habitId: habit.id } })
  const completedLogs = await prisma.habitLog.count({ where: { habitId: habit.id, completed: true } })
  const completionRate = totalLogs > 0 ? completedLogs / totalLogs : 0

  return res.json({ ...habit, completionRate })
})

// PUT /habits/:id
habitsRouter.put('/:id', validate(UpdateHabitSchema), async (req, res) => {
  const { userId } = req as AuthRequest
  const exists = await prisma.habit.findFirst({ where: { id: req.params.id, userId } })
  if (!exists) return res.status(404).json({ error: 'Habit not found' })

  const data = req.body.frequency
    ? { ...req.body, frequency: req.body.frequency.toUpperCase() }
    : req.body
  const habit = await prisma.habit.update({
    where: { id: req.params.id },
    data,
  })
  return res.json(habit)
})

// PATCH /habits/:id/archive
habitsRouter.patch('/:id/archive', validate(ArchiveHabitSchema), async (req, res) => {
  const { userId } = req as AuthRequest
  const exists = await prisma.habit.findFirst({ where: { id: req.params.id, userId } })
  if (!exists) return res.status(404).json({ error: 'Habit not found' })

  const habit = await prisma.habit.update({
    where: { id: req.params.id },
    data: { isArchived: req.body.isArchived },
    select: { id: true, isArchived: true },
  })
  return res.json(habit)
})

// DELETE /habits/:id
habitsRouter.delete('/:id', async (req, res) => {
  const { userId } = req as AuthRequest
  const exists = await prisma.habit.findFirst({ where: { id: req.params.id, userId } })
  if (!exists) return res.status(404).json({ error: 'Habit not found' })

  await prisma.habit.delete({ where: { id: req.params.id } })
  return res.json({ message: 'Habit deleted' })
})
