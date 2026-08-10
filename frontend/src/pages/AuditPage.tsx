import {
    Search,
    Download,
    ChevronDown,
    FileText,
  } from 'lucide-react';
  import { useMemo, useState } from 'react';
  
  type AuditAction =
    | 'Document Submitted'
    | 'Reviewed & Cleared'
    | 'Approved'
    | 'Rejected'
    | 'Revision Requested';
  
  type AuditRecord = {
    id: string;
    date: string;
    time: string;
    document: string;
    documentId: string;
    user: string;
    initials: string;
    role: string;
    action: AuditAction;
    comments: string;
  };
  
  const auditRecords: AuditRecord[] = [
    {
      id: '1',
      date: '2025-01-20',
      time: '09:15:42',
      document: 'Annual Budget Proposal FY2025',
      documentId: 'DOC-2025-0124',
      user: 'Ahmed Al-Rashid',
      initials: 'AA',
      role: 'Submitter',
      action: 'Document Submitted',
      comments: '—',
    },
    {
      id: '2',
      date: '2025-01-21',
      time: '11:32:10',
      document: 'Annual Budget Proposal FY2025',
      documentId: 'DOC-2025-0124',
      user: 'Jennifer Park',
      initials: 'JP',
      role: 'Reviewer',
      action: 'Reviewed & Cleared',
      comments: 'Headcount figures aligned with budget.',
    },
    {
      id: '3',
      date: '2025-01-22',
      time: '14:28:55',
      document: 'Annual Budget Proposal FY2025',
      documentId: 'DOC-2025-0124',
      user: 'Sarah Mitchell',
      initials: 'SM',
      role: 'Approver',
      action: 'Approved',
      comments: 'Aligns with strategic objectives.',
    },
    {
      id: '4',
      date: '2025-01-18',
      time: '13:45:00',
      document: 'Employee Handbook Revision Q1 2025',
      documentId: 'DOC-2025-0118',
      user: 'Jennifer Park',
      initials: 'JP',
      role: 'Submitter',
      action: 'Document Submitted',
      comments: '—',
    },
    {
      id: '5',
      date: '2025-01-20',
      time: '10:12:33',
      document: 'Employee Handbook Revision Q1 2025',
      documentId: 'DOC-2025-0118',
      user: 'Ahmed Al-Rashid',
      initials: 'AA',
      role: 'Reviewer',
      action: 'Reviewed & Cleared',
      comments: 'Financial section reviewed.',
    },
  ];
  
  const actionOptions = [
    'All Actions',
    'Document Submitted',
    'Reviewed & Cleared',
    'Approved',
    'Rejected',
    'Revision Requested',
  ];
  
  function ActionBadge({
    action,
  }: {
    action: AuditAction;
  }) {
    const styles: Record<AuditAction, string> = {
      'Document Submitted':
        'bg-amber-50 text-amber-700',
  
      'Reviewed & Cleared':
        'bg-blue-50 text-blue-700',
  
      Approved:
        'bg-emerald-50 text-emerald-700',
  
      Rejected:
        'bg-red-50 text-red-700',
  
      'Revision Requested':
        'bg-violet-50 text-violet-700',
    };
  
    return (
      <span
        className={`
          inline-flex
          items-center
          px-2
          py-1
          rounded
          text-[10px]
          sm:text-xs
          font-medium
          whitespace-nowrap
          ${styles[action]}
        `}
      >
        {action}
      </span>
    );
  }
  
  function UserAvatar({
    initials,
  }: {
    initials: string;
  }) {
    return (
      <div
        className="
          w-7
          h-7
          rounded-full
          bg-slate-100
          text-slate-600
          flex
          items-center
          justify-center
          text-[9px]
          font-semibold
          flex-shrink-0
        "
      >
        {initials}
      </div>
    );
  }
  
  function DownloadButton() {
    return (
      <button
        type="button"
        className="
          inline-flex
          items-center
          justify-center
          gap-1.5
          px-3
          py-2
          rounded-lg
          border
          border-slate-200
          bg-white
          text-slate-600
          text-xs
          font-medium
          hover:bg-slate-50
          transition-colors
        "
      >
        <Download size={13} />
        <span>Download</span>
      </button>
    );
  }
  
  function AuditMobileCard({
    record,
  }: {
    record: AuditRecord;
  }) {
    return (
      <article
        className="
          bg-white
          border
          border-slate-200
          rounded-xl
          p-4
          shadow-sm
        "
      >
        {/* Top */}
        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-medium
                text-slate-900
              "
            >
              {record.document}
            </p>
  
            <p
              className="
                text-[10px]
                font-mono
                text-slate-400
                mt-1
              "
            >
              {record.documentId}
            </p>
          </div>
  
          <ActionBadge action={record.action} />
        </div>
  
        {/* Divider */}
        <div className="border-t border-slate-100 my-3" />
  
        {/* User */}
        <div
          className="
            flex
            items-center
            gap-2.5
          "
        >
          <UserAvatar initials={record.initials} />
  
          <div>
            <p
              className="
                text-xs
                font-medium
                text-slate-800
              "
            >
              {record.user}
            </p>
  
            <p
              className="
                text-[10px]
                text-slate-400
                mt-0.5
              "
            >
              {record.role}
            </p>
          </div>
        </div>
  
        {/* Date / Time */}
        <div
          className="
            flex
            items-center
            gap-2
            mt-3
            text-[11px]
            text-slate-500
          "
        >
          <span>{record.date}</span>
  
          <span className="text-slate-300">
            •
          </span>
  
          <span>{record.time}</span>
        </div>
  
        {/* Comments */}
        {record.comments !== '—' && (
          <div className="mt-3">
            <p
              className="
                text-[10px]
                uppercase
                tracking-wide
                text-slate-400
                mb-1
              "
            >
              Comments
            </p>
  
            <p
              className="
                text-xs
                text-slate-600
                leading-relaxed
              "
            >
              {record.comments}
            </p>
          </div>
        )}
  
        {/* Download */}
        <div
          className="
            mt-3
            pt-3
            border-t
            border-slate-100
            flex
            justify-end
          "
        >
          <DownloadButton />
        </div>
      </article>
    );
  }
  
  export default function AuditTrail() {
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] =
      useState('All Actions');
  
    const filteredRecords = useMemo(() => {
      const query = search.toLowerCase().trim();
  
      return auditRecords.filter(record => {
        const matchesSearch =
          !query ||
          record.document
            .toLowerCase()
            .includes(query) ||
          record.documentId
            .toLowerCase()
            .includes(query) ||
          record.user
            .toLowerCase()
            .includes(query);
  
        const matchesAction =
          actionFilter === 'All Actions' ||
          record.action === actionFilter;
  
        return matchesSearch && matchesAction;
      });
    }, [search, actionFilter]);
  
    return (
      <main
        className="
          w-full
          px-3
          sm:px-6
          py-5
          sm:py-7
        "
      >
        {/* Header */}
        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-start
            sm:justify-between
            gap-4
            mb-5
          "
        >
          <div>
            <h1
              className="
                text-xl
                sm:text-2xl
                font-bold
                text-slate-900
              "
            >
              Audit Trail
            </h1>
  
            <p
              className="
                text-xs
                sm:text-sm
                text-slate-500
                mt-1
              "
            >
              Complete action log across all documents
              in the system
            </p>
          </div>
  
          <button
            type="button"
            className="
              self-start
              inline-flex
              items-center
              justify-center
              gap-2
              min-h-[38px]
              px-3
              sm:px-4
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-600
              text-xs
              sm:text-sm
              font-medium
              hover:bg-slate-50
              transition-colors
            "
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
  
        {/* Filters */}
        <section
          className="
            bg-white
            border
            border-slate-200
            rounded-xl
            p-3
            sm:p-4
            mb-4
          "
        >
          <div
            className="
              flex
              flex-col
              lg:flex-row
              gap-2.5
            "
          >
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
                onChange={e =>
                  setSearch(e.target.value)
                }
                placeholder="
                  Search by document, user, or ID...
                "
                className="
                  w-full
                  h-10
                  pl-9
                  pr-3
                  rounded-lg
                  border
                  border-slate-200
                  bg-slate-50/50
                  text-sm
                  text-slate-700
                  placeholder:text-slate-400
                  outline-none
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
  
            {/* Action filter */}
            <div
              className="
                relative
                w-full
                lg:w-[190px]
              "
            >
              <select
                value={actionFilter}
                onChange={e =>
                  setActionFilter(e.target.value)
                }
                className="
                  appearance-none
                  w-full
                  h-10
                  px-3
                  pr-8
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                {actionOptions.map(action => (
                  <option
                    key={action}
                    value={action}
                  >
                    {action}
                  </option>
                ))}
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
  
            {/* Record count */}
            <div
              className="
                flex
                items-center
                justify-center
                lg:px-2
                text-xs
                text-slate-400
                whitespace-nowrap
              "
            >
              {filteredRecords.length} records
            </div>
          </div>
        </section>
  
        {/* ========================= */}
        {/* MOBILE CARDS               */}
        {/* ========================= */}
  
        <div
          className="
            block
            lg:hidden
            space-y-2.5
          "
        >
          {filteredRecords.map(record => (
            <AuditMobileCard
              key={record.id}
              record={record}
            />
          ))}
        </div>
  
        {/* ========================= */}
        {/* DESKTOP TABLE              */}
        {/* ========================= */}
  
        <div
          className="
            hidden
            lg:block
            bg-white
            border
            border-slate-200
            rounded-xl
            overflow-hidden
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr
                  className="
                    bg-slate-50
                    border-b
                    border-slate-200
                  "
                >
                  <th className="table-header">
                    DATE
                  </th>
  
                  <th className="table-header">
                    TIME
                  </th>
  
                  <th className="table-header">
                    DOCUMENT
                  </th>
  
                  <th className="table-header">
                    USER
                  </th>
  
                  <th className="table-header">
                    ROLE
                  </th>
  
                  <th className="table-header">
                    ACTION
                  </th>
  
                  <th className="table-header">
                    COMMENTS
                  </th>
  
                  <th className="table-header">
                    DOWNLOAD
                  </th>
                </tr>
              </thead>
  
              <tbody>
                {filteredRecords.map(record => (
                  <tr
                    key={record.id}
                    className="
                      border-b
                      border-slate-100
                      last:border-b-0
                      hover:bg-slate-50/50
                      transition-colors
                    "
                  >
                    {/* Date */}
                    <td className="table-cell">
                      {record.date}
                    </td>
  
                    {/* Time */}
                    <td className="table-cell font-mono">
                      {record.time}
                    </td>
  
                    {/* Document */}
                    <td className="table-cell">
                      <div className="max-w-[210px]">
                        <p
                          className="
                            text-sm
                            font-medium
                            text-slate-800
                            truncate
                          "
                        >
                          {record.document}
                        </p>
  
                        <p
                          className="
                            text-[10px]
                            font-mono
                            text-slate-400
                            mt-1
                          "
                        >
                          {record.documentId}
                        </p>
                      </div>
                    </td>
  
                    {/* User */}
                    <td className="table-cell">
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <UserAvatar
                          initials={record.initials}
                        />
  
                        <span
                          className="
                            text-sm
                            text-slate-700
                            whitespace-nowrap
                          "
                        >
                          {record.user}
                        </span>
                      </div>
                    </td>
  
                    {/* Role */}
                    <td className="table-cell">
                      {record.role}
                    </td>
  
                    {/* Action */}
                    <td className="table-cell">
                      <ActionBadge
                        action={record.action}
                      />
                    </td>
  
                    {/* Comments */}
                    <td className="table-cell">
                      <p
                        className="
                          max-w-[150px]
                          text-xs
                          text-slate-500
                          truncate
                        "
                      >
                        {record.comments}
                      </p>
                    </td>
  
                    {/* Download */}
                    <td className="table-cell">
                      <DownloadButton />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Empty */}
        {filteredRecords.length === 0 && (
          <div
            className="
              bg-white
              border
              border-slate-200
              rounded-xl
              py-12
              text-center
              mt-3
            "
          >
            <FileText
              size={28}
              className="
                mx-auto
                text-slate-300
              "
            />
  
            <p
              className="
                mt-3
                text-sm
                font-medium
                text-slate-700
              "
            >
              No audit records found
            </p>
  
            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              Try changing your search or action filter.
            </p>
          </div>
        )}
      </main>
    );
  }