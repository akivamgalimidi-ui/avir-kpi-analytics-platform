import * as XLSX from 'xlsx';
import type { ParsedData } from './parseWorkbook';

function sumField<T>(rows: T[], field: keyof T): number {
  return rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

function groupBy<T>(arr: T[], key: (r: T) => string): Record<string, T[]> {
  return arr.reduce((acc, r) => {
    const k = key(r) || 'Unknown';
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {} as Record<string, T[]>);
}

function makeSheet(headers: string[], rows: any[][]): XLSX.WorkSheet {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Style header row bold width
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  return ws;
}

export function buildExcelExport(data: ParsedData, filteredOT: any[], filteredBonus: any[], filteredPPD: any[]): Blob {
  const wb = XLSX.utils.book_new();

  // 1. Upload Summary
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Field', 'Value'],
    [
      ['Filename', data.filename],
      ['File Size (KB)', (data.fileSize / 1024).toFixed(1)],
      ['Parsed At', new Date(data.parsedAt).toLocaleString()],
      ['Sheets Detected', data.sheetsDetected.length],
      ['Facilities', data.facilities.length],
      ['Regions', data.regions.length],
      ['Subgroups', data.subgroups.length],
      ['Pay Periods', data.payPeriods.length],
      ['OT Rows', data.otRows.length],
      ['Bonus Rows', data.bonusRows.length],
      ['PPD Rows', data.ppdRows.length],
      ['Warnings', data.warnings.length],
    ]
  ), 'Upload Summary');

  // 2. Facility Mapping
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Facility', 'Subgroup', 'Region', 'Pay Cycle', 'Latest Period', 'Prior Period', 'Comparable Status'],
    data.facilities.map(f => [f.name, f.subgroup, f.region, f.payCycle, f.latestPeriod, f.priorPeriod, f.comparableStatus])
  ), 'Facility Mapping');

  // 3. OT Analysis
  const otByFacility = groupBy(filteredOT, r => r.facility);
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Facility', 'Subgroup', 'Region', 'OT Dollars', 'OT Hours'],
    Object.entries(otByFacility)
      .map(([fac, rows]) => {
        const facInfo = data.facilities.find(f => f.name === fac);
        return [fac, facInfo?.subgroup || '', facInfo?.region || '', sumField(rows, 'otDollars'), sumField(rows, 'otHours')];
      })
      .sort((a, b) => (b[3] as number) - (a[3] as number))
  ), 'OT by Facility');

  // 4. OT Detail
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Employee', 'Facility', 'Subgroup', 'Department', 'Position', 'Pay Period', 'OT Dollars', 'OT Hours'],
    filteredOT.map(r => [r.employee, r.facility, r.subgroup, r.department, r.position, r.payPeriod, r.otDollars, r.otHours])
  ), 'OT Detail');

  // 5. Bonus Analysis
  const bonusByFacility = groupBy(filteredBonus, r => r.facility);
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Facility', 'Subgroup', 'Region', 'Bonus Dollars'],
    Object.entries(bonusByFacility)
      .map(([fac, rows]) => {
        const facInfo = data.facilities.find(f => f.name === fac);
        return [fac, facInfo?.subgroup || '', facInfo?.region || '', sumField(rows, 'bonusDollars')];
      })
      .sort((a, b) => (b[3] as number) - (a[3] as number))
  ), 'Bonus by Facility');

  // 6. Bonus Detail
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Employee', 'Facility', 'Subgroup', 'Bonus Type', 'Position', 'Pay Period', 'Bonus Dollars'],
    filteredBonus.map(r => [r.employee, r.facility, r.subgroup, r.bonusType, r.position, r.payPeriod, r.bonusDollars])
  ), 'Bonus Detail');

  // 7. PPD Analysis
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Facility', 'Subgroup', 'Metric Type', 'Pay Period', 'Value'],
    filteredPPD.map(r => [r.facility, r.subgroup, r.metricType, r.payPeriod, r.value])
  ), 'PPD Detail');

  // 8. Labor Pressure Ranking
  const allFacilityOT = groupBy(filteredOT, r => r.facility);
  const allFacilityBonus = groupBy(filteredBonus, r => r.facility);
  const rankings = data.facilities.map(f => {
    const ot = sumField(allFacilityOT[f.name] || [], 'otDollars');
    const bonus = sumField(allFacilityBonus[f.name] || [], 'bonusDollars');
    return { ...f, ot, bonus, score: ot + bonus };
  }).sort((a, b) => b.score - a.score);

  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Rank', 'Facility', 'Subgroup', 'Region', 'Pay Cycle', 'OT $', 'Bonus $', 'Pressure Score', 'Comparable Status'],
    rankings.map((r, i) => [i + 1, r.name, r.subgroup, r.region, r.payCycle, r.ot, r.bonus, r.score, r.comparableStatus])
  ), 'Labor Pressure Ranking');

  // 9. Pay Cycle Mapping
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Facility', 'Subgroup', 'Region', 'Pay Cycle', 'Latest Period', 'Prior Period', 'Comparable Status'],
    data.facilities.map(f => [f.name, f.subgroup, f.region, f.payCycle, f.latestPeriod, f.priorPeriod, f.comparableStatus])
  ), 'Pay Cycle Mapping');

  // 10. Data Quality
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['Sheet', 'Parser Coverage'],
    Object.entries(data.parserCoverage).map(([k, v]) => [k, v])
  ), 'Data Quality');

  // 11. Parser Warnings
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ['#', 'Warning'],
    data.warnings.map((w, i) => [i + 1, w])
  ), 'Parser Warnings');

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
