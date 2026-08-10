import type {
  ApiDocument,
  ApiDocumentStatus,
  ApiDocumentCurrentStep,
  DashboardDocument,
  DashboardStats,
  DocumentStatus,
} from '../types/document'
import { formatDisplayDate } from './format'
import { formatFullName, getInitials } from './user'

export function mapApiStatusToUi(
  status: ApiDocumentStatus,
  currentStep?: ApiDocumentCurrentStep | null,
): DocumentStatus {
  switch (status) {
    case 'DRAFT':
      return 'draft'
    case 'PENDING_REVIEW':
      if (
        currentStep?.approvalType === 'APPROVER' ||
        currentStep?.approvalType === 'FINAL_APPROVER'
      ) {
        return 'pending_approval'
      }
      return 'pending_review'
    case 'REVISION_REQUESTED':
      return 'revision_requested'
    case 'APPROVED':
      return 'approved'
    case 'REJECTED':
      return 'rejected'
  }
}

function resolveCurrentHolder(document: ApiDocument): string {
  if (document.currentStep?.assignedUser) {
    const { firstName, lastName } = document.currentStep.assignedUser
    return formatFullName(firstName, lastName)
  }

  return formatFullName(document.preparer.firstName, document.preparer.lastName)
}

function resolveActionLabel(
  approvalType: ApiDocumentCurrentStep['approvalType'] | undefined,
): string {
  if (approvalType === 'APPROVER' || approvalType === 'FINAL_APPROVER') {
    return 'Approval Required'
  }
  return 'Review Required'
}

export function mapApiDocumentToDashboard(
  document: ApiDocument,
  currentUserId: string,
): DashboardDocument {
  const isCurrentAssignee =
    document.currentStep?.assignedUser.id === currentUserId
  const isAwaitingMyAction =
    document.status === 'PENDING_REVIEW' &&
    document.preparerId !== currentUserId &&
    isCurrentAssignee

  return {
    id: document.id,
    title: document.title,
    description: document.description?.trim() || 'No description provided.',
    status: mapApiStatusToUi(document.status, document.currentStep),
    preparerId: document.preparerId,
    submittedBy: formatFullName(document.preparer.firstName, document.preparer.lastName),
    submittedByInitials: getInitials(document.preparer.firstName, document.preparer.lastName),
    currentHolder: resolveCurrentHolder(document),
    currentStep: document.workflow?.currentStepOrder ?? 0,
    totalSteps: document.workflow?.totalSteps ?? 0,
    lastUpdated: formatDisplayDate(document.updatedAt),
    submittedDate: formatDisplayDate(document.submittedAt ?? document.createdAt),
    submittedAt: document.submittedAt ?? document.createdAt,
    updatedAt: document.updatedAt,
    versionNumber: document.currentVersionNumber,
    approvalType: document.currentStep?.approvalType ?? null,
    actionLabel: resolveActionLabel(document.currentStep?.approvalType),
    fileType: 'pdf',
    isAwaitingMyAction,
  }
}

export function computeDashboardStats(
  documents: DashboardDocument[],
  currentUserId: string,
): DashboardStats {
  const awaiting = documents.filter(doc => doc.isAwaitingMyAction)
  const mySubmitted = documents.filter(doc => doc.preparerId === currentUserId)

  return {
    awaitingMyAction: awaiting.length,
    mySubmitted: mySubmitted.length,
    approved: mySubmitted.filter(doc => doc.status === 'approved').length,
    rejected: mySubmitted.filter(doc => doc.status === 'rejected').length,
    revisionPending: mySubmitted.filter(doc => doc.status === 'revision_requested').length,
    pendingActionDocument: awaiting[0] ?? null,
  }
}
