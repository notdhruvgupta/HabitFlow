import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  CreateReminderSchema,
  UpdateReminderSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  UpdateUserSchema,
  InvitePartnerSchema,
  RespondPartnerSchema,
} from '@habitflow/shared'

// ─── Reminders ────────────────────────────────────────────────────────────────

export const remindersRouter = Router({ mergeParams: true })
remindersRouter.use(authenticate)

remindersRouter.get('/', async (req, res) => {
  const { userId } = req
  const { habitId } = req.params as { habitId: string }
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } })
  if (!habit) return res.status(404).json({ error: 'Habit not found' })
  const reminders = await prisma.reminder.findMany({ where: { habitId } })
  return res.json(reminders)
})

remindersRouter.post('/', validate(CreateReminderSchema), async (req, res) => {
  const { userId } = req
  const { habitId } = req.params as { habitId: string }
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } })
  if (!habit) return res.status(404).json({ error: 'Habit not found' })
  const reminder = await prisma.reminder.create({ data: { habitId, ...req.body } })
  return res.status(201).json(reminder)
})

remindersRouter.patch('/:reminderId', validate(UpdateReminderSchema), async (req, res) => {
  const { userId } = req
  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.reminderId, habit: { userId } },
  })
  if (!existing) return res.status(404).json({ error: 'Reminder not found' })
  const reminder = await prisma.reminder.update({ where: { id: req.params.reminderId }, data: req.body })
  return res.json(reminder)
})

remindersRouter.delete('/:reminderId', async (req, res) => {
  const { userId } = req
  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.reminderId, habit: { userId } },
  })
  if (!existing) return res.status(404).json({ error: 'Reminder not found' })
  await prisma.reminder.delete({ where: { id: req.params.reminderId } })
  return res.json({ message: 'Reminder deleted' })
})

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesRouter = Router()
categoriesRouter.use(authenticate)

categoriesRouter.get('/', async (req, res) => {
  const { userId } = req
  const categories = await prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } })
  return res.json(categories)
})

categoriesRouter.post('/', validate(CreateCategorySchema), async (req, res) => {
  const { userId } = req
  const category = await prisma.category.create({ data: { userId, ...req.body } })
  return res.status(201).json(category)
})

categoriesRouter.patch('/:id', validate(UpdateCategorySchema), async (req, res) => {
  const { userId } = req
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Category not found' })
  const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body })
  return res.json(category)
})

categoriesRouter.delete('/:id', async (req, res) => {
  const { userId } = req
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Category not found' })
  // Unlink habits (set categoryId to null via onDelete: SetNull in schema)
  await prisma.category.delete({ where: { id: req.params.id } })
  return res.json({ message: 'Category deleted' })
})

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersRouter = Router()
usersRouter.use(authenticate)

usersRouter.get('/me', async (req, res) => {
  const { userId } = req
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, timezone: true, avatarUrl: true, createdAt: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.json(user)
})

usersRouter.patch('/me', validate(UpdateUserSchema), async (req, res) => {
  const { userId } = req
  const user = await prisma.user.update({
    where: { id: userId },
    data: req.body,
    select: { id: true, email: true, username: true, timezone: true, avatarUrl: true },
  })
  return res.json(user)
})

usersRouter.delete('/me', async (req, res) => {
  const { userId } = req
  await prisma.user.delete({ where: { id: userId } })
  return res.json({ message: 'Account deleted' })
})

// ─── Partners ─────────────────────────────────────────────────────────────────

export const partnersRouter = Router()
partnersRouter.use(authenticate)

partnersRouter.get('/', async (req, res) => {
  const { userId } = req
  const partners = await prisma.accountabilityPartner.findMany({
    where: { OR: [{ userId }, { partnerId: userId }] },
    include: {
      user:    { select: { id: true, username: true, avatarUrl: true } },
      partner: { select: { id: true, username: true, avatarUrl: true } },
    },
  })
  // Normalise so the "partner" field is always the other person
  const result = partners.map((p) => ({
    id:       p.id,
    status:   p.status,
    invitedAt: p.invitedAt,
    acceptedAt: p.acceptedAt,
    partner: p.userId === userId ? p.partner : p.user,
  }))
  return res.json(result)
})

partnersRouter.post('/invite', validate(InvitePartnerSchema), async (req, res) => {
  const { userId } = req
  const target = await prisma.user.findUnique({ where: { email: req.body.email } })
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.id === userId) return res.status(400).json({ error: 'Cannot invite yourself' })

  const existing = await prisma.accountabilityPartner.findFirst({
    where: { OR: [{ userId, partnerId: target.id }, { userId: target.id, partnerId: userId }] },
  })
  if (existing) return res.status(409).json({ error: 'Invite already exists' })

  const invite = await prisma.accountabilityPartner.create({
    data: { userId, partnerId: target.id },
    select: { id: true, status: true, invitedAt: true },
  })
  return res.status(201).json(invite)
})

partnersRouter.patch('/:id/respond', validate(RespondPartnerSchema), async (req, res) => {
  const { userId } = req
  const existing = await prisma.accountabilityPartner.findFirst({
    where: { id: req.params.id, partnerId: userId },
  })
  if (!existing) return res.status(404).json({ error: 'Invite not found' })

  const status = req.body.action === 'accept' ? 'ACCEPTED' : 'DECLINED'
  const updated = await prisma.accountabilityPartner.update({
    where: { id: req.params.id },
    data: { status, acceptedAt: status === 'ACCEPTED' ? new Date() : null },
    select: { id: true, status: true },
  })
  return res.json(updated)
})

partnersRouter.delete('/:id', async (req, res) => {
  const { userId } = req
  const existing = await prisma.accountabilityPartner.findFirst({
    where: { id: req.params.id, OR: [{ userId }, { partnerId: userId }] },
  })
  if (!existing) return res.status(404).json({ error: 'Partner not found' })
  await prisma.accountabilityPartner.delete({ where: { id: req.params.id } })
  return res.json({ message: 'Partner removed' })
})
