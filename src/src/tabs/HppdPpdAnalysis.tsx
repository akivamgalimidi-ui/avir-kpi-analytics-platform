import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, fmt$, fmtN, fmt2 } from '../components/shared';

export default function HppdPpdAnalysis() {
  const { data, filteredPPD } = useData();

  const hppdRows = filteredPPD.filter(r => r.metricType.includes('HPPD'));
  const dcPpdRows = filteredPPD.filter(r => r.metricType.includes('Direct Care PPD $'));
  const olPpdRows = filteredPPD.filter(r => r.metricType.includes('Overall Labor PPD $'));

  const avg = (arr: any[]) => arr.length > 0 ? arr.reduce((s, r) => s + r.value, 0) / arr.length : 0;

  const periodData = useMemo(() => {
    const periods = [...new Set(filteredPPD.map(r => r.payPeriod))].sort();
    return periods.map(p => {
      const ph = hppdRows.filter(r => r.payPeriod === p);
      const pd = dcPpdRows.filter(r => r.payPeriod === p);
      const po = olPpdRows.filter(r => r.payPeriod === p);
      return {
        p,
        hppd: avg(ph),
        dcPpd: avg(pd),
        olPpd: avg(po)
      };
    });
  }, [filteredPPD]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Avg Direct Care HPPD" value={avg(hppdRows) ? fmt2(avg(hppdRows)) : '—'} sub="Hours Per Patient Day" color="blue" />
        <StatCard label="Avg Direct Care PPD $" value={avg(dcPpdRows) ? fmt$(avg(dcPpdRows)) : '—'} sub="Direct Labor Per Patient Day" color="teal" />
        <StatCard label="Avg Overall Labor PPD $" value={avg(olPpdRows) ? fmt$(avg(olPpdRows)) : '—'} sub="Total Labor Per Patient Day" color="indigo" />
      </div>

      <SectionCard title="HPPD & PPD Trend by Pay Period">
        <DataTable
          headers={['Pay Period', 'Avg HPPD', 'Avg DC PPD $', 'Avg Overall PPD $']}
          rows={periodData.map(p => [p.p, fmt2(p.hppd), fmt$(p.dcPpd), fmt$(p.olPpd)])}
        />
      </SectionCard>

      <SectionCard title="Metric by Facility (Latest Period)">
        <DataTable
          headers={['Facility', 'Metric Type', 'Value']}
          rows={filteredPPD.slice(0, 30).map(r => [r.facility, r.metricType, r.value % 1 === 0 ? fmtN(r.value) : (r.metricType.includes('$') ? fmt$(r.value) : fmt2(r.value))])}
        />
      </SectionCard>
    </div>
  );
}
