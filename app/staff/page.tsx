import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'

type Vehicle = {
  plate_number: string
  car_model: string
  clients: { full_name: string } | null
}

type Service = {
  id: string
  service_type: string
  next_service_date: string
  vehicles: unknown
}

export default async function StaffDashboard() {
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

  if (userData?.role !== 'staff') redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const { data: todayServices } = await admin
    .from('services')
    .select(`
      id, service_type, next_service_date,
      vehicles ( plate_number, car_model, clients ( full_name ) )
    `)
    .lte('next_service_date', today)
    .eq('reminder_sent', false)
    .order('next_service_date', { ascending: true })

  const { count: totalClients } = await admin
    .from('clients')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Staff Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Welcome, {user.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280' }}>Total Clients</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#1C3A5E' }}>{totalClients ?? 0}</p>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280' }}>Due / Overdue Services</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: (todayServices?.length ?? 0) > 0 ? '#dc2626' : '#1C3A5E' }}>
            {todayServices?.length ?? 0}
          </p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#1C3A5E' }}>Due & Overdue Services</h2>
          <a href="/staff/services" style={{ fontSize: '12px', color: '#1C3A5E', textDecoration: 'none' }}>View all →</a>
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
            {(todayServices?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
                  No due services today
                </td>
              </tr>
            ) : (todayServices ?? []).map((svc, i) => {
              const vehicle = (svc as Service).vehicles as unknown as Vehicle | null
              return (
                <tr key={svc.id} style={{ borderBottom: i < (todayServices?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '10px 16px', color: '#111827' }}>{vehicle?.clients?.full_name ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{vehicle?.car_model} ({vehicle?.plate_number})</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{svc.service_type}</td>
                  <td style={{ padding: '10px 16px', color: '#dc2626', fontWeight: '500' }}>
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