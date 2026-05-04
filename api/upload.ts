import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as XLSX from "xlsx";

export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(new Error("Body read failed: " + err.message)));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

    const buffer = await readRawBody(req);
    
    // Proving the file arrived
    const fileSize = buffer.length;
    
    // Proving we can read the workbook structure
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames;

    return res.status(200).json({
      ok: true,
      message: "Naked Upload Diagnostic Success",
      filename: req.headers["x-filename"] || "unknown",
      fileSize,
      sheetsDetected: sheets,
      parserStatus: "diagnostic_mode_active",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: "Diagnostic Mode Failed",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}
