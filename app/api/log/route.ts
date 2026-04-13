import { createClient } from '../../../lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { action, entity_type, entity_name } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      entity_type,
      entity_name
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Log error:', e)
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}