import * as XLSX from 'xlsx';

export interface ParsedFacility {
  name: string;
  normalized: string;
  region: string;
  group: string;
}

export interface ParsedMetric {
  facility: string;
  region: string;
  group: string;
  payPeriod: string;
  otDollars: number;
  otHours: number;
  bonusDollars: number;
  hppd: number;
  ppdDollars: number;
  sheet: string;
}

export interface ParsedEmployee {
  name: string;
  facility: string;
  otDollars: number;
  bonusDollars: number;
  payPeriod: string;
}

export interface WorkbookParseResult {
  filename: string;
  fileSize: number;
  sheetsDetected: string[];
  sheetRowCounts: Record<string, number>;
  facilities: ParsedFacility[];
  regions: string[];
  groups: string[];
  payPeriods: string[];
  metrics: ParsedMetric[];
  employees: ParsedEmployee[];
  warnings: string[];
  parsedAt: string;
}

function normalize(s: string): string {
  return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function isTotal(s: string): boolean {
  const n = normalize(s);
  return n.includes('total') || n.includes('grand') || n.includes('subtotal') || n === '';
}

function toNum(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/[$,]/g, ''));
  return isNaN(n) ? 0 : n;
}

function isDateLike(v: any): boolean {
  if (!v) return false;
  if (v instanceof Date) return true;
  const s = String(v);
  return /\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/.test(s) || /\d{4}-\d{2}/.test(s);
}

function formatPeriod(v: any): string {
  if (!v) return '';
  if (v instanceof Date) {
    return v.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return String(v).trim();
}

/** Parse facilities, regions, groups from any sheet with column heuristics */
function parseDimensions(wb: XLSX.WorkBook): { facilities: ParsedFacility[]; regions: string[]; groups: string[] } {
  const facilityMap: Record<string, ParsedFacility> = {};
  const regions = new Set<string>();
  const groups = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    if (rows.length < 2) continue;

    // Find header row (scan first 10 rows)
    let headerRow = -1;
    let colFacility = -1, colRegion = -1, colGroup = -1;

    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r].map((c: any) => normalize(String(c)));
      const fi = row.findIndex(c => c.includes('facilit') || c === 'name' || c === 'location');
      const ri = row.findIndex(c => c.includes('region'));
      const gi = row.findIndex(c => c.includes('acq') || c.includes('group') || c.includes('organization') || c.includes('cluster'));
      if (fi >= 0 || ri >= 0 || gi >= 0) {
        headerRow = r;
        colFacility = fi >= 0 ? fi : 0;
        colRegion = ri;
        colGroup = gi;
        break;
      }
    }

    // Fallback: if first column looks like facility names
    if (headerRow === -1 && rows.length > 5) {
      const sample = rows.slice(1, 6).map(r => String(r[0] || ''));
      if (sample.filter(s => s.length > 3 && !isTotal(s)).length >= 3) {
        headerRow = 0;
        colFacility = 0;
      }
    }

    if (headerRow === -1) continue;

    for (let r = headerRow + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[colFacility]) continue;
      const fName = String(row[colFacility]).trim();
      if (isTotal(fName) || fName.length < 2) continue;

      const region = colRegion >= 0 ? String(row[colRegion] || '').trim() : '';
      const group = colGroup >= 0 ? String(row[colGroup] || '').trim() : '';

      if (!facilityMap[fName]) {
        facilityMap[fName] = { name: fName, normalized: normalize(fName), region, group };
      } else {
        if (region && !facilityMap[fName].region) facilityMap[fName].region = region;
        if (group && !facilityMap[fName].group) facilityMap[fName].group = group;
      }

      if (region && !isTotal(region)) regions.add(region);
      if (group && !isTotal(group)) groups.add(group);
    }
  }

  return {
    facilities: Object.values(facilityMap),
    regions: Array.from(regions).filter(Boolean),
    groups: Array.from(groups).filter(Boolean)
  };
}

