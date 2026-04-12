'use client'
import { useState } from 'react'
import { deleteUser } from './actions'

export default function DeleteUserButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    await deleteUser(userId)
    setLoading(false)
    setConfirm(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={confirm ? `Click again to confirm deleting ${userEmail}` : `Delete ${userEmail}`}
      style={{
        padding: '4px 12px',
        background: confirm ? '#dc2626' : 'white',
        color: confirm ? 'white' : '#dc2626',
        border: '1px solid #dc2626',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {loading ? 'Deleting...' : confirm ? 'Confirm?' : 'Delete'}
    </button>
  )
}