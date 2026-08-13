import { useState } from 'react';
import {
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  GitBranch,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Modal from '../components/Modal';
import { usePendingApprovals } from '../hooks/usePendingApprovals';
import { rejectDocument, requestRevision } from '../services/approvalApi';
import { formatDocumentId, formatWaitingDuration } from '../utils/format';
import type { DashboardDocument } from '../types/document';

type ActionType = 'reject' | 'revision';

function FileIcon() {
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: '#ef4444' }}
    >
      PDF
    </div>
  );
}

function WorkflowProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <GitBranch size={14} className="text-slate-500 flex-shrink-0" />
      <span className="text-xs text-slate-600 whitespace-nowrap">
        Step {currentStep} of {totalSteps} in workflow
      </span>
      <div className="hidden sm:block w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function PendingDocumentCard({
  document,
  onOpen,
  onApprove,
  onReject,
  onRevision,
  actionLoading,
}: {
  document: DashboardDocument;
  onOpen: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevision: (id: string) => void;
  actionLoading: boolean;
}) {
  const waitingDuration = formatWaitingDuration(document.updatedAt);

  return (
    <article className="bg-white rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileIcon />

          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug pr-1">
              {document.title}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-1">
              {formatDocumentId(document.id)}
            </p>
          </div>

          <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs font-medium whitespace-nowrap">
            <span className="hidden sm:inline">{document.actionLabel}</span>
            <span className="sm:hidden">
              {document.actionLabel === 'Approval Required' ? 'Approve' : 'Review'}
            </span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:flex sm:flex-wrap gap-y-2 gap-x-4">
          <span className="text-[10px] sm:text-xs text-slate-500">{document.submittedBy}</span>
          <span className="hidden sm:block text-slate-300">•</span>
          <span className="text-[10px] sm:text-xs text-slate-400">{document.submittedDate}</span>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <WorkflowProgress
            currentStep={document.currentStep}
            totalSteps={document.totalSteps}
          />
          <span className="hidden sm:block text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-500" />
            <span className="text-xs text-slate-600">
              Waiting {waitingDuration}
            </span>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-400 truncate">
          Version {document.versionNumber}.pdf
        </div>

        <p className="mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
          {document.description}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onOpen(document.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors w-full sm:w-auto disabled:opacity-50"
          >
            <Eye size={14} />
            Open Document
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onApprove(document.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex-1 sm:flex-none disabled:opacity-50"
          >
            <CheckCircle size={14} />
            {document.approvalType === 'REVIEWER' ? 'Complete Review' : 'Approve'}
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onReject(document.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:bg-red-800 transition-colors flex-1 sm:flex-none disabled:opacity-50"
          >
            <XCircle size={14} />
            Reject
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onRevision(document.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-violet-200 bg-violet-50 text-violet-600 text-xs font-medium hover:bg-violet-100 active:bg-violet-200 transition-colors w-full sm:w-auto disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Request Revision
          </button>
        </div>
      </div>
    </article>
  );
}

export default function PendingApprovals({
  onOpenDocument,
}: {
  onOpenDocument: (id: string) => void;
}) {
  const { documents, loading, error, refetch } = usePendingApprovals();
  const [activeAction, setActiveAction] = useState<{
    type: ActionType;
    documentId: string;
  } | null>(null);
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const openActionModal = (type: ActionType, documentId: string) => {
    setActiveAction({ type, documentId });
    setComment('');
    setActionError(null);
  };

  const closeActionModal = () => {
    if (actionLoading) return;
    setActiveAction(null);
    setComment('');
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!activeAction) return;

    if (activeAction.type === 'revision' && !comment.trim()) {
      setActionError('A comment is required when requesting a revision.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      if (activeAction.type === 'reject') {
        await rejectDocument(activeAction.documentId, comment);
      } else {
        await requestRevision(activeAction.documentId, comment);
      }

      closeActionModal();
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (id: string) => {
    onOpenDocument(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[1400px] mx-auto px-3 py-5 sm:px-6 sm:py-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Pending Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Documents awaiting your review or approval action
          </p>
        </div>

        <div className="self-start flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs sm:text-sm font-medium">
          <AlertCircle size={15} />
          <span>
            {documents.length} action{documents.length !== 1 ? 's' : ''} required
          </span>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="space-y-4">
          {documents.map(document => (
            <PendingDocumentCard
              key={document.id}
              document={document}
              onOpen={onOpenDocument}
              onApprove={handleApprove}
              onReject={id => openActionModal('reject', id)}
              onRevision={id => openActionModal('revision', id)}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl py-14 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">You're all caught up</h2>
          <p className="text-xs text-slate-400 mt-1">
            There are no documents waiting for your action.
          </p>
        </div>
      )}

      <Modal
        open={activeAction !== null}
        onClose={closeActionModal}
        title={activeAction?.type === 'reject' ? 'Reject Document' : 'Request Revision'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {activeAction?.type === 'reject'
              ? 'Optionally provide a reason for rejecting this document.'
              : 'Describe what changes are needed before this document can proceed.'}
          </p>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder={
              activeAction?.type === 'reject'
                ? 'Rejection reason (optional)'
                : 'Revision comments (required)'
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
          />

          {actionError && (
            <p className="text-sm text-red-600">{actionError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeActionModal}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 ${
                activeAction?.type === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              {actionLoading ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
