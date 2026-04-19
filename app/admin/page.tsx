import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase-server'

type VehicleWithClient = {
  plate_number: string
  car_model: string
  client_id: string
  clients: { full_name: string; phone: string } | null
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

function getClientBadge(count: number): { label: string; bg: string; color: string } {
  if (count >= 5) return { label: '⭐ Loyal', bg: '#FEF3C7', color: '#92400E' }
  if (count >= 2) return { label: '🔄 Regular', bg: '#DBEAFE', color: '#1E40AF' }
  return { label: '🆕 New', bg: '#DCFCE7', color: '#166534' }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalClients },
    { count: totalServices },
    { count: totalVehicles },
    { data: branches },
    { data: rawDueServices },
    { data: rawAllServices },
  ] = await Promise.all([
    admin.from('clients').select('*', { count: 'exact', head: true }),
    admin.from('services').select('*', { count: 'exact', head: true }),
    admin.from('vehicles').select('*', { count: 'exact', head: true }),
    admin.from('branches').select('*'),
    admin.from('services').select(`
      id, service_type, next_service_date, reminder_sent,
      vehicles ( plate_number, car_model, client_id, clients ( full_name, phone ) )
    `).lte('next_service_date', today).eq('reminder_sent', false).order('next_service_date', { ascending: true }).limit(10),
    admin.from('services').select('vehicle_id, vehicles(client_id)'),
  ])

  const dueServices = (rawDueServices ?? []) as unknown as DueService[]
  const allServices = (rawAllServices ?? []) as unknown as RawServiceVehicle[]

  // Count services per client
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: '12px', color: s.color, fontWeight: '500' }}>{s.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: '32px', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Client Classification */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>Client Classification</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ background: '#DCFCE7', borderRadius: '12px', padding: '1.25rem', border: '1px solid #BBF7D0' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#166534', fontWeight: '500' }}>🆕 New Clients</p>
            <p style={{ margin: '6px 0 4px', fontSize: '32px', fontWeight: '700', color: '#166534', lineHeight: 1 }}>{newClients}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#166534', opacity: 0.8 }}>1 service visit</p>
          </div>
          <div style={{ background: '#DBEAFE', borderRadius: '12px', padding: '1.25rem', border: '1px solid #BFDBFE' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', fontWeight: '500' }}>🔄 Regular Clients</p>
            <p style={{ margin: '6px 0 4px', fontSize: '32px', fontWeight: '700', color: '#1E40AF', lineHeight: 1 }}>{regularClients}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#1E40AF', opacity: 0.8 }}>2–4 service visits</p>
          </div>
          <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '1.25rem', border: '1px solid #FDE68A' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#92400E', fontWeight: '500' }}>⭐ Loyal Clients</p>
            <p style={{ margin: '6px 0 4px', fontSize: '32px', fontWeight: '700', color: '#92400E', lineHeight: 1 }}>{loyalClients}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#92400E', opacity: 0.8 }}>5+ service visits</p>
          </div>
        </div>
      </div>

      {/* Due Service Notifications */}
      <div style={{ marginBottom: '1.5rem' }}>
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
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Status</th>
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
                  <tr key={svc.id} style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                      {vehicle?.clients?.full_name ?? '—'}
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

      {/* Quick Links */}
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