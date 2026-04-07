import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../../lib/supabase-server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') return redirect('/dashboard')

  const formData = await request.formData()
  const clientId = formData.get('clientId') as string

  await admin.from('clients').delete().eq('id', clientId)

  return redirect('/admin/clients')
}