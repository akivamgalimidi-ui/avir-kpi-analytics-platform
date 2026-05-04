import * as XLSX from 'xlsx';

export interface KPIEntry {
  facility: string;
  payPeriod: string;
  metric: string;
  value: number;
}

export function parseMetrics(workbook: XLSX.WorkBook): KPIEntry[] {
  const entries: KPIEntry[] = [];
  const targetSheets = ["OT by Pay Period", "Bonus by PPE", "PPDs"];

  for (const sheetName of targetSheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const headers = data[0] || [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const facility = row[0];
      if (!facility || typeof facility !== 'string' || facility.includes('Total')) continue;

      for (let j = 1; j < row.length; j++) {
        const period = headers[j];
        const val = row[j];
        if (period && val !== undefined && typeof val === 'number') {
          entries.push({
            facility,
            payPeriod: String(period),
            metric: sheetName.split(' ')[0].toLowerCase(), // 'ot', 'bonus', 'ppd'
            value: val
          });
        }
      }
    }
  }

  return entries;
}
