import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { type } = req.query;

    if (type === 'executive') {
      const [batches, facilities, regions] = await Promise.all([
        supabase.from('upload_batches').select('*', { count: 'exact' }).eq('status', 'complete'),
        supabase.from('facilities').select('*', { count: 'exact' }),
        supabase.from('regions').select('*', { count: 'exact' })
      ]);

      return res.status(200).json({
        ok: true,
        summary: {
          totalBatches: batches.count || 0,
          totalFacilities: facilities.count || 0,
          totalRegions: regions.count || 0,
          totalOtDollars: 0, // Will be populated as metrics are parsed
          totalBonusDollars: 0
        },
        recentBatches: batches.data?.slice(0, 5) || []
      });
    }

    return res.status(200).json({ ok: true, message: "Dashboard type not specified" });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
