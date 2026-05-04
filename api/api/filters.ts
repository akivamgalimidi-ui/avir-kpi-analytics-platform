import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    uploadBatches: [],
    payPeriods: [],
    payCycles: [],
    acquisitionGroups: [],
    regions: [],
    facilities: [],
    departments: [],
    positions: [],
    employees: [],
    bonusTypes: [],
    riskCategories: [],
    comparableStatuses: [],
    message: "Filters endpoint is live (Node.js). No parsed payroll data loaded yet.",
    timestamp: new Date().toISOString(),
  });
}
