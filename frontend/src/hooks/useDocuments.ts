import { useCallback, useEffect, useState } from 'react'
import { getMe } from '../services/authApi'
import { fetchDocuments } from '../services/documentsApi'
import type { DashboardDocument } from '../types/document'
import { mapApiDocumentToDashboard } from '../utils/documentMapper'
import { formatFullName } from '../utils/user'

interface UseDocumentsResult {
  documents: DashboardDocument[]
  currentUserId: string
  userName: string
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [user, { documents: apiDocuments }] = await Promise.all([
        getMe(),
        fetchDocuments(),
      ])

      setCurrentUserId(user.id)
      setUserName(formatFullName(user.firstName, user.lastName))
      setDocuments(
        apiDocuments.map(doc => mapApiDocumentToDashboard(doc, user.id)),
      )
    } catch (err) {
      setDocuments([])
      setCurrentUserId('')
      setUserName('')
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { documents, currentUserId, userName, loading, error, refetch: load }
}
