import { useMemo } from 'react'
import type { DashboardStats } from '../types/document'
import { computeDashboardStats } from '../utils/documentMapper'
import { useDocuments } from './useDocuments'

interface UseDashboardDataResult {
  documents: ReturnType<typeof useDocuments>['documents']
  stats: DashboardStats
  userName: string
  loading: boolean
  error: string | null
  refetch: () => void
}

const EMPTY_STATS: DashboardStats = {
  awaitingMyAction: 0,
  mySubmitted: 0,
  approved: 0,
  rejected: 0,
  revisionPending: 0,
  pendingActionDocument: null,
}

export function useDashboardData(): UseDashboardDataResult {
  const { documents, currentUserId, userName, loading, error, refetch } = useDocuments()

  const stats = useMemo(() => {
    if (!currentUserId) return EMPTY_STATS
    return computeDashboardStats(documents, currentUserId)
  }, [documents, currentUserId])

  return { documents, stats, userName, loading, error, refetch }
}
