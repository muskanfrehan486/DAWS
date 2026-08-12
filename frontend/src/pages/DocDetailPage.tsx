import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle,
  Clock3,
  Download,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Page } from '../App'
import Modal from '../components/Modal'
import PdfDocumentViewer from '../components/PdfDocumentViewer'
import SignApproveModal from '../components/SignApproveModal'
import StatusBadge from '../components/StatusBadge'
import { useCurrentUser } from '../contexts/CurrentUserContext'
import { useDocumentDetail } from '../hooks/useDocumentDetail'
import { requestRevision } from '../services/approvalApi'
import { downloadDocumentAuditCsv } from '../services/auditApi'
import { fetchDocumentFile, resubmitDocument } from '../services/documentDetailApi'
import { deleteDocument } from '../services/documentsApi'
import type {
  CommentView,
  DocumentAuditView,
  DocumentDetailView,
  WorkflowStepView,
} from '../types/documentDetail'
import { formatDocumentId } from '../utils/format'

type Tab = 'overview' | 'workflow' | 'comments' | 'audit'

const returnPageLabels: Record<Page, string> = {
  dashboard: 'Dashboard',
  'my-documents': 'My Documents',
  'pending-approvals': 'Pending Approvals',
  'submit-document': 'Submit Document',
  'document-details': 'Document',
  notifications: 'Notifications',
  'audit-trail': 'Audit Trail',
  administration: 'Administration',
}

