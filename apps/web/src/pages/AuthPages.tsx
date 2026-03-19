import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

// ─── Login ────────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login    = useAuthStore((s) => s.login)
  const from     = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email" required autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input
            type="password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-500">
          No account?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate  = useNavigate()
  const register  = useAuthStore((s) => s.register)

  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, username, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start building better habits today">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input
            type="text" required autoFocus minLength={2} maxLength={32}
            value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input
            type="password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="at least 8 characters"
            className="input"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5">
          {loading ? 'Creating account…' : 'Get started'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-semibold text-gray-900 tracking-tight">
            habit<span className="text-brand-400">flow</span>
          </span>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  )
}
