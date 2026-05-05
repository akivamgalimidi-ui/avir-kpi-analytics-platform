import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy } from '../components/shared';

export default function FacilityDrilldown() {
  const { data, filters, filteredOT, filteredBonus, filteredPPD, updateFilter } = useData();
  if (!data) return null;

  if (!filters.facility) {
    const otByFac = groupBy(filteredOT, r => r.facility);
    return (
      <div className="p-6">
        <p className="text-sm font-bold text-slate-500 mb-5">Select a facility — click any row in Facility Trends or use the grid below.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.facilities.map(f => {
            const ot = sumNum(otByFac[f.name] || [], 'otDollars');
            return (
              <button key={f.name} onClick={() => updateFilter('facility', f.name)}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:shadow-md transition">
                <div className="text-xs font-black text-slate-800 leading-tight">{f.name}</div>
                <div className="text-[9px] text-slate-400 mt-1">{f.subgroup} · {f.payCycle}</div>
                {ot > 0 && <div className="text-[9px] font-bold text-red-600 mt-1">{fmt$(ot)} OT</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const facInfo = data.facilities.find(f => f.name === filters.facility);
  const facOT = filteredOT.filter(r => r.facility === filters.facility);
  const facBonus = filteredBonus.filter(r => r.facility === filters.facility);
  const facPPD = filteredPPD.filter(r => r.facility === filters.facility);

  const totalOT = sumNum(facOT,'otDollars');
  const totalHrs = sumNum(facOT,'otHours');
  const totalBonus = sumNum(facBonus,'bonusDollars');
  const hppdR = facPPD.filter(r => r.metricType === 'Direct Care HPPD');
  const avgHppd = hppdR.length ? sumNum(hppdR,'value')/hppdR.length : 0;

  const byPeriod = groupBy(facOT, r => r.payPeriod);
  const periodRows = Object.entries(byPeriod).map(([p, rows]) => {
    const bp = facBonus.filter(r => r.payPeriod === p);
    const hp = facPPD.filter(r => r.payPeriod === p && r.metricType === 'Direct Care HPPD');
    return [p, fmt$(sumNum(rows,'otDollars')), fmtN(Math.round(sumNum(rows,'otHours'))), fmt$(sumNum(bp,'bonusDollars')), hp.length ? (sumNum(hp,'value')/hp.length).toFixed(2) : '—'];
  });

  const byDept = groupBy(facOT, r => r.department || 'Unknown');
  const deptRows = Object.entries(byDept).map(([dept,rows]) => [dept, fmt$(sumNum(rows,'otDollars')), fmtN(Math.round(sumNum(rows,'otHours')))]).sort((a,b) => parseFloat(String(b[1]).replace(/[^0-9.-]+/g,''))-parseFloat(String(a[1]).replace(/[^0-9.-]+/g,'')));

  const byEmp = groupBy(facOT, r => r.employee);
  const empRows = Object.entries(byEmp).map(([emp,rows]) => ({ emp, pos: rows[0]?.position||'—', ot: sumNum(rows,'otDollars'), hrs: sumNum(rows,'otHours') })).filter(r=>r.ot>0).sort((a,b)=>b.ot-a.ot);
  const bonusByEmp = groupBy(facBonus, r => r.employee);
  const empBonusRows = Object.entries(bonusByEmp).map(([emp,rows]) => ({ emp, pos: rows[0]?.position||'—', type: rows[0]?.bonusType||'—', bonus: sumNum(rows,'bonusDollars') })).sort((a,b)=>b.bonus-a.bonus);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">{filters.facility}</h2>
          <div className="text-xs text-slate-500 mt-1"><strong>{facInfo?.subgroup}</strong> · Cycle: <strong>{facInfo?.payCycle}</strong> · {facInfo?.comparableStatus}</div>
        </div>
        <button onClick={() => updateFilter('facility', null)} className="text-xs font-bold text-blue-600 hover:underline">← All Facilities</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Total OT $', fmt$(totalOT), 'red'],['OT Hours', fmtN(Math.round(totalHrs)), 'amber'],['Total Bonus $', fmt$(totalBonus), 'purple'],['Avg HPPD', avgHppd ? avgHppd.toFixed(2) : '—', 'blue']].map(([l,v,c]) => (
          <div key={l as string} className={`rounded-2xl border p-4 bg-${c}-50 border-${c}-100`}>
            <div className={`text-[9px] font-black text-${c}-600 uppercase tracking-widest`}>{l}</div>
            <div className={`text-xl font-black text-${c}-800 mt-1`}>{v}</div>
          </div>
        ))}
      </div>

      {periodRows.length > 0 && <SectionCard title="OT & Bonus by Pay Period"><DataTable headers={['Period','OT $','OT Hrs','Bonus $','HPPD']} rows={periodRows} /></SectionCard>}
      {deptRows.length > 0 && <SectionCard title="OT by Department"><DataTable headers={['Department','OT $','OT Hours']} rows={deptRows} /></SectionCard>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {empRows.length > 0 && <SectionCard title="Employee OT Detail"><DataTable headers={['Employee','Position','OT $','OT Hrs']} rows={empRows.map(r => [r.emp, r.pos, fmt$(r.ot), fmtN(Math.round(r.hrs))])} /></SectionCard>}
        {empBonusRows.length > 0 && <SectionCard title="Employee Bonus Detail"><DataTable headers={['Employee','Position','Type','Bonus $']} rows={empBonusRows.map(r => [r.emp, r.pos, r.type, fmt$(r.bonus)])} /></SectionCard>}
      </div>
    </div>
  );
}
