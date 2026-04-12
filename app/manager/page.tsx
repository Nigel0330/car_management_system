import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ManagerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userData } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'manager') redirect('/login')

  const [{ count: clientCount }, { count: serviceCount }, { data: recentServices }] = await Promise.all([
    admin.from('clients').select('*', { count: 'exact', head: true }),
    admin.from('services').select('*', { count: 'exact', head: true }),
    admin.from('services').select(`
      id, service_type, next_service_date, reminder_sent,
      vehicles ( plate_number, car_model, clients ( full_name ) )
    `).order('created_at', { ascending: false }).limit(5)
  ])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Manager Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Welcome back, {user.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '2rem' }}>
        {[
          { label: 'Total Clients', value: clientCount ?? 0 },
          { label: 'Total Services', value: serviceCount ?? 0 },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#1C3A5E' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#1C3A5E' }}>Recent Services</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Client</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Vehicle</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Service</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {(recentServices ?? []).map((svc, i) => {
              const vehicle = svc.vehicles as unknown as {
                plate_number: string
                car_model: string
                clients: { full_name: string } | null
              } | null
              return (
                <tr key={svc.id} style={{ borderBottom: i < (recentServices?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '10px 16px', color: '#111827' }}>{vehicle?.clients?.full_name ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{vehicle?.car_model} ({vehicle?.plate_number})</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{svc.service_type}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>
                    {new Date(svc.next_service_date).toLocaleDateString('en-PH')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}