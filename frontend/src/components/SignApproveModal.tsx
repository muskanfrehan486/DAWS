import { Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { approveDocument } from '../services/approvalApi'
import { fetchDocumentFile } from '../services/documentDetailApi'
import {
  blobToDataUrl,
  fetchMySignature,
  uploadMySignature,
} from '../services/userSignatureApi'
import type { PdfPlacement } from '../utils/pdfCoordinates'
import PdfDocumentViewer, { type PdfPageMetrics } from './PdfDocumentViewer'
import SignatureInput, { type SignatureMode } from './SignatureInput'
import { useCurrentUser } from '../contexts/CurrentUserContext'

interface SignApproveModalProps {
  open: boolean
  documentId: string
  documentTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function SignApproveModal({
  open,
  documentId,
  documentTitle,
  onClose,
  onSuccess,
}: SignApproveModalProps) {
  const { user, refetch: refetchUser } = useCurrentUser()
  const [pdfFile, setPdfFile] = useState<Blob | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [placement, setPlacement] = useState<PdfPlacement | null>(null)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('draw')
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null)
  const [loadingSignature, setLoadingSignature] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadSavedSignature = useCallback(async () => {
    setLoadingSignature(true)
    try {
      const blob = await fetchMySignature()
      if (!blob) {
        setSavedSignatureUrl(null)
        return
      }
      setSavedSignatureUrl(await blobToDataUrl(blob))
    } catch {
      setSavedSignatureUrl(null)
    } finally {
      setLoadingSignature(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setPlacement(null)
      setSignatureImage(null)
      setSignatureMode('draw')
      setSavedSignatureUrl(null)
      setSubmitError(null)
      setUploadError(null)
      return
    }

    let cancelled = false
    setLoadingPdf(true)
    setLoadError(null)
    void loadSavedSignature()

    fetchDocumentFile(documentId)
      .then(blob => {
        if (!cancelled) setPdfFile(blob)
      })
      .catch(err => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load PDF')
          setPdfFile(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPdf(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, documentId, loadSavedSignature])

  useEffect(() => {
    if (!open) return
    if (user?.hasSignature && savedSignatureUrl) {
      setSignatureMode('saved')
    }
  }, [open, user?.hasSignature, savedSignatureUrl])

  if (!open) return null

  const handlePlacement = (nextPlacement: PdfPlacement, _metrics: PdfPageMetrics) => {
    setPlacement(nextPlacement)
    setSubmitError(null)
  }

  const handleUploadSavedSignature = async (file: File) => {
    setUploadingSignature(true)
    setUploadError(null)
    try {
      await uploadMySignature(file)
      await refetchUser()
      await loadSavedSignature()
      setSignatureMode('saved')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload signature')
      throw err
    } finally {
      setUploadingSignature(false)
    }
  }

  const handleApprove = async () => {
    if (!placement) {
      setSubmitError('Click or drag your signature onto the document to choose placement.')
      return
    }
    if (!signatureImage) {
      setSubmitError(
        signatureMode === 'saved'
          ? 'Upload or select your saved signature before approving.'
          : 'Draw your signature before approving.',
      )
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await approveDocument(documentId, {
        ...(signatureMode === 'saved'
          ? { useSavedSignature: true }
          : { signatureImage: signatureImage! }),
        signaturePage: placement.page,
        signatureX: placement.signatureX,
        signatureY: placement.signatureY,
        signatureWidth: placement.signatureWidth,
        signatureHeight: placement.signatureHeight,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setSubmitting(false)
    }
  }

  const placementHint = signatureMode === 'saved'
    ? 'Drag your saved signature onto the document, or click to place it'
    : 'Click on the document where you want to place your signature'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-base">Sign &amp; Approve</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{documentTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loadingPdf ? (
            <div className="flex items-center justify-center min-h-[320px] gap-2 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-emerald-600" />
              Loading document...
            </div>
          ) : loadError ? (
            <div className="text-center py-12 text-sm text-red-600">{loadError}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-5">
              <PdfDocumentViewer
                file={pdfFile}
                placementMode
                placement={placement}
                onPlacement={handlePlacement}
                signaturePreviewUrl={signatureImage}
                allowSignatureDrop={signatureMode === 'saved' && Boolean(savedSignatureUrl)}
                placementHint={placementHint}
              />

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-700 mb-2">Instructions</p>
                  <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
                    <li>Choose to draw or use your saved signature</li>
                    <li>Click or drag your signature onto the PDF</li>
                    <li>Confirm to approve the document</li>
                  </ol>
                </div>

                {loadingSignature ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                    <Loader2 size={14} className="animate-spin text-emerald-600" />
                    Loading saved signature...
                  </div>
                ) : (
                  <SignatureInput
                    mode={signatureMode}
                    onModeChange={setSignatureMode}
                    onChange={setSignatureImage}
                    savedSignatureUrl={savedSignatureUrl}
                    hasSavedSignature={Boolean(savedSignatureUrl)}
                    onUploadSavedSignature={handleUploadSavedSignature}
                    uploading={uploadingSignature}
                    uploadError={uploadError}
                  />
                )}

                {placement && (
                  <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500 space-y-1">
                    <p>
                      <span className="font-medium text-slate-700">Page:</span>{' '}
                      {placement.page}
                    </p>
                    <p>
                      <span className="font-medium text-slate-700">Position:</span>{' '}
                      x {Math.round(placement.signatureX)}, y {Math.round(placement.signatureY)}
                    </p>
                  </div>
                )}

                {submitError && (
                  <p className="text-xs text-red-600">{submitError}</p>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Sign &amp; Approve
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="w-full h-10 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
