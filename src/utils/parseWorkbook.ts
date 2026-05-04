import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Facility {
  name: string;
  normalized: string;
  subgroup: string;   // "TX 1.0" etc.
  region: string;
  payCycle: string;
  latestPeriod: string;
  priorPeriod: string;
  comparableStatus: string;
}

export interface PayPeriod {
  label: string;       // "03/28/2026"
  dateValue: Date | null;
}

export interface OTRow {
  facility: string;
  subgroup: string;
  department: string;
  position: string;
  employee: string;
  payPeriod: string;
  otDollars: number;
  otHours: number;
  otPct: number;
}

export interface BonusRow {
  facility: string;
  subgroup: string;
  bonusType: string;
  position: string;
  employee: string;
  payPeriod: string;
  bonusDollars: number;
}

export interface PPDRow {
  facility: string;
  subgroup: string;
  metricType: string;   // "Direct Care HPPD", "Direct Care PPD $", "Overall Labor PPD $"
  payPeriod: string;
  value: number;
}

export interface ParsedData {
  filename: string;
  fileSize: number;
  parsedAt: string;
  sheetsDetected: string[];
  sheetRowCounts: Record<string, number>;

  // Dimensions
  facilities: Facility[];
  subgroups: string[];
  regions: string[];
  payPeriods: string[];
  departments: string[];
  positions: string[];
  bonusTypes: string[];

  // Facts
  otRows: OTRow[];
  bonusRows: BonusRow[];
  ppdRows: PPDRow[];

  // Metadata
  warnings: string[];
  parserCoverage: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function norm(v: any): string {
  return String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toNum(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/[$,%]/g, ''));
  return isNaN(n) ? 0 : n;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(v: any): string {
  const d = toDate(v);
  if (!d) return String(v ?? '').trim();
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function getSheet(wb: XLSX.WorkBook, name: string): any[][] | null {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
}

// Fill-down empty cells in a column (for merged-cell style data)
function fillDown(col: any[]): any[] {
  let last: any = null;
  return col.map(v => {
    if (v !== null && v !== undefined && String(v).trim() !== '') last = v;
    return last;
  });
}

// ─── Parse Pay Cycle Mapping ─────────────────────────────────────────────────

function parsePayCycleMapping(wb: XLSX.WorkBook, warnings: string[]): Facility[] {
  const rows = getSheet(wb, 'Pay Cycle Mapping');
  if (!rows) {
    warnings.push('Pay Cycle Mapping sheet not found — facility metadata unavailable');
    return [];
  }

  // Header is row 3 (index 2)
  // Cols: Subgroup, Facility, Region, Pay Cycle Group, Manual Override, [period cols], Latest Period, Correct Prior Period, Comparable Status
  const headerRow = rows[2] || [];
  const subgroupCol = headerRow.findIndex(h => norm(h).includes('subgroup'));
  const facilityCol = headerRow.findIndex(h => norm(h) === 'facility');
  const regionCol = headerRow.findIndex(h => norm(h) === 'region');
  const payCycleCol = headerRow.findIndex(h => norm(h).includes('pay cycle group'));
  const latestCol = headerRow.findIndex(h => norm(h).includes('latest'));
  const priorCol = headerRow.findIndex(h => norm(h).includes('correct prior'));
  const comparableCol = headerRow.findIndex(h => norm(h).includes('comparable status'));

  const facilities: Facility[] = [];

  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const facility = String(row[facilityCol] ?? '').trim();
    if (!facility || facility.toLowerCase().includes('total')) continue;

    facilities.push({
      name: facility,
      normalized: norm(facility),
      subgroup: String(row[subgroupCol] ?? '').trim(),
      region: String(row[regionCol] ?? '').trim(),
      payCycle: String(row[payCycleCol] ?? '').trim(),
      latestPeriod: formatDate(row[latestCol]),
      priorPeriod: formatDate(row[priorCol]),
      comparableStatus: String(row[comparableCol] ?? '').trim(),
    });
  }

  return facilities;
}

// ─── Parse OT by Pay Period ───────────────────────────────────────────────────

function parseOTbyPayPeriod(wb: XLSX.WorkBook, warnings: string[]): { otRows: OTRow[]; payPeriods: string[] } {
  const rows = getSheet(wb, 'OT by Pay Period');
  if (!rows) {
    warnings.push('OT by Pay Period sheet not found');
    return { otRows: [], payPeriods: [] };
  }

  // Row 3 (idx=2): section labels — "OT Dollars ($)", "", "", "", "OT Hours", "OT % of Gross ($)"
  // Row 4 (idx=3): column headers — Subgroup, Facility, Dept, "", Position, Employee, [dates x3], [dates x3], [dates x3]
  const labelRow = rows[2] || [];
  const headerRow = rows[3] || [];

  // Find date columns (dates appear as date-like strings or Date objects starting at col 6)
  const dateCols: { col: number; period: string; section: 'otDollars' | 'otHours' | 'otPct' }[] = [];
  let currentSection: 'otDollars' | 'otHours' | 'otPct' = 'otDollars';

  for (let c = 0; c < headerRow.length; c++) {
    const label = norm(String(labelRow[c] ?? ''));
    if (label.includes('ot dollars') || label.includes('ot $')) currentSection = 'otDollars';
    else if (label.includes('ot hours') || label.includes('hours')) currentSection = 'otHours';
    else if (label.includes('ot %') || label.includes('gross')) currentSection = 'otPct';

    const h = headerRow[c];
    const d = toDate(h);
    if (d || (typeof h === 'string' && /\d+\/\d+\/\d+/.test(h))) {
      dateCols.push({ col: c, period: formatDate(h), section: currentSection });
    }
  }

  if (dateCols.length === 0) {
    warnings.push('OT by Pay Period: no date columns detected');
    return { otRows: [], payPeriods: [] };
  }

  const payPeriodSet = new Set<string>(dateCols.map(d => d.period));

  // Fill-down subgroup, facility, dept for merged-cell layout
  const subgroupCol = headerRow.findIndex(h => norm(h).includes('subgroup'));
  const facilityCol = headerRow.findIndex(h => norm(h) === 'facility');
  const deptCol = headerRow.findIndex(h => norm(h).includes('department') || norm(h).includes('dept'));
  const posCol = headerRow.findIndex(h => norm(h).includes('position'));
  const empCol = headerRow.findIndex(h => norm(h).includes('employee'));

  const dataRows = rows.slice(4);
  const subgroups = fillDown(dataRows.map(r => r?.[subgroupCol]));
  const facilityNames = fillDown(dataRows.map(r => r?.[facilityCol]));
  const departments = fillDown(dataRows.map(r => r?.[deptCol]));

  const otRows: OTRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row) continue;

