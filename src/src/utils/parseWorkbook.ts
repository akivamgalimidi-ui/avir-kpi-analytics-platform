import * as XLSX from 'xlsx';

// ─── Dimensions & Canonical Types ─────────────────────────────────────────────

export interface FacilityMapping {
  name: string;
  normalized: string;
  subgroup: string;   // Acquisition Group / Portfolio
  region: string;
  payCycle: 'Cycle A' | 'Cycle B' | 'Unknown';
  latestPeriod: string;
  priorPeriod: string;
  comparableStatus: 'Comparable' | 'Non-Comparable' | 'New';
  mappingConfidence: number; // 0-1
}

export interface OTRow {
  employee: string;
  facility: string;
  subgroup: string;
  region: string;
  payCycle: string;
  department: string;
  position: string;
  payPeriod: string;
  otDollars: number;
  otHours: number;
}

export interface BonusRow {
  employee: string;
  facility: string;
  subgroup: string;
  region: string;
  payCycle: string;
  bonusType: string;
  position: string;
  payPeriod: string;
  bonusDollars: number;
}

export interface PPDRow {
  facility: string;
  subgroup: string;
  region: string;
  payCycle: string;
  metricType: string; // "Direct Care HPPD", "Direct Care PPD $", etc.
  payPeriod: string;
  value: number;
}

export interface ParsedData {
  filename: string;
  fileSize: number;
  parsedAt: string;
  sheetsDetected: string[];
  sheetRowCounts: Record<string, number>;
  
  dimensions: {
    facilities: FacilityMapping[];
    subgroups: string[];
    regions: string[];
    payPeriods: string[];
    departments: string[];
    positions: string[];
    bonusTypes: string[];
    employees: string[];
  };
  
  facts: {
    otRows: OTRow[];
    bonusRows: BonusRow[];
    ppdRows: PPDRow[];
  };

  warnings: string[];
  parserCoverage: Record<string, string>;
}

// ─── Heuristic Helpers ────────────────────────────────────────────────────────

