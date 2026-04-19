'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const supabase = createClient()

export default function StaffEditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [form, setForm] = useState({ full_name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchClient = async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      if (data) setForm({ full_name: data.full_name, phone: data.phone, address: data.address ?? '' })
      setFetching(false)
    }
    fetchClient()
  }, [clientId])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('clients')
      .update(form)
      .eq('id', clientId)
    if (err) { setError(err.message); setLoading(false); return }

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edited',
        entity_type: 'client',
        entity_name: form.full_name
      })
    })

    router.push('/staff/clients')
  }

  if (fetching) return <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '500px' }}>
      <h1 style={{ margin: '0 0 1.5rem', color: '#1C3A5E', fontSize: '22px' }}>Edit Client</h1>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name</label>
          <input
            value={form.full_name}
            onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Phone</label>
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Address</label>
          <input
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
          />
        </div>
        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '8px 20px', background: '#1C3A5E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
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