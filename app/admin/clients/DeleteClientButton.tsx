'use client'

interface Props {
  clientId: string
  clientName: string
}

export default function DeleteClientButton({ clientId, clientName }: Props) {
  async function handleDelete() {
    if (!confirm(`Delete ${clientName}? This cannot be undone.`)) return

    const formData = new FormData()
    formData.append('clientId', clientId)

    await fetch('/api/admin/delete-client', {
      method: 'POST',
      body: formData,
    })

    window.location.reload()
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        background: 'none',
        border: 'none',
        color: '#dc2626',
        cursor: 'pointer',
        fontSize: '13px',
        padding: 0,
        fontWeight: '500'
      }}>
      Delete
    </button>
  )
}