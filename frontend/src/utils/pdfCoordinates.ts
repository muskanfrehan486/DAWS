/** Default signature box size in PDF points (1/72 inch). */
export const SIGNATURE_WIDTH_PDF = 150
export const SIGNATURE_HEIGHT_PDF = 50

export const MIN_SIGNATURE_WIDTH_PDF = 40
export const MIN_SIGNATURE_HEIGHT_PDF = 20
export const MAX_SIGNATURE_WIDTH_PDF = 400
export const MAX_SIGNATURE_HEIGHT_PDF = 200

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export interface PdfPlacement {
  page: number
  signatureX: number
  signatureY: number
  signatureWidth: number
  signatureHeight: number
}

export interface ScreenPlacement {
  left: number
  top: number
  width: number
  height: number
}

/** Map a click on the rendered page to PDF coordinates (top-left origin). */
export function clickToPdfPlacement(
  clickX: number,
  clickY: number,
  displayWidth: number,
  displayHeight: number,
  pdfWidth: number,
  pdfHeight: number,
): PdfPlacement {
  const centerX = (clickX / displayWidth) * pdfWidth
  const centerY = (clickY / displayHeight) * pdfHeight

  let signatureX = centerX - SIGNATURE_WIDTH_PDF / 2
  let signatureY = centerY - SIGNATURE_HEIGHT_PDF / 2

  signatureX = Math.max(0, Math.min(signatureX, pdfWidth - SIGNATURE_WIDTH_PDF))
  signatureY = Math.max(0, Math.min(signatureY, pdfHeight - SIGNATURE_HEIGHT_PDF))

  return {
    page: 1,
    signatureX,
    signatureY,
    signatureWidth: SIGNATURE_WIDTH_PDF,
    signatureHeight: SIGNATURE_HEIGHT_PDF,
  }
}

/** Convert PDF placement to screen overlay position for preview. */
export function pdfPlacementToScreen(
  placement: Pick<PdfPlacement, 'signatureX' | 'signatureY' | 'signatureWidth' | 'signatureHeight'>,
  displayWidth: number,
  displayHeight: number,
  pdfWidth: number,
  pdfHeight: number,
): ScreenPlacement {
  return {
    left: (placement.signatureX / pdfWidth) * displayWidth,
    top: (placement.signatureY / pdfHeight) * displayHeight,
    width: (placement.signatureWidth / pdfWidth) * displayWidth,
    height: (placement.signatureHeight / pdfHeight) * displayHeight,
  }
}

/** Map a CSS-pixel rectangle on the rendered page to PDF placement (top-left origin). */
export function screenRectToPdfPlacement(
  left: number,
  top: number,
  width: number,
  height: number,
  displayWidth: number,
  displayHeight: number,
  pdfWidth: number,
  pdfHeight: number,
  page: number,
): PdfPlacement {
  const topLeft = screenPointToPdf(left, top, displayWidth, displayHeight, pdfWidth, pdfHeight)
  const bottomRight = screenPointToPdf(
    left + width,
    top + height,
    displayWidth,
    displayHeight,
    pdfWidth,
    pdfHeight,
  )

  let signatureX = Math.max(0, topLeft.x)
  let signatureY = Math.max(0, topLeft.y)
  let signatureWidth = Math.max(1, bottomRight.x - topLeft.x)
  let signatureHeight = Math.max(1, bottomRight.y - topLeft.y)

  signatureWidth = Math.min(signatureWidth, pdfWidth)
  signatureHeight = Math.min(signatureHeight, pdfHeight)
  signatureX = Math.max(0, Math.min(signatureX, pdfWidth - signatureWidth))
  signatureY = Math.max(0, Math.min(signatureY, pdfHeight - signatureHeight))

  return {
    page,
    signatureX,
    signatureY,
    signatureWidth,
    signatureHeight,
  }
}

/** Map a screen point on the canvas to PDF coordinates (top-left origin). */
export function screenPointToPdf(
  screenX: number,
  screenY: number,
  displayWidth: number,
  displayHeight: number,
  pdfWidth: number,
  pdfHeight: number,
): { x: number; y: number } {
  return {
    x: (screenX / displayWidth) * pdfWidth,
    y: (screenY / displayHeight) * pdfHeight,
  }
}

/**
 * Resize a placed signature from a corner handle.
 * Keeps aspect ratio by default so uploaded signatures don't stretch.
 */
