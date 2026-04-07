import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Client = {
  id: string
  full_name: string
  address: string
  phone: string
  branch_id: string
  created_at: string
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: clients } = await admin
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Clients</h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
              {clients?.length ?? 0} client{(clients?.length ?? 0) !== 1 ? 's' : ''} registered
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/dashboard" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '13px', textDecoration: 'none' }}>
              Back
            </Link>
            <Link href="/dashboard/clients/new" style={{ padding: '8px 16px', borderRadius: '8px', background: '#1C3A5E', color: 'white', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
              + Add Client
            </Link>
          </div>
        </div>

        {(!clients || clients.length === 0) ? (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>No clients yet.</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0' }}>
              {'Click the + Add Client button to register your first client.'}
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Phone</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Address</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Date Added</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(clients as Client[]).map((client, i) => (
                  <tr key={client.id} style={{ borderBottom: i < clients.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{client.full_name}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{client.phone}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{client.address}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {new Date(client.created_at).toLocaleDateString('en-PH')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/dashboard/clients/${client.id}`} style={{ color: '#1C3A5E', textDecoration: 'none', fontWeight: '500' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}