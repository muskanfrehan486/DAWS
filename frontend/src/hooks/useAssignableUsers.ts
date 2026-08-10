import { useCallback, useEffect, useState } from 'react'
import { fetchAssignableUsers } from '../services/usersApi'
import type { AssignableUser } from '../types/submitDocument'
import { formatFullName } from '../utils/user'

export function useAssignableUsers() {
  const [users, setUsers] = useState<AssignableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchAssignableUsers()
      setUsers(result)
    } catch (err) {
      setUsers([])
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { users, loading, error, refetch: load }
}

export function formatUserOptionLabel(user: AssignableUser): string {
  const name = formatFullName(user.firstName, user.lastName)
  const department = user.department?.name
  return department ? `${name} — ${department}` : name
}
