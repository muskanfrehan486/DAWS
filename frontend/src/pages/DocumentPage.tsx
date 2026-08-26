import { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  Eye,
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';

import StatusBadge from '../components/StatusBadge.tsx';
import DownloadDocumentButton from '../components/DownloadDocumentButton.tsx';
import { useDocuments } from '../hooks/useDocuments';
import { formatDocumentId } from '../utils/format';
import {
  computeDocumentListCounts,
  filterDocuments,
  type DocumentStatusFilter,
} from '../utils/documentFilters';
import type { DashboardDocument, DocumentStatus } from '../types/document';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../types/routes';

const FILE_ICONS: Record<string, { bg: string; label: string }> = {
  pdf: { bg: '#ef4444', label: 'PDF' },
  docx: { bg: '#2563eb', label: 'DOC' },
  xlsx: { bg: '#16a34a', label: 'XLS' },
  pptx: { bg: '#ea580c', label: 'PPT' },
};

type FilterStatus = DocumentStatusFilter;

function DocumentFileIcon({ fileType }: { fileType: string }) {
  const fi = FILE_ICONS[fileType] ?? FILE_ICONS.pdf;

  return (
    <div
      className="
        w-8 h-8
        rounded-lg
        flex items-center justify-center
        text-white
        text-[9px]
        font-bold
        flex-shrink-0
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

  const progressColor =
    doc.status === 'approved'
      ? '#10b981'
      : doc.status === 'rejected'
        ? '#ef4444'
        : '#22c55e';

  return (
    <div className="min-w-[100px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          Step {doc.currentStep > 0 ? doc.currentStep : '—'} of{' '}
          {doc.totalSteps}
        </span>

        <span className="text-[10px] font-medium text-slate-400">
          {progress}%
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: progressColor,
          }}
        />
      </div>
    </div>
  );
}

function DocumentActions({
  doc,
  onOpen,
}: {
  doc: DashboardDocument;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={onOpen}
        className="
          flex items-center gap-1.5
          px-2.5 py-1.5
          rounded-lg
          text-xs
          font-medium
          text-emerald-600
          hover:bg-emerald-50
          active:bg-emerald-100
          transition-colors
        "
      >
        <Eye size={13} />
        View
      </button>

      <DownloadDocumentButton
        documentId={doc.id}
        versionNumber={doc.versionNumber}
        disabled={doc.status === 'deleted'}
      />
    </div>
  );
}

function MobileDocumentCard({
  doc,
  onOpen,
}: {
  doc: DashboardDocument;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="p-4 border-b border-slate-100 last:border-0">
      {/* Header */}
      <div className="flex items-start gap-3">
        <DocumentFileIcon fileType={doc.fileType} />

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onOpen(doc.id)}
            className="
              text-sm
              font-semibold
              text-slate-800
              text-left
              leading-snug
              hover:text-emerald-600
              transition-colors
            "
          >
            {doc.title}
          </button>

          <p className="
            text-[10px]
            text-slate-400
            font-mono
            mt-1
            truncate
          ">
            {formatDocumentId(doc.id)}
          </p>
        </div>

        <StatusBadge
          status={doc.status as DocumentStatus}
          size="xs"
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
        <div className="min-w-0">
          <p className="
            text-[10px]
            uppercase
            tracking-wide
            font-medium
            text-slate-400
            mb-1
          ">
            Submitted By
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
          <p className="
            text-[10px]
            uppercase
            tracking-wide
            font-medium
            text-slate-400
            mb-1
          ">
            Current Holder
          </p>

          <p className="text-xs text-slate-700 truncate">
            {doc.currentHolder}
          </p>
        </div>

        <div className="col-span-2">
          <p className="
            text-[10px]
            uppercase
            tracking-wide
            font-medium
            text-slate-400
            mb-1
          ">
            Workflow
          </p>

          <WorkflowProgress doc={doc} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <DocumentActions
          doc={doc}
          onOpen={() => onOpen(doc.id)}
        />
      </div>
    </div>
  );
}

