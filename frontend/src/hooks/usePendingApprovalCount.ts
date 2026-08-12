import { useCallback, useEffect, useState } from 'react'
import { fetchPendingApprovalCountCached } from '../services/documentsApi'

export function usePendingApprovalCount() {
  const [count, setCount] = useState(0)

  const load = useCallback(async (force = false) => {
    try {
      const { count: pendingCount } = await fetchPendingApprovalCountCached(force)
      setCount(pendingCount)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refetch = useCallback(() => load(true), [load])

  return { count, refetch }
}
