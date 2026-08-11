import type {
  ApiComment,
  ApiDocumentAuditEntry,
  ApiDocumentDetail,
  ApiWorkflowResponse,
  CommentView,
  DocumentAuditView,
  DocumentDetailView,
  AssembledDocumentDetailData,
  WorkflowStepStatus,
  WorkflowStepView,
} from '../types/documentDetail.ts'
import type { ApiApprovalType } from '../types/document.ts'
import { mapApiStatusToUi } from './documentMapper'
import { formatDisplayDate } from './format'
import { formatFullName, getInitials } from './user'

function resolveCurrentHolder(document: ApiDocumentDetail): string {
  if (
    document.status !== 'REVISION_REQUESTED' &&
    document.currentStep?.assignedUser
  ) {
    return formatFullName(
      document.currentStep.assignedUser.firstName,
      document.currentStep.assignedUser.lastName,
    )
  }
  return formatFullName(
    document.preparer.firstName,
    document.preparer.lastName,
  )
}

function mapApprovalTypeLabel(type: ApiApprovalType): string {
  switch (type) {
    case 'REVIEWER':
      return 'Reviewer'
    case 'APPROVER':
      return 'Approver'
    case 'FINAL_APPROVER':
      return 'Final Approver'
  }
}

function mapWorkflowStepStatus(status: string): WorkflowStepStatus {
  if (status === 'PENDING') return 'current'
  if (status === 'WAITING') return 'pending'
  return 'completed'
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function mapAuditActionLabel(action: string): string {
  switch (action) {
    case 'APPROVE':
      return 'Approved'
    case 'REJECT':
      return 'Rejected'
    case 'REQUEST_REVISION':
      return 'Revision Requested'
    default:
      return action
  }
}

export function buildDocumentDetailView(
  document: ApiDocumentDetail,
): DocumentDetailView {
  const version = document.versions[0]
  const fileName = version
    ? `v${version.versionNumber}.pdf`
    : 'document.pdf'
  const currentHolder = resolveCurrentHolder(document)

  return {
    id: document.id,
    title: document.title,
    description: document.description?.trim() || 'No description provided.',
    status: mapApiStatusToUi(document.status, document.currentStep),
    preparerName: formatFullName(
      document.preparer.firstName,
      document.preparer.lastName,
    ),
    submittedDate: formatDisplayDate(
      document.submittedAt ?? document.createdAt,
    ),
    lastUpdated: formatDisplayDate(document.updatedAt),
    currentHolder,
    fileName,
    versionNumber: document.currentVersionNumber,
    details: [
      { label: 'DOCUMENT ID', value: document.id, code: true },
      { label: 'FILE NAME', value: fileName },
      { label: 'VERSION', value: String(document.currentVersionNumber) },
      {
        label: 'SUBMITTED BY',
        value: formatFullName(
          document.preparer.firstName,
          document.preparer.lastName,
        ),
      },
      {
        label: 'SUBMITTED DATE',
        value: formatDisplayDate(document.submittedAt ?? document.createdAt),
      },
      { label: 'CURRENT HOLDER', value: currentHolder },
      { label: 'LAST UPDATED', value: formatDisplayDate(document.updatedAt) },
      { label: 'STATUS', value: document.status.replace(/_/g, ' ') },
    ],
  }
}

function buildPreparerStep(document: ApiDocumentDetail): WorkflowStepView {
  const submitted = Boolean(document.submittedAt)
  const needsRevision = document.status === 'REVISION_REQUESTED'
  const submittedDate = document.submittedAt ?? document.createdAt

  return {
    id: `${document.id}-preparer`,
    step: 1,
    type: 'Preparer',
    user: formatFullName(
      document.preparer.firstName,
      document.preparer.lastName,
    ),
    initials: getInitials(
      document.preparer.firstName,
      document.preparer.lastName,
    ),
    date: formatDisplayDate(submittedDate),
    status: needsRevision ? 'current' : submitted ? 'completed' : 'current',
  }
}

export function buildWorkflowSteps(
  document: ApiDocumentDetail,
  workflow: ApiWorkflowResponse,
): WorkflowStepView[] {
  const preparerStep = buildPreparerStep(document)
  const chainSteps = (workflow.workflow ?? []).map(step => ({
    id: `${workflow.documentId}-${step.stepOrder}`,
    step: step.stepOrder + 1,
    type: mapApprovalTypeLabel(step.approvalType),
    user: formatFullName(
      step.assignedUser.firstName,
      step.assignedUser.lastName,
    ),
    initials: getInitials(
      step.assignedUser.firstName,
      step.assignedUser.lastName,
    ),
    date: step.actedAt ? formatDisplayDate(step.actedAt) : undefined,
    status: mapWorkflowStepStatus(step.status),
    comment: step.comment,
  }))

  return [preparerStep, ...chainSteps]
}

export function buildWorkflowSummary(
  workflow: ApiWorkflowResponse,
  steps: WorkflowStepView[],
): string {
  if (workflow.documentStatus === 'REVISION_REQUESTED') {
    const preparerStep = steps.find(step => step.type === 'Preparer')
    return `Revision requested. ${preparerStep?.user ?? 'The preparer'} must upload a revised document and resubmit for review.`
  }

  const total = steps.length
  const currentStep = steps.find(step => step.status === 'current')

  if (!total || !currentStep) {
    if (workflow.currentStepOrder && total > 0) {
      const displayStep = workflow.currentStepOrder + 1
      return `This document is currently at Step ${displayStep} of ${total}.`
    }
    return 'Workflow information is not available.'
  }

  return `This document is currently at Step ${currentStep.step} of ${total}. ${currentStep.user} is the current ${currentStep.type.toLowerCase()}.`
}

export function buildCommentViews(comments: ApiComment[]): CommentView[] {
  return comments.map(comment => ({
    id: comment.id,
    user: formatFullName(comment.author.firstName, comment.author.lastName),
    initials: getInitials(comment.author.firstName, comment.author.lastName),
    comment: comment.comment,
    date: `${formatDisplayDate(comment.createdAt)} ${formatTime(comment.createdAt)}`,
  }))
}

export function buildDocumentAuditViews(
  entries: ApiDocumentAuditEntry[],
): DocumentAuditView[] {
  return entries.map(entry => ({
    id: entry.id,
    date: formatDisplayDate(entry.date),
    time: formatTime(entry.date),
    user: formatFullName(entry.user.firstName, entry.user.lastName),
    role: mapApprovalTypeLabel(entry.role as ApiApprovalType) || entry.role,
    action: mapAuditActionLabel(entry.action),
    comment: entry.comments?.trim() || '—',
  }))
}

export function assembleDocumentDetailData(
  document: ApiDocumentDetail,
  workflow: ApiWorkflowResponse,
  comments: ApiComment[],
  auditEntries: ApiDocumentAuditEntry[],
): AssembledDocumentDetailData {
  const documentView = buildDocumentDetailView(document)
  const workflowSteps = buildWorkflowSteps(document, workflow)
  const completedSteps = workflowSteps.filter(
    step => step.status === 'completed',
  ).length
  const chainSteps = workflowSteps.filter(step => step.type !== 'Preparer')
  const reviewers = chainSteps.filter(step => step.type === 'Reviewer').length
  const approvers = chainSteps.length - reviewers

  return {
    document: documentView,
    workflowSteps,
    completedSteps,
    totalSteps: workflowSteps.length,
    reviewers,
    approvers,
    workflowSummary: buildWorkflowSummary(workflow, workflowSteps),
    comments: buildCommentViews(comments),
    auditRecords: buildDocumentAuditViews(auditEntries),
  }
}
