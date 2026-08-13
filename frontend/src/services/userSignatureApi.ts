import { authHeaders } from './authApi'
import { parseApiError } from '../utils/apiError'

export async function fetchMySignature(): Promise<Blob | null> {
  const res = await fetch('/api/users/me/signature', {
    headers: { ...authHeaders() },
  })

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.blob()
}

export async function uploadMySignature(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/users/me/signature', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
}

export async function deleteMySignature(): Promise<void> {
  const res = await fetch('/api/users/me/signature', {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read signature image'))
    reader.readAsDataURL(blob)
  })
}
