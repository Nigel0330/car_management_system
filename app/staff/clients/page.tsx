import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import SearchClients from './SearchClients'

type Client = {
  id: string
  full_name: string
  phone: string
  branch_id: string
  created_at: string
}

type Branch = {
  id: string
  name: string
}

export default async function ManagerClientsPage({
  searchParams
}: {
  searchParams: { plate?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: branches } = await admin.from('branches').select('*')
  const branchMap = Object.fromEntries(
    (branches as Branch[] ?? []).map(b => [b.id, b.name])
  )

  let clientsQuery = admin
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.plate) {
    const { data: vehicles } = await admin
      .from('vehicles')
      .select('client_id')
      .ilike('plate_number', `%${searchParams.plate}%`)
    const clientIds = (vehicles ?? []).map((v: { client_id: string }) => v.client_id)
    if (clientIds.length > 0) {
      clientsQuery = clientsQuery.in('id', clientIds)
    } else {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Clients</h1>
            <a href="/manager/clients/new" style={{ padding: '8px 16px', background: '#1C3A5E', color: 'white', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>+ Add Client</a>
          </div>
          <SearchClients plate={searchParams.plate} />
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '1rem' }}>No clients found for plate number &quot;{searchParams.plate}&quot;</p>
        </div>
      )
    }
  }

  const { data: clients } = await clientsQuery

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Clients</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{clients?.length ?? 0} total clients</p>
        </div>
        <a href="/manager/clients/new" style={{ padding: '8px 16px', background: '#1C3A5E', color: 'white', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
          + Add Client
        </a>
      </div>

      <SearchClients plate={searchParams.plate} />

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: '1rem' }}>
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
            {(clients as Client[] ?? []).map((client, i) => (
              <tr key={client.id} style={{ borderBottom: i < (clients?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{client.full_name}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{client.phone}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#EFF6FF', color: '#1C3A5E', padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500' }}>
                    {branchMap[client.branch_id] ?? 'Unknown'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{new Date(client.created_at).toLocaleDateString('en-PH')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <a href={'/manager/clients/' + client.id + '/edit'} style={{ color: '#1C3A5E', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}