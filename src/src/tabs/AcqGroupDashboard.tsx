import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN } from '../components/shared';
import EmptyState from '../components/common/EmptyState';

export default function AcqGroupDashboard() {
  const { data, filters, setFilters, filteredOT, filteredBonus } = useData();

  if (!filters.subgroup) {
    return (
      <EmptyState 
        title="No Acquisition Group Selected" 
        message="Select an acquisition group (subgroup) to see consolidated performance for that portfolio."
        icon="search"
        action={
          <div className="max-w-4xl w-full">
            <DataTable 
              headers={['Acquisition Group', 'Total Facilities']}
              rows={data?.dimensions.subgroups.map(sg => [sg, data.dimensions.facilities.filter(f => f.subgroup === sg).length]) || []}
              onRowClick={(row) => setFilters(prev => ({ ...prev, subgroup: row[0] }))}
            />
          </div>
        }
      />
    );
  }

  const sgFacs = data?.dimensions.facilities.filter(f => f.subgroup === filters.subgroup) || [];
  const otTotal = filteredOT.reduce((s, r) => s + r.otDollars, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label={`${filters.subgroup} Portfolio OT`} value={fmt$(otTotal)} color="indigo" />
        <StatCard label="Portfolio Size" value={sgFacs.length} sub="Active Facilities" color="emerald" />
      </div>

      <SectionCard title={`Regional Distribution - ${filters.subgroup}`}>
        <DataTable 
          headers={['Region', 'Facility Count', 'OT $']}
          rows={[...new Set(sgFacs.map(f => f.region))].map(r => {
            const facs = sgFacs.filter(f => f.region === r);
            return [
              r, facs.length, 
              fmt$(filteredOT.filter(ot => facs.some(f => f.name === ot.facility)).reduce((s, ot) => s + ot.otDollars, 0))
            ];
          })}
        />
      </SectionCard>
    </div>
  );
}
