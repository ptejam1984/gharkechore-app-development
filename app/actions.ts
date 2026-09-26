'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { iso, londonToday } from '@/lib/data'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user }
}

export async function toggleOccurrence(occurrenceId: string, done: boolean) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('chore_occurrences')
    .update({
      status: done ? 'done' : 'open',
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? user.id : null,
    })
    .eq('id', occurrenceId)
  revalidatePath('/')
}

export async function addOneOffChore(title: string) {
  const clean = title.trim()
  if (!clean) return
  const { supabase, user } = await requireUser()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return

  const { data: template } = await supabase
    .from('chore_templates')
    .insert({
      title: clean,
      frequency: 'on_demand',
      active: true,
      configuration_complete: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (template) {
    await supabase.from('chore_occurrences').insert({
      template_id: template.id,
      assigned_to: user.id,
      occurrence_date: iso(londonToday()),
    })
  }
  revalidatePath('/')
}

export async function addShoppingItem(label: string, quantity?: string) {
  const clean = label.trim()
  if (!clean) return
  const { supabase, user } = await requireUser()
  await supabase.from('shopping_items').insert({
    label: clean,
    quantity: quantity?.trim() || null,
    added_by: user.id,
  })
  revalidatePath('/')
}

export async function toggleShoppingItem(id: string, purchased: boolean) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('shopping_items')
    .update({ purchased, purchased_by: purchased ? user.id : null })
    .eq('id', id)
  revalidatePath('/')
}

export async function removeShoppingItem(id: string) {
  const { supabase } = await requireUser()
  await supabase.from('shopping_items').delete().eq('id', id)
  revalidatePath('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
