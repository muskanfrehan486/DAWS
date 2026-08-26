import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { cropInkFromCanvas } from '../utils/inkCrop'
import {
  clickToPdfPlacement,
  pdfPlacementToScreen,
  resizePdfPlacement,
  screenPointToPdf,
  screenRectToPdfPlacement,
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
  /** Draw freehand ink on the page instead of click-to-place a stamp. */
  drawOnPdf?: boolean
  /** Increment to wipe ink (Clear, mode switch, modal reopen). */
  inkResetKey?: number
  onInkChange?: (dataUrl: string | null) => void
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

function configureInkContext(ctx: CanvasRenderingContext2D, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2
  ctx.strokeStyle = '#1e293b'
}

export default function PdfDocumentViewer({
  file,
  placementMode = false,
  placement = null,
  onPlacement,
  signaturePreviewUrl = null,
  allowSignatureDrop = false,
  placementHint,
  drawOnPdf = false,
  inkResetKey = 0,
  onInkChange,
}: PdfDocumentViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inkCanvasRef = useRef<HTMLCanvasElement>(null)
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
  const drawingRef = useRef(false)
  const strokesRef = useRef<{ x: number; y: number }[][]>([])
  const onInkChangeRef = useRef(onInkChange)
  const onPlacementRef = useRef(onPlacement)
  const currentPageRef = useRef(currentPage)
  const drawOnPdfRef = useRef(drawOnPdf)

  useEffect(() => {
    placementRef.current = placement
  }, [placement])

  useEffect(() => {
    onInkChangeRef.current = onInkChange
  }, [onInkChange])

  useEffect(() => {
    onPlacementRef.current = onPlacement
  }, [onPlacement])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    drawOnPdfRef.current = drawOnPdf
  }, [drawOnPdf])

  const redrawInkStrokes = useCallback((ctx: CanvasRenderingContext2D, metrics: PdfPageMetrics) => {
    ctx.clearRect(0, 0, metrics.displayWidth, metrics.displayHeight)
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x * metrics.displayWidth, stroke[0].y * metrics.displayHeight)
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x * metrics.displayWidth, stroke[i].y * metrics.displayHeight)
      }
      if (stroke.length === 1) {
        ctx.lineTo(
          stroke[0].x * metrics.displayWidth + 0.01,
          stroke[0].y * metrics.displayHeight,
        )
      }
      ctx.stroke()
    }
  }, [])

  const setupInkCanvas = useCallback(() => {
    const canvas = inkCanvasRef.current
    const metrics = metricsRef.current
    if (!canvas || !metrics || !drawOnPdfRef.current) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = metrics.displayWidth * dpr
    canvas.height = metrics.displayHeight * dpr
    canvas.style.width = `${metrics.displayWidth}px`
    canvas.style.height = `${metrics.displayHeight}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    configureInkContext(ctx, dpr)
    redrawInkStrokes(ctx, metrics)
  }, [redrawInkStrokes])

  const emitInk = useCallback(() => {
    const canvas = inkCanvasRef.current
    const metrics = metricsRef.current
    if (!canvas || !metrics) return

    if (!drawOnPdfRef.current) return

    const cropped = cropInkFromCanvas(canvas)
    if (!cropped) {
      onInkChangeRef.current?.(null)
      return
    }

    onInkChangeRef.current?.(cropped.dataUrl)
    const nextPlacement = screenRectToPdfPlacement(
      cropped.left,
      cropped.top,
      cropped.width,
      cropped.height,
      metrics.displayWidth,
      metrics.displayHeight,
      metrics.pdfWidth,
      metrics.pdfHeight,
      currentPageRef.current,
    )
    onPlacementRef.current?.(nextPlacement, metrics)
  }, [])

  const clearInk = useCallback((notify: boolean) => {
    strokesRef.current = []
    drawingRef.current = false
    const canvas = inkCanvasRef.current
    const metrics = metricsRef.current
    if (canvas && metrics) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, metrics.displayWidth, metrics.displayHeight)
    }
    if (notify && drawOnPdfRef.current) {
      onInkChangeRef.current?.(null)
    }
  }, [])

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

    setupInkCanvas()
  }, [pdfDoc, currentPage, setupInkCanvas])

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

  useEffect(() => {
    clearInk(true)
    setupInkCanvas()
  }, [currentPage, inkResetKey, clearInk, setupInkCanvas])

  useEffect(() => {
    if (!drawOnPdf) {
      drawingRef.current = false
      return
    }
    setupInkCanvas()
  }, [drawOnPdf, setupInkCanvas])

  const placeSignatureAtPoint = (
    clientX: number,
    clientY: number,
  ) => {
    if (!placementMode || drawOnPdf || !onPlacement || !metricsRef.current) return

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
    if (drawOnPdf || resizeSessionRef.current) return
    placeSignatureAtPoint(event.clientX, event.clientY)
  }

  const getInkPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = inkCanvasRef.current
    const metrics = metricsRef.current
    if (!canvas || !metrics) return null
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return {
      cssX: x,
      cssY: y,
      nx: metrics.displayWidth > 0 ? x / metrics.displayWidth : 0,
      ny: metrics.displayHeight > 0 ? y / metrics.displayHeight : 0,
    }
  }

  const handleInkPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawOnPdf) return
    event.preventDefault()
    const canvas = inkCanvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = getInkPoint(event)
    if (!canvas || !ctx || !point) return

    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    strokesRef.current.push([{ x: point.nx, y: point.ny }])
    ctx.beginPath()
    ctx.moveTo(point.cssX, point.cssY)
  }

  const handleInkPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = inkCanvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = getInkPoint(event)
    if (!canvas || !ctx || !point) return

    const stroke = strokesRef.current[strokesRef.current.length - 1]
    stroke?.push({ x: point.nx, y: point.ny })
    ctx.lineTo(point.cssX, point.cssY)
    ctx.stroke()
  }

  const finishInkStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = inkCanvasRef.current
    canvas?.releasePointerCapture(event.pointerId)
    emitInk()
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
    if (!placementMode || !placement || drawOnPdf) return
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
            ?? (drawOnPdf
              ? 'Draw your signature on the document'
              : 'Click to place your signature, then drag the corners to resize')}
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
            className={placementMode && !drawOnPdf ? 'cursor-crosshair' : 'cursor-default'}
          />
          {drawOnPdf && (
            <canvas
              ref={inkCanvasRef}
              className="absolute inset-0 touch-none cursor-crosshair"
              onPointerDown={handleInkPointerDown}
              onPointerMove={handleInkPointerMove}
              onPointerUp={finishInkStroke}
              onPointerLeave={finishInkStroke}
              onPointerCancel={finishInkStroke}
            />
          )}
          {!drawOnPdf && screenPlacement && placement?.page === currentPage && (
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
