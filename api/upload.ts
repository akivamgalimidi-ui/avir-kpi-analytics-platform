import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as XLSX from "xlsx";

export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed",
        details: "Use POST for /api/upload.",
      });
    }

    const filenameHeader = req.headers["x-filename"];
    const filename = Array.isArray(filenameHeader)
      ? filenameHeader[0]
      : filenameHeader || "uploaded-payroll.xlsx";

    const contentType = req.headers["content-type"] || "unknown";
    const buffer = await readRawBody(req);

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "No file bytes received",
        details: "Frontend must POST the Excel file as the raw request body.",
      });
    }

    let sheetsDetected: string[] = [];
    let sheetRowCounts: Record<string, number> = {};
    let workbookParsed = false;
    let parseWarning: string | null = null;

    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      sheetsDetected = workbook.SheetNames || [];

      for (const sheetName of sheetsDetected) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
        }) as unknown[][];
        sheetRowCounts[sheetName] = rows.length;
      }

      workbookParsed = true;
    } catch (parseErr: any) {
      parseWarning = parseErr?.message || String(parseErr);
    }

    return res.status(200).json({
      ok: true,
      message: "Upload API route is working and returning JSON.",
      filename: decodeURIComponent(String(filename)),
      fileSize: buffer.length,
      contentType,
      workbookParsed,
      sheetsDetected,
      sheetRowCounts,
      parserStatus: workbookParsed
        ? "basic_workbook_parse_complete"
        : "file_received_parse_failed",
      warnings: parseWarning ? [parseWarning] : [],
      errors: [],
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Upload failed:", err);

    return res.status(500).json({
      ok: false,
      error: "Upload failed",
      details: err?.message || String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