    const facility = String(facilityNames[i] ?? '').trim();
    if (!facility || facility.toLowerCase().includes('total')) continue;

    const employee = String(row[empCol] ?? '').trim();
    const position = String(row[posCol] ?? '').trim();
    const department = String(departments[i] ?? '').trim();
    const subgroup = String(subgroups[i] ?? '').trim();

    // Group by payPeriod for this employee row
    const byPeriod: Record<string, Partial<OTRow>> = {};

    for (const { col, period, section } of dateCols) {
      const val = toNum(row[col]);
      if (val === 0) continue;
      if (!byPeriod[period]) {
        byPeriod[period] = { facility, subgroup, department, position, employee, payPeriod: period, otDollars: 0, otHours: 0, otPct: 0 };
      }
      if (section === 'otDollars') byPeriod[period].otDollars = (byPeriod[period].otDollars || 0) + val;
      else if (section === 'otHours') byPeriod[period].otHours = (byPeriod[period].otHours || 0) + val;
      else if (section === 'otPct') byPeriod[period].otPct = (byPeriod[period].otPct || 0) + val;
    }

    for (const row of Object.values(byPeriod)) {
      if ((row.otDollars || 0) > 0 || (row.otHours || 0) > 0) {
        otRows.push(row as OTRow);
      }
    }
  }

  return { otRows, payPeriods: Array.from(payPeriodSet) };
}

// ─── Parse Bonus by PPE ───────────────────────────────────────────────────────

function parseBonusByPPE(wb: XLSX.WorkBook, warnings: string[]): BonusRow[] {
  const rows = getSheet(wb, 'Bonus by PPE');
  if (!rows) {
    warnings.push('Bonus by PPE sheet not found');
    return [];
  }

  // Row 3 (idx=2): Subgroup, Facility, Bonus Type, "", Position, Employee Name, [dates]
  const headerRow = rows[2] || [];
  const subgroupCol = headerRow.findIndex(h => norm(h).includes('subgroup'));
  const facilityCol = headerRow.findIndex(h => norm(h) === 'facility');
  const bonusTypeCol = headerRow.findIndex(h => norm(h).includes('bonus type'));
  const posCol = headerRow.findIndex(h => norm(h).includes('position'));
  const empCol = headerRow.findIndex(h => norm(h).includes('employee'));

  const dateCols: { col: number; period: string }[] = [];
  for (let c = 0; c < headerRow.length; c++) {
    const d = toDate(headerRow[c]);
    if (d) dateCols.push({ col: c, period: formatDate(headerRow[c]) });
  }

  if (dateCols.length === 0) {
    warnings.push('Bonus by PPE: no date columns detected');
    return [];
  }

  const dataRows = rows.slice(3);
  const subgroups = fillDown(dataRows.map(r => r?.[subgroupCol]));
  const facilityNames = fillDown(dataRows.map(r => r?.[facilityCol]));
  const bonusTypes = fillDown(dataRows.map(r => r?.[bonusTypeCol]));

  const bonusRows: BonusRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row) continue;
    const facility = String(facilityNames[i] ?? '').trim();
    if (!facility || facility.toLowerCase().includes('total')) continue;

    const employee = String(row[empCol] ?? '').trim();
    const position = String(row[posCol] ?? '').trim();
    const bonusType = String(bonusTypes[i] ?? '').trim();
    const subgroup = String(subgroups[i] ?? '').trim();

    for (const { col, period } of dateCols) {
      const val = toNum(row[col]);
      if (val === 0) continue;
      bonusRows.push({ facility, subgroup, bonusType, position, employee, payPeriod: period, bonusDollars: val });
    }
  }

  return bonusRows;
}

