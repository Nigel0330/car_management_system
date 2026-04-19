'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', minHeight: '100vh',
      fontFamily: 'sans-serif', background: '#f8fafc'
    }}>
      <div style={{
        background: 'white', padding: '2rem',
        borderRadius: '12px', border: '1px solid #e5e7eb',
        width: '100%', maxWidth: '380px'
      }}>
        <h1 style={{ color: '#1C3A5E', marginBottom: '0.25rem' }}>Wash Autority</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '14px' }}>
          Sign in to your account
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#374151' }}>
              Email
            </label>
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#374151' }}>
              Password
            </label>
            <input
              type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px', background: '#1C3A5E',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer'
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}