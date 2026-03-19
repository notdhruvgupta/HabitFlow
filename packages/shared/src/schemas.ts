import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email:    z.string().email(),
  username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(72),
  timezone: z.string().default('UTC'),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

// ─── Habits ───────────────────────────────────────────────────────────────────

const DayOfWeek = z.enum(['mon','tue','wed','thu','fri','sat','sun'])
const Frequency  = z.enum(['daily','weekly','custom'])

export const CreateHabitSchema = z.object({
  title:       z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  frequency:   Frequency.default('daily'),
  targetDays:  z.array(DayOfWeek).default([]),
  targetCount: z.number().int().min(1).default(1),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#5DCAA5'),
  icon:        z.string().default('check'),
  categoryId:  z.string().uuid().optional(),
  startDate:   z.string().datetime().optional(),
})

export const UpdateHabitSchema = CreateHabitSchema.partial()

export const ArchiveHabitSchema = z.object({
  isArchived: z.boolean(),
})

// ─── Habit Logs ───────────────────────────────────────────────────────────────

export const CreateLogSchema = z.object({
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed:  z.boolean().default(true),
  value:      z.number().int().min(0).default(1),
  note:       z.string().max(500).optional(),
})

export const UpdateLogSchema = z.object({
  note:  z.string().max(500).optional(),
  value: z.number().int().min(0).optional(),
})

// ─── Reminders ────────────────────────────────────────────────────────────────

export const CreateReminderSchema = z.object({
  time:    z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  days:    z.array(DayOfWeek).min(1),
  channel: z.enum(['push','email','sms']).default('push'),
})

export const UpdateReminderSchema = z.object({
  time:      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  days:      z.array(DayOfWeek).optional(),
  isEnabled: z.boolean().optional(),
})

// ─── Categories ───────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name:  z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#888780'),
  icon:  z.string().default('folder'),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

// ─── User ─────────────────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  username:  z.string().min(2).max(32).optional(),
  timezone:  z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

// ─── Partners ─────────────────────────────────────────────────────────────────

export const InvitePartnerSchema = z.object({
  email: z.string().email(),
})

export const RespondPartnerSchema = z.object({
  action: z.enum(['accept','decline']),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterInput       = z.infer<typeof RegisterSchema>
export type LoginInput          = z.infer<typeof LoginSchema>
export type CreateHabitInput    = z.infer<typeof CreateHabitSchema>
export type UpdateHabitInput    = z.infer<typeof UpdateHabitSchema>
export type CreateLogInput      = z.infer<typeof CreateLogSchema>
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
