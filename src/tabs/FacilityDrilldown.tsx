import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy } from '../components/shared';

export default function FacilityDrilldown() {
  const { data, filters, filteredOT, filteredBonus, filteredPPD, updateFilter } = useData();
  if (!data) return null;

  const selectedFacility = filters.facility;

  if (!selectedFacility) {
    // Show facility selector grid
    const allFacs = data.facilities;
    const otByFac = groupBy(filteredOT, r => r.facility);
    return (
      <div className="p-6">
        <div className="text-sm font-bold text-slate-500 mb-5">
          Select a facility to drill down. Click any row in Facility Trends, OT Analysis, or Labor Pressure Ranking to auto-select.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allFacs.map(f => {
            const ot = sumNum(otByFac[f.name] || [], 'otDollars');
            return (
              <button key={f.name} onClick={() => updateFilter('facility', f.name)}
                className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:shadow-md transition group">
                <div className="text-xs font-black text-slate-800 group-hover:text-blue-700 leading-tight">{f.name}</div>
                <div className="text-[9px] text-slate-400 mt-1">{f.region} · {f.payCycle}</div>
                {ot > 0 && <div className="text-[9px] font-bold text-red-600 mt-1">{fmt$(ot)} OT</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const facInfo = data.facilities.find(f => f.name === selectedFacility);
  const facOT = filteredOT.filter(r => r.facility === selectedFacility);
  const facBonus = filteredBonus.filter(r => r.facility === selectedFacility);
  const facPPD = filteredPPD.filter(r => r.facility === selectedFacility);

  const totalOT = sumNum(facOT, 'otDollars');
  const totalHrs = sumNum(facOT, 'otHours');
  const totalBonus = sumNum(facBonus, 'bonusDollars');
  const hppdRows = facPPD.filter(r => r.metricType === 'Direct Care HPPD');
  const avgHppd = hppdRows.length ? sumNum(hppdRows, 'value') / hppdRows.length : 0;

  // Period breakdown
  const byPeriod = groupBy(facOT, r => r.payPeriod);
  const periodRows = Object.entries(byPeriod).map(([p, rows]) => {
    const bp = facBonus.filter(r => r.payPeriod === p);
    const pp = facPPD.filter(r => r.payPeriod === p && r.metricType === 'Direct Care HPPD');
    return [p, fmt$(sumNum(rows, 'otDollars')), fmtN(Math.round(sumNum(rows, 'otHours'))),
      fmt$(sumNum(bp, 'bonusDollars')), pp.length ? (sumNum(pp, 'value') / pp.length).toFixed(2) : '—'];
  });

  // Department breakdown
  const byDept = groupBy(facOT, r => r.department || 'Unknown');
  const deptRows = Object.entries(byDept)
    .map(([dept, rows]) => ({ dept, ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') }))
    .sort((a, b) => b.ot - a.ot);

  // Employee breakdown
  const byEmp = groupBy(facOT, r => r.employee);
  const empRows = Object.entries(byEmp)
    .map(([emp, rows]) => ({ emp, pos: rows[0]?.position || '—', ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') }))
    .filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot);

  const empBonus = groupBy(facBonus, r => r.employee);
  const empBonusRows = Object.entries(empBonus)
    .map(([emp, rows]) => ({ emp, pos: rows[0]?.position || '—', type: rows[0]?.bonusType || '—', bonus: sumNum(rows, 'bonusDollars') }))
    .sort((a, b) => b.bonus - a.bonus);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">{selectedFacility}</h2>
          <div className="text-xs text-slate-500 mt-1">
            <strong>{facInfo?.subgroup}</strong> · Region: <strong>{facInfo?.region}</strong> ·
            Pay Cycle: <strong>{facInfo?.payCycle}</strong> · {facInfo?.comparableStatus}
          </div>
        </div>
        <button onClick={() => updateFilter('facility', null)} className="text-xs font-bold text-blue-600 hover:underline">← All Facilities</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <div className="text-[9px] font-black text-red-600 uppercase tracking-widest">Total OT $</div>
          <div className="text-xl font-black text-red-800 mt-1">{fmt$(totalOT)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest">OT Hours</div>
          <div className="text-xl font-black text-amber-800 mt-1">{fmtN(Math.round(totalHrs))}</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <div className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Total Bonus $</div>
          <div className="text-xl font-black text-purple-800 mt-1">{fmt$(totalBonus)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Avg HPPD</div>
          <div className="text-xl font-black text-blue-800 mt-1">{avgHppd ? avgHppd.toFixed(2) : '—'}</div>
        </div>
      </div>

      {periodRows.length > 0 && (
        <SectionCard title="OT & Bonus by Pay Period">
          <DataTable headers={['Period', 'OT $', 'OT Hrs', 'Bonus $', 'HPPD']} rows={periodRows} />
        </SectionCard>
      )}

      {deptRows.length > 0 && (
        <SectionCard title="OT by Department">
          <DataTable
            headers={['Department', 'OT $', 'OT Hours']}
            rows={deptRows.map(r => [r.dept, fmt$(r.ot), fmtN(Math.round(r.hrs))])}
          />
        </SectionCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {empRows.length > 0 && (
          <SectionCard title="Employee OT Detail">
            <DataTable
              headers={['Employee', 'Position', 'OT $', 'OT Hrs']}
              rows={empRows.map(r => [r.emp, r.pos, fmt$(r.ot), fmtN(Math.round(r.hrs))])}
            />
          </SectionCard>
        )}
        {empBonusRows.length > 0 && (
          <SectionCard title="Employee Bonus Detail">
            <DataTable
              headers={['Employee', 'Position', 'Type', 'Bonus $']}
              rows={empBonusRows.map(r => [r.emp, r.pos, r.type, fmt$(r.bonus)])}
            />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
