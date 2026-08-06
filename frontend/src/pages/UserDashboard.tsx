import { FileText, Clock, CheckCircle, XCircle, RotateCcw, AlertCircle, Eye, GitBranch } from 'lucide-react';
import { DOCUMENTS } from '../data/sampleData';
import StatusBadge from '../components/StatusBadge.tsx';
import type { Page } from '../App';
import type { DocumentStatus } from '../data/sampleData';

const FILE_ICONS: Record<string, { bg: string; label: string }> = {
  pdf: { bg: '#ef4444', label: 'PDF' },
  docx: { bg: '#2563eb', label: 'DOC' },
  xlsx: { bg: '#16a34a', label: 'XLS' },
  pptx: { bg: '#ea580c', label: 'PPT' },
};

function StatCard({ label, value, icon: Icon, color, bg, sub }: {
  label: string; value: number; icon: typeof FileText;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ label, value, icon: Icon, color, bg, onClick }: {
  label: string; value: number; icon: typeof FileText;
  color: string; bg: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-blue-300 transition-all group w-full"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </button>
  );
}

export default function Dashboard({ onNavigate, onOpenDocument }: {
  onNavigate: (page: Page) => void;
  onOpenDocument: (id: string) => void;
}) {
  const total = DOCUMENTS.length;
  const pending = DOCUMENTS.filter(d => d.status === 'pending_review' || d.status === 'pending_approval').length;
  const approved = DOCUMENTS.filter(d => d.status === 'approved').length;
  const rejected = DOCUMENTS.filter(d => d.status === 'rejected').length;
  const revision = DOCUMENTS.filter(d => d.status === 'revision_requested').length;
  const myAction = 1; // Q4 Marketing Campaign assigned to current user

  const recent = [...DOCUMENTS].sort((a, b) =>
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  ).slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Good morning, Ahmed. Here is your workflow overview.</p>
        </div>
        <div className="text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          Thursday, 24 January 2025
        </div>
      </div>

      {/* Action required banner */}
      {myAction > 0 && (
        <div
          className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
          style={{ background: '#eff6ff', borderColor: '#93c5fd' }}
          onClick={() => onNavigate('pending-approvals')}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800">
              {myAction} document{myAction !== 1 ? 's' : ''} awaiting your action
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Q4 2025 Marketing Campaign Proposal is pending your review
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap">
            View Pending →
          </span>
        </div>
      )}

      {/* My Action + Quick Stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">My Workflow Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <ActionCard label="Awaiting My Action" value={myAction} icon={AlertCircle} color="#2563eb" bg="#eff6ff" onClick={() => onNavigate('pending-approvals')} />
          <ActionCard label="My Submitted" value={DOCUMENTS.filter(d => d.submittedBy === 'Ahmed Al-Rashid').length} icon={FileText} color="#0f6cbd" bg="#e0f2fe" onClick={() => onNavigate('my-documents')} />
          <ActionCard label="Approved" value={approved} icon={CheckCircle} color="#059669" bg="#ecfdf5" />
          <ActionCard label="Rejected" value={rejected} icon={XCircle} color="#dc2626" bg="#fef2f2" />
          <ActionCard label="Revision Pending" value={revision} icon={RotateCcw} color="#7c3aed" bg="#f5f3ff" />
        </div>
      </div>

      {/* {/* Organization Stats */}
      {/* <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Organization Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Documents" value={total} icon={FileText} color="#0f6cbd" bg="#eff6fc" sub="All-time" />
          <StatCard label="Pending" value={pending} icon={Clock} color="#d97706" bg="#fffbeb" sub="In workflow" />
          <StatCard label="Approved" value={approved} icon={CheckCircle} color="#059669" bg="#ecfdf5" sub="Fully approved" />
          <StatCard label="Rejected" value={rejected} icon={XCircle} color="#dc2626" bg="#fef2f2" sub="Requires resubmission" />
        </div>
      </div>  */}

      {/* Recent Documents */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Recent Documents</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest workflow activity across the organization</p>
          </div>
          <button
            onClick={() => onNavigate('my-documents')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Doc ID', 'Document Name', 'Submitted By', 'Current Holder', 'Workflow Step', 'Status', 'Last Updated', 'Actions'].map(col => (
                  <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((doc) => {
                const fi = FILE_ICONS[doc.fileType];
                const progress = doc.totalSteps > 0 ? Math.round((doc.currentStep / doc.totalSteps) * 100) : 0;
                return (
                  <tr key={doc.id} className="doc-table-row border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {doc.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                          style={{ background: fi.bg }}>
                          {fi.label}
                        </div>
                        <button
                          onClick={() => onOpenDocument(doc.id)}
                          className="font-medium text-slate-800 hover:text-blue-600 text-left transition-colors max-w-[200px] truncate"
                        >
                          {doc.title}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                          {doc.submittedByInitials}
                        </div>
                        <span className="text-slate-600 whitespace-nowrap">{doc.submittedBy}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {doc.currentHolder}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">
                            Step {doc.currentStep > 0 ? doc.currentStep : '—'} of {doc.totalSteps}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: doc.status === 'approved' ? '#10b981' : doc.status === 'rejected' ? '#ef4444' : '#3b82f6',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status as DocumentStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {doc.lastUpdated}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenDocument(doc.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => onOpenDocument(doc.id)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                        >
                          <GitBranch size={12} /> Track
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
