'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

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

export default function ManagerEditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    car_model: '',
    plate_number: '',
    service_type: '',
    reminder_months: '3',
  })
  const [vehicleId, setVehicleId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .single()

      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('vehicle_id', vehicle?.id)
        .single()

      if (client) {
        setForm(p => ({
          ...p,
          full_name: client.full_name ?? '',
          email: client.email ?? '',
          phone: client.phone ?? '',
          address: client.address ?? '',
        }))
      }
      if (vehicle) {
        setVehicleId(vehicle.id)
        setForm(p => ({
          ...p,
          car_model: vehicle.car_model ?? '',
          plate_number: vehicle.plate_number ?? '',
        }))
      }
      if (service) {
        setServiceId(service.id)
        setForm(p => ({
          ...p,
          service_type: service.service_type ?? '',
          reminder_months: service.reminder_months?.toString() ?? '3',
        }))
      }
      setFetching(false)
    }
    fetchData()
  }, [clientId])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { error: clientErr } = await supabase
      .from('clients')
      .update({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone,
        address: form.address
      })
      .eq('id', clientId)

    if (clientErr) { setError(clientErr.message); setLoading(false); return }

    if (vehicleId) {
      await supabase
        .from('vehicles')
        .update({ car_model: form.car_model, plate_number: form.plate_number })
        .eq('id', vehicleId)
    }

    if (serviceId) {
      const nextServiceDate = new Date()
      nextServiceDate.setMonth(nextServiceDate.getMonth() + parseInt(form.reminder_months))

      await supabase
        .from('services')
        .update({
          service_type: form.service_type,
          reminder_months: parseInt(form.reminder_months),
          next_service_date: nextServiceDate.toISOString().split('T')[0],
        })
        .eq('id', serviceId)
    }

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edited', entity_type: 'client', entity_name: form.full_name })
    })

    router.push('/manager/clients')
  }

  if (fetching) return <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ margin: '0 0 1.5rem', color: '#1C3A5E', fontSize: '22px' }}>Edit Client</h1>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '500', color: '#1C3A5E' }}>Client Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name</label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Email Address
                <span style={{ marginLeft: '6px', fontSize: '11px', color: '#6b7280', fontWeight: '400' }}>— used for service reminders</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. juan@email.com"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Phone Number</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Address</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '500', color: '#1C3A5E' }}>Vehicle Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Car Model</label>
              <input value={form.car_model} onChange={e => setForm(p => ({ ...p, car_model: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Plate Number</label>
              <input value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', color: '#111827' }} />
            </div>
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '500', color: '#1C3A5E' }}>Service Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Type of Service</label>
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => router.push('/manager/clients')} style={{ padding: '8px 20px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}