function Avatar({
  initials,
  color = 'blue',
}: {
  initials: string
  color?: 'blue' | 'green' | 'gray'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    gray: 'bg-slate-100 text-slate-500',
  }

  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${colors[color]}`}
    >
      {initials}
    </div>
  )
}

function WorkflowStatusPanel({
  workflowSteps,
  completedSteps,
}: {
  workflowSteps: WorkflowStepView[]
  completedSteps: number
}) {
  const total = workflowSteps.length
  const progress = total > 0 ? (completedSteps / total) * 100 : 0

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900">
          Workflow Status
        </h2>
        <span className="text-xs text-slate-500">
          {completedSteps} / {total} steps
        </span>
      </div>

      <div className="mb-5">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        {workflowSteps.map((step, index) => {
          const isLast = index === workflowSteps.length - 1

          return (
            <div key={step.id} className="relative flex gap-3">
              {!isLast && (
                <div
                  className={`absolute left-[15px] top-[32px] w-px h-[calc(100%-8px)] ${
                    step.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}

              <div className="relative z-10 flex-shrink-0">
                {step.status === 'completed' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
                {step.status === 'current' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Clock3 size={16} className="text-white" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 bg-white" />
                )}
              </div>

              <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-slate-700">
                      Step {step.step} · {step.type}
                    </span>
                    {step.status === 'current' && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  {step.date && (
                    <span className="text-[10px] text-slate-400">{step.date}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <Avatar
                    initials={step.initials}
                    color={
                      step.status === 'pending'
                        ? 'gray'
                        : step.status === 'current'
                          ? 'blue'
                          : 'green'
                    }
                  />
                  <span
                    className={`text-sm ${
                      step.status === 'pending' ? 'text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    {step.user}
                  </span>
                </div>

                {step.comment && (
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {step.comment}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {workflowSteps.length === 0 && (
          <p className="text-sm text-slate-500">No workflow steps configured.</p>
        )}
      </div>
    </section>
  )
}

function QuickInfo({
  totalSteps,
  completedSteps,
  reviewers,
  approvers,
}: {
  totalSteps: number
  completedSteps: number
  reviewers: number
  approvers: number
}) {
  const rows = [
    { label: 'Total Steps', value: totalSteps },
    { label: 'Completed Steps', value: completedSteps },
    { label: 'Reviewers', value: reviewers },
    { label: 'Approvers', value: approvers },
  ]

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">
        Quick Info
      </h2>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{row.label}</span>
            <span className="text-sm font-medium text-slate-700">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function DocumentDetails({ document }: { document: DocumentDetailView }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-5">
        Document Details
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {document.details.map(detail => (
          <div key={detail.label}>
            <p className="text-[10px] sm:text-xs font-medium tracking-wide text-slate-400 mb-1.5">
              {detail.label}
            </p>
            {detail.code ? (
              <span className="inline-flex px-2 py-1 rounded bg-slate-50 text-[11px] font-mono text-slate-600 break-all">
                {detail.value}
              </span>
            ) : (
              <p className="text-sm text-slate-800 break-words">{detail.value}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function DocumentPreview({
  documentId,
  fileName,
  versionNumber,
  isDeleted = false,
  canApprove,
  canResubmit,
  resubmitLoading,
  pendingActionType,
  onSignClick,
  onRequestRevision,
  onResubmit,
  onDownload,
}: {
  documentId: string
  fileName: string
  versionNumber: number
  isDeleted?: boolean
  canApprove?: boolean
  canResubmit?: boolean
  resubmitLoading?: boolean
  pendingActionType?: string | null
  onSignClick?: () => void
  onRequestRevision?: () => void
  onResubmit?: (file: File) => void
  onDownload?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfFile, setPdfFile] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(!isDeleted)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDeleted) {
      setPdfFile(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchDocumentFile(documentId)
      .then(blob => {
        if (!cancelled) setPdfFile(blob)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [documentId, versionNumber, isDeleted])

  if (isDeleted) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-10 text-center">
          <Trash2 size={32} className="mx-auto text-slate-300 mb-3" />
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Document deleted by preparer
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            The preparer removed this document and its files. The workflow has
            stopped, but the record remains visible for audit purposes.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Document Preview
          </h2>
          <span className="text-xs text-slate-400">
            {fileName} · v{versionNumber}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {canApprove && onSignClick && (
            <button
              type="button"
              onClick={onSignClick}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium hover:bg-emerald-700"
            >
              <CheckCircle size={15} />
              {pendingActionType === 'REVIEWER'
                ? 'Sign & Complete Review'
                : 'Sign & Approve'}
            </button>
          )}
          {canApprove && onRequestRevision && (
            <button
              type="button"
              onClick={onRequestRevision}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-xs sm:text-sm font-medium hover:bg-violet-100"
            >
              <RotateCcw size={15} />
              Request Revision
            </button>
          )}
          {canResubmit && onResubmit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) onResubmit(file)
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={resubmitLoading}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {resubmitLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Upload size={15} />
                )}
                {resubmitLoading ? 'Uploading...' : 'Upload & Resubmit'}
              </button>
            </>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50"
            >
              <Download size={15} />
              Download
            </button>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center min-h-[280px] gap-2 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            Loading preview...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[280px] text-sm text-red-600">
            {error}
          </div>
        ) : (
          <PdfDocumentViewer file={pdfFile} />
        )}
      </div>
    </section>
  )
}

function CommentsTab({
  comments,
  onAddComment,
  commentLoading,
}: {
  comments: CommentView[]
  onAddComment: (comment: string) => Promise<void>
  commentLoading: boolean
}) {
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = newComment.trim()
    if (!trimmed) return

    setError(null)
    try {
      await onAddComment(trimmed)
      setNewComment('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">Comments</h2>
          <p className="text-xs text-slate-400 mt-1">Discussion related to this document</p>
        </div>
        <MessageSquare size={18} className="text-slate-400" />
      </div>

      <div className="space-y-5">
        {comments.length === 0 && (
          <p className="text-sm text-slate-500">No comments yet.</p>
        )}
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <Avatar initials={comment.initials} color="blue" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm font-medium text-slate-800">{comment.user}</span>
                <span className="text-[10px] text-slate-400">{comment.date}</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                {comment.comment}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100">
        <label className="block text-xs font-medium text-slate-700 mb-2">Add Comment</label>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
          placeholder="Write a comment..."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            disabled={!newComment.trim() || commentLoading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {commentLoading && <Loader2 size={14} className="animate-spin" />}
            Add Comment
          </button>
        </div>
      </div>
    </section>
  )
}

function AuditHistoryTab({
  records,
  documentId,
}: {
  records: DocumentAuditView[]
  documentId: string
}) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadDocumentAuditCsv(documentId)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">Approval Log</h2>
          <p className="text-xs text-slate-400 mt-1">Complete action history for this document</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || records.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export CSV
        </button>
      </div>

      {records.length === 0 ? (
        <div className="px-4 sm:px-5 py-10 text-center text-sm text-slate-500">
          No audit records yet.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['DATE', 'TIME', 'USER', 'ROLE', 'ACTION', 'COMMENTS'].map(col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-slate-500">{record.date}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{record.time}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{record.user}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{record.role}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-medium">
                        {record.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">{record.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {records.map(record => (
              <div key={record.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">{record.user}</span>
                  <span className="text-[10px] text-slate-400">{record.date}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{record.role}</p>
                <span className="inline-flex mt-2 px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-medium">
                  {record.action}
                </span>
                {record.comment !== '—' && (
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{record.comment}</p>
                )}
                <p className="mt-2 text-[10px] font-mono text-slate-400">{record.time}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default function DocumentDetail({
  documentId,
  returnPage,
  onNavigate,
  onBack,
}: {
  documentId: string
  returnPage: Page
  onNavigate: (page: Page) => void
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [revisionComment, setRevisionComment] = useState('')
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [revisionError, setRevisionError] = useState<string | null>(null)
  const [resubmitLoading, setResubmitLoading] = useState(false)
  const [resubmitError, setResubmitError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { user } = useCurrentUser()
  const { data, loading, error, commentLoading, refetch, addComment } =
    useDocumentDetail(documentId)

  const handleApproveSuccess = () => {
    setSignModalOpen(false)
    onBack()
  }

  const openRevisionModal = () => {
    setRevisionComment('')
    setRevisionError(null)
    setRevisionModalOpen(true)
  }

  const closeRevisionModal = () => {
    if (revisionLoading) return
    setRevisionModalOpen(false)
    setRevisionComment('')
    setRevisionError(null)
  }

  const handleConfirmRevision = async () => {
    if (!revisionComment.trim()) {
      setRevisionError('A comment is required when requesting a revision.')
      return
    }

    setRevisionLoading(true)
    setRevisionError(null)

    try {
      await requestRevision(documentId, revisionComment)
      setRevisionModalOpen(false)
      setRevisionComment('')
      setRevisionError(null)
      onBack()
    } catch (err) {
      setRevisionError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setRevisionLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await fetchDocumentFile(documentId)
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = data?.document.fileName ?? 'document.pdf'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // no-op; preview section shows load errors
    }
  }

  const handleResubmit = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setResubmitError('Please upload a PDF file.')
      return
    }

    setResubmitLoading(true)
    setResubmitError(null)

    try {
      await resubmitDocument(documentId, file)
      await refetch()
    } catch (err) {
      setResubmitError(err instanceof Error ? err.message : 'Resubmit failed')
    } finally {
      setResubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      await deleteDocument(documentId)
      setDeleteModalOpen(false)
      await refetch()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete document')
    } finally {
      setDeleteLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Document Overview' },
    { id: 'workflow', label: 'Approval Workflow' },
    { id: 'comments', label: 'Comments' },
    { id: 'audit', label: 'Approval Log' },
  ]

  if (loading) {
    return (
      <main className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading document...</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 py-16">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to load document</h2>
          <p className="text-sm text-slate-500 mb-4">{error ?? 'Document not found'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  const { document, workflowSteps, completedSteps, totalSteps, reviewers, approvers, workflowSummary, comments, auditRecords, canApprove, canResubmit, pendingActionType } = data
  const isDeleted = document.status === 'deleted'
  const canDelete = user?.id === document.preparerId && !isDeleted

  return (
    <main className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap mb-4 sm:mb-5 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="text-slate-400 hover:text-blue-600"
        >
          Dashboard
        </button>
        <span className="text-slate-300">/</span>
        <button type="button" onClick={onBack} className="text-slate-400 hover:text-blue-600">
          {returnPageLabels[returnPage]}
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-medium">{formatDocumentId(documentId)}</span>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 lg:p-6 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex flex-col sm:flex-row gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm sm:text-base font-bold">PDF</span>
            </div>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words">
                {document.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                <span className="px-2 py-1 rounded bg-slate-50 text-[10px] sm:text-xs font-mono text-slate-500">
                  {formatDocumentId(document.id)}
                </span>
                <StatusBadge status={document.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User size={13} />
                  Submitted by {document.preparerName}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {document.submittedDate}
                </span>
                <span className="flex items-center gap-1.5 break-all">
                  <FileText size={13} />
                  {document.fileName} · v{document.versionNumber}
                </span>
              </div>

              <p className="flex items-start gap-2 mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
                <Clock3 size={14} className="flex-shrink-0 mt-0.5" />
                {document.description}
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full lg:w-auto flex-shrink-0 flex-wrap">
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteModalOpen(true)
                }}
                className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-medium hover:bg-red-100"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
            {!isDeleted && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview')
                  setTimeout(() => {
                    window.document.getElementById('document-preview')?.scrollIntoView({ behavior: 'smooth' })
                  }, 0)
                }}
                className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50"
              >
                <Eye size={15} />
                Preview
              </button>
            )}
            <button
              type="button"
              className="hidden sm:flex lg:hidden w-10 h-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
        </div>
      </section>

      {isDeleted && (
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-4">
          <p className="text-sm font-medium text-slate-900">Document deleted by preparer</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            The preparer removed this document. The workflow has stopped and the file is no longer available.
          </p>
        </section>
      )}

      {canResubmit && !isDeleted && (
        <section className="bg-violet-50 border border-violet-200 rounded-xl p-4 sm:p-5 mb-4">
          <p className="text-sm font-medium text-violet-900">Revision requested</p>
          <p className="mt-1 text-xs sm:text-sm text-violet-700">
            Upload a revised PDF to replace the current version and restart the approval workflow.
          </p>
          {resubmitError && (
            <p className="mt-2 text-sm text-red-600">{resubmitError}</p>
          )}
        </section>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-shrink-0 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-medium transition-colors ${
                  active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 sm:gap-5">
          <div className="space-y-4 sm:space-y-5">
            <DocumentDetails document={document} />
            <div id="document-preview">
              <DocumentPreview
                documentId={documentId}
                fileName={document.fileName}
                versionNumber={document.versionNumber}
                isDeleted={isDeleted}
                canApprove={canApprove && !isDeleted}
                canResubmit={canResubmit && !isDeleted}
                resubmitLoading={resubmitLoading}
                pendingActionType={pendingActionType}
                onSignClick={() => setSignModalOpen(true)}
                onRequestRevision={openRevisionModal}
                onResubmit={handleResubmit}
                onDownload={handleDownload}
              />
            </div>
          </div>
          <div className="space-y-4 sm:space-y-5">
            <WorkflowStatusPanel
              workflowSteps={workflowSteps}
              completedSteps={completedSteps}
            />
            <QuickInfo
              totalSteps={totalSteps}
              completedSteps={completedSteps}
              reviewers={reviewers}
              approvers={approvers}
            />
          </div>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="max-w-[900px] mx-auto space-y-4">
          <WorkflowStatusPanel
            workflowSteps={workflowSteps}
            completedSteps={completedSteps}
          />
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">
              Approval Chain
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">{workflowSummary}</p>
          </section>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="max-w-[900px] mx-auto">
          <CommentsTab
            comments={comments}
            onAddComment={addComment}
            commentLoading={commentLoading}
          />
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="max-w-[1100px] mx-auto">
          <AuditHistoryTab records={auditRecords} documentId={documentId} />
        </div>
      )}
      <SignApproveModal
        open={signModalOpen}
        documentId={documentId}
        documentTitle={document.title}
        onClose={() => setSignModalOpen(false)}
        onSuccess={handleApproveSuccess}
      />

      <Modal
        open={revisionModalOpen}
        onClose={closeRevisionModal}
        title="Request Revision"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Describe what changes are needed before this document can proceed.
          </p>
          <textarea
            value={revisionComment}
            onChange={e => setRevisionComment(e.target.value)}
            rows={4}
            placeholder="Revision comments (required)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
          />
          {revisionError && (
            <p className="text-sm text-red-600">{revisionError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeRevisionModal}
              disabled={revisionLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRevision}
              disabled={revisionLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50"
            >
              {revisionLoading ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => !deleteLoading && setDeleteModalOpen(false)}
        title="Delete Document"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently remove the document files and stop the workflow.
            Everyone with access will still see that you deleted it.
          </p>
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Document'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
