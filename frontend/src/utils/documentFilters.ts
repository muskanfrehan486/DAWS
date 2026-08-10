import type { DashboardDocument, DocumentStatus } from '../types/document'

export type DocumentStatusFilter =
  | 'all'
  | 'pending'
  | 'pending_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'revision_requested'

export interface DocumentListCounts {
  all: number
  pending: number
  approved: number
  rejected: number
  revision: number
}

export function computeDocumentListCounts(
  documents: DashboardDocument[],
): DocumentListCounts {
  return {
    all: documents.length,
    pending: documents.filter(
      doc =>
        doc.status === 'pending_review' ||
        doc.status === 'pending_approval',
    ).length,
    approved: documents.filter(doc => doc.status === 'approved').length,
    rejected: documents.filter(doc => doc.status === 'rejected').length,
    revision: documents.filter(doc => doc.status === 'revision_requested').length,
  }
}

function matchesStatusFilter(
  status: DocumentStatus,
  filter: DocumentStatusFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'pending') {
    return status === 'pending_review' || status === 'pending_approval'
  }
  return status === filter
}

export function filterPendingApprovals(
  documents: DashboardDocument[],
): DashboardDocument[] {
  return documents.filter(
    doc =>
      doc.isAwaitingMyAction &&
      (doc.status === 'pending_review' || doc.status === 'pending_approval'),
  )
}

export function filterDocuments(
  documents: DashboardDocument[],
  search: string,
  statusFilter: DocumentStatusFilter,
): DashboardDocument[] {
  const query = search.trim().toLowerCase()

  return documents.filter(doc => {
    const matchesSearch =
      !query ||
      doc.title.toLowerCase().includes(query) ||
      doc.id.toLowerCase().includes(query) ||
      doc.submittedBy.toLowerCase().includes(query) ||
      doc.currentHolder.toLowerCase().includes(query)

    const matchesStatus = matchesStatusFilter(doc.status, statusFilter)

    return matchesSearch && matchesStatus
  })
}
