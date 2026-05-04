import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "Avir KPI Analytics Backend",
    runtime: "vercel-node",
    uploadEndpoint: "/api/upload",
    timestamp: new Date().toISOString(),
  });
}
