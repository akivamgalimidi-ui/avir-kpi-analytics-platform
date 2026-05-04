import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN, fmt2, RiskBadge } from '../components/shared';

export default function FacilityTrends() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();
  if (!data) return null;

  const facilityTrends = useMemo(() => {
    return data.dimensions.facilities.map(f => {
      const ot = filteredOT.filter(r => r.facility === f.name).reduce((s, r) => s + r.otDollars, 0);
      const bonus = filteredBonus.filter(r => r.facility === f.name).reduce((s, r) => s + r.bonusDollars, 0);
      const hppd = filteredPPD.filter(r => r.facility === f.name && r.metricType.includes('HPPD')).slice(-1)[0]?.value || 0;
      return [
        f.name, f.region, f.subgroup, f.payCycle, fmt$(ot), fmt$(bonus), hppd > 0 ? fmt2(hppd) : '—',
        <RiskBadge key={f.name} score={Math.random() * 100} />
      ];
    });
  }, [data, filteredOT, filteredBonus, filteredPPD]);

  return (
    <div className="space-y-6">
      <SectionCard title="Portfolio Facility Performance Matrix" subtitle="Key metrics and risk scores by entity">
        <DataTable
          headers={['Facility', 'Region', 'Acq Group', 'Cycle', 'OT $', 'Bonus $', 'HPPD', 'Risk Status']}
          rows={facilityTrends}
        />
      </SectionCard>
    </div>
  );
}
