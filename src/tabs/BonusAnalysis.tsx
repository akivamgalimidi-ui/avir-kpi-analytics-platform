import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, sumField, groupBy } from '../components/shared';

export default function BonusAnalysis() {
  const { filteredMetrics, updateFilters } = useData();
  const totalBonus = sumField(filteredMetrics, 'bonusDollars');

  const byFacility = groupBy(filteredMetrics, m => m.facility);
  const facilityBonus = Object.entries(byFacility)
    .map(([fac, rows]) => ({ fac, bonus: sumField(rows, 'bonusDollars'), region: rows[0]?.region || '—' }))
    .filter(r => r.bonus > 0)
    .sort((a, b) => b.bonus - a.bonus);

  const byPeriod = groupBy(filteredMetrics, m => m.payPeriod);
  const periodBonus = Object.entries(byPeriod)
    .map(([p, rows]) => ({ p, bonus: sumField(rows, 'bonusDollars') }))
    .filter(r => r.bonus > 0)
    .sort((a, b) => b.bonus - a.bonus);

  const byRegion = groupBy(filteredMetrics, m => m.region || 'Unassigned');
  const regionBonus = Object.entries(byRegion)
    .map(([r, rows]) => ({ r, bonus: sumField(rows, 'bonusDollars') }))
    .filter(r => r.bonus > 0)
    .sort((a, b) => b.bonus - a.bonus);

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Facilities with Bonus" value={String(facilityBonus.length)} accent="bg-yellow-50 text-yellow-700" />
        <StatCard label="Periods" value={String(periodBonus.length)} accent="bg-orange-50 text-orange-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Bonus by Facility">
          <DataTable
            headers={['Facility', 'Region', 'Bonus $']}
            rows={facilityBonus.slice(0, 50).map(r => [r.fac, r.region, <span className="font-black text-amber-700">{fmt$(r.bonus)}</span>])}
            onRowClick={i => updateFilters({ facility: facilityBonus[i].fac })}
          />
        </SectionCard>
        <SectionCard title="Bonus by Region">
          <DataTable
            headers={['Region', 'Bonus $']}
            rows={regionBonus.map(r => [r.r, fmt$(r.bonus)])}
            onRowClick={i => updateFilters({ region: regionBonus[i].r })}
          />
        </SectionCard>
      </div>

      <SectionCard title="Bonus by Pay Period">
        <DataTable
          headers={['Pay Period', 'Bonus $']}
          rows={periodBonus.map(r => [r.p, fmt$(r.bonus)])}
          onRowClick={i => updateFilters({ payPeriod: periodBonus[i].p })}
        />
      </SectionCard>
    </div>
  );
}
