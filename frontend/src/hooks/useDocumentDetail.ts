import { useCallback, useEffect, useState } from 'react'
import { getMe } from '../services/authApi'
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
  const [data, setData] = useState<DocumentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [document, workflow, comments, auditHistory, me] = await Promise.all([
        fetchDocumentById(documentId),
        fetchDocumentWorkflow(documentId),
        fetchDocumentComments(documentId),
        fetchDocumentAuditHistory(documentId),
        getMe(),
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
          me.id,
        ),
        pendingActionType: resolveCanApprove(
          workflow.documentStatus,
          document.preparerId,
          workflow,
          me.id,
        )
          ? resolvePendingActionType(workflow, me.id)
          : null,
      })
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [documentId])

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
