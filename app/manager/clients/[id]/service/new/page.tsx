'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Vehicle = {
  id: string
  car_model: string
  plate_number: string
}

export default function ManagerNewServicePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [reminderMonths, setReminderMonths] = useState('3')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px',
    boxSizing: 'border-box' as const, color: '#111827'
  }
  const labelStyle = {
    display: 'block', fontSize: '13px',
    marginBottom: '4px', color: '#374151', fontWeight: '500' as const
  }

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVehicles(data as Vehicle[])
          setVehicleId(data[0].id)
        }
      })
  }, [clientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const months = parseInt(reminderMonths)
    const svcDate = new Date(serviceDate)
    const nextDate = new Date(svcDate)
    nextDate.setMonth(nextDate.getMonth() + months)

    const { error: svcError } = await supabase
      .from('services')
      .insert({
        vehicle_id: vehicleId,
        service_type: serviceType,
        service_date: serviceDate,
        reminder_months: months,
        next_service_date: nextDate.toISOString().split('T')[0],
        notes: notes || null,
        reminder_sent: false
      })

    if (svcError) {
      setError(svcError.message)
      setLoading(false)
      return
    }

    router.push(`/manager/clients/${clientId}`)
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Log a Service</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Record the service and set a maintenance reminder</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1rem' }}>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Vehicle *</label>
            <select style={inputStyle} value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.car_model} — {v.plate_number}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Type of Service *</label>
            <select style={inputStyle} value={serviceType} onChange={e => setServiceType(e.target.value)} required>
              <option value="">Select service type</option>
              <option>Oil Change</option>
              <option>Brake Check</option>
              <option>Tire Rotation</option>
              <option>Engine Tune-up</option>
              <option>Air Filter Replacement</option>
              <option>Battery Check</option>
              <option>Wheel Alignment</option>
              <option>General Inspection</option>
              <option>Transmission Service</option>
              <option>Cooling System Service</option>
              <option>Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Service Date *</label>
            <input style={inputStyle} type="date" required value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Reminder — next service in</label>
            <select style={inputStyle} value={reminderMonths} onChange={e => setReminderMonths(e.target.value)}>
              <option value="1">1 month</option>
              <option value="2">2 months</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
            {serviceDate && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#059669' }}>
                Next service due: {(() => {
                  const d = new Date(serviceDate)
                  d.setMonth(d.getMonth() + parseInt(reminderMonths))
                  return d.toLocaleDateString('en-PH')
                })()}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this service..."
            />
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
            {loading ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      </form>
    </div>
  )
}