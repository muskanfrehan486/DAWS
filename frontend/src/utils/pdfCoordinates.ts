/** Default signature box size in PDF points (1/72 inch). */
export const SIGNATURE_WIDTH_PDF = 150
export const SIGNATURE_HEIGHT_PDF = 50

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
