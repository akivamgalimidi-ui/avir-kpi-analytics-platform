import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmt2, sumField, groupBy } from '../components/shared';

export default function FacilityTrends() {
  const { data, filteredMetrics, updateFilters } = useData();

  const byFacility = groupBy(filteredMetrics, m => m.facility);
  const facilityRows = Object.entries(byFacility).map(([fac, rows]) => {
    const facInfo = data.facilities.find(f => f.name === fac);
    const ot = sumField(rows, 'otDollars');
    const bonus = sumField(rows, 'bonusDollars');
    const hppdRows = rows.filter(r => r.hppd > 0);
    const hppd = hppdRows.length ? sumField(hppdRows, 'hppd') / hppdRows.length : 0;
    const ppdRows = rows.filter(r => r.ppdDollars > 0);
    const ppd = ppdRows.length ? sumField(ppdRows, 'ppdDollars') / ppdRows.length : 0;
    const score = ot + bonus;
    return { fac, region: facInfo?.region || '—', group: facInfo?.group || '—', ot, bonus, hppd, ppd, score, periods: rows.length };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Portfolio Facility Trends (${facilityRows.length} facilities)`}>
        <DataTable
          headers={['Facility', 'Region', 'Acq Group', 'OT $', 'Bonus $', 'Avg HPPD', 'Avg PPD $', 'Periods']}
          rows={facilityRows.map(r => [r.fac, r.region, r.group, fmt$(r.ot), fmt$(r.bonus), fmt2(r.hppd), fmt$(r.ppd), r.periods])}
          onRowClick={i => {
            updateFilters({ facility: facilityRows[i].fac });
          }}
        />
        <div className="px-5 py-2 text-[10px] text-slate-400 font-bold">Click a row to drill into that facility</div>
      </SectionCard>
    </div>
  );
}