// ─── Parse PPDs ───────────────────────────────────────────────────────────────

function parsePPDs(wb: XLSX.WorkBook, warnings: string[]): PPDRow[] {
  const rows = getSheet(wb, 'PPDs');
  if (!rows) {
    warnings.push('PPDs sheet not found');
    return [];
  }

  // Row 4 (idx=3): "", Subgroup Name, Facility, "", [dates...]
  // Col A has metric type (fill-down): "Direct Care HPPD", "Direct Care PPD $", "Overall Labor PPD $"
  const headerRow = rows[3] || [];
  const subgroupCol = 1;
  const facilityCol = 2;

  const dateCols: { col: number; period: string }[] = [];
  for (let c = 4; c < headerRow.length; c++) {
    const v = headerRow[c];
    if (v) dateCols.push({ col: c, period: formatDate(v) });
  }

  if (dateCols.length === 0) {
    warnings.push('PPDs: no date columns found');
    return [];
  }

  const dataRows = rows.slice(4);
  const metricTypes = fillDown(dataRows.map(r => r?.[0]));
  const subgroups = fillDown(dataRows.map(r => r?.[subgroupCol]));
  const facilities = fillDown(dataRows.map(r => r?.[facilityCol]));

  const ppdRows: PPDRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row) continue;
    const facility = String(facilities[i] ?? '').trim();
    if (!facility || facility.toLowerCase().includes('total')) continue;

    const metricType = String(metricTypes[i] ?? '').trim();
    const subgroup = String(subgroups[i] ?? '').trim();

    for (const { col, period } of dateCols) {
      const val = toNum(row[col]);
      if (val === 0) continue;
      ppdRows.push({ facility, subgroup, metricType, payPeriod: period, value: val });
    }
  }

  return ppdRows;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function parseWorkbook(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheetsDetected = wb.SheetNames;
  const sheetRowCounts: Record<string, number> = {};
  for (const name of sheetsDetected) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    sheetRowCounts[name] = rows.length;
  }

  const warnings: string[] = [];
  const coverage: Record<string, string> = {};

  // Parse all dimensions and facts
  const facilities = parsePayCycleMapping(wb, warnings);
  coverage['Pay Cycle Mapping'] = facilities.length > 0 ? `${facilities.length} facilities` : 'FAILED';

  const { otRows, payPeriods } = parseOTbyPayPeriod(wb, warnings);
  coverage['OT by Pay Period'] = otRows.length > 0 ? `${otRows.length} rows` : 'FAILED';

  const bonusRows = parseBonusByPPE(wb, warnings);
  coverage['Bonus by PPE'] = bonusRows.length > 0 ? `${bonusRows.length} rows` : 'FAILED';

  const ppdRows = parsePPDs(wb, warnings);
  coverage['PPDs'] = ppdRows.length > 0 ? `${ppdRows.length} rows` : 'FAILED';

  // Derive dimension sets
  const subgroups = [...new Set(facilities.map(f => f.subgroup).filter(Boolean))];
  const regions = [...new Set(facilities.map(f => f.region).filter(Boolean))];
  const departments = [...new Set(otRows.map(r => r.department).filter(Boolean))];
  const positions = [...new Set([...otRows.map(r => r.position), ...bonusRows.map(r => r.position)].filter(Boolean))];
  const bonusTypes = [...new Set(bonusRows.map(r => r.bonusType).filter(Boolean))];

  // Enrich OT/Bonus with region/subgroup from facility lookup
  const facilityLookup = new Map(facilities.map(f => [f.normalized, f]));
  const getRegion = (facilityName: string) => facilityLookup.get(norm(facilityName))?.region || '';
  const getSubgroup = (facilityName: string) => facilityLookup.get(norm(facilityName))?.subgroup || '';

  for (const r of otRows) {
    if (!r.subgroup) r.subgroup = getSubgroup(r.facility);
  }
  for (const r of bonusRows) {
    if (!r.subgroup) r.subgroup = getSubgroup(r.facility);
  }

  return {
    filename: file.name,
    fileSize: file.size,
    parsedAt: new Date().toISOString(),
    sheetsDetected,
    sheetRowCounts,
    facilities,
    subgroups,
    regions,
    payPeriods: payPeriods.sort(),
    departments: departments.sort(),
    positions: positions.sort(),
    bonusTypes: bonusTypes.sort(),
    otRows,
    bonusRows,
    ppdRows,
    warnings,
    parserCoverage: coverage,
  };
}
