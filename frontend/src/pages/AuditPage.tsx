import {
  Search,
  Download,
  ChevronDown,
  FileText,
  Loader2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuditTrail } from '../hooks/useAuditTrail';
import {
  downloadAuditCsv,
  downloadDocumentAuditCsv,
} from '../services/auditApi';
import { filterAuditRecords } from '../utils/auditFilters';
import { formatDocumentId } from '../utils/format';
import type { AuditActionLabel } from '../types/audit';
import type { AuditRecord } from '../types/audit';

const actionStyles: Record<AuditActionLabel, string> = {
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
  'Revision Requested': 'bg-violet-50 text-violet-700',
};

function ActionBadge({ action }: { action: AuditActionLabel }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${actionStyles[action]}`}
    >
      {action}
    </span>
  );
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

function DownloadButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      <span>Download</span>
    </button>
  );
}

function AuditMobileCard({
  record,
  onDownload,
  downloading,
}: {
  record: AuditRecord;
  onDownload: (documentId: string) => void;
  downloading: boolean;
}) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{record.document}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            {formatDocumentId(record.documentId)}
          </p>
        </div>
        <ActionBadge action={record.action} />
      </div>

      <div className="border-t border-slate-100 my-3" />

      <div className="flex items-center gap-2.5">
        <UserAvatar initials={record.initials} />
        <div>
          <p className="text-xs font-medium text-slate-800">{record.user}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{record.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
        <span>{record.date}</span>
        <span className="text-slate-300">•</span>
        <span>{record.time}</span>
      </div>

      {record.comments !== '—' && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
            Comments
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">{record.comments}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
        <DownloadButton
          onClick={() => onDownload(record.documentId)}
          loading={downloading}
        />
      </div>
    </article>
  );
}

export default function AuditTrail() {
  const { records, actionFilterOptions, loading, error, refetch } = useAuditTrail();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingDocumentId, setExportingDocumentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredRecords = useMemo(
    () => filterAuditRecords(records, search, actionFilter),
    [records, search, actionFilter],
  );

  const handleExportAll = async () => {
    setActionError(null);
    setExportingAll(true);
    try {
      await downloadAuditCsv();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExportingAll(false);
    }
  };

  const handleExportDocument = async (documentId: string) => {
    setActionError(null);
    setExportingDocumentId(documentId);
    try {
      await downloadDocumentAuditCsv(documentId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to download audit CSV');
    } finally {
      setExportingDocumentId(null);
    }
  };

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
    <main className="w-full px-3 sm:px-6 py-5 sm:py-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete action log across documents you can access
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportAll}
          disabled={exportingAll || records.length === 0}
          className="self-start inline-flex items-center justify-center gap-2 min-h-[38px] px-3 sm:px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {exportingAll ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
          Export CSV
        </button>
      </div>

      {actionError && (
        <p className="mb-3 text-sm text-red-600">{actionError}</p>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by document, user, or ID..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative w-full lg:w-[190px]">
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="appearance-none w-full h-10 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {actionFilterOptions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <div className="flex items-center justify-center lg:px-2 text-xs text-slate-400 whitespace-nowrap">
            {filteredRecords.length} records
          </div>
        </div>
      </section>

      {filteredRecords.length > 0 && (
        <>
          <div className="block lg:hidden space-y-2.5">
            {filteredRecords.map(record => (
              <AuditMobileCard
                key={record.id}
                record={record}
                onDownload={handleExportDocument}
                downloading={exportingDocumentId === record.documentId}
              />
            ))}
          </div>

          <div className="hidden lg:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['DATE', 'TIME', 'DOCUMENT', 'USER', 'ROLE', 'ACTION', 'COMMENTS', 'DOWNLOAD'].map(
                      column => (
                        <th
                          key={column}
                          className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                        >
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.date}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {record.time}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[210px]">
                          <p className="font-medium text-slate-800 truncate">{record.document}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            {formatDocumentId(record.documentId)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar initials={record.initials} />
                          <span className="text-slate-700 whitespace-nowrap">{record.user}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.role}</td>
                      <td className="px-4 py-3">
                        <ActionBadge action={record.action} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[150px] text-xs text-slate-500 truncate">
                          {record.comments}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <DownloadButton
                          onClick={() => handleExportDocument(record.documentId)}
                          loading={exportingDocumentId === record.documentId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {filteredRecords.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center mt-3">
          <FileText size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No audit records found</p>
          <p className="mt-1 text-xs text-slate-400">
            {records.length === 0
              ? 'Workflow actions will appear here once documents are reviewed.'
              : 'Try changing your search or action filter.'}
          </p>
        </div>
      )}
    </main>
  );
}
