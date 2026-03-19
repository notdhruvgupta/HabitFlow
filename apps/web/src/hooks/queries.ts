import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Habit, HabitLog, AnalyticsOverview, DaySnapshot } from '@habitflow/shared'
import type { CreateHabitInput, CreateLogInput, CreateCategoryInput } from '@habitflow/shared'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const keys = {
  habits:     ['habits']                          as const,
  habit:      (id: string) => ['habits', id]      as const,
  logs:       (habitId: string) => ['logs', habitId] as const,
  overview:   (date?: string) => ['analytics', 'overview', date] as const,
  heatmap:    (year: number)  => ['analytics', 'heatmap', year]  as const,
  habitStats: (id: string)    => ['analytics', 'habit', id]      as const,
  categories: ['categories']  as const,
  reminders:  (habitId: string) => ['reminders', habitId] as const,
  partners:   ['partners']    as const,
  me:         ['me']          as const,
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export function useHabits() {
  return useQuery({
    queryKey: keys.habits,
    queryFn:  () => api.get<Habit[]>('/habits').then((r) => r.data),
  })
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: keys.habit(id),
    queryFn:  () => api.get<Habit>(`/habits/${id}`).then((r) => r.data),
    enabled:  !!id,
  })
}

export function useCreateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHabitInput) => api.post<Habit>('/habits', data).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: keys.habits }),
  })
}

export function useUpdateHabit(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateHabitInput>) => api.put<Habit>(`/habits/${id}`, data).then((r) => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: keys.habits }); qc.invalidateQueries({ queryKey: keys.habit(id) }) },
  })
}

export function useArchiveHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      api.patch(`/habits/${id}/archive`, { isArchived }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits }),
  })
}

export function useDeleteHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: keys.habits }),
  })
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function useHabitLogs(habitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: [...keys.logs(habitId), from, to],
    queryFn:  () => api.get<HabitLog[]>(`/habits/${habitId}/logs`, { params: { from, to } }).then((r) => r.data),
    enabled:  !!habitId,
  })
}

export function useLogHabit(habitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLogInput) =>
      api.post(`/habits/${habitId}/logs`, data).then((r) => r.data),

    // Optimistic update — flip the checkbox immediately
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: keys.habits })
      const prev = qc.getQueryData<Habit[]>(keys.habits)

      qc.setQueryData<Habit[]>(keys.habits, (old) =>
        old?.map((h) =>
          h.id === habitId
            ? { ...h, todayCompleted: data.completed }
            : h,
        ) ?? [],
      )
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.habits, ctx.prev)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.habits })
      qc.invalidateQueries({ queryKey: keys.logs(habitId) })
      qc.invalidateQueries({ queryKey: keys.overview() })
    },
  })
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useAnalyticsOverview(date?: string) {
  return useQuery({
    queryKey: keys.overview(date),
    queryFn:  () => api.get<AnalyticsOverview>('/analytics/overview', { params: { date } }).then((r) => r.data),
  })
}

export function useHeatmap(year = new Date().getFullYear()) {
  return useQuery({
    queryKey: keys.heatmap(year),
    queryFn:  () => api.get<{ year: number; days: DaySnapshot[] }>('/analytics/heatmap', { params: { year } }).then((r) => r.data),
  })
}

export function useHabitAnalytics(id: string, from?: string, to?: string) {
  return useQuery({
    queryKey: [...keys.habitStats(id), from, to],
    queryFn:  () => api.get(`/analytics/habits/${id}`, { params: { from, to } }).then((r) => r.data),
    enabled:  !!id,
  })
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn:  () => api.get('/categories').then((r) => r.data),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => api.post('/categories', data).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: keys.categories }),
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateCategoryInput>) => api.patch(`/categories/${id}`, data).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: keys.categories }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: keys.categories }),
  })
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function useReminders(habitId: string) {
  return useQuery({
    queryKey: keys.reminders(habitId),
    queryFn:  () => api.get(`/habits/${habitId}/reminders`).then((r) => r.data),
    enabled:  !!habitId,
  })
}

export function useToggleReminder(habitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reminderId, isEnabled }: { reminderId: string; isEnabled: boolean }) =>
      api.patch(`/reminders/${reminderId}`, { isEnabled }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.reminders(habitId) }),
  })
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn:  () => api.get('/users/me').then((r) => r.data),
  })
}
