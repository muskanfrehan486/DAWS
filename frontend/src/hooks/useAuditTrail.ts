import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAuditHistory } from '../services/auditApi'
import type { AuditRecord } from '../types/audit'
import { getAuditActionFilterOptions, mapApiAuditEntryToRecord } from '../utils/auditMapper'

export function useAuditTrail() {
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { auditHistory } = await fetchAuditHistory()
      setRecords(auditHistory.map(mapApiAuditEntryToRecord))
    } catch (err) {
      setRecords([])
      setError(err instanceof Error ? err.message : 'Failed to load audit trail')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const actionFilterOptions = useMemo(
    () => getAuditActionFilterOptions(records),
    [records],
  )

  return { records, actionFilterOptions, loading, error, refetch: load }
}
