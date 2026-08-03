import type { User, UpdateUserPayload } from '../types/admin.ts'

const BASE = import.meta.env.VITE_API_BASE || ''

export async function fetchUsers() {
  const res = await fetch(`${BASE}/admin/users`, { credentials: 'include' })
  return res.json() as Promise<User[]>
}

export async function fetchUser(id: string) {
  const res = await fetch(`${BASE}/admin/users/${id}`, { credentials: 'include' })
  return res.json() as Promise<User>
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const res = await fetch(`${BASE}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<User>
}