import * as XLSX from 'xlsx';
import { ParsedData, OTRow, BonusRow, PPDRow } from './parseWorkbook';

export function buildExcelExport(data: ParsedData, filteredOT: OTRow[], filteredBonus: BonusRow[], filteredPPD: PPDRow[]) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Dashboard (KPI Summary)
  const execSummary = [
    ['AVIR KPI ANALYTICS - EXECUTIVE PORTFOLIO SUMMARY'],
    ['Generated At:', new Date().toLocaleString()],
    ['Filename:', data.filename],
    [],
    ['KPI Metric', 'Portfolio Total / Average'],
    ['Total OT Dollars', filteredOT.reduce((s, r) => s + r.otDollars, 0)],
    ['Total OT Hours', filteredOT.reduce((s, r) => s + r.otHours, 0)],
    ['Total Bonus Dollars', filteredBonus.reduce((s, r) => s + r.bonusDollars, 0)],
    ['Avg Direct HPPD', filteredPPD.filter(r => r.metricType.includes('HPPD')).reduce((s, r, _, a) => s + r.value / a.length, 0)],
    ['Avg Labor PPD', filteredPPD.filter(r => r.metricType.includes('PPD $')).reduce((s, r, _, a) => s + r.value / a.length, 0)],
    [],
    ['Dimensions Detected'],
    ['Facilities', data.dimensions.facilities.length],
    ['Regions', data.dimensions.regions.length],
    ['Acquisition Groups', data.dimensions.subgroups.length],
  ];
  const wsExec = XLSX.utils.aoa_to_sheet(execSummary);
  XLSX.utils.book_append_sheet(wb, wsExec, 'Executive Summary');

  // 2. OT Analysis
  const otSheet = [
    ['OT ANALYSIS BY FACILITY'],
    ['Facility', 'Region', 'Acq Group', 'Pay Cycle', 'Total OT $', 'Total OT Hours'],
    ...data.dimensions.facilities.map(f => {
      const rows = filteredOT.filter(r => r.facility === f.name);
      return [
        f.name, f.region, f.subgroup, f.payCycle,
        rows.reduce((s, r) => s + r.otDollars, 0),
        rows.reduce((s, r) => s + r.otHours, 0)
      ];
    })
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(otSheet), 'OT Analysis');

  // 3. Bonus Analysis
  const bonusSheet = [
    ['BONUS ANALYSIS BY FACILITY'],
    ['Facility', 'Region', 'Acq Group', 'Pay Cycle', 'Total Bonus $'],
    ...data.dimensions.facilities.map(f => {
      const rows = filteredBonus.filter(r => r.facility === f.name);
      return [
        f.name, f.region, f.subgroup, f.payCycle,
        rows.reduce((s, r) => s + r.bonusDollars, 0)
      ];
    })
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bonusSheet), 'Bonus Analysis');

  // 4. Labor Pressure Ranking
  const rankingSheet = [
    ['LABOR PRESSURE RANKING'],
    ['Rank', 'Facility', 'Region', 'Acq Group', 'Pressure Score'],
    ...data.dimensions.facilities.map((f, i) => [i + 1, f.name, f.region, f.subgroup, Math.random() * 100]) // Mock score for now
      .sort((a, b) => (b[4] as number) - (a[4] as number))
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rankingSheet), 'Labor Pressure');

  // 5. Raw Details (For QA)
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredOT), 'OT Detail');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredBonus), 'Bonus Detail');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.dimensions.facilities), 'Facility Mapping');

  // Final Output
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/octet-stream' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
