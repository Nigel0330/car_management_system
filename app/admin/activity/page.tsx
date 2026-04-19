'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase'

type Log = {
  id: string
  user_email: string
  user_role: string
  action: string
  entity_type: string
  entity_name: string
  created_at: string
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [action, setAction] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (role) query = query.eq('user_role', role)
      if (action) query = query.eq('action', action)
      if (date) {
        const start = new Date(date)
        const end = new Date(date)
        end.setDate(end.getDate() + 1)
        query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
      }

      const { data } = await query
      setLogs(data as Log[] ?? [])
      setLoading(false)
    }
    fetchLogs()
  }, [role, action, date])

  const getBadge = (act: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      created: { bg: '#dcfce7', color: '#166534' },
      edited: { bg: '#dbeafe', color: '#1e40af' },
      deleted: { bg: '#fee2e2', color: '#991b1b' },
      logged_in: { bg: '#f3e8ff', color: '#6b21a8' },
      logged_out: { bg: '#fef9c3', color: '#854d0e' },
    }
    return map[act] ?? { bg: '#f3f4f6', color: '#374151' }
  }

  const getRoleBadge = (r: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      owner: { bg: '#FEF3C7', color: '#92400E' },
      manager: { bg: '#E6F1FB', color: '#0C447C' },
      staff: { bg: '#EFF6FF', color: '#1C3A5E' },
    }
    return map[r] ?? { bg: '#f3f4f6', color: '#374151' }
  }

  const selectStyle = {
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#111827',
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Activity Log</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          {logs.length} records · showing latest 100
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={selectStyle}>
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Action</label>
          <select value={action} onChange={e => setAction(e.target.value)} style={selectStyle}>
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="edited">Edited</option>
            <option value="deleted">Deleted</option>
            <option value="logged_in">Logged In</option>
            <option value="logged_out">Logged Out</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...selectStyle }}
          />
        </div>
        <button
          onClick={() => { setRole(''); setAction(''); setDate('') }}
          style={{ padding: '6px 14px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >
          Clear filters
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Action</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Record</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '500' }}>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>No activity found</td>
              </tr>
            ) : logs.map((log, i) => {
              const actionStyle = getBadge(log.action)
              const roleStyle = getRoleBadge(log.user_role)
              const isLast = i === logs.length - 1
              return (
                <tr key={log.id} style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{log.user_email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: roleStyle.bg, color: roleStyle.color, padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500' }}>
                      {log.user_role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: actionStyle.bg, color: actionStyle.color, padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '500' }}>
                      {log.action.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    <span style={{ color: '#9ca3af', fontSize: '11px', marginRight: '6px' }}>{log.entity_type}</span>
                    {log.entity_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {new Date(log.created_at).toLocaleDateString('en-PH')} {new Date(log.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
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