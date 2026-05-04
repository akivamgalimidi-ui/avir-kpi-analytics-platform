import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as XLSX from "xlsx";
import { parseDimensions } from "./parser/dimensions.js";
import { parseMetrics } from "./parser/metrics.js";
import { supabaseAdmin, getOrCreateOrg } from "./supabaseAdmin.js";

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
  // 1. Initial Handshake (Proves Function is Alive)
  console.log("Upload handler invoked at", new Date().toISOString());

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }

    const filename = decodeURIComponent(req.headers["x-filename"] as string || "uploaded-payroll.xlsx");
    
    // 2. Read Body with Safety
    let buffer: Buffer;
    try {
      buffer = await readRawBody(req);
    } catch (bodyErr: any) {
      return res.status(400).json({ ok: false, error: "Failed to read request body", details: bodyErr.message });
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ ok: false, error: "Empty file body received" });
    }

    // 3. Parse Workbook with Safety
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    } catch (xlsxErr: any) {
      return res.status(400).json({ ok: false, error: "Excel parsing failed", details: xlsxErr.message });
    }

    // 4. Deep Parsing Orchestration
    let dims: any = { facilities: [], regions: [], groups: [] };
    let metrics: any[] = [];
    try {
      dims = parseDimensions(workbook);
      metrics = parseMetrics(workbook);
    } catch (parseErr: any) {
       console.error("Deep parse failed:", parseErr);
       // We still return 200 but report the partial failure
       return res.status(200).json({
         ok: true,
         filename,
         workbookParsed: true,
         sheetsDetected: workbook.SheetNames,
         parserStatus: "partial_failure",
         error: "Deep parsing of sheets failed",
         details: parseErr.message
       });
    }

    // 5. Database Persistence with Safety
    let dbStatus = "Skipped (No Config)";
    let batchId = null;

    const hasDbConfig = process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);

    if (hasDbConfig) {
      try {
        const orgId = await getOrCreateOrg().catch(() => null);
        
        if (orgId) {
          const { data: batch, error: batchErr } = await supabaseAdmin.from('upload_batches').insert({
            organization_id: orgId,
            filename: filename,
            status: 'complete',
            rows_parsed: metrics.length
          }).select('id').single();
          
          if (batchErr) throw batchErr;
          batchId = batch?.id;
          dbStatus = "Persisted to Supabase";
        } else {
          dbStatus = "Skipped (Org creation failed)";
        }
      } catch (dbErr: any) {
        dbStatus = "Persistence Error (Function continued): " + dbErr.message;
      }
    }

    // 6. Final Successful JSON Response
    return res.status(200).json({
      ok: true,
      uploadBatchId: batchId,
      filename,
      workbookParsed: true,
      sheetsDetected: workbook.SheetNames,
      parserStatus: "full_kpi_parse_complete",
      databaseStatus: dbStatus,
      summary: {
        facilities: dims.facilities?.length || 0,
        regions: dims.regions?.length || 0,
        groups: dims.groups?.length || 0,
        metricEntries: metrics.length
      },
      parsedData: {
        dimensions: dims,
        recentMetrics: metrics.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    });

  } catch (globalErr: any) {
    console.error("GLOBAL CRASH:", globalErr);
    return res.status(500).json({
      ok: false,
      error: "Critical Internal Server Error",
      details: globalErr.message,
      stack: process.env.NODE_ENV === 'development' ? globalErr.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
