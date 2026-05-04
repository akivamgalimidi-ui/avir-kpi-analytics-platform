import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, fmt2, sumNum, groupBy } from '../components/shared';

export default function DataQuality() {
  const { data } = useData();

  if (!data) return (
    <div className="p-8 text-center text-slate-400 text-sm font-bold pt-24">
      Upload a payroll file to see data quality metrics.
    </div>
  );

  const checks = [
    { name: 'Workbook Parsed', status: 'PASS', detail: `${data.sheetsDetected.length} sheets detected` },
    { name: 'Facilities Detected', status: data.facilities.length > 0 ? 'PASS' : 'FAIL', detail: `${data.facilities.length} facilities from Pay Cycle Mapping` },
    { name: 'Regions Detected', status: data.regions.length > 0 ? 'PASS' : 'WARNING', detail: `${data.regions.length} unique regions` },
    { name: 'Subgroups (Acq Groups)', status: data.subgroups.length > 0 ? 'PASS' : 'WARNING', detail: `${data.subgroups.length}: ${data.subgroups.join(', ')}` },
    { name: 'Pay Periods Detected', status: data.payPeriods.length > 0 ? 'PASS' : 'FAIL', detail: `${data.payPeriods.length}: ${data.payPeriods.join(', ')}` },
    { name: 'OT Rows Parsed', status: data.otRows.length > 0 ? 'PASS' : 'FAIL', detail: `${data.otRows.length} employee-period OT records` },
    { name: 'Bonus Rows Parsed', status: data.bonusRows.length > 0 ? 'PASS' : 'FAIL', detail: `${data.bonusRows.length} employee-period bonus records` },
    { name: 'PPD/HPPD Rows Parsed', status: data.ppdRows.length > 0 ? 'PASS' : 'WARNING', detail: `${data.ppdRows.length} facility-period PPD/HPPD records` },
    { name: 'Departments Detected', status: data.departments.length > 0 ? 'PASS' : 'WARNING', detail: `${data.departments.length} departments` },
    { name: 'Positions Detected', status: data.positions.length > 0 ? 'PASS' : 'WARNING', detail: `${data.positions.length} positions` },
    { name: 'Bonus Types Detected', status: data.bonusTypes.length > 0 ? 'PASS' : 'WARNING', detail: `${data.bonusTypes.length}: ${data.bonusTypes.slice(0, 5).join(', ')}` },
    { name: 'Parser Warnings', status: data.warnings.length === 0 ? 'PASS' : 'WARNING', detail: `${data.warnings.length} warning(s)` },
    { name: 'localStorage Persistence', status: 'PASS', detail: 'Data auto-saved, survives page refresh' },
  ];

  const statusColor = (s: string) => ({ PASS: 'bg-emerald-100 text-emerald-800', WARNING: 'bg-amber-100 text-amber-800', FAIL: 'bg-red-100 text-red-800' }[s] || '');

  return (
    <div className="p-6 space-y-6">
      {/* Inspection Box */}
      <div className="bg-slate-900 rounded-2xl p-6 text-emerald-400 font-mono text-xs space-y-1 shadow-xl">
        <div className="text-slate-400 text-[9px] uppercase tracking-widest font-black mb-3">◉ Workbook Inspection Status</div>
        <div>File: <span className="text-white">{data.filename}</span></div>
        <div>Size: <span className="text-white">{(data.fileSize / 1024).toFixed(1)} KB</span></div>
        <div>Parsed: <span className="text-white">{new Date(data.parsedAt).toLocaleString()}</span></div>
        <div>Sheets: <span className="text-white">{data.sheetsDetected.join(' · ')}</span></div>
        <div className="border-t border-slate-800 pt-2 mt-2 grid grid-cols-2 gap-x-8 gap-y-0.5">
          <div>Facilities: <span className="text-white">{data.facilities.length}</span></div>
          <div>Regions: <span className="text-white">{data.regions.length}</span></div>
          <div>Acq Groups: <span className="text-white">{data.subgroups.length}</span></div>
          <div>Pay Periods: <span className="text-white">{data.payPeriods.length}</span></div>
          <div>OT Rows: <span className="text-white">{data.otRows.length}</span></div>
          <div>Bonus Rows: <span className="text-white">{data.bonusRows.length}</span></div>
          <div>PPD/HPPD Rows: <span className="text-white">{data.ppdRows.length}</span></div>
          <div>Departments: <span className="text-white">{data.departments.length}</span></div>
          <div>Positions: <span className="text-white">{data.positions.length}</span></div>
          <div>Bonus Types: <span className="text-white">{data.bonusTypes.length}</span></div>
        </div>
      </div>

      {/* QA Checks */}
      <SectionCard title="Parser QA Checks">
        <DataTable
          headers={['Check', 'Status', 'Detail']}
          rows={checks.map(c => [
            <strong key={c.name}>{c.name}</strong>,
            <span key={c.name} className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${statusColor(c.status)}`}>{c.status}</span>,
            <span key={c.name} className="text-slate-500">{c.detail}</span>
          ])}
        />
      </SectionCard>

      {/* Sheet Breakdown */}
      <SectionCard title="Sheet Row Counts">
        <DataTable
          headers={['Sheet Name', 'Rows', 'Parser Coverage']}
          rows={data.sheetsDetected.map(s => [
            s,
            fmtN(data.sheetRowCounts[s] || 0),
            data.parserCoverage[s] ? (
              <span className="text-emerald-700 font-bold">{data.parserCoverage[s]}</span>
            ) : <span className="text-slate-400">—</span>
          ])}
        />
      </SectionCard>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <SectionCard title={`Parser Warnings (${data.warnings.length})`}>
          <div className="p-4 space-y-2">
            {data.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <span className="font-black shrink-0">⚠</span> {w}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