export default function MyDocuments() {
  const navigate = useNavigate();
  const { documents, loading, error, refetch } = useDocuments();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const filteredDocuments = useMemo(
    () => filterDocuments(documents, search, statusFilter),
    [documents, search, statusFilter],
  );

  const counts = useMemo(
    () => computeDocumentListCounts(documents),
    [documents],
  );

  const hasFilters = search.length > 0 || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
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
    <div className="
      w-full
      max-w-[1400px]
      mx-auto
      px-3 py-4
      sm:px-6 sm:py-6
      space-y-5 sm:space-y-6
    ">
      {/* Page Header */}
      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-start
        sm:justify-between
        gap-3
      ">
        <div>
          <h1 className="
            text-lg
            sm:text-xl
            font-bold
            text-slate-900
          ">
            Dashboard
          </h1>

          <p className="
            text-xs
            sm:text-sm
            text-slate-500
            mt-1
          ">
            Documents associated with you across the approval workflow.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="
        grid
        grid-cols-2
        sm:grid-cols-5
        gap-2.5 sm:gap-3
      ">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`
            bg-white
            border
            rounded-xl
            p-3
            text-left
            transition-all
            ${
              statusFilter === 'all'
                ? 'border-emerald-400 ring-1 ring-emerald-200'
                : 'border-slate-200 hover:border-emerald-300'
            }
          `}
        >
          <p className="text-xs text-slate-500">
            All Documents
          </p>

          <p className="
            text-xl
            font-bold
            text-slate-900
            mt-1
          ">
            {counts.all}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`
            bg-white
            border
            rounded-xl
            p-3
            text-left
            transition-all
            ${
              statusFilter === 'pending'
                ? 'border-emerald-400 ring-1 ring-emerald-200'
                : 'border-slate-200 hover:border-emerald-300'
            }
          `}
        >
          <p className="text-xs text-slate-500">
            Pending
          </p>

          <p className="
            text-xl
            font-bold
            text-emerald-600
            mt-1
          ">
            {counts.pending}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className="
            bg-white
            border
            border-slate-200
            rounded-xl
            p-3
            text-left
            hover:border-emerald-300
            transition-all
          "
        >
          <p className="text-xs text-slate-500">
            Approved
          </p>

          <p className="
            text-xl
            font-bold
            text-emerald-600
            mt-1
          ">
            {counts.approved}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className="
            bg-white
            border
            border-slate-200
            rounded-xl
            p-3
            text-left
            hover:border-red-300
            transition-all
          "
        >
          <p className="text-xs text-slate-500">
            Rejected
          </p>

          <p className="
            text-xl
            font-bold
            text-red-600
            mt-1
          ">
            {counts.rejected}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter('revision_requested')
          }
          className="
            bg-white
            border
            border-slate-200
            rounded-xl
            p-3
            text-left
            hover:border-violet-300
            transition-all
          "
        >
          <p className="text-xs text-slate-500">
            Revision
          </p>

          <p className="
            text-xl
            font-bold
            text-violet-600
            mt-1
          ">
            {counts.revision}
          </p>
        </button>
      </div>

      {/* Documents container */}
      <section className="
        bg-white
        rounded-xl
        border border-slate-200
        overflow-hidden
      ">
        {/* Search / Filter header */}
        <div className="
          p-3
          sm:p-4
          border-b border-slate-100
          space-y-3
        ">
          <div className="
            flex
            flex-col
            sm:flex-row
            gap-2
            sm:items-center
          ">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="
                  Search by document name, ID, or person...
                "
                className="
                  w-full
                  h-10
                  pl-9
                  pr-9
                  text-sm
                  border
                  border-slate-200
                  rounded-lg
                  outline-none
                  text-slate-700
                  placeholder:text-slate-400
                  focus:border-emerald-400
                  focus:ring-2
                  focus:ring-emerald-100
                "
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="
                    absolute
                    right-2
                    top-1/2
                    -translate-y-1/2
                    w-7 h-7
                    flex items-center justify-center
                    rounded-md
                    hover:bg-slate-100
                    text-slate-400
                  "
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter
                size={15}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  pointer-events-none
                "
              />

              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(
                    e.target.value as FilterStatus
                  )
                }
                className="
                  w-full
                  sm:w-[190px]
                  h-10
                  pl-9
                  pr-8
                  text-sm
                  border
                  border-slate-200
                  rounded-lg
                  bg-white
                  text-slate-700
                  outline-none
                  focus:border-emerald-400
                  focus:ring-2
                  focus:ring-emerald-100
                  appearance-none
                "
              >
                <option value="all">
                  All Statuses
                </option>
                <option value="pending">
                  Pending
                </option>
                <option value="pending_review">
                  Pending Review
                </option>
                <option value="pending_approval">
                  Pending Approval
                </option>
                <option value="approved">
                  Approved
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="revision_requested">
                  Revision Requested
                </option>
              </select>

              <ChevronDown
                size={14}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  pointer-events-none
                "
              />
            </div>
          </div>

          {/* Result count */}
          <div className="
            flex
            items-center
            justify-between
            gap-2
          ">
            <p className="text-xs text-slate-400">
              Showing{' '}
              <span className="
                font-medium
                text-slate-600
              ">
                {filteredDocuments.length}
              </span>{' '}
              of{' '}
              <span className="
                font-medium
                text-slate-600
              ">
                {documents.length}
              </span>{' '}
              documents
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  text-xs
                  font-medium
                  text-emerald-600
                  hover:text-emerald-700
                "
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {filteredDocuments.length === 0 && (
          <div className="
            py-14
            px-6
            text-center
          ">
            <div className="
              w-12 h-12
              rounded-xl
              bg-slate-100
              flex
              items-center
              justify-center
              mx-auto
              mb-3
            ">
              <FileText
                size={22}
                className="text-slate-400"
              />
            </div>

            <h3 className="
              text-sm
              font-semibold
              text-slate-800
            ">
              No documents found
            </h3>

            <p className="
              text-xs
              text-slate-400
              mt-1
            ">
              {documents.length === 0
                ? 'Submit a document to get started.'
                : 'Try changing your search or filter.'}
            </p>

            {documents.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate(ROUTES.submitDocument)}
                className="
                  mt-4
                  text-xs
                  font-medium
                  text-emerald-600
                  hover:text-emerald-700
                "
              >
                Submit Document →
              </button>
            ) : hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  mt-4
                  text-xs
                  font-medium
                  text-emerald-600
                  hover:text-emerald-700
                "
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}

        {/* Mobile */}
        {filteredDocuments.length > 0 && (
          <div className="md:hidden">
            {filteredDocuments.map(doc => (
              <MobileDocumentCard
                key={doc.id}
                doc={doc}
                onOpen={id => navigate(ROUTES.document(id))}
              />
            ))}
          </div>
        )}

        {/* Desktop */}
        {filteredDocuments.length > 0 && (
          <div className="
            hidden
            md:block
            overflow-x-auto
          ">
            <table className="
              w-full
              text-sm
              min-w-[1050px]
            ">
              <thead>
                <tr className="
                  border-b
                  border-slate-100
                  bg-slate-50/50
                ">
                  {[
                    'Document',
                    'Submitted By',
                    'Current Holder',
                    'Workflow',
                    'Status',
                    'Download',
                  ].map(column => (
                    <th
                      key={column}
                      className="
                        text-left
                        text-[11px]
                        font-semibold
                        text-slate-500
                        uppercase
                        tracking-wider
                        px-4
                        py-3
                        whitespace-nowrap
                      "
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map(doc => (
                  <tr
                    key={doc.id}
                    className="
                      border-b
                      border-slate-50
                      last:border-0
                      hover:bg-slate-50/60
                      transition-colors
                    "
                  >
                    {/* Document */}
                    <td className="px-4 py-4">
                      <div className="
                        flex
                        items-center
                        gap-3
                        min-w-[230px]
                      ">
                        <DocumentFileIcon
                          fileType={doc.fileType}
                        />

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(ROUTES.document(doc.id))
                            }
                            className="
                              font-medium
                              text-slate-800
                              hover:text-emerald-600
                              text-left
                              truncate
                              block
                              max-w-[240px]
                            "
                          >
                            {doc.title}
                          </button>

                          <p className="
                            text-[10px]
                            text-slate-400
                            font-mono
                            mt-0.5
                          ">
                            {formatDocumentId(doc.id)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Submitted By */}
                    <td className="px-4 py-4">
                      <div className="
                        flex
                        items-center
                        gap-2
                        whitespace-nowrap
                      ">
                        <div className="
                          w-7 h-7
                          rounded-full
                          bg-slate-200
                          flex
                          items-center
                          justify-center
                          text-[10px]
                          font-bold
                          text-slate-600
                        ">
                          {doc.submittedByInitials}
                        </div>

                        <span className="text-slate-600">
                          {doc.submittedBy}
                        </span>
                      </div>
                    </td>

                    {/* Current Holder */}
                    <td className="
                      px-4 py-4
                      text-slate-600
                      whitespace-nowrap
                    ">
                      {doc.currentHolder}
                    </td>

                    {/* Workflow */}
                    <td className="px-4 py-4">
                      <WorkflowProgress doc={doc} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge
                        status={
                          doc.status as DocumentStatus
                        }
                      />
                    </td>

                    {/* Download */}
                    <td className="px-4 py-4">
                      <DownloadDocumentButton
                        documentId={doc.id}
                        versionNumber={doc.versionNumber}
                        disabled={doc.status === 'deleted'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
