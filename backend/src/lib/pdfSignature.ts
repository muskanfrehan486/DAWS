import { PDFDocument } from "pdf-lib";
import { errors } from "./errors";

export type SignaturePlacement = {
  signaturePage: number;
  signatureX: number;
  signatureY: number;
  signatureWidth: number;
  signatureHeight: number;
};

export function decodeSignatureImage(signatureImage: string): Buffer {
  const base64 = signatureImage.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

export async function embedSignatureInPdf(
  pdfBuffer: Buffer,
  signatureBuffer: Buffer,
  input: SignaturePlacement
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  if (input.signaturePage < 1 || input.signaturePage > pages.length) {
    throw errors.badRequest("Invalid signature page number.");
  }

  const page = pages[input.signaturePage - 1];
  const { height: pageHeight } = page.getSize();

  let image;
  try {
    image = await pdfDoc.embedPng(signatureBuffer);
  } catch {
    image = await pdfDoc.embedJpg(signatureBuffer);
  }

  // Frontend coordinates are top-left origin; pdf-lib uses bottom-left origin.
  const pdfY = pageHeight - input.signatureY - input.signatureHeight;

  page.drawImage(image, {
    x: input.signatureX,
    y: pdfY,
    width: input.signatureWidth,
    height: input.signatureHeight,
  });

  const signedPdfBytes = await pdfDoc.save();
  return Buffer.from(signedPdfBytes);
}
