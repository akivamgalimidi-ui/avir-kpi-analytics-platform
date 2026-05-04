import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, sumField, groupBy } from '../components/shared';

export default function OtAnalysis() {
  const { filteredMetrics, updateFilters } = useData();
  const totalOT = sumField(filteredMetrics, 'otDollars');

  const byFacility = groupBy(filteredMetrics, m => m.facility);
  const facilityOT = Object.entries(byFacility)
    .map(([fac, rows]) => ({ fac, ot: sumField(rows, 'otDollars'), region: rows[0]?.region || '—', group: rows[0]?.group || '—' }))
    .filter(r => r.ot > 0)
    .sort((a, b) => b.ot - a.ot);

  const byPeriod = groupBy(filteredMetrics, m => m.payPeriod);
  const periodOT = Object.entries(byPeriod)
    .map(([p, rows]) => ({ p, ot: sumField(rows, 'otDollars') }))
    .filter(r => r.ot > 0)
    .sort((a, b) => b.ot - a.ot);

  const byRegion = groupBy(filteredMetrics, m => m.region || 'Unassigned');
  const regionOT = Object.entries(byRegion)
    .map(([r, rows]) => ({ r, ot: sumField(rows, 'otDollars') }))
    .filter(r => r.ot > 0)
    .sort((a, b) => b.ot - a.ot);

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} accent="bg-red-50 text-red-700" />
        <StatCard label="Facilities with OT" value={String(facilityOT.length)} accent="bg-orange-50 text-orange-700" />
        <StatCard label="Pay Periods" value={String(periodOT.length)} accent="bg-rose-50 text-rose-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="OT by Facility">
          <DataTable
            headers={['Facility', 'Region', 'OT $']}
            rows={facilityOT.slice(0, 50).map(r => [r.fac, r.region, <span className="font-black text-red-700">{fmt$(r.ot)}</span>])}
            onRowClick={i => updateFilters({ facility: facilityOT[i].fac })}
          />
        </SectionCard>

        <SectionCard title="OT by Region">
          <DataTable
            headers={['Region', 'OT $']}
            rows={regionOT.map(r => [r.r, <span className="font-black text-red-700">{fmt$(r.ot)}</span>])}
            onRowClick={i => updateFilters({ region: regionOT[i].r })}
          />
        </SectionCard>
      </div>

      <SectionCard title="OT by Pay Period">
        <DataTable
          headers={['Pay Period', 'OT $']}
          rows={periodOT.map(r => [r.p, fmt$(r.ot)])}
          onRowClick={i => updateFilters({ payPeriod: periodOT[i].p })}
        />
      </SectionCard>
    </div>
  );
}
