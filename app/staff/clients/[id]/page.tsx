import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Service = {
  id: string
  service_type: string
  service_date: string
  next_service_date: string | null
  notes: string | null
  vehicle_id: string
  vehicles: {
    plate_number: string
    car_model: string
  } | null
}

type Vehicle = {
  id: string
  car_model: string
  plate_number: string
  client_id: string
}

type Client = {
  id: string
  full_name: string
  email: string | null
  address: string
  phone: string
  branch_id: string
  created_at: string
}

export default async function StaffClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) redirect('/staff/clients')

  const { data: vehicles } = await admin
    .from('vehicles')
    .select('*')
    .eq('client_id', id)

  const { data: services } = await admin
    .from('services')
    .select('*, vehicles(plate_number, car_model)')
    .in('vehicle_id', (vehicles ?? []).map((v: Vehicle) => v.id))
    .order('service_date', { ascending: false })

  const typedClient = client as Client
  const typedVehicles = (vehicles ?? []) as Vehicle[]
  const typedServices = (services ?? []) as Service[]

  // Check if staff can edit this client (created by them within 24h)
  const now = new Date().getTime()
  const canEdit =
    client.created_by === user.id &&
    new Date(client.created_at).getTime() > now - 86400000

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/staff/clients" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>
          ← Back to Clients
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          {canEdit && (
            <Link
              href={`/staff/clients/${id}/edit`}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #1C3A5E', color: '#1C3A5E', fontSize: '13px', textDecoration: 'none' }}
            >
              Edit Client
            </Link>
          )}
          <Link
            href={`/staff/clients/${id}/service/new`}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#1C3A5E', color: 'white', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}
          >
            + Log Service
          </Link>
        </div>
      </div>

      {/* Client Info */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '20px' }}>{typedClient.full_name}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#6b7280' }}>Phone</span>
            <p style={{ margin: '2px 0 0', color: '#111827', fontWeight: '500' }}>{typedClient.phone || '—'}</p>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Email</span>
            <p style={{ margin: '2px 0 0', color: '#111827', fontWeight: '500' }}>{typedClient.email || '—'}</p>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Address</span>
            <p style={{ margin: '2px 0 0', color: '#111827', fontWeight: '500' }}>{typedClient.address || '—'}</p>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Date Registered</span>
            <p style={{ margin: '2px 0 0', color: '#111827', fontWeight: '500' }}>
              {new Date(typedClient.created_at).toLocaleDateString('en-PH')}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>Vehicles</h2>
        {typedVehicles.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No vehicles on record.</p>
        ) : typedVehicles.map(v => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
            <span style={{ fontWeight: '500', color: '#111827' }}>{v.car_model}</span>
            <span style={{ color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: '99px' }}>{v.plate_number}</span>
          </div>
        ))}
      </div>

      {/* Service History */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>Service History</h2>
        {typedServices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No services logged yet.</p>
            <Link href={`/staff/clients/${id}/service/new`} style={{ display: 'inline-block', marginTop: '8px', color: '#1C3A5E', fontSize: '13px' }}>
              Log the first service →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 0', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Service</th>
                <th style={{ padding: '8px 0', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Vehicle</th>
                <th style={{ padding: '8px 0', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '8px 0', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Next Service</th>
              </tr>
            </thead>
            <tbody>
              {typedServices.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < typedServices.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '10px 0', color: '#111827', fontWeight: '500' }}>{s.service_type}</td>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>{s.vehicles?.plate_number}</td>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>
                    {s.service_date ? new Date(s.service_date).toLocaleDateString('en-PH') : '—'}
                  </td>
                  <td style={{ padding: '10px 0', color: s.next_service_date ? '#059669' : '#6b7280' }}>
                    {s.next_service_date ? new Date(s.next_service_date).toLocaleDateString('en-PH') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}