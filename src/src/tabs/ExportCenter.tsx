import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable } from '../components/shared';
import { buildExcelExport, downloadBlob } from '../utils/exportWorkbook';
import { FileDown, FileJson, Table } from 'lucide-react';

export default function ExportCenter() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();
  if (!data) return (
    <div className="p-8 text-center text-slate-400 font-bold pt-24">
      Upload data before exporting.
    </div>
  );

  const handleFullExport = () => {
    const blob = buildExcelExport(data, filteredOT, filteredBonus, filteredPPD);
    downloadBlob(blob, `Avir-Full-Analytics-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportOptions = [
    { name: 'Full Excel Analytics Workbook', desc: 'All 11 sheets including rankings and detail lines.', icon: FileDown, action: handleFullExport },
    { name: 'Filtered Dataset Export', desc: 'Export current filtered view to Excel.', icon: Table, action: handleFullExport },
    { name: 'Data Quality & QA Report', desc: 'Export parser warnings and reconciliation checks.', icon: FileJson, action: handleFullExport },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionCard title="Available Export Formats">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {exportOptions.map((opt, i) => (
            <button key={i} onClick={opt.action}
              className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:shadow-md transition group">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                <opt.icon size={24} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{opt.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.desc}</div>
                <div className="mt-3 text-[10px] font-black text-blue-600 uppercase tracking-widest">Download Now →</div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Export Dataset Summary">
        <DataTable
          headers={['Metric', 'Count in Export']}
          rows={[
            ['Facilities', data.facilities.length],
            ['OT Record Lines', filteredOT.length],
            ['Bonus Record Lines', filteredBonus.length],
            ['HPPD/PPD Lines', filteredPPD.length],
            ['Active Filters applied', Object.values(useData().filters).filter(Boolean).length]
          ]}
        />
      </SectionCard>
    </div>
  );
}
