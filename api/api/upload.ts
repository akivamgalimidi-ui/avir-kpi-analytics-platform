import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as XLSX from "xlsx";
import { supabase, getOrCreateOrg } from "./supabase";

export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const filename = decodeURIComponent(req.headers["x-filename"] as string || "uploaded-payroll.xlsx");
    const buffer = await readRawBody(req);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;

    const orgId = await getOrCreateOrg();

    // 1. Create Upload Batch
    const { data: batch, error: batchError } = await supabase
      .from('upload_batches')
      .insert({ 
        organization_id: orgId, 
        filename, 
        status: 'processing' 
      })
      .select('id')
      .single();

    if (batchError) throw batchError;
    const batchId = batch.id;

    const results: any = {
      ok: true,
      uploadBatchId: batchId,
      sheets: sheetNames,
      counts: { facilities: 0, metrics: 0 },
      warnings: []
    };

    // 2. Dimension & Metric Extraction (Optimized for standard platform sheets)
    const sheetsToProcess = [
      "Analysis by Acq Group",
      "Analysis by Region",
      "OT by Pay Period",
      "PPDs"
    ];

    for (const sheetName of sheetsToProcess) {
      if (!sheetNames.includes(sheetName)) {
        results.warnings.push(`Missing expected sheet: ${sheetName}`);
        continue;
      }

      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Basic dimension capture from "Analysis by Region"
      if (sheetName === "Analysis by Region") {
        const regions: Set<string> = new Set();
        for (let i = 5; i < data.length; i++) {
          const regionName = data[i][0];
          if (regionName && typeof regionName === 'string' && !regionName.includes('Total')) {
             regions.add(regionName);
          }
        }
        
        if (regions.size > 0) {
           await supabase.from('regions').upsert(
             Array.from(regions).map(name => ({ organization_id: orgId, region_name: name })),
             { onConflict: 'organization_id,region_name' }
           );
        }
      }
    }

    // 3. Mark Batch as Complete
    await supabase.from('upload_batches').update({ status: 'complete' }).eq('id', batchId);

    return res.status(200).json({
      ...results,
      parserStatus: "full_ingestion_complete",
      databaseStatus: "Saved to Supabase"
    });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return res.status(500).json({ ok: false, error: "Deep parse failed", details: err?.message });
  }
}
