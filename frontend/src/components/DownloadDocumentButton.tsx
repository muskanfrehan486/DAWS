import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { downloadDocumentFile } from '../utils/downloadDocument'

export default function DownloadDocumentButton({
  documentId,
  versionNumber,
  disabled = false,
  className = '',
  label = 'Download',
}: {
  documentId: string
  versionNumber: number
  disabled?: boolean
  className?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation()

    if (disabled || loading) return

    setLoading(true)
    setError(null)

    try {
      await downloadDocumentFile(
        documentId,
        `document-${documentId.slice(0, 8)}-v${versionNumber}.pdf`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || loading}
        title={disabled ? 'File not available' : 'Download document'}
        className="
          inline-flex items-center gap-1.5
          px-2.5 py-1.5
          rounded-lg
          text-xs font-medium
          text-slate-600
          hover:bg-slate-100
          active:bg-slate-200
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {label}
      </button>
      {error && (
        <p className="mt-1 text-[10px] text-red-600 max-w-[140px] truncate" title={error}>
          {error}
        </p>
      )}
    </div>
  )
}
