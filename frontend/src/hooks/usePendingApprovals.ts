import { useMemo } from 'react'
import { useDocuments } from './useDocuments'
import { filterPendingApprovals } from '../utils/documentFilters'

export function usePendingApprovals() {
  const { documents, loading, error, refetch } = useDocuments()

  const pendingDocuments = useMemo(
    () => filterPendingApprovals(documents),
    [documents],
  )

  return { documents: pendingDocuments, loading, error, refetch }
}
