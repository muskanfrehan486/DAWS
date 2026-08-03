
export const EMAIL_TEMPLATES = [
  {
    id: 'submitted',
    name: 'Document Submitted',
    subject: 'Document Submitted for Approval: {{document_title}}',
    badge: 'info',
    preview: (
      <div>
        <p className="mb-3">Dear <strong>{"{{approver_name}}"}</strong>,</p>
        <p className="mb-3">
          A new document has been submitted for your review and approval.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 text-xs">
          <p><strong>Document:</strong> {"{{document_title}}"}</p>
          <p><strong>Submitted by:</strong> {"{{submitter_name}}"}</p>
          <p><strong>Date:</strong> {"{{submission_date}}"}</p>
          <p><strong>Step:</strong> {"{{workflow_step}}"}</p>
        </div>
        <p className="mb-4">Please review the document at your earliest convenience.</p>
      </div>
    ),
  },
  {
    id: 'review_required',
    name: 'Review Required',
    subject: 'Action Required: Review Document — {{document_title}}',
    badge: 'review',
    preview: (
      <div>
        <p className="mb-3">Dear <strong>{"{{reviewer_name}}"}</strong>,</p>
        <p className="mb-3">
          You have been assigned to review the following document.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs">
          <p><strong>Document:</strong> {"{{document_title}}"}</p>
          <p><strong>Submitted by:</strong> {"{{submitter_name}}"}</p>
          <p><strong>Due by:</strong> {"{{due_date}}"}</p>
        </div>
        <p className="mb-4">Your review is needed before the document proceeds to the next step.</p>
      </div>
    ),
  },
  {
    id: 'approval_required',
    name: 'Approval Required',
    subject: 'Approval Required: {{document_title}}',
    badge: 'approval',
    preview: (
      <div>
        <p className="mb-3">Dear <strong>{"{{approver_name}}"}</strong>,</p>
        <p className="mb-3">
          The following document has completed prior review steps and now requires your approval.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs">
          <p><strong>Document:</strong> {"{{document_title}}"}</p>
          <p><strong>Submitted by:</strong> {"{{submitter_name}}"}</p>
          <p><strong>Previous Approvers:</strong> {"{{previous_approvers}}"}</p>
        </div>
      </div>
    ),
  },
  {
    id: 'revision_requested',
    name: 'Revision Requested',
    subject: 'Revision Required: {{document_title}}',
    badge: 'revision',
    preview: (
      <div>
        <p className="mb-3">Dear <strong>{"{{submitter_name}}"}</strong>,</p>
        <p className="mb-3">
          A revision has been requested for the document you submitted.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 text-xs">
          <p><strong>Document:</strong> {"{{document_title}}"}</p>
          <p><strong>Requested by:</strong> {"{{reviewer_name}}"}</p>
          <p><strong>Comments:</strong> {"{{revision_comments}}"}</p>
        </div>
        <p className="mb-4">Please revise the document and resubmit at your earliest convenience.</p>
      </div>
    ),
  },
  {
    id: 'approved',
    name: 'Document Approved',
    subject: 'Document Approved: {{document_title}}',
    badge: 'approved',
    preview: (
      <div>
        <p className="mb-3">Dear <strong>{"{{submitter_name}}"}</strong>,</p>
        <p className="mb-3 text-emerald-700 font-semibold">
          Your document has been fully approved by all required approvers.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3 text-xs">
          <p><strong>Document:</strong> {"{{document_title}}"}</p>
          <p><strong>Final Approver:</strong> {"{{final_approver}}"}</p>
          <p><strong>Date:</strong> {"{{approval_date}}"}</p>
        </div>
      </div>
    ),
  },
  {
    id: 'rejected',
    name: 'Document Rejected',
    subject: 'Document Rejected: {{document_title}}',
    badge: 'rejected',
    preview: (
      <div>
        <p className="mb-3">Dear <strong>{"{{submitter_name}}"}</strong>,</p>
        <p className="mb-3 text-red-700 font-semibold">
          Your document submission has been rejected.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs">
          <p><strong>Document:</strong> {"{{document_title}}"}</p>
          <p><strong>Rejected by:</strong> {"{{rejector_name}}"}</p>
          <p><strong>Reason:</strong> {"{{rejection_reason}}"}</p>
        </div>
      </div>
    ),
  },
];