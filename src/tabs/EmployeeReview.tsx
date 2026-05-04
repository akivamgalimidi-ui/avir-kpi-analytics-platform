import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, EmptyState } from '../components/shared';

export default function EmployeeReview() {
  const { data } = useData();
  const employees = [...data.employees].sort((a, b) => (b.otDollars + b.bonusDollars) - (a.otDollars + a.bonusDollars));

  if (employees.length === 0) {
    return (
      <div className="p-8">
        <SectionCard title="Employee Review">
          <EmptyState message="No employee data found. Ensure your 'Top OT Earners' or 'Bonus by Type' sheets have an employee name column." />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Top Employees by Combined OT + Bonus (${employees.length} records)`}>
        <DataTable
          headers={['Employee', 'Facility', 'OT $', 'Bonus $', 'Combined $', 'Period', 'Review Flag']}
          rows={employees.slice(0, 100).map((e, i) => {
            const combined = e.otDollars + e.bonusDollars;
            const flag = combined > 10000 ? '🔴 High Priority' : combined > 5000 ? '🟡 Moderate' : '🟢 Normal';
            return [e.name, e.facility || '—', fmt$(e.otDollars), fmt$(e.bonusDollars),
              <span key={i} className="font-black">{fmt$(combined)}</span>,
              e.payPeriod || '—', flag];
          })}
        />
      </SectionCard>
    </div>
  );
}
