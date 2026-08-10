import {
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle,
  Eye,
  GitBranch,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge.tsx';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatHeaderDate, formatDocumentId, getTimeGreeting } from '../utils/format';
import type { Page } from '../App';
import type { DashboardDocument, DocumentStatus } from '../types/document';

const FILE_ICONS: Record<string, { bg: string; label: string }> = {
  pdf: { bg: '#ef4444', label: 'PDF' },
  docx: { bg: '#2563eb', label: 'DOC' },
  xlsx: { bg: '#16a34a', label: 'XLS' },
  pptx: { bg: '#ea580c', label: 'PPT' },
};

function getGreeting(): string {
  return getTimeGreeting();
}

function formatDate(): string {
  return formatHeaderDate();
}

function ActionCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  bg: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        bg-white rounded-xl border p-3 sm:p-4 text-left
        transition-all group w-full
        min-h-[112px]
        active:scale-[0.98]
        hover:shadow-md
        ${
          active
            ? 'border-blue-400 shadow-sm ring-1 ring-blue-200'
            : 'border-slate-200 hover:border-blue-300'
        }
      `}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: bg }}
        >
          <Icon size={15} style={{ color }} />
        </div>

        <span className="text-xs sm:text-sm font-medium text-slate-600 leading-snug">
          {label}
        </span>
      </div>

      <p
        className="text-xl sm:text-2xl font-bold"
        style={{ color }}
      >
        {value}
      </p>
    </button>
  );
}

function DocumentFileIcon({ fileType }: { fileType: string }) {
  const fi = FILE_ICONS[fileType] ?? FILE_ICONS.pdf;

  return (
    <div
      className="
        w-7 h-7 sm:w-6 sm:h-6
        rounded flex items-center justify-center
        text-white text-[8px] sm:text-[9px]
        font-bold flex-shrink-0
      "
      style={{ background: fi.bg }}
    >
      {fi.label}
    </div>
  );
}

function WorkflowProgress({ doc }: { doc: DashboardDocument }) {
  const progress =
    doc.totalSteps > 0
      ? Math.round((doc.currentStep / doc.totalSteps) * 100)
      : 0;

  return (
    <div className="min-w-0">
      <span className="text-[11px] sm:text-xs text-slate-500">
        Step {doc.currentStep > 0 ? doc.currentStep : '—'} of {doc.totalSteps}
      </span>

      <div className="w-full max-w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background:
              doc.status === 'approved'
                ? '#10b981'
                : doc.status === 'rejected'
                  ? '#ef4444'
                  : '#3b82f6',
          }}
        />
      </div>
    </div>
  );
}

function DocumentActions({
  onView,
}: {
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <button
        type="button"
        onClick={onView}
        className="
          flex items-center justify-center gap-1.5
          text-xs text-blue-600
          px-3 py-2
          rounded-lg
          bg-blue-50
          hover:bg-blue-100
          active:bg-blue-200
          transition-colors
          min-h-[36px]
        "
      >
        <Eye size={13} />
        View
      </button>

      <button
        type="button"
        onClick={onView}
        className="
          flex items-center justify-center gap-1.5
          text-xs text-slate-600
          px-3 py-2
          rounded-lg
          bg-slate-50
          hover:bg-slate-100
          active:bg-slate-200
          transition-colors
          min-h-[36px]
        "
      >
        <GitBranch size={13} />
        Track
      </button>
    </div>
  );
}

function DocumentMobileCard({
  doc,
  onOpen,
}: {
  doc: DashboardDocument;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Document header */}
      <div className="flex items-start gap-3">
        <DocumentFileIcon fileType={doc.fileType} />

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onOpen(doc.id)}
            className="
              font-semibold
              text-slate-800
              hover:text-blue-600
              active:text-blue-700
              text-left
              text-sm
              leading-snug
              w-full
            "
          >
            {doc.title}
          </button>

          <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1 truncate">
            {formatDocumentId(doc.id)}
          </p>
        </div>

        <div className="flex-shrink-0">
          <StatusBadge
            status={doc.status as DocumentStatus}
            size="xs"
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
            Submitted by
          </p>

          <div className="flex items-center gap-1.5 min-w-0">
            <div className="
              w-6 h-6
              rounded-full
              bg-slate-200
              flex items-center justify-center
              text-[9px]
              font-bold
              text-slate-600
              flex-shrink-0
            ">
              {doc.submittedByInitials}
            </div>

            <span className="text-xs text-slate-700 truncate">
              {doc.submittedBy}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
            Current holder
          </p>

          <p className="text-xs text-slate-700 truncate">
            {doc.currentHolder}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
            Workflow
          </p>

          <WorkflowProgress doc={doc} />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
            Last updated
          </p>

          <p className="text-xs text-slate-500">
            {doc.lastUpdated}
          </p>
        </div>
      </div>

      {/* Actions */}
      <DocumentActions onView={() => onOpen(doc.id)} />
    </div>
  );
}

export default function UserDashboard({
  onNavigate,
  onOpenDocument,
}: {
  onNavigate: (page: Page) => void;
  onOpenDocument: (id: string) => void;
}) {
  const { documents, stats, userName, loading, error, refetch } = useDashboardData();

  const recent = documents.slice(0, 6);
  const firstName = userName.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
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
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      className="
        w-full
        max-w-[1400px]
        mx-auto
        px-3 py-4
        sm:px-6 sm:py-6
        space-y-5 sm:space-y-6
      "
    >
      {/* Header */}
      <div className="
        flex flex-col
        sm:flex-row
        sm:items-start
        sm:justify-between
        gap-3
      ">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {getGreeting()}, {firstName}. Here is your
            workflow overview.
          </p>
        </div>

        <div className="
          text-[11px] sm:text-xs
          text-slate-500
          bg-white
          border border-slate-200
          px-3 py-2
          rounded-lg
          self-start
          whitespace-nowrap
        ">
          {formatDate()}
        </div>
      </div>

      {/* Action required banner */}
      {stats.awaitingMyAction > 0 && (
        <button
          type="button"
          className="
            w-full
            rounded-xl
            border
            p-3.5 sm:p-4
            flex
            items-start
            gap-3
            text-left
            hover:shadow-sm
            active:scale-[0.995]
            transition-all
          "
          style={{
            background: '#eff6ff',
            borderColor: '#93c5fd',
          }}
          onClick={() => onNavigate('pending-approvals')}
        >
          <div className="
            w-9 h-9
            rounded-lg
            bg-blue-500
            flex items-center justify-center
            flex-shrink-0
          ">
            <AlertCircle size={18} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="
              text-sm
              font-semibold
              text-blue-800
              leading-snug
            ">
              {stats.awaitingMyAction} document
              {stats.awaitingMyAction !== 1 ? 's' : ''} awaiting your action
            </p>

            <p className="
              text-xs
              text-blue-600
              mt-1
              truncate
            ">
              {stats.pendingActionDocument?.title ??
                'A document is pending your review'}
            </p>

            <span className="
              inline-block
              text-xs
              font-semibold
              text-blue-600
              mt-2
            ">
              View Pending →
            </span>
          </div>
        </button>
      )}

      {/* Workflow summary */}
      <section>
        <h2 className="
          text-[11px] sm:text-xs
          font-semibold
          text-slate-500
          uppercase
          tracking-wider
          mb-3
        ">
          My Workflow Summary
        </h2>

        <div className="
          grid
          grid-cols-2
          sm:grid-cols-3
          lg:grid-cols-5
          gap-2.5 sm:gap-3
        ">
          <ActionCard
            label="Awaiting My Action"
            value={stats.awaitingMyAction}
            icon={AlertCircle}
            color="#2563eb"
            bg="#eff6ff"
            onClick={() => onNavigate('pending-approvals')}
          />

          <ActionCard
            label="My Submitted"
            value={stats.mySubmitted}
            icon={FileText}
            color="#0f6cbd"
            bg="#e0f2fe"
            active
            onClick={() => onNavigate('my-documents')}
          />

          <ActionCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="#059669"
            bg="#ecfdf5"
          />

          <ActionCard
            label="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="#dc2626"
            bg="#fef2f2"
          />

          <ActionCard
            label="Revision Pending"
            value={stats.revisionPending}
            icon={RotateCcw}
            color="#7c3aed"
            bg="#f5f3ff"
            onClick={() => onNavigate('my-documents')}
          />
        </div>
      </section>

      {/* Recent Documents */}
      <section className="
        bg-white
        rounded-xl
        border border-slate-200
        overflow-hidden
      ">
        {/* Section header */}
        <div className="
          px-4 py-3.5
          sm:px-5 sm:py-4
          border-b border-slate-100
          flex items-center justify-between
          gap-3
        ">
          <div className="min-w-0">
            <h2 className="
              font-semibold
              text-slate-900
              text-sm
            ">
              Recent Documents
            </h2>

            <p className="
              text-xs
              text-slate-400
              mt-0.5
              hidden sm:block
            ">
              Latest workflow activity across the organization
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('my-documents')}
            className="
              text-xs
              font-medium
              text-blue-600
              hover:text-blue-700
              active:text-blue-800
              flex-shrink-0
              px-2 py-1
            "
          >
            View all →
          </button>
        </div>

        {/* Mobile cards */}
        <div className="
          block
          md:hidden
          divide-y divide-slate-100
        ">
          {recent.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">No documents yet.</p>
          ) : (
            recent.map(doc => (
              <DocumentMobileCard
                key={doc.id}
                doc={doc}
                onOpen={onOpenDocument}
              />
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="
            w-full
            text-sm
            min-w-[900px]
          ">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  'Doc ID',
                  'Document Name',
                  'Submitted By',
                  'Current Holder',
                  'Workflow Step',
                  'Status',
                  'Last Updated',
                  'Actions',
                ].map(col => (
                  <th
                    key={col}
                    className="
                      text-left
                      text-xs
                      font-semibold
                      text-slate-500
                      uppercase
                      tracking-wider
                      px-4 py-3
                      whitespace-nowrap
                    "
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                    No documents yet.
                  </td>
                </tr>
              ) : (
                recent.map(doc => (
                <tr
                  key={doc.id}
                  className="
                    doc-table-row
                    border-b
                    border-slate-50
                    last:border-0
                  "
                >
                  <td className="px-4 py-3">
                    <span className="
                      font-mono
                      text-xs
                      text-slate-500
                      bg-slate-100
                      px-2 py-0.5
                      rounded
                    ">
                      {formatDocumentId(doc.id)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DocumentFileIcon
                        fileType={doc.fileType}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          onOpenDocument(doc.id)
                        }
                        className="
                          font-medium
                          text-slate-800
                          hover:text-blue-600
                          text-left
                          transition-colors
                          max-w-[200px]
                          truncate
                        "
                      >
                        {doc.title}
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="
                        w-6 h-6
                        rounded-full
                        bg-slate-200
                        flex items-center justify-center
                        text-[10px]
                        font-bold
                        text-slate-600
                        flex-shrink-0
                      ">
                        {doc.submittedByInitials}
                      </div>

                      <span className="
                        text-slate-600
                        whitespace-nowrap
                      ">
                        {doc.submittedBy}
                      </span>
                    </div>
                  </td>

                  <td className="
                    px-4 py-3
                    text-slate-600
                    whitespace-nowrap
                  ">
                    {doc.currentHolder}
                  </td>

                  <td className="px-4 py-3">
                    <WorkflowProgress doc={doc} />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={doc.status as DocumentStatus}
                    />
                  </td>

                  <td className="
                    px-4 py-3
                    text-xs
                    text-slate-400
                    whitespace-nowrap
                  ">
                    {doc.lastUpdated}
                  </td>

                  <td className="px-4 py-3">
                    <DocumentActions
                      onView={() => onOpenDocument(doc.id)}
                    />
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
