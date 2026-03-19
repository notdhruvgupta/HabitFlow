import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateHabitSchema, type CreateHabitInput } from '@habitflow/shared'
import { useCreateHabit, useCategories } from '@/hooks/queries'
import { Modal, FormField, ColorPicker, DayPicker } from '@/components/ui'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'basics' | 'schedule' | 'style'
const STEPS: Step[] = ['basics', 'schedule', 'style']
const STEP_LABELS = { basics: 'Basics', schedule: 'Schedule', style: 'Style' }

export function NewHabitModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('basics')
  const createHabit     = useCreateHabit()
  const { data: categories } = useCategories()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<CreateHabitInput>({
    resolver: zodResolver(CreateHabitSchema),
    defaultValues: {
      title:       '',
      frequency:   'daily',
      targetDays:  [],
      targetCount: 1,
      color:       '#5DCAA5',
      icon:        'check',
    },
  })

  const frequency   = watch('frequency')
  const targetDays  = watch('targetDays') as string[]
  const color       = watch('color')

  function handleClose() {
    reset()
    setStep('basics')
    onClose()
  }

  const STEP_FIELDS: Record<Step, (keyof CreateHabitInput)[]> = {
    basics:   ['title', 'description', 'categoryId'],
    schedule: ['frequency', 'targetDays', 'targetCount'],
    style:    ['color', 'icon'],
  }

  async function onSubmit(data: CreateHabitInput) {
    if (step !== 'style') {
      const valid = await trigger(STEP_FIELDS[step])
      if (!valid) return
      setStep(STEPS[STEPS.indexOf(step) + 1])
      return
    }
    await createHabit.mutateAsync(data)
    handleClose()
  }

  const currentIdx = STEPS.indexOf(step)

  return (
    <Modal open={open} onClose={handleClose} title="New habit" size="md">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < currentIdx && setStep(s)}
              className={clsx(
                'flex items-center gap-1.5 text-xs font-medium transition-colors',
                s === step ? 'text-brand-600' : i < currentIdx ? 'text-gray-500 cursor-pointer hover:text-gray-700' : 'text-gray-300',
              )}
            >
              <span className={clsx(
                'w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold',
                s === step ? 'bg-brand-400 text-white' : i < currentIdx ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-300',
              )}>{i + 1}</span>
              {STEP_LABELS[s]}
            </button>
            {i < STEPS.length - 1 && <div className={clsx('flex-1 h-px w-6', i < currentIdx ? 'bg-gray-300' : 'bg-gray-100')} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basics */}
        {step === 'basics' && (
          <div className="flex flex-col gap-4">
            <FormField label="Habit name" error={errors.title?.message}>
              <input
                {...register('title')}
                autoFocus
                placeholder="e.g. Morning run"
                className="input"
              />
            </FormField>

            <FormField label="Description (optional)">
              <textarea
                {...register('description')}
                placeholder="What does this habit mean to you?"
                rows={2}
                className="input resize-none"
              />
            </FormField>

            <FormField label="Category">
              <select {...register('categoryId')} className="input">
                <option value="">No category</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 'schedule' && (
          <div className="flex flex-col gap-4">
            <FormField label="Frequency">
              <div className="flex gap-2">
                {(['daily', 'weekly', 'custom'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setValue('frequency', f)}
                    className={clsx(
                      'flex-1 py-2 rounded-xl text-sm font-medium border transition-all capitalize',
                      frequency === f
                        ? 'border-brand-400 bg-brand-50 text-brand-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </FormField>

            {(frequency === 'weekly' || frequency === 'custom') && (
              <FormField label="Target days">
                <DayPicker
                  value={targetDays}
                  onChange={(days) => setValue('targetDays', days as any)}
                />
              </FormField>
            )}

            <FormField label="Daily target" hint="How many times per day?">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setValue('targetCount', Math.max(1, (watch('targetCount') ?? 1) - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold"
                >−</button>
                <span className="text-lg font-semibold w-8 text-center">{watch('targetCount')}</span>
                <button
                  type="button"
                  onClick={() => setValue('targetCount', (watch('targetCount') ?? 1) + 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold"
                >+</button>
              </div>
            </FormField>
          </div>
        )}

        {/* Step 3: Style */}
        {step === 'style' && (
          <div className="flex flex-col gap-4">
            <FormField label="Colour">
              <ColorPicker value={color} onChange={(c) => setValue('color', c)} />
            </FormField>

            {/* Preview */}
            <div className="mt-2 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <p className="text-sm font-medium text-gray-900">{watch('title') || 'Your habit'}</p>
              <div className="ml-auto w-7 h-7 rounded-full border-2 border-gray-200" />
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button type="button" onClick={handleClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createHabit.isPending}
            className="btn-primary flex-1"
          >
            {step === 'style'
              ? createHabit.isPending ? 'Creating…' : 'Create habit'
              : 'Next →'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
