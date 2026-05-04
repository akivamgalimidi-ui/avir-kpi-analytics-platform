import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN, fmt2, RiskBadge } from '../components/shared';
import EmptyState from '../components/common/EmptyState';

export default function FacilityDrilldown() {
  const { data, filters, setFilters, filteredOT, filteredBonus, filteredPPD } = useData();

  if (!filters.facility) {
    return (
      <EmptyState 
        title="No Facility Selected" 
        message="Please select a facility from the global filters or the table below to view detailed operational metrics."
        icon="search"
        action={
          <div className="max-w-4xl w-full">
            <DataTable 
              headers={['Facility', 'Region', 'Acq Group']}
              rows={data?.dimensions.facilities.slice(0, 10).map(f => [f.name, f.region, f.subgroup]) || []}
              onRowClick={(row) => setFilters(prev => ({ ...prev, facility: row[0] }))}
            />
          </div>
        }
      />
    );
  }

  const facility = data?.dimensions.facilities.find(f => f.name === filters.facility);
  const otTotal = filteredOT.reduce((s, r) => s + r.otDollars, 0);
  const bonusTotal = filteredBonus.reduce((s, r) => s + r.bonusDollars, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Selected Facility OT" value={fmt$(otTotal)} color="red" />
        <StatCard label="Selected Facility Bonus" value={fmt$(bonusTotal)} color="amber" />
        <RiskBadge score={Math.random() * 100} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title="Departmental OT Breakdown">
          <DataTable 
            headers={['Department', 'OT Dollars', 'OT Hours']}
            rows={[...new Set(filteredOT.map(r => r.department))].map(d => {
              const rows = filteredOT.filter(r => r.department === d);
              return [d, fmt$(rows.reduce((s, r) => s + r.otDollars, 0)), fmtN(rows.reduce((s, r) => s + r.otHours, 0))];
            })}
          />
        </SectionCard>

        <SectionCard title="Employee Detail Review">
          <DataTable 
            headers={['Employee', 'Position', 'OT $', 'Bonus $']}
            rows={filteredOT.slice(0, 20).map(r => [r.employee, r.position, fmt$(r.otDollars), '—'])}
          />
        </SectionCard>
      </div>
    </div>
  );
}
