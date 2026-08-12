/** Backend Prisma enums as returned by the API */
export type ApiDocumentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'DELETED'

export type ApiApprovalType = 'REVIEWER' | 'APPROVER' | 'FINAL_APPROVER'

export interface ApiUserRef {
  id: string
  firstName: string
  lastName: string
}

export interface ApiDocumentCurrentStep {
  id: string
  stepOrder: number
  approvalType: ApiApprovalType
  assignedUser: ApiUserRef
}

export interface ApiDocumentWorkflow {
  currentStepOrder: number
  totalSteps: number
}

export interface ApiDocument {
  id: string
  title: string
  description: string | null
  status: ApiDocumentStatus
  preparerId: string
  currentVersionNumber: number
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  preparer: ApiUserRef
  currentStep: ApiDocumentCurrentStep | null
  workflow: ApiDocumentWorkflow | null
}

export interface DocumentsListResponse {
  documents: ApiDocument[]
}

/** Normalized status values used by UI components */
export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
  | 'deleted'

export type FileType = 'pdf'

/** View model consumed by dashboard and document list pages */
export interface DashboardDocument {
  id: string
  title: string
  description: string
  status: DocumentStatus
  preparerId: string
  submittedBy: string
  submittedByInitials: string
  currentHolder: string
  currentStep: number
  totalSteps: number
  lastUpdated: string
  submittedDate: string
  submittedAt: string
  updatedAt: string
  versionNumber: number
  approvalType: ApiApprovalType | null
  actionLabel: string
  fileType: FileType
  isAwaitingMyAction: boolean
}

export interface DashboardStats {
  awaitingMyAction: number
  mySubmitted: number
  approved: number
  rejected: number
  revisionPending: number
  pendingActionDocument: DashboardDocument | null
}