export function resizePdfPlacement(
  placement: PdfPlacement,
  handle: ResizeHandle,
  pointerPdfX: number,
  pointerPdfY: number,
  pdfWidth: number,
  pdfHeight: number,
  lockAspectRatio = true,
): PdfPlacement {
  const aspect =
    placement.signatureHeight > 0
      ? placement.signatureWidth / placement.signatureHeight
      : SIGNATURE_WIDTH_PDF / SIGNATURE_HEIGHT_PDF

  const fixedRight = placement.signatureX + placement.signatureWidth
  const fixedBottom = placement.signatureY + placement.signatureHeight
  const fixedLeft = placement.signatureX
  const fixedTop = placement.signatureY

  let signatureX = placement.signatureX
  let signatureY = placement.signatureY
  let signatureWidth = placement.signatureWidth
  let signatureHeight = placement.signatureHeight

  if (!lockAspectRatio) {
    if (handle === 'se') {
      signatureWidth = pointerPdfX - fixedLeft
      signatureHeight = pointerPdfY - fixedTop
    } else if (handle === 'sw') {
      signatureWidth = fixedRight - pointerPdfX
      signatureHeight = pointerPdfY - fixedTop
      signatureX = pointerPdfX
    } else if (handle === 'ne') {
      signatureWidth = pointerPdfX - fixedLeft
      signatureHeight = fixedBottom - pointerPdfY
      signatureY = pointerPdfY
    } else {
      signatureWidth = fixedRight - pointerPdfX
      signatureHeight = fixedBottom - pointerPdfY
      signatureX = pointerPdfX
      signatureY = pointerPdfY
    }
  } else {
    // Anchor opposite corner; size from the larger projected axis.
    let nextWidth: number
    let nextHeight: number

    if (handle === 'se') {
      nextWidth = pointerPdfX - fixedLeft
      nextHeight = pointerPdfY - fixedTop
    } else if (handle === 'sw') {
      nextWidth = fixedRight - pointerPdfX
      nextHeight = pointerPdfY - fixedTop
    } else if (handle === 'ne') {
      nextWidth = pointerPdfX - fixedLeft
      nextHeight = fixedBottom - pointerPdfY
    } else {
      nextWidth = fixedRight - pointerPdfX
      nextHeight = fixedBottom - pointerPdfY
    }

    nextWidth = Math.max(nextWidth, MIN_SIGNATURE_WIDTH_PDF)
    nextHeight = Math.max(nextHeight, MIN_SIGNATURE_HEIGHT_PDF)

    if (nextWidth / aspect >= nextHeight) {
      signatureWidth = nextWidth
      signatureHeight = signatureWidth / aspect
    } else {
      signatureHeight = nextHeight
      signatureWidth = signatureHeight * aspect
    }

    if (handle === 'se') {
      signatureX = fixedLeft
      signatureY = fixedTop
    } else if (handle === 'sw') {
      signatureX = fixedRight - signatureWidth
      signatureY = fixedTop
    } else if (handle === 'ne') {
      signatureX = fixedLeft
      signatureY = fixedBottom - signatureHeight
    } else {
      signatureX = fixedRight - signatureWidth
      signatureY = fixedBottom - signatureHeight
    }
  }

  signatureWidth = Math.max(
    MIN_SIGNATURE_WIDTH_PDF,
    Math.min(signatureWidth, MAX_SIGNATURE_WIDTH_PDF, pdfWidth),
  )
  signatureHeight = Math.max(
    MIN_SIGNATURE_HEIGHT_PDF,
    Math.min(signatureHeight, MAX_SIGNATURE_HEIGHT_PDF, pdfHeight),
  )

  if (lockAspectRatio) {
    const heightForWidth = signatureWidth / aspect
    const widthForHeight = signatureHeight * aspect
    if (heightForWidth <= MAX_SIGNATURE_HEIGHT_PDF && heightForWidth <= pdfHeight) {
      signatureHeight = heightForWidth
    } else {
      signatureWidth = widthForHeight
    }

    if (handle === 'sw' || handle === 'nw') {
      signatureX = fixedRight - signatureWidth
    }
    if (handle === 'ne' || handle === 'nw') {
      signatureY = fixedBottom - signatureHeight
    }
    if (handle === 'se' || handle === 'ne') {
      signatureX = fixedLeft
    }
    if (handle === 'se' || handle === 'sw') {
      signatureY = fixedTop
    }
  }

  signatureX = Math.max(0, Math.min(signatureX, pdfWidth - signatureWidth))
  signatureY = Math.max(0, Math.min(signatureY, pdfHeight - signatureHeight))

  return {
    page: placement.page,
    signatureX,
    signatureY,
    signatureWidth,
    signatureHeight,
  }
}
