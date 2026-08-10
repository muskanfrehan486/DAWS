import { useState } from 'react';
import {
    Eye,
    CheckCircle,
    XCircle,
    RotateCcw,
    GitBranch,
    Clock,
    AlertCircle,
  } from 'lucide-react';
  
  type PendingDocument = {
    id: string;
    title: string;
    fileType: 'pdf';
    fileName: string;
    fileSize: string;
    submittedBy: string;
    submittedDate: string;
    currentStep: number;
    totalSteps: number;
    dueIn: string;
    description: string;
  };
  
  const pendingDocuments: PendingDocument[] = [
    {
      id: 'DOC-2025-0122',
      title: 'Q4 2025 Marketing Campaign Proposal',
      fileType: 'pdf',
      fileName: 'Marketing_Campaign_Q4_2025.pptx',
      fileSize: '15.2 MB',
      submittedBy: 'Lisa Wang',
      submittedDate: '2025-01-22',
      currentStep: 1,
      totalSteps: 3,
      dueIn: '3 days',
      description:
        'Integrated digital and traditional marketing campaign proposal for Q4 2025 including creative briefs, channel strategy, budget breakdowns, and projected ROI metrics.',
    },
  ];
  
  const FILE_ICONS = {
    pdf: {
      bg: '#ef4444',
      label: 'PDF',
    },
    docx: {
      bg: '#2563eb',
      label: 'DOC',
    },
    xlsx: {
      bg: '#16a34a',
      label: 'XLS',
    },
    pptx: {
      bg: '#ea580c',
      label: 'PPT',
    },
  };
  
  function FileIcon({
    fileType,
  }: {
    fileType: PendingDocument['fileType'];
  }) {
    const icon = FILE_ICONS[fileType];
  
    return (
      <div
        className="
          w-11 h-11
          sm:w-11 sm:h-11
          rounded-xl
          flex items-center justify-center
          text-white
          text-[10px]
          font-bold
          flex-shrink-0
        "
        style={{ backgroundColor: icon.bg }}
      >
        {icon.label}
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
    const progress =
      totalSteps > 0
        ? Math.round((currentStep / totalSteps) * 100)
        : 0;
  
    return (
      <div className="flex items-center gap-2">
        <GitBranch
          size={14}
          className="text-slate-500 flex-shrink-0"
        />
  
        <span className="text-xs text-slate-600 whitespace-nowrap">
          Step {currentStep} of {totalSteps} in workflow
        </span>
  
        <div className="
          hidden
          sm:block
          w-16
          h-1.5
          bg-slate-100
          rounded-full
          overflow-hidden
        ">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
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
  }: {
    document: PendingDocument;
    onOpen: (id: string) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onRevision: (id: string) => void;
  }) {
    return (
      <article
        className="
          bg-white
          rounded-xl
          border
          border-blue-200
          shadow-sm
          hover:shadow-md
          transition-shadow
          overflow-hidden
        "
      >
        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="
            flex
            items-start
            gap-3
          ">
            <FileIcon fileType={document.fileType} />
  
            <div className="
              flex-1
              min-w-0
            ">
              <h2 className="
                text-sm
                sm:text-base
                font-semibold
                text-slate-900
                leading-snug
                pr-1
              ">
                {document.title}
              </h2>
  
              {/* ID */}
              <p className="
                text-[10px]
                sm:text-xs
                text-slate-400
                font-mono
                mt-1
              ">
                {document.id}
              </p>
            </div>
  
            {/* Status */}
            <span className="
              flex-shrink-0
              inline-flex
              items-center
              px-2.5
              py-1
              rounded-lg
              border
              border-indigo-200
              bg-indigo-50
              text-indigo-600
              text-[10px]
              sm:text-xs
              font-medium
              whitespace-nowrap
            ">
              <span className="
                hidden
                sm:inline
              ">
                Review Required
              </span>
  
              <span className="sm:hidden">
                Review
              </span>
            </span>
          </div>
  
          {/* Document metadata */}
          <div className="
            mt-4
            grid
            grid-cols-1
            sm:flex
            sm:flex-wrap
            gap-y-2
            gap-x-4
          ">
            <div className="
              flex
              items-center
              gap-1.5
            ">
              <span className="
                text-[10px]
                sm:text-xs
                text-slate-500
              ">
                {document.submittedBy}
              </span>
            </div>
  
            <span className="
              hidden
              sm:block
              text-slate-300
            ">
              •
            </span>
  
            <span className="
              text-[10px]
              sm:text-xs
              text-slate-400
            ">
              {document.submittedDate}
            </span>
          </div>
  
          {/* Workflow / Due / File */}
          <div className="
            mt-3
            flex
            flex-col
            sm:flex-row
            sm:items-center
            gap-2
            sm:gap-4
          ">
            <WorkflowProgress
              currentStep={document.currentStep}
              totalSteps={document.totalSteps}
            />
  
            <span className="
              hidden
              sm:block
              text-slate-300
            ">
              •
            </span>
  
            <div className="
              flex
              items-center
              gap-1.5
            ">
              <Clock
                size={13}
                className="text-slate-500"
              />
  
              <span className="
                text-xs
                text-slate-600
              ">
                Due in {document.dueIn}
              </span>
            </div>
          </div>
  
          {/* File */}
          <div className="
            mt-3
            text-xs
            text-slate-400
            truncate
          ">
            <span className="truncate">
              {document.fileName}
            </span>
  
            <span className="mx-1">
              •
            </span>
  
            <span>
              {document.fileSize}
            </span>
          </div>
  
          {/* Description */}
          <p className="
            mt-3
            text-xs
            sm:text-sm
            text-slate-500
            leading-relaxed
          ">
            {document.description}
          </p>
  
          {/* Actions */}
          <div className="
            mt-4
            pt-3
            border-t
            border-slate-100
            flex
            flex-wrap
            gap-2
          ">
            {/* Open */}
            <button
              type="button"
              onClick={() => onOpen(document.id)}
              className="
                flex
                items-center
                justify-center
                gap-1.5
                px-3
                py-2
                min-h-[38px]
                rounded-lg
                border
                border-slate-200
                bg-white
                text-slate-700
                text-xs
                font-medium
                hover:bg-slate-50
                active:bg-slate-100
                transition-colors
                w-full
                sm:w-auto
              "
            >
              <Eye size={14} />
              Open Document
            </button>
  
            {/* Approve */}
            <button
              type="button"
              onClick={() => onApprove(document.id)}
              className="
                flex
                items-center
                justify-center
                gap-1.5
                px-3
                py-2
                min-h-[38px]
                rounded-lg
                bg-emerald-600
                text-white
                text-xs
                font-semibold
                hover:bg-emerald-700
                active:bg-emerald-800
                transition-colors
                flex-1
                sm:flex-none
              "
            >
              <CheckCircle size={14} />
              Approve
            </button>
  
            {/* Reject */}
            <button
              type="button"
              onClick={() => onReject(document.id)}
              className="
                flex
                items-center
                justify-center
                gap-1.5
                px-3
                py-2
                min-h-[38px]
                rounded-lg
                bg-red-600
                text-white
                text-xs
                font-semibold
                hover:bg-red-700
                active:bg-red-800
                transition-colors
                flex-1
                sm:flex-none
              "
            >
              <XCircle size={14} />
              Reject
            </button>
  
            {/* Revision */}
            <button
              type="button"
              onClick={() => onRevision(document.id)}
              className="
                flex
                items-center
                justify-center
                gap-1.5
                px-3
                py-2
                min-h-[38px]
                rounded-lg
                border
                border-violet-200
                bg-violet-50
                text-violet-600
                text-xs
                font-medium
                hover:bg-violet-100
                active:bg-violet-200
                transition-colors
                w-full
                sm:w-auto
              "
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
    const [documents] = useState<PendingDocument[]>(
      pendingDocuments
    );
  
    const handleApprove = (id: string) => {
      console.log('Approve:', id);
  
      // Later:
      // await approveDocument(id);
    };
  
    const handleReject = (id: string) => {
      console.log('Reject:', id);
  
      // Later:
      // await rejectDocument(id);
    };
  
    const handleRevision = (id: string) => {
      console.log('Request revision:', id);
  
      // Later:
      // open revision comment modal
    };
  
    return (
      <main className="
        w-full
        max-w-[1400px]
        mx-auto
        px-3
        py-5
        sm:px-6
        sm:py-7
      ">
        {/* Page header */}
        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-start
          sm:justify-between
          gap-3
          mb-5
          sm:mb-6
        ">
          <div>
            <h1 className="
              text-xl
              sm:text-2xl
              font-bold
              text-slate-900
            ">
              Pending Approvals
            </h1>
  
            <p className="
              text-xs
              sm:text-sm
              text-slate-500
              mt-1
            ">
              Documents awaiting your review or approval action
            </p>
          </div>
  
          {/* Action count */}
          <div className="
            self-start
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-lg
            border
            border-amber-300
            bg-amber-50
            text-amber-700
            text-xs
            sm:text-sm
            font-medium
          ">
            <AlertCircle size={15} />
  
            <span>
              {documents.length} action
              {documents.length !== 1 ? 's' : ''} required
            </span>
          </div>
        </div>
  
        {/* Pending documents */}
        <div className="space-y-4">
          {documents.map(document => (
            <PendingDocumentCard
              key={document.id}
              document={document}
              onOpen={onOpenDocument}
              onApprove={handleApprove}
              onReject={handleReject}
              onRevision={handleRevision}
            />
          ))}
        </div>
  
        {/* Empty state */}
        {documents.length === 0 && (
          <div className="
            bg-white
            border
            border-slate-200
            rounded-xl
            py-14
            px-6
            text-center
          ">
            <div className="
              w-12
              h-12
              rounded-xl
              bg-emerald-50
              flex
              items-center
              justify-center
              mx-auto
              mb-3
            ">
              <CheckCircle
                size={24}
                className="text-emerald-600"
              />
            </div>
  
            <h2 className="
              text-sm
              font-semibold
              text-slate-800
            ">
              You're all caught up
            </h2>
  
            <p className="
              text-xs
              text-slate-400
              mt-1
            ">
              There are no documents waiting for your action.
            </p>
          </div>
        )}
      </main>
    );
  }