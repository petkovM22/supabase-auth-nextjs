'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(
  formData: FormData
): Promise<{ error: string } | { info: string } | never> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error('[signUp] Supabase error:', error.message)
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('user already exists')) {
      return { error: 'An account with this email already exists' }
    }
    if (msg.includes('rate limit')) {
      return { error: 'Too many sign-up attempts — please wait a few minutes and try again.' }
    }
    return { error: 'Something went wrong, please try again' }
  }

  // If email confirmation is enabled in Supabase, session will be null.
  // Return an info message (not an error) so the UI can display it appropriately.
  if (!data.session) {
    return { info: 'Account created! Check your email and click the confirmation link to log in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(
  formData: FormData
): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
