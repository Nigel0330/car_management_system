import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import CreateUserForm from './CreateUserForm'
import DeleteUserButton from './DeleteUserButton'

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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Staff & Manager Accounts</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          {staff?.length ?? 0} accounts registered
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Branch</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Date Added</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(staff as User[] ?? []).map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < (staff?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{s.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: s.role === 'owner' ? '#FEF3C7' : s.role === 'manager' ? '#E6F1FB' : '#EFF6FF',
                    color: s.role === 'owner' ? '#92400E' : s.role === 'manager' ? '#0C447C' : '#1C3A5E',
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
                <td style={{ padding: '12px 16px' }}>
                  {s.role !== 'owner' && (
                    <DeleteUserButton userId={s.id} userEmail={s.email} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserForm />
    </div>
  )
}