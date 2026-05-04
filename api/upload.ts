import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as XLSX from "xlsx";
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: false },
};

// Defensive Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(new Error("Body read failed: " + err.message)));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Analytical Engine invoked at", new Date().toISOString());

  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

    const filename = decodeURIComponent(req.headers["x-filename"] as string || "uploaded-payroll.xlsx");
    const buffer = await readRawBody(req);
    
    // 1. Workbook Load
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // 2. Dimension Parsing (Integrated)
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

    // 3. Metric Parsing (Integrated)
    let metricCount = 0;
    ["OT by Pay Period", "Bonus by PPE", "PPDs"].forEach(sheetName => {
       const sheet = workbook.Sheets[sheetName];
       if (!sheet) return;
       const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
       metricCount += Math.max(0, (data.length - 1) * ((data[0]?.length || 1) - 1));
    });

    // 4. Defensive Database Logic
    let dbStatus = "Database Persistence Disabled (Check Env Vars)";
    if (supabase) {
      try {
        // Attempt Org Lookup
        const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
        const orgId = org?.id;

        if (orgId) {
          await supabase.from('upload_batches').insert({
            organization_id: orgId,
            filename,
            status: 'complete',
            rows_parsed: metricCount
          });
          dbStatus = "Analytical Batch Persisted to Supabase";
        }
      } catch (dbErr: any) {
        dbStatus = "Analytical data parsed, but DB save failed: " + dbErr.message;
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Analytical Engine Success",
      filename,
      workbookParsed: true,
      sheetsDetected: workbook.SheetNames,
      databaseStatus: dbStatus,
      summary: {
        facilities: facilities.size,
        regions: regions.size,
        groups: groups.size,
        metrics: metricCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("Analytical Engine Crash:", err);
    return res.status(500).json({
      ok: false,
      error: "Analytical Engine Failure",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}
