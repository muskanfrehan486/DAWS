import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  clickToPdfPlacement,
  pdfPlacementToScreen,
  type PdfPlacement,
  type ScreenPlacement,
} from '../utils/pdfCoordinates'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export interface PdfPageMetrics {
  pdfWidth: number
  pdfHeight: number
  displayWidth: number
  displayHeight: number
}

interface PdfDocumentViewerProps {
  file: Blob | null
  placementMode?: boolean
  placement?: PdfPlacement | null
  onPlacement?: (placement: PdfPlacement, metrics: PdfPageMetrics) => void
  signaturePreviewUrl?: string | null
  allowSignatureDrop?: boolean
  placementHint?: string
}

export default function PdfDocumentViewer({
  file,
  placementMode = false,
  placement = null,
  onPlacement,
  signaturePreviewUrl = null,
  allowSignatureDrop = false,
  placementHint,
}: PdfDocumentViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [screenPlacement, setScreenPlacement] = useState<ScreenPlacement | null>(null)
  const metricsRef = useRef<PdfPageMetrics | null>(null)

  useEffect(() => {
    if (!file) {
      setPdfDoc(null)
      setPageCount(0)
      setCurrentPage(1)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    file.arrayBuffer()
      .then(buffer => pdfjs.getDocument({ data: buffer }).promise)
      .then(doc => {
        if (cancelled) return
        setPdfDoc(doc)
        setPageCount(doc.numPages)
        setCurrentPage(1)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load PDF')
          setPdfDoc(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [file])

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !pdfDoc) return

    const page = await pdfDoc.getPage(currentPage)
    const baseViewport = page.getViewport({ scale: 1 })
    const containerWidth = container.clientWidth
    const scale = containerWidth / baseViewport.width
    const viewport = page.getViewport({ scale })

    const dpr = window.devicePixelRatio || 1
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    const metrics: PdfPageMetrics = {
      pdfWidth: baseViewport.width,
      pdfHeight: baseViewport.height,
      displayWidth: viewport.width,
      displayHeight: viewport.height,
    }
    metricsRef.current = metrics

    if (placement && placement.page === currentPage) {
      setScreenPlacement(pdfPlacementToScreen(
        placement,
        metrics.displayWidth,
        metrics.displayHeight,
        metrics.pdfWidth,
        metrics.pdfHeight,
      ))
    } else {
      setScreenPlacement(null)
    }
  }, [pdfDoc, currentPage, placement])

  useEffect(() => {
    renderPage().catch(() => setError('Failed to render page'))
  }, [renderPage])

  useEffect(() => {
    const handleResize = () => {
      renderPage().catch(() => undefined)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderPage])

  const placeSignatureAtPoint = (
    clientX: number,
    clientY: number,
  ) => {
    if (!placementMode || !onPlacement || !metricsRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = clientX - rect.left
    const clickY = clientY - rect.top
    const { pdfWidth, pdfHeight, displayWidth, displayHeight } = metricsRef.current

    const pdfPlacement = clickToPdfPlacement(
      clickX,
      clickY,
      displayWidth,
      displayHeight,
      pdfWidth,
      pdfHeight,
    )
    pdfPlacement.page = currentPage

    onPlacement(pdfPlacement, metricsRef.current)
    setScreenPlacement(pdfPlacementToScreen(
      pdfPlacement,
      displayWidth,
      displayHeight,
      pdfWidth,
      pdfHeight,
    ))
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    placeSignatureAtPoint(event.clientX, event.clientY)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!allowSignatureDrop) return
    if (!event.dataTransfer.types.includes('application/x-docflow-signature')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!allowSignatureDrop) return
    if (!event.dataTransfer.getData('application/x-docflow-signature')) return
    event.preventDefault()
    placeSignatureAtPoint(event.clientX, event.clientY)
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-sm text-slate-500">
        No document loaded
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] gap-2 text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin text-emerald-600" />
        Loading PDF...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(page => page - 1)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-xs text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage(page => page + 1)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-xs text-slate-600 disabled:opacity-40"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {placementMode && (
        <p className="mb-2 text-xs text-emerald-600 font-medium">
          {placementHint ?? 'Click on the document where you want to place your signature'}
        </p>
      )}

      <div
        ref={containerRef}
        className="relative w-full overflow-auto rounded-lg border border-slate-200 bg-slate-100"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={placementMode ? 'cursor-crosshair' : 'cursor-default'}
          />
          {screenPlacement && placement?.page === currentPage && (
            <div
              className="absolute border-2 border-emerald-500 bg-emerald-50/40 pointer-events-none overflow-hidden"
              style={{
                left: screenPlacement.left,
                top: screenPlacement.top,
                width: screenPlacement.width,
                height: screenPlacement.height,
              }}
            >
              {signaturePreviewUrl && (
                <img
                  src={signaturePreviewUrl}
                  alt="Signature preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
