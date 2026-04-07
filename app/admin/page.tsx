import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase-server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ count: totalClients }, { count: totalServices }, { count: totalVehicles }, { data: branches }] = await Promise.all([
    admin.from('clients').select('*', { count: 'exact', head: true }),
    admin.from('services').select('*', { count: 'exact', head: true }),
    admin.from('vehicles').select('*', { count: 'exact', head: true }),
    admin.from('branches').select('*'),
  ])

  const stats = [
    { label: 'Total Clients', value: totalClients ?? 0, color: '#1C3A5E', bg: '#EFF6FF' },
    { label: 'Total Vehicles', value: totalVehicles ?? 0, color: '#0F766E', bg: '#F0FDFA' },
    { label: 'Total Services', value: totalServices ?? 0, color: '#B45309', bg: '#FFFBEB' },
    { label: 'Branches', value: branches?.length ?? 0, color: '#6D28D9', bg: '#F5F3FF' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Admin Overview</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          Logged in as owner: {user?.email}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: '12px', color: s.color, fontWeight: '500' }}>{s.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: '32px', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <a href="/admin/clients" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem', textDecoration: 'none', display: 'block' }}>
          <h2 style={{ margin: '0 0 4px', color: '#1C3A5E', fontSize: '15px' }}>Manage Clients</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>View all clients from both branches, delete records</p>
        </a>
        <a href="/admin/staff" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem', textDecoration: 'none', display: 'block' }}>
          <h2 style={{ margin: '0 0 4px', color: '#1C3A5E', fontSize: '15px' }}>Manage Staff</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Create staff accounts, assign branches, manage access</p>
        </a>
      </div>
    </div>
  )
}