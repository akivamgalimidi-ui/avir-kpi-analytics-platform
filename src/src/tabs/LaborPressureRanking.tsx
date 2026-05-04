import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, fmt$, fmt2, RiskBadge } from '../components/shared';

export default function LaborPressureRanking() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();

  const rankings = useMemo(() => {
    if (!data) return [];
    
    return data.dimensions.facilities.map(f => {
      const facOT = filteredOT.filter(r => r.facility === f.name).reduce((s, r) => s + r.otDollars, 0);
      const facBonus = filteredBonus.filter(r => r.facility === f.name).reduce((s, r) => s + r.bonusDollars, 0);
      const hppd = filteredPPD.filter(r => r.facility === f.name && r.metricType.includes('HPPD')).slice(-1)[0]?.value || 0;
      
      // Heuristic score (0-100)
      // High OT + High Bonus + Low HPPD = High Pressure
      let score = (facOT / 5000) + (facBonus / 2000) + (hppd < 3.0 ? 30 : 0);
      score = Math.min(Math.max(score, 0), 100);

      return {
        name: f.name,
        region: f.region,
        sg: f.subgroup,
        ot: facOT,
        bonus: facBonus,
        hppd: hppd,
        score
      };
    }).sort((a, b) => b.score - a.score);
  }, [data, filteredOT, filteredBonus, filteredPPD]);

  return (
    <div className="space-y-6">
      <SectionCard title="Portfolio Labor Pressure Ranking" subtitle="Facilities sorted by operational and financial risk">
        <DataTable
          headers={['Rank', 'Facility', 'Region', 'Acq Group', 'OT $', 'HPPD', 'Pressure Score', 'Status']}
          rows={rankings.map((r, i) => [
            i + 1,
            r.name,
            r.region,
            r.sg,
            fmt$(r.ot),
            r.hppd > 0 ? fmt2(r.hppd) : '—',
            Math.round(r.score),
            <RiskBadge key={r.name} score={r.score} />
          ])}
        />
      </SectionCard>
    </div>
  );
}
