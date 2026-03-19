import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useMe, useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries'
import { api } from '@/lib/api'
import { FormField, ColorPicker } from '@/components/ui'
import type { CreateCategoryInput } from '@habitflow/shared'

export function SettingsPage() {
  const navigate = useNavigate()
  const logout   = useAuthStore((s) => s.logout)
  const { data: me, refetch } = useMe()

  const [username,  setUsername]  = useState(me?.username ?? '')
  const [timezone,  setTimezone]  = useState(me?.timezone ?? 'UTC')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  // Category state
  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [newName,     setNewName]     = useState('')
  const [newColor,    setNewColor]    = useState('#888780')
  const [showNewForm, setShowNewForm] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/users/me', { username, timezone })
      await refetch()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('This will permanently delete your account and all data. Are you sure?')) return
    setDeleting(true)
    try {
      await api.delete('/users/me')
      navigate('/login', { replace: true })
    } finally {
      setDeleting(false)
    }
  }

  const TZ_OPTIONS = [
    'UTC', 'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai',
    'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago',
    'America/Denver', 'America/Los_Angeles', 'Australia/Sydney',
  ]

  return (
    <div className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* Profile */}
      <section className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <FormField label="Email">
            <input className="input bg-gray-50 cursor-not-allowed" value={me?.email ?? ''} readOnly />
          </FormField>

          <FormField label="Username">
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              maxLength={32}
            />
          </FormField>

          <FormField label="Timezone">
            <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TZ_OPTIONS.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </FormField>

          <button type="submit" disabled={saving} className="btn-primary self-start px-6">
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Categories */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
          <button
            onClick={() => { setShowNewForm((v) => !v); setNewName(''); setNewColor('#888780') }}
            className="btn-ghost px-2 py-1 text-xs"
          >
            {showNewForm ? 'Cancel' : '+ New'}
          </button>
        </div>

        {showNewForm && (
          <div className="mb-4 p-3 rounded-xl border border-gray-100 flex flex-col gap-3">
            <FormField label="Name">
              <input
                className="input"
                placeholder="e.g. Health"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </FormField>
            <FormField label="Colour">
              <ColorPicker value={newColor} onChange={setNewColor} />
            </FormField>
            <button
              onClick={async () => {
                if (!newName.trim()) return
                await createCategory.mutateAsync({ name: newName.trim(), color: newColor } as CreateCategoryInput)
                setShowNewForm(false)
                setNewName('')
                setNewColor('#888780')
              }}
              disabled={createCategory.isPending || !newName.trim()}
              className="btn-primary self-start px-4"
            >
              {createCategory.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        )}

        {categories.length === 0 && !showNewForm ? (
          <p className="text-xs text-gray-400">No categories yet. Create one to organise your habits.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {categories.map((c: any) => (
              <CategoryRow
                key={c.id}
                category={c}
                editing={editingId === c.id}
                onEdit={() => setEditingId(c.id)}
                onDone={() => setEditingId(null)}
                onDelete={() => deleteCategory.mutate(c.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Account actions */}
      <section className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account</h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="btn-ghost self-start"
          >
            Log out
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="card border-red-100">
        <h2 className="text-sm font-semibold text-red-600 mb-2">Danger zone</h2>
        <p className="text-xs text-gray-400 mb-4">
          Deleting your account is permanent and cannot be undone. All habits, logs, and data will be erased.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger self-start"
        >
          {deleting ? 'Deleting…' : 'Delete account'}
        </button>
      </section>
    </div>
  )
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({
  category, editing, onEdit, onDone, onDelete,
}: {
  category: { id: string; name: string; color: string }
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onDelete: () => void
}) {
  const updateCategory = useUpdateCategory(category.id)
  const [name,  setName]  = useState(category.name)
  const [color, setColor] = useState(category.color)

  async function handleSave() {
    await updateCategory.mutateAsync({ name: name.trim(), color })
    onDone()
  }

  if (editing) {
    return (
      <div className="p-3 rounded-xl border border-brand-200 flex flex-col gap-3">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={updateCategory.isPending || !name.trim()} className="btn-primary px-4 text-xs">
            {updateCategory.isPending ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onDone} className="btn-ghost px-4 text-xs">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 group">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: category.color }} />
      <span className="flex-1 text-sm text-gray-800">{category.name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="btn-ghost px-2 py-1 text-xs">Edit</button>
        <button
          onClick={() => { if (confirm(`Delete "${category.name}"?`)) onDelete() }}
          className="btn-danger px-2 py-1 text-xs"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
