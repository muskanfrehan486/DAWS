import type { User, UpdateUserPayload } from '../types/admin.ts'
import { authHeaders } from './authApi.ts'
import { parseApiError } from '../utils/apiError'

export type Department = {
  id: string
  name: string
}

export async function fetchDepartments() {
  const res = await fetch('/api/admin/departments', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<Department[]>
}

export async function fetchUsers() {
  const res = await fetch(`/api/admin/users`, {
    headers: {
      ...authHeaders(),
    },
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  return res.json() as Promise<User[]>
}

export async function createUser(payload: UpdateUserPayload) {
  const res = await fetch(`/api/admin/users`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  return res.json() as Promise<User>
}

export async function fetchUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, {
    headers: {
      ...authHeaders(),
    },
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  return res.json() as Promise<User>
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  return res.json() as Promise<User>
}

export async function deleteUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<{ message: string }>
}
