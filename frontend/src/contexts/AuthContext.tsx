import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getAuthToken,
  restoreSession,
  setAuthToken,
} from '../services/authApi'
import type { CurrentUser } from './CurrentUserContext'
import type { UserRole } from '../types/user'

interface AuthContextValue {
  authChecked: boolean
  loggedIn: boolean
  sessionUser: CurrentUser | null
  sessionKey: number
  login: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthChecked(true)
      return
    }

    restoreSession()
      .then(user => {
        if (user) {
          setLoggedIn(true)
          setSessionUser(user)
        }
      })
      .finally(() => setAuthChecked(true))
  }, [])

  const login = useCallback((_role: UserRole) => {
    setLoggedIn(true)
    setSessionUser(null)
    setSessionKey(key => key + 1)
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setLoggedIn(false)
    setSessionUser(null)
  }, [])

  const value = useMemo(
    () => ({
      authChecked,
      loggedIn,
      sessionUser,
      sessionKey,
      login,
      logout,
    }),
    [authChecked, loggedIn, sessionUser, sessionKey, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
