'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchClients({ plate }: { plate?: string }) {
  const router = useRouter()
  const [search, setSearch] = useState(plate ?? '')

  const handleSearch = () => {
    if (search.trim()) {
      window.location.href = '?plate=' + encodeURIComponent(search.trim())
    } else {
      window.location.href = '?'
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="Search by plate number..."
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', width: '250px', color: '#111827' }}
      />
      <button
        onClick={handleSearch}
        style={{ padding: '8px 16px', background: '#1C3A5E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
      >
        Search
      </button>
      {plate && (
        <button
          onClick={() => { setSearch(''); window.location.href = '?' }}
          style={{ padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >
          Clear
        </button>
      )}
    </div>
  )
}