import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumNum, groupBy } from '../components/shared';

export default function RegionDashboard() {
  const { data, filteredOT, filteredBonus, filteredPPD, filters, updateFilter } = useData();
  if (!data) return null;

  const getRegion = (facility: string) => data.facilities.find(f => f.name === facility)?.region || 'Unknown';

  const byRegion = groupBy(filteredOT, r => getRegion(r.facility));
  const bonusByRegion = groupBy(filteredBonus, r => getRegion(r.facility));

  const regionData = data.regions.map(region => {
    const otRows = byRegion[region] || [];
    const bonusRows = bonusByRegion[region] || [];
    const facilities = [...new Set(otRows.map(r => r.facility))];
    return {
      region,
      facilities: facilities.length,
      ot: sumNum(otRows, 'otDollars'),
      bonus: sumNum(bonusRows, 'bonusDollars')
    };
  }).filter(r => r.ot > 0 || r.bonus > 0).sort((a, b) => b.ot - a.ot);

  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Region Dashboard — ${regionData.length} Regions`}>
        <DataTable
          headers={['Region', 'Facilities Active', 'OT $', 'Bonus $', 'Combined $']}
          rows={regionData.map(r => [
            r.region, r.facilities,
            <span className="font-bold text-red-700">{fmt$(r.ot)}</span>,
            <span className="font-bold text-amber-700">{fmt$(r.bonus)}</span>,
            <strong>{fmt$(r.ot + r.bonus)}</strong>
          ])}
          onRowClick={i => updateFilter('region', regionData[i].region)}
        />
        <div className="px-5 py-2 text-[9px] text-slate-400 font-bold">Click a region to filter all tabs</div>
      </SectionCard>

      {filters.region && (
        <SectionCard title={`Facilities in ${filters.region}`}>
          <DataTable
            headers={['Facility', 'Acq Group', 'Pay Cycle', 'OT $', 'Bonus $']}
            rows={data.facilities.filter(f => f.region === filters.region).map(f => {
              const ot = sumNum(filteredOT.filter(r => r.facility === f.name), 'otDollars');
              const bonus = sumNum(filteredBonus.filter(r => r.facility === f.name), 'bonusDollars');
              return [f.name, f.subgroup, f.payCycle, fmt$(ot), fmt$(bonus)];
            })}
            onRowClick={(i) => {
              const facs = data.facilities.filter(f => f.region === filters.region);
              updateFilter('facility', facs[i].name);
            }}
          />
        </SectionCard>
      )}
    </div>
  );
}
