import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, StatCard, DataTable, fmtN } from '../components/shared';

export default function DataQuality() {
  const { data } = useData();

  if (!data.filename) {
    return (
      <div className="p-8">
        <SectionCard title="Data Quality Dashboard">
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-4">📋</div>
            <div className="font-bold">No data loaded yet. Upload a payroll file to see quality metrics.</div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sheets Detected" value={fmtN(data.sheetsDetected.length)} accent="bg-blue-50 text-blue-700" />
        <StatCard label="Facilities Parsed" value={fmtN(data.facilities.length)} accent="bg-emerald-50 text-emerald-700" />
        <StatCard label="Metric Rows" value={fmtN(data.metrics.length)} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Employees" value={fmtN(data.employees.length)} accent="bg-purple-50 text-purple-700" />
        <StatCard label="Regions" value={fmtN(data.regions.length)} accent="bg-indigo-50 text-indigo-700" />
        <StatCard label="Acq Groups" value={fmtN(data.groups.length)} accent="bg-pink-50 text-pink-700" />
        <StatCard label="Pay Periods" value={fmtN(data.payPeriods.length)} accent="bg-teal-50 text-teal-700" />
        <StatCard label="Persistence" value="localStorage" sub="Auto-saved to browser" accent="bg-slate-100 text-slate-700" />
      </div>

      {/* File Info */}
      <SectionCard title="Upload Summary">
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ['Filename', data.filename],
            ['File Size', `${((data.fileSize || 0) / 1024).toFixed(1)} KB`],
            ['Parsed At', data.parsedAt ? new Date(data.parsedAt).toLocaleString() : '—'],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k}</div>
              <div className="font-bold text-slate-800 text-xs break-all">{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Sheet Row Counts */}
      <SectionCard title="Sheet Breakdown">
        <DataTable
          headers={['Sheet Name', 'Row Count']}
          rows={data.sheetsDetected.map(s => [s, fmtN(data.sheetRowCounts[s] || 0)])}
        />
      </SectionCard>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <SectionCard title={`Parser Warnings (${data.warnings.length})`}>
          <div className="p-4 space-y-2">
            {data.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <span>⚠</span> {w}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
