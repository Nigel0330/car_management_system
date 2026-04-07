'use client'

import { useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [carModel, setCarModel] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [branchId, setBranchId] = useState('0296e847-80fb-488d-a5bc-40ae32e67f14')

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px',
    boxSizing: 'border-box' as const, outline: 'none'
  }
  const labelStyle = {
    display: 'block', fontSize: '13px',
    marginBottom: '4px', color: '#374151', fontWeight: '500' as const
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({ full_name: fullName, address, phone, branch_id: branchId })
      .select()
      .single()

    if (clientError) {
      setError(clientError.message)
      setLoading(false)
      return
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .insert({ client_id: client.id, car_model: carModel, plate_number: plateNumber })

    if (vehicleError) {
      setError(vehicleError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/clients')
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Add New Client</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Fill in the client and vehicle details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>Client Information</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Juan dela Cruz" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 09171234567" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Rizal St, Quezon City" />
            </div>

            <div>
              <label style={labelStyle}>Branch *</label>
              <select style={inputStyle} value={branchId} onChange={e => setBranchId(e.target.value)} required>
                <option value="0296e847-80fb-488d-a5bc-40ae32e67f14">Branch 1</option>
                <option value="cc49b6ff-fd74-4855-9b54-bda3c5d41b05">Branch 2</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 1rem', color: '#1C3A5E', fontSize: '15px' }}>Vehicle Information</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Car Model *</label>
              <input style={inputStyle} type="text" required value={carModel} onChange={e => setCarModel(e.target.value)} placeholder="e.g. Toyota Vios 2020" />
            </div>

            <div>
              <label style={labelStyle}>Plate Number *</label>
              <input style={inputStyle} type="text" required value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="e.g. ABC 1234" />
            </div>
          </div>

          {error && (
            <p style={{ color: '#dc2626', background: '#fee2e2', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: '8px', background: '#1C3A5E', color: 'white', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}