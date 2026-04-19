'use client'
import { useState, useEffect } from 'react'
import { createUser } from './actions'
import { createClient } from '../../../lib/supabase'

type Branch = {
  id: string
  name: string
}

export default function CreateUserForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchBranches = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('branches').select('*')
      setBranches(data as Branch[] ?? [])
    }
    fetchBranches()
  }, [])

  const handleSubmit = async () => {
    if (!email || !password || !branchId) {
      setError('Please fill in all fields including branch.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('role', role)
    formData.append('branch_id', branchId)
    const result = await createUser(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setEmail('')
      setPassword('')
      setRole('staff')
      setBranchId('')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '16px' }}>Create New Account</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@email.com"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Branch</label>
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          >
            <option value="">Select branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: '8px 20px', background: '#1C3A5E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Creating...' : '+ Create'}
        </button>
      </div>
      {error && <p style={{ margin: '10px 0 0', color: '#dc2626', fontSize: '13px' }}>{error}</p>}
      {success && <p style={{ margin: '10px 0 0', color: '#16a34a', fontSize: '13px' }}>Account created successfully!</p>}
    </div>
  )
}