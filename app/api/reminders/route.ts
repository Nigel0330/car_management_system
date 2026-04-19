import { createClient as createAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

type VehicleWithClient = {
  plate_number: string
  car_model: string
  clients: { full_name: string; phone: string } | null
} | null

export async function GET() {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  const { data: dueServices, error } = await admin
    .from('services')
    .select(`
      id,
      service_type,
      next_service_date,
      reminder_sent,
      vehicles (
        plate_number,
        car_model,
        clients (
          full_name,
          phone
        )
      )
    `)
    .lte('next_service_date', today)
    .eq('reminder_sent', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!dueServices || dueServices.length === 0) {
    return NextResponse.json({ message: 'No reminders due today.', sent: 0 })
  }

  let sentCount = 0
  const results: { client: string; vehicle: string; status: string }[] = []

  for (const svc of dueServices) {
    // ✅ Double cast to bypass Supabase's generated array types
    const vehicle = (svc.vehicles as unknown) as VehicleWithClient

    if (!vehicle) continue

    const client = vehicle.clients
    if (!client) continue

    try {
      await resend.emails.send({
        from: 'Wash Autority <onboarding@resend.dev>',
        to: [process.env.TEST_EMAIL ?? 'nigelhernandez0330@gmail.com'],
        subject: `Service Reminder — ${vehicle.car_model} (${vehicle.plate_number})`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <div style="background: #1C3A5E; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0; font-size: 20px;">Wash Autority Service Reminder</h2>
            </div>
            <div style="background: #f8fafc; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="margin: 0 0 12px; font-size: 15px;">Hi <strong>${client.full_name}</strong>,</p>
              <p style="margin: 0 0 12px; color: #374151;">Your vehicle is due for its next service:</p>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 6px;"><strong>Vehicle:</strong> ${vehicle.car_model}</p>
                <p style="margin: 0 0 6px;"><strong>Plate:</strong> ${vehicle.plate_number}</p>
                <p style="margin: 0 0 6px;"><strong>Service:</strong> ${svc.service_type}</p>
                <p style="margin: 0;"><strong>Due date:</strong> ${svc.next_service_date}</p>
              </div>
              <p style="margin: 0 0 12px; color: #374151;">Please visit us at your earliest convenience.</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">— Wash Autority Team</p>
            </div>
          </div>
        `
      })

      await admin
        .from('services')
        .update({ reminder_sent: true })
        .eq('id', svc.id)

      sentCount++
      results.push({
        client: client.full_name,
        vehicle: vehicle.plate_number,
        status: 'sent'
      })

    } catch (err) {
      console.error('Email send error:', err)
      results.push({
        client: client.full_name,
        vehicle: vehicle.plate_number,
        status: 'failed'
      })
    }
  }

  return NextResponse.json({
    message: 'Reminders processed.',
    sent: sentCount,
    total: dueServices.length,
    results
  })
}