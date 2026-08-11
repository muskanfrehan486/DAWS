import type { User, UpdateUserPayload } from '../types/admin.ts'
import { authHeaders } from './authApi.ts';

export async function fetchUsers() {
  const res = await fetch(`/api/admin/users`, { headers: {
      ...authHeaders(),
    }, })
    if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<User[]>
}

export async function createUser(payload: UpdateUserPayload) {
  const res = await fetch(`/api/admin/users`, {
    method: 'POST',
    headers: {...authHeaders(), 'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<User>
}

export async function fetchUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { headers: {
      ...authHeaders(),
    }, })
  return res.json() as Promise<User>
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<User>
}