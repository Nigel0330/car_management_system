import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'

type StaffMember = {
  id: string
  email: string
  role: string
  created_at: string
}

export default async function ManagerStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: staffList } = await admin
    .from('users')
    .select('*')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Staff List</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          {staffList?.length ?? 0} staff members · read only
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Date Added</th>
            </tr>
          </thead>
          <tbody>
            {(staffList as StaffMember[] ?? []).map((staff, i) => (
              <tr key={staff.id} style={{ borderBottom: i < (staffList?.length ?? 0) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px 16px', color: '#111827' }}>{staff.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#FAEEDA', color: '#633806', padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500' }}>
                    {staff.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {new Date(staff.created_at).toLocaleDateString('en-PH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}