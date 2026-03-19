// ─── Domain Types ─────────────────────────────────────────────────────────────

export type Frequency = 'daily' | 'weekly' | 'custom'
export type Channel   = 'push' | 'email' | 'sms'
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type PartnerStatus = 'pending' | 'accepted' | 'declined'

export interface User {
  id: string
  email: string
  username: string
  timezone: string
  avatarUrl?: string
  createdAt: string
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export interface Habit {
  id: string
  userId: string
  categoryId?: string
  title: string
  description?: string
  frequency: Frequency
  targetDays: DayOfWeek[]
  targetCount: number
  color: string
  icon: string
  isArchived: boolean
  startDate: string
  createdAt: string
  updatedAt: string
  // Joined fields
  streak?: Streak
  todayCompleted?: boolean
  category?: Category
}

export interface HabitLog {
  id: string
  habitId: string
  userId: string
  loggedDate: string   // ISO date string "2026-03-19"
  completed: boolean
  value: number
  note?: string
  createdAt: string
}

export interface Streak {
  id: string
  habitId: string
  currentStreak: number
  longestStreak: number
  lastCompletedDate?: string
  streakStartDate?: string
  updatedAt: string
}

export interface Reminder {
  id: string
  habitId: string
  time: string          // "07:30"
  days: DayOfWeek[]
  isEnabled: boolean
  channel: Channel
  createdAt: string
}

export interface AnalyticsSnapshot {
  id: string
  userId: string
  habitId: string
  snapshotDate: string
  completionCount: number
  completionRate: number
  totalDays: number
  createdAt: string
}

export interface AnalyticsOverview {
  totalHabits: number
  completedToday: number
  longestStreak: number
  weeklyRate: number
}

export interface DaySnapshot {
  date: string
  completedCount: number
  totalCount: number
}

export interface AccountabilityPartner {
  id: string
  userId: string
  partnerId: string
  status: PartnerStatus
  partner: Pick<User, 'id' | 'username' | 'avatarUrl'>
  invitedAt: string
  acceptedAt?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser extends User {
  accessToken: string
}
