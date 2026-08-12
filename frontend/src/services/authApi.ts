import type { UserRole } from '../types/user.ts'
import { parseApiError } from '../utils/apiError'

const TOKEN_STORAGE_KEY = 'docflow_auth_token'

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: UserRole
  }
}

function normalizeUserRole(role: string): UserRole {
  return role?.toLowerCase() === 'administrator' ? 'ADMINISTRATOR' : 'USER'
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

/** Validate stored token and return the current user, or null if unauthenticated. */
export async function restoreSession() {
  if (!getAuthToken()) {
    return null
  }

  try {
    return await getMe()
  } catch {
    setAuthToken(null)
    return null
  }
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const payload = await res.json()
  const result: LoginResponse = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: {
      id: payload.user?.id,
      email: payload.user?.email,
      role: normalizeUserRole(payload.user?.role),
    },
  }

  setAuthToken(result.accessToken)
  return result
}

export async function getMe() {
  const res = await fetch('/api/auth/me', {
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const data = await res.json()
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: normalizeUserRole(data.loginRole),
  } as { id: string; email: string; firstName: string; lastName: string; role: UserRole }
}
