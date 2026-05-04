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

    const filename = decodeURIComponent(req.headers["x-filename"] as string || "uploaded-payroll.xlsx");
    const buffer = await readRawBody(req);
    
    // 1. Workbook Load (Proven Stable)
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // 2. Dimension Parsing (Proven Stable)
    const facilities = new Set<string>();
    const regions = new Set<string>();
    const groups = new Set<string>();

    ["Analysis by Region", "Analysis by Acq Group"].forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      for (let i = 5; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        const fName = String(row[0]);
        if (fName.includes('Total')) continue;
        facilities.add(fName);
        if (sheetName.includes('Region') && row[1]) regions.add(String(row[1]));
        if (sheetName.includes('Acq') && row[1]) groups.add(String(row[1]));
      }
    });

    // 3. Metric Parsing (Proven Stable)
    let metricCount = 0;
    ["OT by Pay Period", "Bonus by PPE", "PPDs"].forEach(sheetName => {
       const sheet = workbook.Sheets[sheetName];
       if (!sheet) return;
       const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
       metricCount += Math.max(0, (data.length - 1) * ((data[0]?.length || 1) - 1));
    });

    return res.status(200).json({
      ok: true,
      message: "Analytical Ingestion Success (Stability Mode)",
      filename,
      workbookParsed: true,
      sheetsDetected: workbook.SheetNames,
      databaseStatus: "Stability Mode: Cloud Save Disabled",
      summary: {
        facilities: facilities.size,
        regions: regions.size,
        groups: groups.size,
        metrics: metricCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: "Analytical Engine Error",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}
