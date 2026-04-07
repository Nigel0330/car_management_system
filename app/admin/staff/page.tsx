import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'

type User = {
  id: string
  email: string
  role: string
  branch_id: string | null
  created_at: string
}

type Branch = {
  id: string
  name: string
}

export default async function AdminStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: staff } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: branches } = await admin
    .from('branches')
    .select('*')

  const branchMap = Object.fromEntries(
    (branches as Branch[] ?? []).map(b => [b.id, b.name])
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Staff Accounts</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
            {staff?.length ?? 0} accounts registered
          </p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Branch</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Date Added</th>
            </tr>
          </thead>
          <tbody>
            {(staff as User[] ?? []).map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < (staff?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{s.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: s.role === 'owner' ? '#FEF3C7' : '#EFF6FF',
                    color: s.role === 'owner' ? '#92400E' : '#1C3A5E',
                    padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500'
                  }}>
                    {s.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {s.branch_id ? branchMap[s.branch_id] ?? 'Unknown' : '— (All branches)'}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {new Date(s.created_at).toLocaleDateString('en-PH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '1.25rem', border: '1px solid #BFDBFE' }}>
        <h2 style={{ margin: '0 0 4px', color: '#1C3A5E', fontSize: '14px' }}>To add a new staff account</h2>
        <p style={{ margin: 0, color: '#1C3A5E', fontSize: '13px' }}>
          Go to your Supabase dashboard → Authentication → Users → Add user. Then run this SQL to assign them a role and branch:
        </p>
        <div style={{ background: 'white', borderRadius: '8px', padding: '10px 14px', marginTop: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#1C3A5E' }}>
          INSERT INTO users (id, email, role, branch_id) VALUES (&apos;AUTH_USER_ID&apos;, &apos;staff@email.com&apos;, &apos;staff&apos;, &apos;BRANCH_ID&apos;);
        </div>
      </div>
    </div>
  )
}