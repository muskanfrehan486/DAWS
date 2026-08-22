import type {
  ApiApprovalType,
  ApiDocument,
  ApiDocumentStatus,
  DocumentStatus,
} from './document'

export interface ApiDocumentVersion {
  id: string
  versionNumber: number
  storagePath: string
  uploadedAt: string
}

export interface ApiSupportingDocument {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export interface ApiDocumentDetail extends ApiDocument {
  versions: ApiDocumentVersion[]
  supportingDocuments?: ApiSupportingDocument[]
  approvalChain: {
    steps: {
      id: string
      stepOrder: number
      approvalType: ApiApprovalType
      assignedUser: { id: string; firstName: string; lastName: string }
    }[]
  } | null
  currentWorkflowRun: {
    id: string
    status: string
    currentStepOrder: number
  } | null
  currentStep?: {
    id: string
    stepOrder: number
    approvalType: ApiApprovalType
    assignedUser: { id: string; firstName: string; lastName: string }
  } | null
}

export interface ApiWorkflowStep {
  stepOrder: number
  approvalType: ApiApprovalType
  assignedUser: { id: string; firstName: string; lastName: string }
  status: string
  actedAt: string | null
  comment: string | null
}

export interface ApiWorkflowResponse {
  documentId: string
  documentStatus: ApiDocumentStatus
  workflowStatus: string | null
  currentStepOrder: number | null
  workflow: ApiWorkflowStep[] | undefined
}

export interface ApiComment {
  id: string
  comment: string
  createdAt: string
  author: { id: string; firstName: string; lastName: string }
}

export interface ApiDocumentAuditEntry {
  id: string
  date: string
  time: string
  user: { id: string; firstName: string; lastName: string }
  role: string
  action: string
  comments: string | null
}

export type WorkflowStepStatus = 'completed' | 'current' | 'pending' | 'skipped'

export interface DocumentDetailView {
  id: string
  title: string
  description: string
  status: DocumentStatus
  preparerId: string
  preparerName: string
  submittedDate: string
  lastUpdated: string
  currentHolder: string
  fileName: string
  versionNumber: number
  details: { label: string; value: string; code?: boolean }[]
}

export interface WorkflowStepView {
  id: string
  step: number
  type: string
  user: string
  initials: string
  date?: string
  status: WorkflowStepStatus
  comment?: string | null
}

export interface CommentView {
  id: string
  user: string
  initials: string
  comment: string
  date: string
}

export interface DocumentAuditView {
  id: string
  date: string
  time: string
  user: string
  role: string
  action: string
  comment: string
}

export interface SupportingDocumentView {
  id: string
  fileName: string
  contentType: string
  sizeLabel: string
  uploadedAt: string
}

export interface DocumentDetailData {
  document: DocumentDetailView
  workflowSteps: WorkflowStepView[]
  completedSteps: number
  totalSteps: number
  reviewers: number
  approvers: number
  workflowSummary: string
  comments: CommentView[]
  auditRecords: DocumentAuditView[]
  supportingDocuments: SupportingDocumentView[]
  canApprove: boolean
  pendingActionType: ApiApprovalType | null
  canResubmit: boolean
  canSkipStep: boolean
}

/** Document detail without user-specific action flags (set in useDocumentDetail). */
export type AssembledDocumentDetailData = Omit<
  DocumentDetailData,
  'canApprove' | 'pendingActionType' | 'canResubmit' | 'canSkipStep'
>
