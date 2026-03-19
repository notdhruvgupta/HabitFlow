import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthGuard, AppShell } from '@/components/layout/AppShell'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import { DashboardPage } from '@/pages/DashboardPage'
import { HabitsPage } from '@/pages/OtherPages'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage }  from '@/pages/SettingsPage'
import { HabitDetailPage } from '@/pages/HabitDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60_000,       // 1 min
      retry:              1,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<AuthGuard />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/habits"        element={<HabitsPage />} />
              <Route path="/habits/:id"   element={<HabitDetailPage />} />
              <Route path="/analytics"  element={<AnalyticsPage />} />
              <Route path="/settings"   element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
