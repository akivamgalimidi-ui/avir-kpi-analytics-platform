import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy } from '../components/shared';

export default function FacilityTrends() {
  const { data, filteredOT, filteredBonus, filteredPPD, updateFilter } = useData();
  if (!data) return null;

  const otByFac = groupBy(filteredOT, r => r.facility);
  const bonusByFac = groupBy(filteredBonus, r => r.facility);
  const ppdByFac = groupBy(filteredPPD, r => r.facility);

  const rows = data.facilities.map(f => {
    const ot = sumNum(otByFac[f.name] || [], 'otDollars');
    const hrs = sumNum(otByFac[f.name] || [], 'otHours');
    const bonus = sumNum(bonusByFac[f.name] || [], 'bonusDollars');
    const hppdR = (ppdByFac[f.name] || []).filter(r => r.metricType === 'Direct Care HPPD');
    const hppd = hppdR.length ? sumNum(hppdR,'value')/hppdR.length : 0;
    const ppdR = (ppdByFac[f.name] || []).filter(r => r.metricType.includes('Overall'));
    const ppd = ppdR.length ? sumNum(ppdR,'value')/ppdR.length : 0;
    return { ...f, ot, hrs, bonus, hppd, ppd };
  }).sort((a, b) => (b.ot+b.bonus) - (a.ot+a.bonus));

  return (
    <div className="p-6">
      <SectionCard title={`Portfolio Facility Trends — ${rows.length} Facilities`} subtitle="Click any row to drill down">
        <DataTable
          headers={['Facility','Acq Group','Pay Cycle','OT $','OT Hrs','Bonus $','Avg HPPD','Avg PPD $','Comparable']}
          rows={rows.map(r => [
            r.name, r.subgroup, r.payCycle,
            r.ot > 0 ? <span className="font-bold text-red-700">{fmt$(r.ot)}</span> : '—',
            r.hrs > 0 ? fmtN(Math.round(r.hrs)) : '—',
            r.bonus > 0 ? <span className="font-bold text-amber-700">{fmt$(r.bonus)}</span> : '—',
            r.hppd > 0 ? r.hppd.toFixed(2) : '—',
            r.ppd > 0 ? fmt$(r.ppd) : '—',
            r.comparableStatus || '—',
          ])}
          onRowClick={i => updateFilter('facility', rows[i].name)}
        />
        <div className="px-5 py-2 text-[9px] text-slate-400 font-bold">Click any row to drill into that facility</div>
      </SectionCard>
    </div>
  );
}
