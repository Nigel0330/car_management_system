import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import DeleteClientButton from './DeleteClientButton'
import SearchClients from '../../../components/SearchClients'

type Client = {
  id: string
  full_name: string
  phone: string
  address: string
  branch_id: string
  created_at: string
}

type Branch = {
  id: string
  name: string
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ plate?: string }>
}) {
  const { plate } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let clients: Client[] = []

  if (plate && plate.trim() !== '') {
    const { data: matchedVehicles } = await admin
      .from('vehicles')
      .select('client_id')
      .ilike('plate_number', `%${plate.trim()}%`)

    const clientIds = (matchedVehicles ?? []).map((v: { client_id: string }) => v.client_id)

    if (clientIds.length > 0) {
      const { data } = await admin
        .from('clients')
        .select('*')
        .in('id', clientIds)
        .order('created_at', { ascending: false })
      clients = (data as Client[]) ?? []
    }
  } else {
    const { data } = await admin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    clients = (data as Client[]) ?? []
  }

  const { data: branches } = await admin.from('branches').select('*')

  const branchMap = Object.fromEntries(
    (branches as Branch[] ?? []).map(b => [b.id, b.name])
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>All Clients</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          {clients.length} {plate ? `result${clients.length !== 1 ? 's' : ''} for "${plate}"` : 'total clients across all branches'}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <SearchClients plate={plate} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Phone</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Branch</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Date Added</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
                  {plate ? `No clients found with plate matching "${plate}"` : 'No clients yet'}
                </td>
              </tr>
            ) : clients.map((client, i) => (
              <tr key={client.id} style={{ borderBottom: i < clients.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{client.full_name}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{client.phone}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#EFF6FF', color: '#1C3A5E', padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500' }}>
                    {branchMap[client.branch_id] ?? 'Unknown'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {new Date(client.created_at).toLocaleDateString('en-PH')}
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <a href={`/dashboard/clients/${client.id}`} style={{ color: '#1C3A5E', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
                    View
                  </a>
                  <DeleteClientButton clientId={client.id} clientName={client.full_name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}