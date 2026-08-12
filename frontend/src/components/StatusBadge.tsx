import type { DocumentStatus } from '../types/document';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  revision_requested: {
    label: 'Revision Requested',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  deleted: {
    label: 'Deleted',
    className: 'bg-slate-100 text-slate-600 border border-slate-300',
  },
};

export default function StatusBadge({ status, size = 'sm' }: { status: DocumentStatus; size?: 'xs' | 'sm' }) {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded font-semibold tracking-wide ${sizeClass} ${config.className}`}>
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
        style={{
          backgroundColor:
            status === 'draft' ? '#6b7280' :
            status === 'pending_review' ? '#0f6cbd' :
            status === 'pending_approval' ? '#d97706' :
            status === 'revision_requested' ? '#7c3aed' :
            status === 'approved' ? '#059669' :
            status === 'deleted' ? '#64748b' : '#dc2626',
        }}
      />
      {config.label}
    </span>
  );
}
