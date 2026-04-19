'use client'
import { useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

const supabase = createClient()

const SERVICE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Engine Tune-Up',
  'Transmission Service',
  'Battery Replacement',
  'Air Filter Replacement',
  'Coolant Flush',
  'Wheel Alignment',
  'General Inspection',
]

export default function StaffNewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    car_model: '',
    plate_number: '',
    service_type: '',
    reminder_months: '3',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.full_name || !form.plate_number || !form.car_model || !form.service_type) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: userData } = await supabase
      .from('users')
      .select('branch_id')
      .eq('id', user?.id)
      .single()

    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        created_by: user?.id,
        branch_id: userData?.branch_id
      })
      .select()
      .single()

    if (clientErr || !client) { setError(clientErr?.message ?? 'Failed to create client'); setLoading(false); return }

    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .insert({ car_model: form.car_model, plate_number: form.plate_number, client_id: client.id })
      .select()
      .single()

    if (vehicleErr || !vehicle) { setError(vehicleErr?.message ?? 'Failed to create vehicle'); setLoading(false); return }

    const nextServiceDate = new Date()
    nextServiceDate.setMonth(nextServiceDate.getMonth() + parseInt(form.reminder_months))

    const { error: serviceErr } = await supabase
      .from('services')
      .insert({
        vehicle_id: vehicle.id,
        service_type: form.service_type,
        next_service_date: nextServiceDate.toISOString().split('T')[0],
        reminder_sent: false
      })

    if (serviceErr) { setError(serviceErr.message); setLoading(false); return }

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'created', entity_type: 'client', entity_name: form.full_name })
    })

    router.push('/staff/clients')
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ margin: '0 0 1.5rem', color: '#1C3A5E', fontSize: '22px' }}>Add New Client</h1>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '500', color: '#1C3A5E' }}>Client Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Juan dela Cruz" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 09123456789" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Address</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="e.g. 123 Main St, Quezon City" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '500', color: '#1C3A5E' }}>Vehicle Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Car Model <span style={{ color: '#dc2626' }}>*</span></label>
              <input value={form.car_model} onChange={e => setForm(p => ({ ...p, car_model: e.target.value }))} placeholder="e.g. Toyota Vios" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Plate Number <span style={{ color: '#dc2626' }}>*</span></label>
              <input value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value }))} placeholder="e.g. ABC 1234" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '500', color: '#1C3A5E' }}>Service Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Type of Service <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}>
                <option value="">Select service type</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Service Reminder Interval</label>
              <select value={form.reminder_months} onChange={e => setForm(p => ({ ...p, reminder_months: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}>
                <option value="1">Every 1 month</option>
                <option value="2">Every 2 months</option>
                <option value="3">Every 3 months</option>
                <option value="6">Every 6 months</option>
                <option value="12">Every 12 months</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px', background: '#1C3A5E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save Client'}
          </button>
          <button onClick={() => router.push('/staff/clients')} style={{ padding: '8px 20px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}