/** Parse OT/Bonus metrics from sheets with wide date-column layout */
function parseWideMetrics(wb: XLSX.WorkBook, facilities: ParsedFacility[]): { metrics: ParsedMetric[]; payPeriods: string[]; employees: ParsedEmployee[] } {
  const metrics: ParsedMetric[] = [];
  const payPeriodSet = new Set<string>();
  const employees: ParsedEmployee[] = [];

  const facilityLookup: Record<string, ParsedFacility> = {};
  for (const f of facilities) {
    facilityLookup[normalize(f.name)] = f;
  }

  // Parse "OT by Pay Period" style sheets (facility rows, date columns)
  const otSheet = wb.Sheets['OT by Pay Period'];
  const bonusSheet = wb.Sheets['Bonus by PPE'];
  const ppdSheet = wb.Sheets['PPDs'];
  const topOtSheet = wb.Sheets['Top OT Earners'];

  function parseWideSheet(sheet: XLSX.WorkSheet | undefined, metricType: 'ot' | 'bonus' | 'ppd') {
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    if (rows.length < 3) return;

    // Find date headers row (look for row with multiple date-like or numeric column headers)
    let dateRow = -1;
    let dateCols: { col: number; period: string }[] = [];

    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r];
      const found = row.map((v: any, ci: number) => ({ v, ci }))
        .filter(({ v }) => isDateLike(v) || (typeof v === 'number' && v > 40000 && v < 55000)); // Excel date serials

      if (found.length >= 2) {
        dateRow = r;
        dateCols = found.map(({ v, ci }) => ({
          col: ci,
          period: formatPeriod(
            typeof v === 'number' && v > 40000 ? XLSX.SSF.parse_date_code(v) : v
          )
        }));
        dateCols.forEach(d => payPeriodSet.add(d.period));
        break;
      }
    }

    // If no date row found, treat all numeric columns as a single period
    if (dateRow === -1) {
      const header = rows[0] || [];
      dateCols = header.map((v: any, ci: number) => ({ v, ci }))
        .filter(({ v, ci }) => ci > 0 && typeof v !== 'undefined' && v !== '')
        .slice(0, 20)
        .map(({ v, ci }) => ({ col: ci, period: String(v).trim() }));
      dateRow = 0;
    }

    for (let r = dateRow + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0]) continue;
      const facilityName = String(row[0]).trim();
      if (isTotal(facilityName)) continue;

      const fInfo = facilityLookup[normalize(facilityName)] || { name: facilityName, normalized: normalize(facilityName), region: '', group: '' };

      for (const { col, period } of dateCols) {
        const val = toNum(row[col]);
        if (val === 0) continue;

        // Find existing metric entry or create new
        let entry = metrics.find(m => m.facility === fInfo.name && m.payPeriod === period);
        if (!entry) {
          entry = {
            facility: fInfo.name,
            region: fInfo.region,
            group: fInfo.group,
            payPeriod: period,
            otDollars: 0,
            otHours: 0,
            bonusDollars: 0,
            hppd: 0,
            ppdDollars: 0,
            sheet: sheet === otSheet ? 'OT by Pay Period' : sheet === bonusSheet ? 'Bonus by PPE' : 'PPDs'
          };
          metrics.push(entry);
        }

        if (metricType === 'ot') entry.otDollars += val;
        else if (metricType === 'bonus') entry.bonusDollars += val;
        else if (metricType === 'ppd') {
          // Try to detect HPPD vs PPD$ from column header
          const header = String(rows[dateRow - 1]?.[col] || rows[0]?.[col] || '').toLowerCase();
          if (header.includes('hour') || header.includes('hppd')) entry.hppd += val;
          else entry.ppdDollars += val;
        }
      }
    }
  }

  parseWideSheet(otSheet, 'ot');
  parseWideSheet(bonusSheet, 'bonus');
  parseWideSheet(ppdSheet, 'ppd');

  // Parse Top OT Earners for employee data
  if (topOtSheet) {
    const rows = XLSX.utils.sheet_to_json(topOtSheet, { header: 1, defval: '' }) as any[][];
    let headerRow = rows.findIndex(r =>
      r.some((c: any) => normalize(String(c)).includes('name') || normalize(String(c)).includes('employee'))
    );
    if (headerRow < 0) headerRow = 0;
    const header = rows[headerRow].map((c: any) => normalize(String(c)));
    const nameCol = header.findIndex(c => c.includes('name') || c.includes('employee'));
    const facilCol = header.findIndex(c => c.includes('facilit'));
    const otCol = header.findIndex(c => c.includes('ot') && (c.includes('dollar') || c.includes('$') || c.includes('amount') || c.includes('total')));
    const periodCol = header.findIndex(c => c.includes('period') || c.includes('date') || c.includes('ppe'));

    for (let r = headerRow + 1; r < rows.length; r++) {
      const row = rows[r];
      const name = String(row[nameCol >= 0 ? nameCol : 0] || '').trim();
      if (!name || isTotal(name)) continue;
      employees.push({
        name,
        facility: facilCol >= 0 ? String(row[facilCol] || '').trim() : '',
        otDollars: toNum(row[otCol >= 0 ? otCol : 2]),
        bonusDollars: 0,
        payPeriod: periodCol >= 0 ? formatPeriod(row[periodCol]) : ''
      });
    }
  }

  // Also check Bonus by Type for employee bonus data
  const bonusTypeSheet = wb.Sheets['Bonus by Type'];
  if (bonusTypeSheet) {
    const rows = XLSX.utils.sheet_to_json(bonusTypeSheet, { header: 1, defval: '' }) as any[][];
    let headerRow = rows.findIndex(r =>
      r.some((c: any) => normalize(String(c)).includes('employee') || normalize(String(c)).includes('name'))
    );
    if (headerRow >= 0) {
      const header = rows[headerRow].map((c: any) => normalize(String(c)));
      const nameCol = header.findIndex(c => c.includes('name') || c.includes('employee'));
      const facilCol = header.findIndex(c => c.includes('facilit'));
      const amtCol = header.findIndex(c => c.includes('amount') || c.includes('bonus') || c.includes('dollar'));
      for (let r = headerRow + 1; r < rows.length; r++) {
        const row = rows[r];
        const name = String(row[nameCol >= 0 ? nameCol : 0] || '').trim();
        if (!name || isTotal(name)) continue;
        const existing = employees.find(e => normalize(e.name) === normalize(name));
        const bonusAmt = toNum(row[amtCol >= 0 ? amtCol : 2]);
        if (existing) existing.bonusDollars += bonusAmt;
        else employees.push({ name, facility: facilCol >= 0 ? String(row[facilCol] || '') : '', otDollars: 0, bonusDollars: bonusAmt, payPeriod: '' });
      }
    }
  }

  return {
    metrics,
    payPeriods: Array.from(payPeriodSet).filter(Boolean),
    employees
  };
}

export async function parseWorkbook(file: File): Promise<WorkbookParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheetRowCounts: Record<string, number> = {};
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    sheetRowCounts[name] = rows.length;
  }

  const warnings: string[] = [];
  const { facilities, regions, groups } = parseDimensions(wb);
  if (facilities.length === 0) warnings.push('No facilities detected — check column headers in your workbook.');

  const { metrics, payPeriods, employees } = parseWideMetrics(wb, facilities);
  if (metrics.length === 0) warnings.push('No metric rows parsed — sheets may have unexpected layout.');

  return {
    filename: file.name,
    fileSize: file.size,
    sheetsDetected: wb.SheetNames,
    sheetRowCounts,
    facilities,
    regions,
    groups,
    payPeriods,
    metrics,
    employees,
    warnings,
    parsedAt: new Date().toISOString()
  };
}
