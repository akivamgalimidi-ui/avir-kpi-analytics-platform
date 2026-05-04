import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "Avir KPI Analytics Backend",
    runtime: "vercel-node",
    database: "not_tested",
    uploadEndpoint: "/api/upload",
    uploadEndpointExpected: true,
    supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    supabaseServiceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString(),
  });
}
