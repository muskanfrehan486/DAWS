import * as XLSX from "xlsx";
import { errors } from "../lib/errors";
import { parseCsv } from "./csv";

export function parseSpreadsheet(
  buffer: Buffer,
  filename: string
): Record<string, string>[] {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".csv")) {
    return parseCsv(buffer.toString("utf-8"));
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return [];
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    return rows.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key] =
          value === null || value === undefined ? "" : String(value).trim();
      }
      return normalized;
    });
  }

  throw errors.badRequest("Unsupported file type. Upload a .csv or .xlsx file.");
}