function norm(v: any): string {
  return String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toNum(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/[$,%]/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatDate(v: any): string {
  if (!v) return '';
  if (v instanceof Date) return v.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const d = new Date(String(v));
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  return String(v).trim();
}

function getSheet(wb: XLSX.WorkBook, names: string[]): any[][] | null {
  for (const name of names) {
    const actualName = wb.SheetNames.find(s => norm(s) === norm(name));
    if (actualName) {
      const ws = wb.Sheets[actualName];
      return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
    }
  }
  return null;
}

function findHeaderRow(data: any[][], keywords: string[]): number {
  for (let i = 0; i < Math.min(data.length, 25); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = row.map(c => norm(c)).join('|');
    if (keywords.some(k => rowStr.includes(norm(k)))) return i;
  }
  return 0;
}

function fillDown(col: any[]): any[] {
  let last: any = null;
  return col.map(v => {
    if (v !== null && v !== undefined && String(v).trim() !== '') last = v;
    return last;
  });
}

// ─── Mapping Engine ───────────────────────────────────────────────────────────

function buildFacilityMapping(wb: XLSX.WorkBook, warnings: string[]): FacilityMapping[] {
  const rows = getSheet(wb, ['Pay Cycle Mapping', 'Facility Mapping', 'Buildings']);
  if (!rows) {
    warnings.push('Facility Mapping sheet not found — region and subgroup logic will be inferred.');
    return [];
  }

  const hIdx = findHeaderRow(rows, ['Facility', 'Building', 'Subgroup', 'Region']);
  const header = rows[hIdx] || [];
  
  const subgroupCol = header.findIndex(h => norm(h).includes('subgroup') || norm(h).includes('portfolio'));
  const facilityCol = header.findIndex(h => norm(h).includes('facility') || norm(h).includes('building') || norm(h).includes('entity'));
  const regionCol = header.findIndex(h => norm(h).includes('region'));
  const payCycleCol = header.findIndex(h => norm(h).includes('paycycle'));
  const latestCol = header.findIndex(h => norm(h).includes('latest'));
  const priorCol = headerRowIndex(header, ['prior', 'matching']);
  const comparableCol = header.findIndex(h => norm(h).includes('comparable'));

  return rows.slice(hIdx + 1).map(row => {
    const name = String(row[facilityCol] ?? '').trim();
    if (!name || norm(name).includes('total')) return null;
    
    return {
      name,
      normalized: norm(name),
      subgroup: String(row[subgroupCol] ?? 'Unassigned').trim(),
      region: String(row[regionCol] ?? 'Unassigned').trim(),
      payCycle: inferPayCycle(String(row[payCycleCol] ?? '')),
      latestPeriod: formatDate(row[latestCol]),
      priorPeriod: formatDate(row[priorCol]),
      comparableStatus: (row[comparableCol] || 'Unknown') as any,
      mappingConfidence: 1.0
    };
  }).filter(Boolean) as FacilityMapping[];
}

function headerRowIndex(header: any[], keys: string[]): number {
  return header.findIndex(h => keys.some(k => norm(h).includes(norm(k))));
}

function inferPayCycle(v: string): 'Cycle A' | 'Cycle B' | 'Unknown' {
  if (norm(v).includes('cyclea') || norm(v).includes('groupa')) return 'Cycle A';
  if (norm(v).includes('cycleb') || norm(v).includes('groupb')) return 'Cycle B';
  return 'Unknown';
}

// ─── Parsing Modules ──────────────────────────────────────────────────────────

function parseOT(wb: XLSX.WorkBook, mapping: Map<string, FacilityMapping>): OTRow[] {
  const rows = getSheet(wb, ['OT by Pay Period', 'OT Analysis']);
  if (!rows) return [];

  const hIdx = findHeaderRow(rows, ['Employee', 'Facility', 'OT Dollars']);
  const labelRow = rows[hIdx - 1] || [];
  const header = rows[hIdx] || [];
  
  const subgroupCol = headerRowIndex(header, ['subgroup', 'group']);
  const facilityCol = headerRowIndex(header, ['facility', 'building']);
  const deptCol = headerRowIndex(header, ['department', 'dept']);
  const posCol = headerRowIndex(header, ['position', 'title']);
  const empCol = headerRowIndex(header, ['employee', 'staff']);

  const dateCols: { col: number; period: string; section: 'dollars' | 'hours' }[] = [];
  let section: 'dollars' | 'hours' = 'dollars';
  
  header.forEach((h, i) => {
    const label = norm(labelRow[i]);
    if (label.includes('dollars')) section = 'dollars';
    if (label.includes('hours')) section = 'hours';
    
    if (i >= 5 && (h instanceof Date || /\d+\/\d+/.test(String(h)))) {
      dateCols.push({ col: i, period: formatDate(h), section });
    }
  });

  const dataRows = rows.slice(hIdx + 1);
  const subs = fillDown(dataRows.map(r => r?.[subgroupCol]));
  const facs = fillDown(dataRows.map(r => r?.[facilityCol]));
  const depts = fillDown(dataRows.map(r => r?.[deptCol]));

  const results: OTRow[] = [];
  dataRows.forEach((row, i) => {
    const facilityName = String(facs[i] ?? '').trim();
    if (!facilityName || norm(facilityName).includes('total')) return;
    
    const employee = String(row[empCol] ?? '').trim();
    const position = String(row[posCol] ?? '').trim();
    const map = mapping.get(norm(facilityName));
    
    const byPeriod: Record<string, Partial<OTRow>> = {};
    dateCols.forEach(({ col, period, section: sec }) => {
      const val = toNum(row[col]);
      if (val === 0) return;
      if (!byPeriod[period]) byPeriod[period] = {
        employee, facility: facilityName, position, 
        subgroup: map?.subgroup || String(subs[i] || 'Unassigned'),
        region: map?.region || 'Unassigned',
        payCycle: map?.payCycle || 'Unknown',
        department: String(depts[i] || 'Unassigned'),
        payPeriod: period, otDollars: 0, otHours: 0
      };
      if (sec === 'dollars') byPeriod[period].otDollars = (byPeriod[period].otDollars || 0) + val;
      if (sec === 'hours') byPeriod[period].otHours = (byPeriod[period].otHours || 0) + val;
    });
    
    Object.values(byPeriod).forEach(r => results.push(r as OTRow));
  });

  return results;
}

function parseBonus(wb: XLSX.WorkBook, mapping: Map<string, FacilityMapping>): BonusRow[] {
  const rows = getSheet(wb, ['Bonus by PPE', 'Bonus Analysis']);
  if (!rows) return [];

  const hIdx = findHeaderRow(rows, ['Employee', 'Bonus Type', 'Dollars']);
  const header = rows[hIdx] || [];
  
  const subgroupCol = headerRowIndex(header, ['subgroup', 'group']);
  const facilityCol = headerRowIndex(header, ['facility', 'building']);
  const typeCol = headerRowIndex(header, ['bonus type']);
  const posCol = headerRowIndex(header, ['position']);
  const empCol = headerRowIndex(header, ['employee']);

  const dateCols: { col: number; period: string }[] = [];
  header.forEach((h, i) => {
    if (i >= 5 && (h instanceof Date || /\d+\/\d+/.test(String(h)))) {
      dateCols.push({ col: i, period: formatDate(h) });
    }
  });

  const dataRows = rows.slice(hIdx + 1);
  const subs = fillDown(dataRows.map(r => r?.[subgroupCol]));
  const facs = fillDown(dataRows.map(r => r?.[facilityCol]));
  const types = fillDown(dataRows.map(r => r?.[typeCol]));

  const results: BonusRow[] = [];
  dataRows.forEach((row, i) => {
    const facilityName = String(facs[i] ?? '').trim();
    if (!facilityName || norm(facilityName).includes('total')) return;
    
    const employee = String(row[empCol] ?? '').trim();
    const position = String(row[posCol] ?? '').trim();
    const map = mapping.get(norm(facilityName));
    
    dateCols.forEach(({ col, period }) => {
      const val = toNum(row[col]);
      if (val === 0) return;
      results.push({
        employee, facility: facilityName, position,
        subgroup: map?.subgroup || String(subs[i] || 'Unassigned'),
        region: map?.region || 'Unassigned',
        payCycle: map?.payCycle || 'Unknown',
        bonusType: String(types[i] || 'Other'),
        payPeriod: period, bonusDollars: val
      });
    });
  });

  return results;
}

function parsePPD(wb: XLSX.WorkBook, mapping: Map<string, FacilityMapping>): PPDRow[] {
  const rows = getSheet(wb, ['PPDs', 'HPPD Analysis']);
  if (!rows) return [];

  const hIdx = findHeaderRow(rows, ['HPPD', 'PPD $', 'Facility']);
  const header = rows[hIdx] || [];
  
  const dateCols: { col: number; period: string }[] = [];
  header.forEach((h, i) => {
    if (i >= 3 && (h instanceof Date || /\d+\/\d+/.test(String(h)))) {
      dateCols.push({ col: i, period: formatDate(h) });
    }
  });

  const dataRows = rows.slice(hIdx + 1);
  const metrics = fillDown(dataRows.map(r => r?.[0]));
  const subs = fillDown(dataRows.map(r => r?.[1]));
  const facs = fillDown(dataRows.map(r => r?.[2]));

  const results: PPDRow[] = [];
  dataRows.forEach((row, i) => {
    const facilityName = String(facs[i] ?? '').trim();
    if (!facilityName || norm(facilityName).includes('total')) return;
    
    const map = mapping.get(norm(facilityName));
    dateCols.forEach(({ col, period }) => {
      const val = toNum(row[col]);
      if (val === 0) return;
      results.push({
        facility: facilityName,
        subgroup: map?.subgroup || String(subs[i] || 'Unassigned'),
        region: map?.region || 'Unassigned',
        payCycle: map?.payCycle || 'Unknown',
        metricType: String(metrics[i] || 'Unknown'),
        payPeriod: period, value: val
      });
    });
  });

  return results;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export async function parseWorkbook(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  const warnings: string[] = [];
  const facilities = buildFacilityMapping(wb, warnings);
  const mapping = new Map(facilities.map(f => [f.normalized, f]));
  
  const otRows = parseOT(wb, mapping);
  const bonusRows = parseBonus(wb, mapping);
  const ppdRows = parsePPD(wb, mapping);

  // Auto-discover missing facilities from facts
  const allFacsInFacts = new Set([
    ...otRows.map(r => r.facility),
    ...bonusRows.map(r => r.facility),
    ...ppdRows.map(r => r.facility)
  ]);

  allFacsInFacts.forEach(name => {
    if (!mapping.has(norm(name))) {
      const f: FacilityMapping = {
        name, normalized: norm(name),
        subgroup: 'Unmapped', region: 'Unmapped', payCycle: 'Unknown',
        latestPeriod: '', priorPeriod: '', comparableStatus: 'New', mappingConfidence: 0.5
      };
      facilities.push(f);
      mapping.set(norm(name), f);
    }
  });

  const sheets = wb.SheetNames;
  const rowCounts: Record<string, number> = {};
  sheets.forEach(s => rowCounts[s] = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 }).length);

  return {
    filename: file.name,
    fileSize: file.size,
    parsedAt: new Date().toISOString(),
    sheetsDetected: sheets,
    sheetRowCounts: rowCounts,
    dimensions: {
      facilities: facilities.sort((a, b) => a.name.localeCompare(b.name)),
      subgroups: [...new Set(facilities.map(f => f.subgroup))].sort(),
      regions: [...new Set(facilities.map(f => f.region))].sort(),
      payPeriods: [...new Set([...otRows.map(r => r.payPeriod), ...bonusRows.map(r => r.payPeriod), ...ppdRows.map(r => r.payPeriod)])].sort(),
      departments: [...new Set(otRows.map(r => r.department))].sort(),
      positions: [...new Set([...otRows.map(r => r.position), ...bonusRows.map(r => r.position)])].sort(),
      bonusTypes: [...new Set(bonusRows.map(r => r.bonusType))].sort(),
      employees: [...new Set([...otRows.map(r => r.employee), ...bonusRows.map(r => r.employee)])].sort(),
    },
    facts: { otRows, bonusRows, ppdRows },
    warnings,
    parserCoverage: {
      'Facility Mapping': facilities.length > 0 ? 'COMPLETE' : 'MISSING',
      'OT Analysis': otRows.length > 0 ? 'COMPLETE' : 'EMPTY',
      'Bonus Analysis': bonusRows.length > 0 ? 'COMPLETE' : 'EMPTY',
      'PPD Analysis': ppdRows.length > 0 ? 'COMPLETE' : 'EMPTY'
    }
  };
}
