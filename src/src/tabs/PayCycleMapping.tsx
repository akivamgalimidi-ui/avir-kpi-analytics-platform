import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard } from '../components/shared';

export default function PayCycleMapping() {
  const { data } = useData();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Entities Mapped" value={data.dimensions.facilities.length} color="blue" />
        <StatCard label="Inferred Cycle A" value={data.dimensions.facilities.filter(f => f.payCycle === 'Cycle A').length} color="emerald" />
        <StatCard label="Inferred Cycle B" value={data.dimensions.facilities.filter(f => f.payCycle === 'Cycle B').length} color="teal" />
      </div>

      <SectionCard title="Active Facility Mapping & Pay Cycle Inference" subtitle="Deterministic period matching for latest vs prior comparisons">
        <DataTable
          headers={['Facility', 'Region', 'Acq Group', 'Pay Cycle', 'Comparable', 'Latest Period', 'Matching Prior']}
          rows={data.dimensions.facilities.map(f => [
            f.name,
            f.region,
            f.subgroup,
            f.payCycle,
            f.comparableStatus,
            f.latestPeriod || '—',
            f.priorPeriod || '—'
          ])}
        />
      </SectionCard>
    </div>
  );
}
