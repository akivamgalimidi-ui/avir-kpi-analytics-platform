import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmt2, sumField, groupBy } from '../components/shared';

export default function PayPeriodDashboard() {
  const { data, filteredMetrics, updateFilters } = useData();
  const byPeriod = groupBy(filteredMetrics, m => m.payPeriod);
  const selectedPeriod = data.filters.payPeriod;

  const periodSummary = data.payPeriods.map(p => {
    const rows = byPeriod[p] || [];
    return {
      p, facilities: [...new Set(rows.map(r => r.facility))].length,
      ot: sumField(rows, 'otDollars'), bonus: sumField(rows, 'bonusDollars'), rows
    };
  }).filter(x => x.rows.length > 0);

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Pay Period Overview (${periodSummary.length} periods)`}>
        <DataTable
          headers={['Pay Period', 'Facilities', 'OT $', 'Bonus $']}
          rows={periodSummary.map(r => [r.p, r.facilities, fmt$(r.ot), fmt$(r.bonus)])}
          onRowClick={i => updateFilters({ payPeriod: periodSummary[i].p })}
        />
        <div className="px-5 py-2 text-[10px] text-slate-400 font-bold">Click a row to filter to that period</div>
      </SectionCard>

      {selectedPeriod && (
        <SectionCard title={`Facilities in ${selectedPeriod}`}>
          <DataTable
            headers={['Facility', 'Region', 'OT $', 'Bonus $']}
            rows={filteredMetrics.map(m => [m.facility, m.region || '—', fmt$(m.otDollars), fmt$(m.bonusDollars)])}
          />
        </SectionCard>
      )}
    </div>
  );
}
