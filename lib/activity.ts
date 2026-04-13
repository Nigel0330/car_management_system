import { createClient } from './supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'

type Action = 'created' | 'edited' | 'deleted' | 'logged_in' | 'logged_out'
type EntityType = 'client' | 'service' | 'user' | 'session'

export async function logActivity(
  action: Action,
  entityType: EntityType,
  entityName: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    await admin.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      user_role: userData?.role ?? 'unknown',
      action,
      entity_type: entityType,
      entity_name: entityName
    })
  } catch (e) {
    console.error('Failed to log activity:', e)
  }
}