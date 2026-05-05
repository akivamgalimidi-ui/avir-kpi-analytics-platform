import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmtN } from '../components/shared';
import { buildExcelExport, downloadBlob } from '../utils/exportWorkbook';
import { FileDown, Table, FileJson } from 'lucide-react';

export default function ExportCenter() {
  const { data, filteredOT, filteredBonus, filteredPPD, filters } = useData();
  if (!data) return <div className="p-8 text-center text-slate-400 font-bold pt-24">Upload data before exporting.</div>;

  const handleFullExport = () => {
    const blob = buildExcelExport(data, filteredOT, filteredBonus, filteredPPD);
    downloadBlob(blob, `Avir-Analytics-Export-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportOptions = [
    { name: 'Full Excel Analytics Workbook', desc: 'All sheets: OT detail, Bonus detail, PPD, Facility Mapping, Labor Pressure, Pay Cycle, Data Quality.', icon: FileDown, action: handleFullExport },
    { name: 'Filtered Dataset Export', desc: 'Export current filtered view to Excel.', icon: Table, action: handleFullExport },
    { name: 'Data Quality & QA Report', desc: 'Parser warnings and reconciliation checks.', icon: FileJson, action: handleFullExport },
  ];

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      <SectionCard title="Export Formats">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {exportOptions.map((opt,i)=>(
            <button key={i} onClick={opt.action} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:shadow-md transition group">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition"><opt.icon size={22} className="text-slate-600 group-hover:text-blue-600" /></div>
              <div><div className="text-sm font-black text-slate-800">{opt.name}</div><div className="text-[11px] text-slate-500 mt-1">{opt.desc}</div><div className="mt-3 text-[10px] font-black text-blue-600 uppercase tracking-widest">Download →</div></div>
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Export Dataset Summary">
        <DataTable headers={['Metric','Count']} rows={[
          ['Facilities', data.facilities.length],
          ['OT Records (filtered)', filteredOT.length],
          ['Bonus Records (filtered)', filteredBonus.length],
          ['PPD/HPPD Records (filtered)', filteredPPD.length],
          ['Active Filters', activeFilters],
          ['Pay Periods', data.payPeriods.length],
          ['Acq Groups', data.subgroups.length],
        ].map(([k,v])=>[k, fmtN(Number(v))])} />
      </SectionCard>
    </div>
  );
}
