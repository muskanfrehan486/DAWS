import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  clickToPdfPlacement,
  pdfPlacementToScreen,
  resizePdfPlacement,
  screenPointToPdf,
  type PdfPlacement,
  type ResizeHandle,
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

const RESIZE_HANDLES: {
  id: ResizeHandle
  className: string
  cursor: string
}[] = [
  { id: 'nw', className: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2', cursor: 'nwse-resize' },
  { id: 'ne', className: 'right-0 top-0 translate-x-1/2 -translate-y-1/2', cursor: 'nesw-resize' },
  { id: 'sw', className: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2', cursor: 'nesw-resize' },
  { id: 'se', className: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2', cursor: 'nwse-resize' },
]

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
  const placementRef = useRef<PdfPlacement | null>(placement)
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null)
  const resizeSessionRef = useRef<{
    handle: ResizeHandle
    pointerId: number
  } | null>(null)

  useEffect(() => {
    placementRef.current = placement
  }, [placement])

  // Keep the overlay in sync when placement changes — do NOT re-render the PDF canvas.
  useEffect(() => {
    const metrics = metricsRef.current
    if (!metrics) return

    if (placement && placement.page === currentPage) {
      setScreenPlacement(
        pdfPlacementToScreen(
          placement,
          metrics.displayWidth,
          metrics.displayHeight,
          metrics.pdfWidth,
          metrics.pdfHeight,
        ),
      )
    } else {
      setScreenPlacement(null)
    }
  }, [placement, currentPage])

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

    renderTaskRef.current?.cancel()
    renderTaskRef.current = null

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

    const task = page.render({ canvasContext: ctx, viewport, canvas })
    renderTaskRef.current = task

    try {
      await task.promise
    } catch (err) {
      // Cancelled renders throw; ignore those so resize/page changes don't show an error.
      if ((err as { name?: string } | null)?.name === 'RenderingCancelledException') {
        return
      }
      throw err
    } finally {
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null
      }
    }

    const metrics: PdfPageMetrics = {
      pdfWidth: baseViewport.width,
      pdfHeight: baseViewport.height,
      displayWidth: viewport.width,
      displayHeight: viewport.height,
    }
    metricsRef.current = metrics

    const currentPlacement = placementRef.current
    if (currentPlacement && currentPlacement.page === currentPage) {
      setScreenPlacement(
        pdfPlacementToScreen(
          currentPlacement,
          metrics.displayWidth,
          metrics.displayHeight,
          metrics.pdfWidth,
          metrics.pdfHeight,
        ),
      )
    } else {
      setScreenPlacement(null)
    }
  }, [pdfDoc, currentPage])

  useEffect(() => {
    let cancelled = false
    renderPage().catch(() => {
      if (!cancelled) setError('Failed to render page')
    })
    return () => {
      cancelled = true
      renderTaskRef.current?.cancel()
    }
  }, [renderPage])

  useEffect(() => {
    const handleWindowResize = () => {
      renderPage().catch(() => undefined)
    }
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
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
    if (resizeSessionRef.current) return
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

  const applyResizeFromClientPoint = useCallback((
    handle: ResizeHandle,
    clientX: number,
    clientY: number,
  ) => {
    const current = placementRef.current
    const metrics = metricsRef.current
    const canvas = canvasRef.current
    if (!current || !metrics || !canvas || !onPlacement) return

    const rect = canvas.getBoundingClientRect()
    const { x, y } = screenPointToPdf(
      clientX - rect.left,
      clientY - rect.top,
      metrics.displayWidth,
      metrics.displayHeight,
      metrics.pdfWidth,
      metrics.pdfHeight,
    )

    const next = resizePdfPlacement(
      current,
      handle,
      x,
      y,
      metrics.pdfWidth,
      metrics.pdfHeight,
      true,
    )

    placementRef.current = next
    onPlacement(next, metrics)
    setScreenPlacement(pdfPlacementToScreen(
      next,
      metrics.displayWidth,
      metrics.displayHeight,
      metrics.pdfWidth,
      metrics.pdfHeight,
    ))
  }, [onPlacement])

  const endResizeSession = useCallback(() => {
    resizeSessionRef.current = null
    document.body.style.userSelect = ''
    document.body.style.touchAction = ''
  }, [])

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: ResizeHandle,
  ) => {
    if (!placementMode || !placement) return
    event.preventDefault()
    event.stopPropagation()

    const pointerId = event.pointerId
    resizeSessionRef.current = { handle, pointerId }
    document.body.style.userSelect = 'none'
    document.body.style.touchAction = 'none'

    const onMove = (moveEvent: PointerEvent) => {
      const session = resizeSessionRef.current
      if (!session || session.pointerId !== moveEvent.pointerId) return
      moveEvent.preventDefault()
      applyResizeFromClientPoint(session.handle, moveEvent.clientX, moveEvent.clientY)
    }

    const onUp = (upEvent: PointerEvent) => {
      const session = resizeSessionRef.current
      if (!session || session.pointerId !== upEvent.pointerId) return
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      endResizeSession()
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  // Clean up if the viewer unmounts mid-drag.
  useEffect(() => {
    return () => {
      endResizeSession()
    }
  }, [endResizeSession])

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
          {placementHint
            ?? 'Click to place your signature, then drag the corners to resize'}
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
              className={`absolute border-2 border-emerald-500 bg-emerald-50/40 overflow-visible ${
                placementMode ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              style={{
                left: screenPlacement.left,
                top: screenPlacement.top,
                width: screenPlacement.width,
                height: screenPlacement.height,
              }}
              onClick={event => event.stopPropagation()}
              onPointerDown={event => event.stopPropagation()}
            >
              {signaturePreviewUrl && (
                <img
                  src={signaturePreviewUrl}
                  alt="Signature preview"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
              )}
              {placementMode &&
                RESIZE_HANDLES.map(handle => (
                  <button
                    key={handle.id}
                    type="button"
                    aria-label={`Resize signature ${handle.id}`}
                    className={`absolute z-20 flex items-center justify-center w-11 h-11 sm:w-7 sm:h-7 touch-none select-none ${handle.className}`}
                    style={{ cursor: handle.cursor, touchAction: 'none' }}
                    onPointerDown={event => handleResizePointerDown(event, handle.id)}
                  >
                    <span className="block w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-sm bg-white border-2 border-emerald-600 shadow-sm pointer-events-none" />
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
