import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN, RiskBadge } from '../components/shared';
import EmptyState from '../components/common/EmptyState';

export default function RegionDashboard() {
  const { data, filters, setFilters, filteredOT, filteredBonus } = useData();

  if (!filters.region) {
    return (
      <EmptyState 
        title="No Region Selected" 
        message="Select a region from the filters to see detailed regional performance benchmarks."
        icon="search"
        action={
          <div className="max-w-4xl w-full">
            <DataTable 
              headers={['Region', 'Total Facilities']}
              rows={data?.dimensions.regions.map(r => [r, data.dimensions.facilities.filter(f => f.region === r).length]) || []}
              onRowClick={(row) => setFilters(prev => ({ ...prev, region: row[0] }))}
            />
          </div>
        }
      />
    );
  }

  const regionFacs = data?.dimensions.facilities.filter(f => f.region === filters.region) || [];
  const otTotal = filteredOT.reduce((s, r) => s + r.otDollars, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label={`${filters.region} Total OT`} value={fmt$(otTotal)} color="red" />
        <StatCard label="Regional Facilities" value={regionFacs.length} color="blue" />
      </div>

      <SectionCard title={`Facility Breakdown - ${filters.region}`}>
        <DataTable 
          headers={['Facility', 'Acq Group', 'OT $', 'Bonus $']}
          rows={regionFacs.map(f => [
            f.name, f.subgroup, 
            fmt$(filteredOT.filter(r => r.facility === f.name).reduce((s, r) => s + r.otDollars, 0)),
            fmt$(filteredBonus.filter(r => r.facility === f.name).reduce((s, r) => s + r.bonusDollars, 0))
          ])}
        />
      </SectionCard>
    </div>
  );
}
