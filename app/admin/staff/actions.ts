'use server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { logActivity } from '../../../lib/activity'

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError || !authUser.user) {
    return { error: authError?.message ?? 'Failed to create user' }
  }

  const { error: dbError } = await admin.from('users').insert({
    id: authUser.user.id,
    email,
    role
  })

  if (dbError) {
    return { error: dbError.message }
  }

  await logActivity('created', 'user', `${email} (${role})`)

  revalidatePath('/admin/staff')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userData } = await admin
    .from('users')
    .select('email, role')
    .eq('id', userId)
    .single()

  await admin.from('users').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)

  await logActivity('deleted', 'user', `${userData?.email} (${userData?.role})`)

  revalidatePath('/admin/staff')
  return { success: true }
}