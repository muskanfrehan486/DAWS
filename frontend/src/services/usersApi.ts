import type { AssignableUser } from '../types/submitDocument'
import { authHeaders } from './authApi'

async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body?.message || body?.error || `Request failed (${res.status})`
}

export async function fetchAssignableUsers(): Promise<AssignableUser[]> {
  const res = await fetch('/api/users', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<AssignableUser[]>
}
