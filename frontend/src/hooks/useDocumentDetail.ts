import { useCallback, useEffect, useState } from 'react'
import { useCurrentUser } from '../contexts/CurrentUserContext'
import {
  createDocumentComment,
  fetchDocumentAuditHistory,
  fetchDocumentById,
  fetchDocumentComments,
  fetchDocumentWorkflow,
} from '../services/documentDetailApi'
import type { DocumentDetailData } from '../types/documentDetail'
import { assembleDocumentDetailData } from '../utils/documentDetailMapper'

function resolvePendingActionType(
  workflow: Awaited<ReturnType<typeof fetchDocumentWorkflow>>,
  userId: string,
) {
  const step = (workflow.workflow ?? []).find(
    item => item.status === 'PENDING' && item.assignedUser.id === userId,
  )
  return step?.approvalType ?? null
}

function resolveCanApprove(
  documentStatus: string,
  preparerId: string,
  workflow: Awaited<ReturnType<typeof fetchDocumentWorkflow>>,
  userId: string,
): boolean {
  if (documentStatus !== 'PENDING_REVIEW') return false
  if (preparerId === userId) return false

  return (workflow.workflow ?? []).some(
    step => step.status === 'PENDING' && step.assignedUser.id === userId,
  )
}

export function useDocumentDetail(documentId: string) {
  const { user, loading: userLoading, error: userError } = useCurrentUser()
  const [data, setData] = useState<DocumentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)

  const load = useCallback(async () => {
    if (userLoading) return

    setLoading(true)
    setError(null)

    if (!user) {
      setData(null)
      setError(userError ?? 'Failed to load current user')
      setLoading(false)
      return
    }

    try {
      const [document, workflow, comments, auditHistory] = await Promise.all([
        fetchDocumentById(documentId),
        fetchDocumentWorkflow(documentId),
        fetchDocumentComments(documentId),
        fetchDocumentAuditHistory(documentId),
      ])

      const assembled = assembleDocumentDetailData(
        document,
        workflow,
        comments,
        auditHistory,
      )

      setData({
        ...assembled,
        canApprove: resolveCanApprove(
          workflow.documentStatus,
          document.preparerId,
          workflow,
          user.id,
        ),
        pendingActionType: resolveCanApprove(
          workflow.documentStatus,
          document.preparerId,
          workflow,
          user.id,
        )
          ? resolvePendingActionType(workflow, user.id)
          : null,
        canResubmit:
          document.preparerId === user.id &&
          workflow.documentStatus === 'REVISION_REQUESTED',
      })
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [documentId, user, userLoading, userError])

  useEffect(() => {
    load()
  }, [load])

  const addComment = useCallback(
    async (comment: string) => {
      setCommentLoading(true)
      try {
        await createDocumentComment(documentId, comment)
        await load()
      } finally {
        setCommentLoading(false)
      }
    },
    [documentId, load],
  )

  return { data, loading, error, commentLoading, refetch: load, addComment }
}
