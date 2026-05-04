import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "Avir KPI Analytics Backend",
    database: "connected",
    supabaseConfigured: true,
    timestamp: new Date().toISOString()
  });
}
