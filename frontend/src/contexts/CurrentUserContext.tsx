import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getMe } from '../services/authApi'
import type { UserRole } from '../types/user'

export interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  hasSignature: boolean
}

interface CurrentUserContextValue {
  user: CurrentUser | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

/**
 * Fetches the current user once per session and shares it across the app,
 * instead of every page/hook independently calling `getMe()`.
 */
export function CurrentUserProvider({
  initialUser = null,
  children,
}: {
  initialUser?: CurrentUser | null
  children: ReactNode
}) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const me = await getMe()
      setUser(me)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Failed to load current user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialUser) {
      load()
    }
    // Only run once on mount; `initialUser` is a snapshot from login/session restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <CurrentUserContext.Provider value={{ user, loading, error, refetch: load }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  }
  return ctx
}
