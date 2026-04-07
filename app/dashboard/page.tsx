import { createClient } from '../../lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

type Branch = {
  id: string
  name: string
  address: string
  phone: string
  created_at: string
}

export default async function Dashboard() {
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

  const { data: branches } = await admin
    .from('branches')
    .select('*')

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <div style={{ background: '#1C3A5E', color: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>CarShop Dashboard</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>
            Logged in as: {user.email} &nbsp;|&nbsp; Role: <strong>{profile?.role?.toUpperCase()}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <a href="/dashboard/clients" style={{ padding: '10px 20px', background: 'white', color: '#1C3A5E', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '500', border: '1px solid #e5e7eb' }}>
            Clients →
          </a>
          {profile?.role === 'owner' && (
            <a href="/admin" style={{ padding: '10px 20px', background: '#1C3A5E', color: 'white', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
              Admin Panel →
            </a>
          )}
        </div>

        <h2 style={{ color: '#1C3A5E', marginBottom: '1rem' }}>Branches</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          {(branches as Branch[])?.map((branch) => (
            <div key={branch.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 4px', color: '#1C3A5E' }}>{branch.name}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{branch.address}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}