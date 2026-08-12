import type { AssignableUser } from '../types/submitDocument'
import { authHeaders } from './authApi'
import { parseApiError } from '../utils/apiError'

export async function fetchAssignableUsers(): Promise<AssignableUser[]> {
  const res = await fetch('/api/users', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<AssignableUser[]>
}
