import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmt2, sumField, groupBy } from '../components/shared';

export default function KpiByPeriod() {
  const { data, filteredMetrics } = useData();
  const byPeriod = groupBy(filteredMetrics, m => m.payPeriod);

  const periods = data.payPeriods.filter(p => byPeriod[p]);

  const rows = periods.map(period => {
    const rows = byPeriod[period] || [];
    const ot = sumField(rows, 'otDollars');
    const bonus = sumField(rows, 'bonusDollars');
    const hppdRows = rows.filter(r => r.hppd > 0);
    const hppd = hppdRows.length ? sumField(hppdRows, 'hppd') / hppdRows.length : 0;
    const ppdRows = rows.filter(r => r.ppdDollars > 0);
    const ppd = ppdRows.length ? sumField(ppdRows, 'ppdDollars') / ppdRows.length : 0;
    return [period, fmt$(ot), fmt$(bonus), fmt2(hppd), fmt$(ppd), rows.length];
  });

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`KPI Matrix by Pay Period (${periods.length} periods)`}>
        <DataTable
          headers={['Pay Period', 'OT $', 'Bonus $', 'Avg HPPD', 'Avg PPD $', 'Facility Rows']}
          rows={rows}
        />
      </SectionCard>
    </div>
  );
}
