import { Eraser, Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type SignatureMode = 'draw' | 'saved'

interface SignatureInputProps {
  mode: SignatureMode
  onModeChange: (mode: SignatureMode) => void
  onChange: (dataUrl: string | null) => void
  savedSignatureUrl: string | null
  hasSavedSignature: boolean
  onUploadSavedSignature: (file: File) => Promise<void>
  uploading?: boolean
  uploadError?: string | null
  onClearInk?: () => void
}

export default function SignatureInput({
  mode,
  onModeChange,
  onChange,
  savedSignatureUrl,
  hasSavedSignature,
  onUploadSavedSignature,
  uploading = false,
  uploadError = null,
  onClearInk,
}: SignatureInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (mode === 'saved' && savedSignatureUrl) {
      onChange(savedSignatureUrl)
    }
  }, [mode, savedSignatureUrl, onChange])

  const handleModeChange = (nextMode: SignatureMode) => {
    onModeChange(nextMode)
    if (nextMode === 'draw') {
      onChange(null)
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    await onUploadSavedSignature(file)
    onModeChange('saved')
  }

  const handleUploadInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    try {
      await handleFile(file)
    } catch {
      // Parent surfaces upload errors.
    }
  }

  const handleDropUpload = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    try {
      const file = event.dataTransfer.files?.[0]
      await handleFile(file)
    } catch {
      // Parent surfaces upload errors.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-slate-200 p-1 bg-white">
        <button
          type="button"
          onClick={() => handleModeChange('draw')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'draw'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('saved')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'saved'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Saved signature
        </button>
      </div>

      {mode === 'draw' ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-700">Draw on the document</p>
            <button
              type="button"
              onClick={onClearInk}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <Eraser size={13} />
              Clear
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Sign anywhere on the PDF with your mouse, stylus, or finger. Use Clear to start over.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hasSavedSignature && savedSignatureUrl ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-700">Drag onto the document</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                >
                  <Eraser size={13} />
                  Replace
                </button>
              </div>
              <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-4 flex items-center justify-center">
                <img
                  src={savedSignatureUrl}
                  alt="Saved signature"
                  draggable
                  onDragStart={event => {
                    event.dataTransfer.setData('application/x-docflow-signature', 'saved')
                    event.dataTransfer.effectAllowed = 'copy'
                  }}
                  className="max-h-24 max-w-full object-contain cursor-grab active:cursor-grabbing"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Drag this signature onto the PDF, or click on the document to place it.
              </p>
            </div>
          ) : (
            <div
              onDragOver={event => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDropUpload}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragging
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <Upload size={20} className="mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-medium text-slate-700 mb-1">
                Upload your signature once
              </p>
              <p className="text-[11px] text-slate-500 mb-3">
                It will be saved to your profile for future approvals.
              </p>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {uploading && <Loader2 size={14} className="animate-spin" />}
                Choose image
              </button>
              <p className="mt-2 text-[10px] text-slate-400">PNG or JPEG, up to 2 MB</p>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleUploadInput}
      />
    </div>
  )
}
