'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarRange, ChefHat, X } from 'lucide-react'
import type { Member, MealSlot, WeekMealDay } from '@/lib/data'
import { updateWeekMeal } from './actions'

const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner']

const slotLabels: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

const slotTones: Record<MealSlot, string> = {
  breakfast: 'bg-gold-tint text-gold',
  lunch: 'bg-peach-tint text-peach',
  dinner: 'bg-mint-tint text-mint',
}

type Draft = { dish: string; responsibleId: string }
type Drafts = Record<MealSlot, Draft>

function emptyDrafts(day: WeekMealDay): Drafts {
  return {
    breakfast: { dish: day.meals.breakfast.dish ?? '', responsibleId: day.meals.breakfast.responsibleId ?? '' },
    lunch: { dish: day.meals.lunch.dish ?? '', responsibleId: day.meals.lunch.responsibleId ?? '' },
    dinner: { dish: day.meals.dinner.dish ?? '', responsibleId: day.meals.dinner.responsibleId ?? '' },
  }
}

export default function MealWeekPlanner({ week, members }: { week: WeekMealDay[]; members: Member[] }) {
  const [selectedIso, setSelectedIso] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Drafts | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const selectedDay = week.find((day) => day.iso === selectedIso) ?? null

  function openDay(day: WeekMealDay) {
    setDrafts(emptyDrafts(day))
    setSelectedIso(day.iso)
  }

  function closeEditor() {
    setSelectedIso(null)
    setDrafts(null)
  }

  function updateDraft(slot: MealSlot, patch: Partial<Draft>) {
    setDrafts((current) => (current ? { ...current, [slot]: { ...current[slot], ...patch } } : current))
  }

  function save() {
    if (!selectedIso || !drafts) return
    startTransition(async () => {
      for (const slot of slots) {
        await updateWeekMeal(selectedIso, slot, drafts[slot].dish, drafts[slot].responsibleId || null)
      }
      router.refresh()
      closeEditor()
    })
  }

  return (
    <section className="order-5 w-full max-w-full min-w-0 scroll-mt-6 xl:order-none rounded-[14px] border border-border bg-secondary p-2.5 sm:rounded-[24px] sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-foreground">Meal plan</p>
          <h2 className="mt-1 font-serif text-[21px] font-semibold sm:text-[24px]">Meal plan for the week</h2>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl bg-secondary/60 text-secondary-foreground">
          <CalendarRange className="size-[18px]" />
        </div>
      </div>

      <div className="mt-4 min-w-0 overflow-hidden pb-1 sm:mt-5">
        <div className="grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-2">
          {week.map((day) => {
            const plannedCount = slots.filter((slot) => day.meals[slot].dish).length
            return (
              <button
                key={day.iso}
                onClick={() => openDay(day)}
                className={`min-w-0 rounded-xl border p-1 text-center transition sm:rounded-2xl sm:p-3 ${
                  day.isToday
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-mint'
                }`}
              >
                <div className="truncate text-[8px] font-bold tracking-wide opacity-70 sm:text-[10px]">{day.day}</div>
                <div className="mt-1 text-base font-semibold sm:text-xl">{day.date}</div>
                <div
                  className={`mx-auto mt-2 size-1.5 rounded-full ${
                    plannedCount === 0 ? 'bg-transparent' : day.isToday ? 'bg-gold' : 'bg-mint'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && drafts && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">
              Meals for {selectedDay.day} {selectedDay.date}
            </p>
            <button onClick={closeEditor} className="rounded-lg p-1 text-secondary-foreground hover:bg-muted" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {slots.map((slot) => (
              <div key={slot} className="flex items-center gap-2 rounded-xl bg-muted p-2.5 sm:gap-3">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${slotTones[slot]}`}>
                  <ChefHat className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="sr-only" htmlFor={`${selectedDay.iso}-${slot}-dish`}>
                    {slotLabels[slot]} dish
                  </label>
                  <input
                    id={`${selectedDay.iso}-${slot}-dish`}
                    value={drafts[slot].dish}
                    onChange={(e) => updateDraft(slot, { dish: e.target.value })}
                    placeholder={`${slotLabels[slot]} plan`}
                    className="h-10 w-full min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-success"
                  />
                  <select
                    aria-label={`Assign ${slotLabels[slot]}`}
                    value={drafts[slot].responsibleId}
                    onChange={(e) => updateDraft(slot, { responsibleId: e.target.value })}
                    className="h-10 shrink-0 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-success sm:w-36"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={closeEditor} className="rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              Save meal plan
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
