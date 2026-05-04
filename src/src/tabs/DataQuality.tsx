import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmtN } from '../components/shared';
import { ShieldCheck, FileSearch, Database, AlertCircle } from 'lucide-react';

export default function DataQuality() {
  const { data } = useData();
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Workbook Parsed" value={data.filename} sub={`Size: ${(data.fileSize / 1024).toFixed(1)} KB`} color="blue" />
        <StatCard label="Facility Dimensions" value={fmtN(data.dimensions.facilities.length)} sub="Mapped Entities" color="emerald" />
        <StatCard label="Fact Rows (OT/Bonus)" value={fmtN(data.facts.otRows.length + data.facts.bonusRows.length)} sub="Total Record Lines" color="indigo" />
        <StatCard label="Parser Warnings" value={fmtN(data.warnings.length)} sub="Logic Alerts" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title="Parser Coverage Matrix" subtitle="Status of each critical data module">
          <DataTable 
            headers={['Module', 'Status / Result']}
            rows={Object.entries(data.parserCoverage).map(([k, v]) => [k, v])}
          />
        </SectionCard>

        <SectionCard title="Sheets Detected in Workbook" subtitle="Raw Excel worksheet structure">
          <DataTable 
            headers={['Sheet Name', 'Row Count']}
            rows={Object.entries(data.sheetRowCounts).map(([k, v]) => [k, fmtN(v)])}
          />
        </SectionCard>
      </div>

      <SectionCard title="Active Dimension Discovery" subtitle="Unique entities identified by the mapping engine">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-8">
          <DimStat label="Regions" val={data.dimensions.regions.length} />
          <DimStat label="Acq Groups" val={data.dimensions.subgroups.length} />
          <DimStat label="Pay Periods" val={data.dimensions.payPeriods.length} />
          <DimStat label="Depts" val={data.dimensions.departments.length} />
          <DimStat label="Positions" val={data.dimensions.positions.length} />
          <DimStat label="Employees" val={data.dimensions.employees.length} />
        </div>
      </SectionCard>

      {data.warnings.length > 0 && (
        <SectionCard title="Parser Logic Warnings" subtitle="Potential issues detected during ingestion">
          <div className="p-6 space-y-3">
            {data.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertCircle className="text-amber-600 shrink-0" size={16} />
                <span className="text-[11px] font-bold text-amber-800 leading-relaxed">{w}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function DimStat({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-xl font-black text-slate-800 tracking-tight">{val}</div>
    </div>
  );
}
