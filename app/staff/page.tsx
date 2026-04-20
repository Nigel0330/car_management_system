import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'

type VehicleWithClient = {
  plate_number: string
  car_model: string
  client_id: string
  clients: { full_name: string } | null
}

type DueService = {
  id: string
  service_type: string
  next_service_date: string
  reminder_sent: boolean
  vehicles: VehicleWithClient | null
}

type RawServiceVehicle = {
  vehicle_id: string
  vehicles: { client_id: string } | null
}

function getClientBadge(count: number): { label: string; bg: string; color: string; isNew: boolean } {
  if (count >= 5) return { label: '⭐ Loyal', bg: '#FEF3C7', color: '#92400E', isNew: false }
  if (count >= 2) return { label: '🔄 Regular', bg: '#DBEAFE', color: '#1E40AF', isNew: false }
  return { label: '🆕 New', bg: '#DCFCE7', color: '#166534', isNew: true }
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

  const [
    { count: totalClients },
    { data: rawDueServices },
    { data: rawAllServices },
  ] = await Promise.all([
    admin.from('clients').select('*', { count: 'exact', head: true }),
    admin.from('services').select(`
      id, service_type, next_service_date, reminder_sent,
      vehicles ( plate_number, car_model, client_id, clients ( full_name ) )
    `).lte('next_service_date', today).eq('reminder_sent', false).order('next_service_date', { ascending: true }),
    admin.from('services').select('vehicle_id, vehicles(client_id)'),
  ])

  const dueServices = (rawDueServices ?? []) as unknown as DueService[]
  const allServices = (rawAllServices ?? []) as unknown as RawServiceVehicle[]

  const clientServiceCounts: Record<string, number> = {}
  allServices.forEach(svc => {
    const clientId = svc.vehicles?.client_id
    if (clientId) {
      clientServiceCounts[clientId] = (clientServiceCounts[clientId] || 0) + 1
    }
  })

  const counts = Object.values(clientServiceCounts)
  const newClients = counts.filter(c => c === 1).length
  const regularClients = counts.filter(c => c >= 2 && c <= 4).length
  const loyalClients = counts.filter(c => c >= 5).length

  const priorityDueClients = dueServices.filter(svc => {
    const clientId = svc.vehicles?.client_id ?? ''
    const count = clientServiceCounts[clientId] ?? 1
    return count === 1
  })

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Staff Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Welcome, {user.email}</p>
      </div>

      {/* Priority Alert Banner */}
      {priorityDueClients.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🚨</span>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#991B1B' }}>
              {priorityDueClients.length} priority new client{priorityDueClients.length > 1 ? 's' : ''} with due service!
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#B91C1C' }}>
              New clients are visiting for the first time — give them priority attention to build loyalty.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280' }}>Total Clients</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#1C3A5E' }}>{totalClients ?? 0}</p>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280' }}>Due / Overdue Services</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: dueServices.length > 0 ? '#dc2626' : '#1C3A5E' }}>
            {dueServices.length}
          </p>
        </div>
      </div>

      {/* Client Classification */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>Client Classification</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: '#DCFCE7', borderRadius: '12px', padding: '1.25rem', border: '1px solid #BBF7D0' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#166534', fontWeight: '500' }}>🆕 New Clients</p>
            <p style={{ margin: '6px 0 4px', fontSize: '28px', fontWeight: '600', color: '#166534', lineHeight: 1 }}>{newClients}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#166534', opacity: 0.8 }}>1 service visit · priority</p>
          </div>
          <div style={{ background: '#DBEAFE', borderRadius: '12px', padding: '1.25rem', border: '1px solid #BFDBFE' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', fontWeight: '500' }}>🔄 Regular Clients</p>
            <p style={{ margin: '6px 0 4px', fontSize: '28px', fontWeight: '600', color: '#1E40AF', lineHeight: 1 }}>{regularClients}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#1E40AF', opacity: 0.8 }}>2–4 service visits</p>
          </div>
          <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '1.25rem', border: '1px solid #FDE68A' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#92400E', fontWeight: '500' }}>⭐ Loyal Clients</p>
            <p style={{ margin: '6px 0 4px', fontSize: '28px', fontWeight: '600', color: '#92400E', lineHeight: 1 }}>{loyalClients}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#92400E', opacity: 0.8 }}>5+ service visits</p>
          </div>
        </div>
      </div>

      {/* Due Service Notifications */}
      <div>
        <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>
          Due & Overdue Services
          {dueServices.length > 0 && (
            <span style={{ marginLeft: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: '500' }}>
              {dueServices.length} pending
            </span>
          )}
        </h2>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Client</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Classification</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Vehicle</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Service</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {dueServices.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
                    No due or overdue services 🎉
                  </td>
                </tr>
              ) : dueServices.map((svc, i) => {
                const vehicle = svc.vehicles
                const isLast = i === dueServices.length - 1
                const isOverdue = new Date(svc.next_service_date) < new Date()
                const clientId = vehicle?.client_id ?? ''
                const serviceCount = clientServiceCounts[clientId] ?? 1
                const badge = getClientBadge(serviceCount)

                return (
                  <tr key={svc.id} style={{
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    background: badge.isNew ? '#FFF7F7' : 'white',
                  }}>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                      {vehicle?.clients?.full_name ?? '—'}
                      {badge.isNew && (
                        <span style={{ marginLeft: '8px', background: '#DC2626', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '99px', fontWeight: '600' }}>
                          PRIORITY
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '500' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {vehicle?.car_model} ({vehicle?.plate_number})
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{svc.service_type}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: isOverdue ? '#dc2626' : '#d97706', fontWeight: '500' }}>
                        {new Date(svc.next_service_date).toLocaleDateString('en-PH')}
                        {isOverdue ? ' ⚠️ Overdue' : ' 🔔 Due'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}