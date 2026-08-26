import type { User, UpdateUserPayload, BulkUserImportResult } from '../types/admin.ts'
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

export function downloadUserImportTemplate() {
  const headers = ['firstName', 'lastName', 'email', 'password', 'department', 'role']
  const example = ['Jane', 'Smith', 'jane@company.com', 'password123', 'Human Resources', 'USER']
  const csv = `\uFEFF${[headers.join(','), example.join(',')].join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'user-import-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export async function bulkCreateUsers(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/admin/users/bulk', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<BulkUserImportResult>
}
