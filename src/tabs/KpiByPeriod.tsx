import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, fmt2, sumNum, groupBy } from '../components/shared';

export default function KpiByPeriod() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();
  if (!data) return null;

  const periods = data.payPeriods;

  const rows = periods.map(period => {
    const otRows = filteredOT.filter(r => r.payPeriod === period);
    const bonusRows = filteredBonus.filter(r => r.payPeriod === period);
    const ppdRows = filteredPPD.filter(r => r.payPeriod === period);

    const ot = sumNum(otRows, 'otDollars');
    const bonus = sumNum(bonusRows, 'bonusDollars');
    
    const hppdItems = ppdRows.filter(r => r.metricType === 'Direct Care HPPD');
    const hppd = hppdItems.length ? sumNum(hppdItems, 'value') / hppdItems.length : 0;
    
    const ppdItems = ppdRows.filter(r => r.metricType === 'Overall Labor PPD $');
    const ppd = ppdItems.length ? sumNum(ppdItems, 'value') / ppdItems.length : 0;

    const facilities = new Set([...otRows.map(r => r.facility), ...bonusRows.map(r => r.facility), ...ppdRows.map(r => r.facility)]);

    return [
      period,
      <span key={period + 'ot'} className="font-bold text-red-700">{fmt$(ot)}</span>,
      <span key={period + 'bonus'} className="font-bold text-amber-700">{fmt$(bonus)}</span>,
      <span key={period + 'hppd'} className="text-blue-700">{hppd ? hppd.toFixed(2) : '—'}</span>,
      <span key={period + 'ppd'} className="text-indigo-700">{ppd ? fmt$(ppd) : '—'}</span>,
      fmtN(facilities.size)
    ];
  });

  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`KPI Matrix by Pay Period — ${periods.length} Periods`}>
        <DataTable
          headers={['Pay Period', 'Total OT $', 'Total Bonus $', 'Avg HPPD', 'Avg PPD $', 'Active Facilities']}
          rows={rows}
        />
      </SectionCard>
    </div>
  );
}
