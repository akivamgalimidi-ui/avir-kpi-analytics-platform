import React from 'react';
import { Terminal, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function DiagnosticPanel() {
  const { data, filteredOT, filteredBonus, filteredPPD, filters } = useData();

  if (!data) return null;

  const stats = [
    { label: 'Facilities', count: data.facilities.length, status: data.facilities.length > 0 ? 'pass' : 'fail' },
    { label: 'OT Rows', count: data.otRows.length, status: data.otRows.length > 0 ? 'pass' : 'fail' },
    { label: 'Bonus Rows', count: data.bonusRows.length, status: data.bonusRows.length > 0 ? 'pass' : 'fail' },
    { label: 'PPD Rows', count: data.ppdRows.length, status: data.ppdRows.length > 0 ? 'warn' : 'fail' },
    { label: 'Filtered OT', count: filteredOT.length, status: 'pass' },
  ];

  return (
    <div className="bg-slate-900 rounded-3xl p-6 text-emerald-400 font-mono text-[10px] space-y-4 shadow-2xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-500" />
          <span className="font-black uppercase tracking-widest text-slate-400">System Diagnostic Panel</span>
        </div>
        <div className="text-[8px] text-slate-500 px-2 py-0.5 border border-slate-800 rounded-full">v3.0.4-LTC</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="space-y-1">
            <div className="text-slate-500 uppercase tracking-widest text-[8px] font-black">{s.label}</div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold">{s.count.toLocaleString()}</span>
              {s.status === 'pass' ? <CheckCircle2 size={10} className="text-emerald-500" /> : 
               s.status === 'warn' ? <AlertCircle size={10} className="text-amber-500" /> : 
               <AlertCircle size={10} className="text-red-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 pt-4 mt-2">
        <div className="text-slate-500 uppercase tracking-widest text-[8px] font-black mb-2">Active Filter Context</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([k, v]) => (
            <div key={k} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2">
              <span className="text-slate-500">{k}:</span>
              <span className={v ? 'text-blue-400 font-bold' : 'text-slate-600'}>{v || 'None'}</span>
            </div>
          ))}
        </div>
      </div>

      {data.warnings.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-3">
          <div className="text-amber-500 uppercase tracking-widest text-[8px] font-black mb-1 flex items-center gap-1">
            <HelpCircle size={10} /> Parser Logic Warnings
          </div>
          <div className="text-amber-200/70 text-[9px] leading-tight space-y-1">
            {data.warnings.slice(0, 3).map((w, i) => (
              <div key={i}>• {w}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
