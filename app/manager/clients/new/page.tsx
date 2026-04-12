'use client'
import { useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ManagerNewClientPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('clients').insert({
      ...form,
      created_by: user?.id
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/manager/clients')
  }

  return (
    <div style={{ maxWidth: '500px' }}>
      <h1 style={{ margin: '0 0 1.5rem', color: '#1C3A5E', fontSize: '22px' }}>Add New Client</h1>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { field: 'full_name', label: 'Full Name' },
          { field: 'phone', label: 'Phone' },
          { field: 'address', label: 'Address' },
        ].map(({ field, label }) => (
          <div key={field}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              {label}
            </label>
            <input
              value={form[field as keyof typeof form]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '8px 20px', background: '#1C3A5E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : 'Save Client'}
          </button>
          <button
            onClick={() => router.back()}
            style={{ padding: '8px 20px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}