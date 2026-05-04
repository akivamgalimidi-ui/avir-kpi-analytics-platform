import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumField, groupBy } from '../components/shared';

function riskCategory(score: number, max: number): { label: string; color: string } {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return { label: 'Critical', color: 'bg-red-100 text-red-800' };
  if (pct >= 0.5) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
  if (pct >= 0.25) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Low', color: 'bg-emerald-100 text-emerald-800' };
}

export default function LaborPressureRanking() {
  const { filteredMetrics, data, updateFilters } = useData();

  const byFacility = groupBy(filteredMetrics, m => m.facility);
  const rankings = Object.entries(byFacility)
    .map(([fac, rows]) => {
      const facInfo = data.facilities.find(f => f.name === fac);
      const ot = sumField(rows, 'otDollars');
      const bonus = sumField(rows, 'bonusDollars');
      const score = ot + bonus;
      const driver = ot > bonus ? 'OT' : bonus > ot ? 'Bonus' : 'Mixed';
      return { fac, region: facInfo?.region || '—', group: facInfo?.group || '—', ot, bonus, score, driver };
    })
    .sort((a, b) => b.score - a.score);

  const maxScore = rankings[0]?.score || 1;

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Labor Pressure Ranking — ${rankings.length} Facilities`}>
        <DataTable
          headers={['Rank', 'Facility', 'Region', 'Acq Group', 'Risk', 'Driver', 'OT $', 'Bonus $', 'Pressure Score']}
          rows={rankings.slice(0, 100).map((r, i) => {
            const risk = riskCategory(r.score, maxScore);
            return [
              <span key={i} className="font-black text-slate-400">#{i + 1}</span>,
              r.fac, r.region, r.group,
              <span key={i} className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${risk.color}`}>{risk.label}</span>,
              <span key={i} className="text-[10px] font-bold text-slate-600 uppercase">{r.driver}</span>,
              fmt$(r.ot), fmt$(r.bonus),
              <span key={i} className="font-black text-slate-800">{fmt$(r.score)}</span>
            ];
          })}
          onRowClick={i => updateFilters({ facility: rankings[i].fac })}
        />
      </SectionCard>
    </div>
  );
}
