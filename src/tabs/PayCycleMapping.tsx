import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumNum, groupBy, Badge } from '../components/shared';

export default function PayCycleMapping() {
  const { data } = useData();
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Pay Cycle Mapping — ${data.facilities.length} Facilities`}>
        <DataTable
          headers={['Facility', 'Acq Group', 'Region', 'Pay Cycle', 'Latest Period', 'Prior Period', 'Comparable Status']}
          rows={data.facilities.map(f => [
            f.name, f.subgroup, f.region, f.payCycle,
            f.latestPeriod, f.priorPeriod,
            <Badge
              key={f.name}
              label={f.comparableStatus || '—'}
              color={f.comparableStatus === 'Comparable' ? 'emerald' : f.comparableStatus ? 'amber' : 'slate'}
            />
          ])}
        />
      </SectionCard>

      <div className="grid grid-cols-2 gap-6">
        <SectionCard title="Pay Cycle A Facilities">
          <DataTable
            headers={['Facility', 'Region', 'Latest']}
            rows={data.facilities.filter(f => f.payCycle === 'Pay Cycle A').map(f => [f.name, f.region, f.latestPeriod])}
          />
        </SectionCard>
        <SectionCard title="Pay Cycle B Facilities">
          <DataTable
            headers={['Facility', 'Region', 'Latest']}
            rows={data.facilities.filter(f => f.payCycle === 'Pay Cycle B').map(f => [f.name, f.region, f.latestPeriod])}
          />
        </SectionCard>
      </div>
    </div>
  );
}
