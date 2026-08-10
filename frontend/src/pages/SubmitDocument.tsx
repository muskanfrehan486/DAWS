import {
    FileText,
    Upload,
    ArrowRight,
    Plus,
    X,
    ChevronDown,
  } from 'lucide-react';
  import { useRef, useState } from 'react';
  
  type ApprovalType = 'Reviewer' | 'Approver' | 'Final Approver';
  
  type ApprovalStep = {
    id: string;
    type: ApprovalType;
    assignedUser: string;
    instructions: string;
  };
  
  const APPROVAL_TYPES: ApprovalType[] = [
    'Reviewer',
    'Approver',
    'Final Approver',
  ];
  
  export default function SubmitDocument() {
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
  
    const [steps, setSteps] = useState<ApprovalStep[]>([
      {
        id: crypto.randomUUID(),
        type: 'Reviewer',
        assignedUser: '',
        instructions: '',
      },
    ]);
  
    const addApprovalStep = () => {
      setSteps(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'Reviewer',
          assignedUser: '',
          instructions: '',
        },
      ]);
    };
  
    const removeApprovalStep = (id: string) => {
      setSteps(prev => prev.filter(step => step.id !== id));
    };
  
    const updateStep = (
      id: string,
      field: keyof ApprovalStep,
      value: string,
    ) => {
      setSteps(prev =>
        prev.map(step =>
          step.id === id
            ? { ...step, [field]: value }
            : step,
        ),
      );
    };
  
    const handleFileChange = (
      selectedFile?: File,
    ) => {
      if (!selectedFile) return;
  
      setFile(selectedFile);
    };
  
    const handleDrop = (
      e: React.DragEvent<HTMLDivElement>,
    ) => {
      e.preventDefault();
  
      const droppedFile = e.dataTransfer.files[0];
  
      if (droppedFile) {
        handleFileChange(droppedFile);
      }
    };
  
    const handleSubmit = () => {
      // Later connect this to your API:
      //
      // const formData = new FormData();
      // formData.append('title', title);
      // formData.append('description', description);
      // formData.append('file', file);
      // formData.append(
      //   'approvalChain',
      //   JSON.stringify(steps),
      // );
      //
      // await createDocument(formData);
  
      console.log({
        title,
        description,
        file,
        approvalChain: steps,
      });
    };
  
    return (
      <main
        className="
          w-full
          max-w-[1100px]
          mx-auto
          px-3
          py-5
          sm:px-6
          sm:py-7
        "
      >
        {/* Breadcrumb */}
        <div className="
          flex
          items-center
          gap-2
          text-xs
          sm:text-sm
          mb-5
          sm:mb-6
        ">
          <span className="text-slate-400">
            Dashboard
          </span>
  
          <span className="text-slate-300">
            /
          </span>
  
          <span className="text-blue-600 font-medium">
            Submit Document
          </span>
        </div>
  
        {/* Page Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="
            text-xl
            sm:text-2xl
            font-bold
            text-slate-900
          ">
            Submit Document
          </h1>
  
          <p className="
            text-xs
            sm:text-sm
            text-slate-500
            mt-1
          ">
            Upload a document and define the approval chain
            before submitting for review.
          </p>
        </div>
  
        {/* Document Information */}
        <section className="
          bg-white
          rounded-xl
          border
          border-slate-200
          overflow-hidden
          mb-4
          sm:mb-5
        ">
          {/* Section Header */}
          <div className="
            px-4
            py-3.5
            sm:px-5
            sm:py-4
            border-b
            border-slate-100
            flex
            items-center
            gap-3
          ">
            <div className="
              w-8
              h-8
              rounded-lg
              bg-blue-50
              flex
              items-center
              justify-center
              flex-shrink-0
            ">
              <FileText
                size={16}
                className="text-blue-600"
              />
            </div>
  
            <div>
              <h2 className="
                text-sm
                font-semibold
                text-slate-900
              ">
                Document Information
              </h2>
  
              <p className="
                text-[11px]
                sm:text-xs
                text-slate-400
                mt-0.5
              ">
                Provide title and description for the document
              </p>
            </div>
          </div>
  
          {/* Form */}
          <div className="
            p-4
            sm:p-5
            space-y-5
          ">
            <div>
              <label className="
                block
                text-sm
                font-medium
                text-slate-700
                mb-2
              ">
                Document Title
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>
  
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Annual Budget Proposal FY2025"
                className="
                  w-full
                  h-10
                  px-3
                  text-sm
                  border
                  border-slate-200
                  rounded-lg
                  outline-none
                  text-slate-700
                  placeholder:text-slate-400
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
  
            <div>
              <label className="
                block
                text-sm
                font-medium
                text-slate-700
                mb-2
              ">
                Description / Notes
                <span className="
                  text-slate-400
                  font-normal
                  ml-1
                ">
                  (Optional)
                </span>
              </label>
  
              <textarea
                value={description}
                onChange={e =>
                  setDescription(e.target.value)
                }
                rows={4}
                placeholder="
                  Briefly describe the document purpose and
                  any relevant context for approvers...
                "
                className="
                  w-full
                  px-3
                  py-2.5
                  text-sm
                  border
                  border-slate-200
                  rounded-lg
                  outline-none
                  resize-none
                  text-slate-700
                  placeholder:text-slate-400
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
          </div>
        </section>
  
        {/* Upload */}
        <section className="
          bg-white
          rounded-xl
          border
          border-slate-200
          overflow-hidden
          mb-4
          sm:mb-5
        ">
          {/* Header */}
          <div className="
            px-4
            py-3.5
            sm:px-5
            sm:py-4
            border-b
            border-slate-100
            flex
            items-center
            gap-3
          ">
            <div className="
              w-8
              h-8
              rounded-lg
              bg-violet-50
              flex
              items-center
              justify-center
              flex-shrink-0
            ">
              <Upload
                size={16}
                className="text-violet-600"
              />
            </div>
  
            <div>
              <h2 className="
                text-sm
                font-semibold
                text-slate-900
              ">
                Upload Document
              </h2>
  
              <p className="
                text-[11px]
                sm:text-xs
                text-slate-400
                mt-0.5
              ">
                Supported: PDF, Word (.doc/.docx),
                Excel, PowerPoint
              </p>
            </div>
          </div>
  
          {/* Drop zone */}
          <div className="p-4 sm:p-5">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                min-h-[190px]
                sm:min-h-[230px]
                border-2
                border-dashed
                border-slate-200
                rounded-xl
                bg-slate-50/30
                flex
                flex-col
                items-center
                justify-center
                text-center
                px-4
                cursor-pointer
                hover:border-blue-300
                hover:bg-blue-50/20
                transition-colors
              "
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="
                  .pdf,
                  .doc,
                  .docx,
                  .xls,
                  .xlsx,
                  .ppt,
                  .pptx
                "
                onChange={e =>
                  handleFileChange(
                    e.target.files?.[0],
                  )
                }
              />
  
              {file ? (
                <>
                  <div className="
                    w-12
                    h-12
                    rounded-xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    mb-3
                  ">
                    <FileText
                      size={24}
                      className="text-blue-600"
                    />
                  </div>
  
                  <p className="
                    text-sm
                    font-medium
                    text-slate-800
                    break-all
                  ">
                    {file.name}
                  </p>
  
                  <p className="
                    text-xs
                    text-slate-400
                    mt-1
                  ">
                    {(file.size / 1024 / 1024).toFixed(1)}
                    {' '}
                    MB
                  </p>
  
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="
                      mt-3
                      text-xs
                      text-red-600
                      hover:text-red-700
                    "
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <div className="
                    w-12
                    h-12
                    rounded-xl
                    bg-slate-100
                    flex
                    items-center
                    justify-center
                    mb-3
                  ">
                    <Upload
                      size={23}
                      className="text-slate-400"
                    />
                  </div>
  
                  <p className="
                    text-sm
                    font-medium
                    text-slate-700
                  ">
                    Drag & drop your file here
                  </p>
  
                  <p className="
                    text-xs
                    text-blue-500
                    mt-1
                  ">
                    or click to browse from your computer
                  </p>
  
                  {/* File types */}
                  <div className="
                    flex
                    flex-wrap
                    justify-center
                    gap-1.5
                    mt-4
                  ">
                    {[
                      'PDF',
                      'DOC',
                      'DOCX',
                      'XLS',
                      'XLSX',
                      'PPT',
                      'PPTX',
                    ].map(type => (
                      <span
                        key={type}
                        className="
                          px-2
                          py-1
                          rounded
                          bg-slate-100
                          text-[10px]
                          font-medium
                          text-slate-500
                        "
                      >
                        {type}
                      </span>
                    ))}
                  </div>
  
                  <p className="
                    text-[11px]
                    text-slate-400
                    mt-3
                  ">
                    Maximum file size: 50 MB
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
  
        {/* Approval Chain */}
        <section className="
          bg-white
          rounded-xl
          border
          border-slate-200
          overflow-hidden
          mb-5"
        >
          {/* Header */}
          <div className="
            px-4
            py-3.5
            sm:px-5
            sm:py-4
            border-b
            border-slate-100
            flex
            items-center
            justify-between
            gap-3
          ">
            <div className="
              flex
              items-center
              gap-3
              min-w-0
            ">
              <div className="
                w-8
                h-8
                rounded-lg
                bg-orange-50
                flex
                items-center
                justify-center
                flex-shrink-0
              ">
                <ArrowRight
                  size={16}
                  className="text-orange-500"
                />
              </div>
  
              <div className="min-w-0">
                <h2 className="
                  text-sm
                  font-semibold
                  text-slate-900
                ">
                  Approval Chain Builder
                </h2>
  
                <p className="
                  text-[11px]
                  sm:text-xs
                  text-slate-400
                  mt-0.5
                  truncate
                ">
                  Define the review and approval sequence
                  for this document
                </p>
              </div>
            </div>
  
            <span className="
              flex-shrink-0
              px-2
              py-1
              rounded
              bg-slate-100
              text-[10px]
              sm:text-xs
              text-slate-500
              font-medium
            ">
              {steps.length} step
              {steps.length !== 1 ? 's' : ''}
            </span>
          </div>
  
          {/* Steps */}
          <div className="
            p-4
            sm:p-5
          ">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="
                    relative
                    border
                    border-slate-200
                    rounded-xl
                    p-3
                    sm:p-4
                    bg-slate-50/30
                  "
                >
                  {/* Step header */}
                  <div className="
                    flex
                    items-center
                    justify-between
                    mb-4
                  ">
                    <div className="
                      flex
                      items-center
                      gap-2
                    ">
                      <div className="
                        w-7
                        h-7
                        rounded-full
                        bg-blue-600
                        text-white
                        flex
                        items-center
                        justify-center
                        text-xs
                        font-semibold
                      ">
                        {index + 1}
                      </div>
  
                      <span className="
                        text-xs
                        font-semibold
                        text-slate-700
                      ">
                        Approval Step {index + 1}
                      </span>
                    </div>
  
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeApprovalStep(step.id)
                        }
                        className="
                          w-8
                          h-8
                          rounded-lg
                          flex
                          items-center
                          justify-center
                          text-slate-400
                          hover:text-red-500
                          hover:bg-red-50
                          transition-colors
                        "
                        aria-label="Remove approval step"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
  
                  {/* Step fields */}
                  <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-4
                  ">
                    {/* Approval Type */}
                    <div>
                      <label className="
                        block
                        text-xs
                        font-medium
                        text-slate-600
                        mb-1.5
                      ">
                        Approval Type
                      </label>
  
                      <div className="relative">
                        <select
                          value={step.type}
                          onChange={e =>
                            updateStep(
                              step.id,
                              'type',
                              e.target.value,
                            )
                          }
                          className="
                            w-full
                            h-10
                            px-3
                            pr-9
                            border
                            border-slate-200
                            rounded-lg
                            bg-white
                            text-sm
                            text-slate-700
                            outline-none
                            appearance-none
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                          "
                        >
                          {APPROVAL_TYPES.map(type => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
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
                    </div>
  
                    {/* Assigned User */}
                    <div>
                      <label className="
                        block
                        text-xs
                        font-medium
                        text-slate-600
                        mb-1.5
                      ">
                        Assigned User
                      </label>
  
                      <input
                        type="text"
                        value={step.assignedUser}
                        onChange={e =>
                          updateStep(
                            step.id,
                            'assignedUser',
                            e.target.value,
                          )
                        }
                        placeholder="
                          Search and select user...
                        "
                        className="
                          w-full
                          h-10
                          px-3
                          border
                          border-slate-200
                          rounded-lg
                          bg-white
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
                  </div>
                </div>
              ))}
            </div>
  
            {/* Add step */}
            <button
              type="button"
              onClick={addApprovalStep}
              className="
                w-full
                mt-3
                min-h-[46px]
                rounded-xl
                border-2
                border-dashed
                border-blue-200
                text-blue-600
                text-sm
                font-medium
                flex
                items-center
                justify-center
                gap-2
                hover:bg-blue-50
                hover:border-blue-300
                active:bg-blue-100
                transition-colors
              "
            >
              <Plus size={16} />
              Add Approval Step
            </button>
          </div>
        </section>
  
        {/* Bottom actions */}
        <div className="
          flex
          flex-col-reverse
          sm:flex-row
          sm:items-center
          gap-2
          sm:gap-4
        ">
          <button
            type="button"
            onClick={handleSubmit}
            className="
              w-full
              sm:w-auto
              min-h-[44px]
              px-5
              rounded-lg
              bg-blue-600
              hover:bg-blue-700
              active:bg-blue-800
              text-white
              text-sm
              font-semibold
              flex
              items-center
              justify-center
              gap-2
              transition-colors
            "
          >
            <Upload size={15} />
            Submit for Approval
          </button>
  
          <button
            type="button"
            className="
              w-full
              sm:w-auto
              min-h-[44px]
              px-4
              rounded-lg
              text-slate-600
              text-sm
              font-medium
              hover:bg-slate-100
              transition-colors
            "
          >
            Cancel
          </button>
        </div>
      </main>
    );
  }