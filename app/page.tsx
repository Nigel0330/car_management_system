import { createClient } from '../lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#1C3A5E' }}>Wash Autority Dashboard</h1>
      <p style={{ color: '#6b7280' }}>Welcome! You are logged in as: {user.email}</p>
      <h2 style={{ marginTop: '1.5rem', color: '#1C3A5E' }}>Branches</h2>
      <ul>
        {branches?.map((branch) => (
          <li key={branch.id}>{branch.name}</li>
        ))}
      </ul>
    </main>
  )
}