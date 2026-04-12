'use client'
import { useState } from 'react'
import { createClient } from '../../../lib/supabase'

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!startDate || !endDate) { setError('Please select both start and end date.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()

    const [{ data: services }, { data: clients }, { data: staff }] = await Promise.all([
      supabase.from('services').select(`
        id, service_type, next_service_date, reminder_sent,
        vehicles ( plate_number, car_model, clients ( full_name, phone ) )
      `).gte('next_service_date', startDate).lte('next_service_date', endDate).order('next_service_date', { ascending: true }),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*').order('created_at', { ascending: false })
    ])

    const rows: string[] = []

    // Sheet 1 — Cover Summary
    rows.push('CARSHOP MANAGEMENT SYSTEM — REPORT')
    rows.push(`Generated,${new Date().toLocaleDateString('en-PH')}`)
    rows.push(`Date Range,${startDate} to ${endDate}`)
    rows.push('')
    rows.push('SUMMARY')
    rows.push(`Total Clients,${clients?.length ?? 0}`)
    rows.push(`Total Services in Range,${services?.length ?? 0}`)
    rows.push(`Reminders Sent,${services?.filter(s => s.reminder_sent).length ?? 0}`)
    rows.push(`Reminders Pending,${services?.filter(s => !s.reminder_sent).length ?? 0}`)
    rows.push(`Total Staff & Managers,${staff?.filter(s => s.role !== 'owner').length ?? 0}`)
    rows.push('')

    // Sheet 2 — Services
    rows.push('SERVICES')
    rows.push('Client Name,Vehicle,Plate Number,Service Type,Due Date,Reminder Sent')
    ;(services ?? []).forEach(svc => {
      const v = svc.vehicles as unknown as { plate_number: string; car_model: string; clients: { full_name: string } | null } | null
      rows.push([
        v?.clients?.full_name ?? '—',
        v?.car_model ?? '—',
        v?.plate_number ?? '—',
        svc.service_type,
        new Date(svc.next_service_date).toLocaleDateString('en-PH'),
        svc.reminder_sent ? 'Yes' : 'No'
      ].join(','))
    })
    rows.push('')

    // Sheet 3 — Clients
    rows.push('CLIENTS')
    rows.push('Full Name,Phone,Address,Date Registered')
    ;(clients ?? []).forEach((c: { full_name: string; phone: string; address: string; created_at: string }) => {
      rows.push([
        c.full_name,
        c.phone,
        c.address ?? '—',
        new Date(c.created_at).toLocaleDateString('en-PH')
      ].join(','))
    })
    rows.push('')

    // Sheet 4 — Staff Activity
    rows.push('STAFF & MANAGERS')
    rows.push('Email,Role,Date Added')
    ;(staff ?? []).forEach((s: { email: string; role: string; created_at: string }) => {
      rows.push([
        s.email,
        s.role.toUpperCase(),
        new Date(s.created_at).toLocaleDateString('en-PH')
      ].join(','))
    })

    // Download
    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const month = new Date(startDate).toLocaleString('en-PH', { month: 'long', year: 'numeric' })
    link.href = url
    link.download = `CarShop_Report_${month.replace(' ', '_')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '500px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1C3A5E', fontSize: '22px' }}>Generate Report</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
          Download a full CSV report for a selected date range
        </p>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}

        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Report includes:</p>
          <p style={{ margin: '3px 0', fontSize: '12px', color: '#6b7280' }}>• Cover — summary stats & date range</p>
          <p style={{ margin: '3px 0', fontSize: '12px', color: '#6b7280' }}>• Services — all services in date range</p>
          <p style={{ margin: '3px 0', fontSize: '12px', color: '#6b7280' }}>• Clients — full client list</p>
          <p style={{ margin: '3px 0', fontSize: '12px', color: '#6b7280' }}>• Staff & Managers — all accounts</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#1C3A5E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
        >
          {loading ? 'Generating...' : 'Download Report (CSV)'}
        </button>
      </div>
    </div>
  )
}