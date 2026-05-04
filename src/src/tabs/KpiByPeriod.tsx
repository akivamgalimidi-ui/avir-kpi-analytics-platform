import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, fmt2 } from '../components/shared';

export default function KpiByPeriod() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();
  if (!data) return null;

  const periods = data.dimensions.payPeriods;

  return (
    <div className="space-y-6">
      <SectionCard title="Portfolio KPI Matrix by Pay Period" subtitle="Cross-period labor performance tracking">
        <DataTable
          headers={['Pay Period', 'OT $', 'Bonus $', 'Avg HPPD', 'Avg PPD $']}
          rows={periods.map(p => {
            const ot = filteredOT.filter(r => r.payPeriod === p).reduce((s, r) => s + r.otDollars, 0);
            const bonus = filteredBonus.filter(r => r.payPeriod === p).reduce((s, r) => s + r.bonusDollars, 0);
            const hppd = filteredPPD.filter(r => r.payPeriod === p && r.metricType.includes('HPPD'));
            const avgHppd = hppd.length > 0 ? hppd.reduce((s, r) => s + r.value, 0) / hppd.length : 0;
            const ppd = filteredPPD.filter(r => r.payPeriod === p && r.metricType.includes('PPD $'));
            const avgPpd = ppd.length > 0 ? ppd.reduce((s, r) => s + r.value, 0) / ppd.length : 0;

            return [p, fmt$(ot), fmt$(bonus), fmt2(avgHppd), fmt$(avgPpd)];
          })}
        />
      </SectionCard>
    </div>
  );
}
