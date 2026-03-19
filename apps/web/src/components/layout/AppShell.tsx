import { Navigate, Outlet, useLocation, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useAnalyticsOverview } from '@/hooks/queries'

// ─── AuthGuard ────────────────────────────────────────────────────────────────

export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: HomeIcon  },
  { to: '/habits',     label: 'Habits',     icon: CheckIcon },
  { to: '/analytics',  label: 'Analytics',  icon: ChartIcon },
  { to: '/settings',   label: 'Settings',   icon: GearIcon  },
]

export function AppShell() {
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { data: overview } = useAnalyticsOverview()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden sm:flex w-[220px] shrink-0 border-r border-gray-100 bg-white flex-col py-6 px-3">
        {/* Logo */}
        <div className="px-3 mb-8">
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            habit<span className="text-brand-400">flow</span>
          </span>
        </div>

        {/* Streak pill */}
        {overview && (
          <div className="mx-3 mb-6 flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50">
            <FlameIcon />
            <span className="text-sm font-medium text-brand-600">{overview.longestStreak} day streak</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 pt-4 px-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-600">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={() => logout()} className="text-gray-400 hover:text-gray-600 transition-colors" title="Log out">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 sm:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex z-40">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-gray-400'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

// ─── Inline icons (no dependency) ────────────────────────────────────────────

function HomeIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg> }
function CheckIcon()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
function ChartIcon()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> }
function GearIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> }
function FlameIcon()  { return <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-5-5-10-5-10z" opacity={0.3}/><path d="M12 6c0 0-3 3-3 6a3 3 0 006 0c0-3-3-6-3-6z"/></svg> }
function LogoutIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> }
