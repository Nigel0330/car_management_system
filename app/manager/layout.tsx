import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', background: '#f8fafc' }}>
      <aside style={{ width: '220px', background: '#1C3A5E', color: 'white', padding: '1.5rem 1rem', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>CarShop</h2>
            <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.6 }}>Manager Panel</p>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <a href="/manager" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', opacity: 0.85 }}>Dashboard</a>
            <a href="/manager/clients" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', opacity: 0.85 }}>Clients</a>
            <a href="/manager/services" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', opacity: 0.85 }}>Services</a>
            <a href="/manager/staff" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', opacity: 0.85 }}>Staff List</a>
            <a href="/manager/reports" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', opacity: 0.85 }}>Reports</a>
          </nav>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', opacity: 0.6, padding: '0 12px' }}>{user.email}</p>
          <a href="/auth/logout" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', opacity: 0.85, display: 'block', background: 'rgba(255,255,255,0.1)' }}>
            Log out
          </a>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}