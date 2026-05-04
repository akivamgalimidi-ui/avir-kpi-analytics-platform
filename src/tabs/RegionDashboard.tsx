import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumField, groupBy } from '../components/shared';

export default function RegionDashboard() {
  const { data, filteredMetrics, updateFilters } = useData();
  const byRegion = groupBy(filteredMetrics, m => m.region || 'Unassigned');

  const regionRows = Object.entries(byRegion)
    .map(([region, rows]) => {
      const facilities = [...new Set(rows.map(r => r.facility))];
      return {
        region, facilities: facilities.length,
        ot: sumField(rows, 'otDollars'), bonus: sumField(rows, 'bonusDollars'), rows
      };
    })
    .sort((a, b) => b.ot - a.ot);

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Region Dashboard (${regionRows.length} regions)`}>
        <DataTable
          headers={['Region', 'Facilities', 'OT $', 'Bonus $']}
          rows={regionRows.map(r => [r.region, r.facilities, fmt$(r.ot), fmt$(r.bonus)])}
          onRowClick={i => updateFilters({ region: regionRows[i].region })}
        />
        <div className="px-5 py-2 text-[10px] text-slate-400 font-bold">Click a row to filter by region</div>
      </SectionCard>

      {data.filters.region && (
        <SectionCard title={`Facilities in ${data.filters.region}`}>
          <DataTable
            headers={['Facility', 'OT $', 'Bonus $']}
            rows={[...new Set(filteredMetrics.map(m => m.facility))].map(fac => {
              const rows = filteredMetrics.filter(m => m.facility === fac);
              return [fac, fmt$(sumField(rows, 'otDollars')), fmt$(sumField(rows, 'bonusDollars'))];
            })}
            onRowClick={(i) => {
              const facs = [...new Set(filteredMetrics.map(m => m.facility))];
              updateFilters({ facility: facs[i] });
            }}
          />
        </SectionCard>
      )}
    </div>
  );
}
