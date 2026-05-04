import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumField, groupBy } from '../components/shared';

export default function AcqGroupDashboard() {
  const { filteredMetrics, updateFilters } = useData();
  const byGroup = groupBy(filteredMetrics, m => m.group || 'Unassigned');

  const groupRows = Object.entries(byGroup)
    .map(([group, rows]) => ({
      group,
      facilities: [...new Set(rows.map(r => r.facility))].length,
      regions: [...new Set(rows.map(r => r.region).filter(Boolean))].length,
      ot: sumField(rows, 'otDollars'),
      bonus: sumField(rows, 'bonusDollars')
    }))
    .sort((a, b) => b.ot - a.ot);

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Acquisition Group Dashboard (${groupRows.length} groups)`}>
        <DataTable
          headers={['Acq Group', 'Facilities', 'Regions', 'OT $', 'Bonus $']}
          rows={groupRows.map(r => [r.group, r.facilities, r.regions, fmt$(r.ot), fmt$(r.bonus)])}
          onRowClick={i => updateFilters({ group: groupRows[i].group })}
        />
        <div className="px-5 py-2 text-[10px] text-slate-400 font-bold">Click a row to filter by acquisition group</div>
      </SectionCard>
    </div>
  );
}
