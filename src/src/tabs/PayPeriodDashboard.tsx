import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$ } from '../components/shared';
import EmptyState from '../components/common/EmptyState';

export default function PayPeriodDashboard() {
  const { data, filters, setFilters, filteredOT } = useData();

  if (!filters.payPeriod) {
    return (
      <EmptyState 
        title="No Pay Period Selected" 
        message="Select a specific pay period to see the portfolio snapshot for that window."
        icon="search"
        action={
          <div className="max-w-4xl w-full">
            <DataTable 
              headers={['Pay Period', 'Total OT $']}
              rows={data?.dimensions.payPeriods.map(p => [p, fmt$(data.facts.otRows.filter(r => r.payPeriod === p).reduce((s, r) => s + r.otDollars, 0))]) || []}
              onRowClick={(row) => setFilters(prev => ({ ...prev, payPeriod: row[0] }))}
            />
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <StatCard label={`Snapshot: ${filters.payPeriod}`} value={fmt$(filteredOT.reduce((s, r) => s + r.otDollars, 0))} color="blue" />
      
      <SectionCard title={`Regional Distribution - ${filters.payPeriod}`}>
        <DataTable 
          headers={['Region', 'OT $', 'Bonus $']}
          rows={data?.dimensions.regions.map(r => [
            r,
            fmt$(filteredOT.filter(ot => ot.region === r).reduce((s, ot) => s + ot.otDollars, 0)),
            '—'
          ]) || []}
        />
      </SectionCard>
    </div>
  );
}
