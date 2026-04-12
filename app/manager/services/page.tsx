import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
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
  reminder_sent: boolean
  vehicles: unknown
}

export default async function ManagerServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: services } = await admin
    .from('services')
    .select(`
      id, service_type, next_service_date, reminder_sent,
      vehicles ( plate_number, car_model, clients ( full_name ) )
    `)
    .order('next_service_date', { ascending: true })

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>All Services</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          {services?.length ?? 0} total services
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Client</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Vehicle</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Service Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Due Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Reminder</th>
            </tr>
          </thead>
          <tbody>
            {(services ?? []).map((svc, i) => {
              const vehicle = (svc as Service).vehicles as unknown as Vehicle | null
              const isOverdue = new Date(svc.next_service_date) < new Date()
              return (
                <tr key={svc.id} style={{ borderBottom: i < (services?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                    {vehicle?.clients?.full_name ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {vehicle?.car_model} ({vehicle?.plate_number})
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{svc.service_type}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? '500' : '400' }}>
                      {new Date(svc.next_service_date).toLocaleDateString('en-PH')}
                      {isOverdue && ' ⚠️'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: svc.reminder_sent ? '#dcfce7' : '#fef9c3', color: svc.reminder_sent ? '#166534' : '#854d0e', padding: '2px 10px', borderRadius: '99px', fontSize: '12px' }}>
                      {svc.reminder_sent ? 'Sent' : 'Pending'}
                    </span>
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