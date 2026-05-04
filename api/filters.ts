import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const [batches, facilities, regions, groups] = await Promise.all([
      supabaseAdmin.from('upload_batches').select('id, filename, uploaded_at').order('uploaded_at', { ascending: false }),
      supabaseAdmin.from('facilities').select('id, facility_name, normalized_facility_name'),
      supabaseAdmin.from('regions').select('id, region_name'),
      supabaseAdmin.from('acquisition_groups').select('id, acquisition_group_name')
    ]);

    res.status(200).json({
      ok: true,
      uploadBatches: batches.data || [],
      facilities: facilities.data || [],
      regions: regions.data || [],
      acquisitionGroups: groups.data || [],
      payCycles: ["Cycle A", "Cycle B"],
      riskCategories: ["Low", "Medium", "High", "Critical"],
      source: "database",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(200).json({
      ok: true,
      error: "Using empty fallback filters",
      details: err.message,
      facilities: [],
      regions: [],
      acquisitionGroups: []
    });
  }
}
