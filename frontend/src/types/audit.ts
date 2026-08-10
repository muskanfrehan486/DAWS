export type ApiApprovalActionType = 'APPROVE' | 'REJECT' | 'REQUEST_REVISION'

export type ApiApprovalType = 'REVIEWER' | 'APPROVER' | 'FINAL_APPROVER'

export type ApiDocumentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'

export interface ApiAuditUser {
  id: string
  firstName: string
  lastName: string
}

export interface ApiAuditEntry {
  id: string
  date: string
  time: string
  user: ApiAuditUser
  role: string
  action: string
  comments: string | null
  documentId: string
  documentTitle: string
  documentStatus: ApiDocumentStatus
}

export interface AuditHistoryResponse {
  auditHistory: ApiAuditEntry[]
}

export type AuditActionLabel = 'Approved' | 'Rejected' | 'Revision Requested'

export interface AuditRecord {
  id: string
  date: string
  time: string
  document: string
  documentId: string
  documentStatus: ApiDocumentStatus
  user: string
  initials: string
  role: string
  action: AuditActionLabel
  actionRaw: ApiApprovalActionType
  comments: string
}
