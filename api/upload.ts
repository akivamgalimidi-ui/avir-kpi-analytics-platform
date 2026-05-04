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
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

    const filename = decodeURIComponent(req.headers["x-filename"] as string || "uploaded-payroll.xlsx");
    const buffer = await readRawBody(req);
    
    // 1. High-Performance Workbook Load
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // 2. Deep Analytical Parsing
    const dims = parseDimensions(workbook);
    const metrics = parseMetrics(workbook);

    // 3. Database Persistence
    let dbStatus = "Skipped (No Config)";
    let batchId = null;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const orgId = await getOrCreateOrg();
        
        // Create Master Upload Batch
        const { data: batch } = await supabaseAdmin.from('upload_batches').insert({
          organization_id: orgId,
          filename: filename,
          status: 'complete',
          rows_parsed: metrics.length
        }).select('id').single();
        
        batchId = batch?.id;

        // Atomic Upsert of Dimensions
        await Promise.all([
          supabaseAdmin.from('regions').upsert(dims.regions.map(n => ({ organization_id: orgId, region_name: n })), { onConflict: 'organization_id,region_name' }),
          supabaseAdmin.from('acquisition_groups').upsert(dims.groups.map(n => ({ organization_id: orgId, acquisition_group_name: n })), { onConflict: 'organization_id,acquisition_group_name' })
        ]);

        dbStatus = "Successfully Persisted to Database";
      } catch (dbErr: any) {
        dbStatus = "Partial Success: Meta-data parsed, but DB save failed: " + dbErr.message;
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Analytical Ingestion Complete",
      filename,
      fileSize: buffer.length,
      workbookParsed: true,
      sheetsDetected: workbook.SheetNames,
      databaseStatus: dbStatus,
      summary: {
        facilities: dims.facilities.length,
        regions: dims.regions.length,
        groups: dims.groups.length,
        metrics: metrics.length
      },
      parsedData: {
        dimensions: dims,
        preview: metrics.slice(0, 10)
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
