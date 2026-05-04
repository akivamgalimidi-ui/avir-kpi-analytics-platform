import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy, riskBadge, Badge } from '../components/shared';

export default function LaborPressureRanking() {
  const { data, filteredOT, filteredBonus, updateFilter } = useData();
  if (!data) return null;

  const otByFac = groupBy(filteredOT, r => r.facility);
  const bonusByFac = groupBy(filteredBonus, r => r.facility);

  const rankings = data.facilities.map(f => {
    const ot = sumNum(otByFac[f.name] || [], 'otDollars');
    const bonus = sumNum(bonusByFac[f.name] || [], 'bonusDollars');
    const score = ot + bonus;
    const driver = ot > bonus * 1.5 ? 'OT-Driven' : bonus > ot * 1.5 ? 'Bonus-Driven' : 'Mixed';
    return { ...f, ot, bonus, score, driver };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

  const maxScore = rankings[0]?.score || 1;

  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Labor Pressure Ranking — ${rankings.length} Facilities with Activity`}>
        <DataTable
          headers={['#', 'Facility', 'Acq Group', 'Region', 'Pay Cycle', 'Risk', 'Driver', 'OT $', 'Bonus $', 'Pressure Score', 'Comparable']}
          rows={rankings.slice(0, 150).map((r, i) => [
            <span key={i} className="text-[9px] font-black text-slate-400">#{i + 1}</span>,
            r.name, r.subgroup, r.region, r.payCycle,
            riskBadge(r.score, maxScore),
            <span key={i} className="text-[9px] font-bold text-slate-600">{r.driver}</span>,
            fmt$(r.ot), fmt$(r.bonus),
            <strong key={i} className="text-slate-900">{fmt$(r.score)}</strong>,
            <Badge key={i} label={r.comparableStatus || '—'} color={r.comparableStatus === 'Comparable' ? 'emerald' : 'amber'} />
          ])}
          onRowClick={i => updateFilter('facility', rankings[i].name)}
        />
      </SectionCard>
    </div>
  );
}
