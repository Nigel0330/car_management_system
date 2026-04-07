import { createClient } from '../../lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1C3A5E', padding: '0 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>CarShop Admin</span>
            <a href="/admin" style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none' }}>Dashboard</a>
            <a href="/admin/clients" style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none' }}>All Clients</a>
            <a href="/admin/staff" style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none' }}>Staff</a>
          </div>
          <a href="/dashboard" style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {children}
      </div>
    </div>
  )
}