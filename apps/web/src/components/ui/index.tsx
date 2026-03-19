import { useEffect, useRef } from 'react'
import clsx from 'clsx'

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const maxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className={clsx('w-full bg-white rounded-2xl shadow-xl animate-slide-up', maxW)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return (
    <svg className={clsx(s, 'animate-spin text-brand-400')} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({
  label, error, children, hint,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint  && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── ColorPicker ─────────────────────────────────────────────────────────────

const COLORS = [
  '#5DCAA5', '#1D9E75', '#7F77DD', '#D4537E',
  '#F0997B', '#EF9F27', '#378ADD', '#639922',
  '#E24B4A', '#888780',
]

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={clsx(
            'w-7 h-7 rounded-full transition-all duration-100',
            value === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105',
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

// ─── DayPicker ────────────────────────────────────────────────────────────────

const ALL_DAYS = ['mon','tue','wed','thu','fri','sat','sun'] as const
const DAY_LABELS: Record<string, string> = { mon:'M', tue:'T', wed:'W', thu:'T', fri:'F', sat:'S', sun:'S' }

export function DayPicker({ value, onChange }: { value: string[]; onChange: (d: string[]) => void }) {
  function toggle(day: string) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }
  return (
    <div className="flex gap-1.5">
      {ALL_DAYS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => toggle(d)}
          className={clsx(
            'w-8 h-8 rounded-full text-xs font-medium transition-all',
            value.includes(d)
              ? 'bg-brand-400 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
          )}
        >
          {DAY_LABELS[d]}
        </button>
      ))}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: { value: T; label: string }[]
  active: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            active === value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
