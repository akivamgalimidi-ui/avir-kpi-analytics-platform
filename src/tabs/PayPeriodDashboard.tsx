import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy } from '../components/shared';

export default function PayPeriodDashboard() {
  const { data, filteredOT, filteredBonus, filteredPPD, filters, updateFilter } = useData();
  if (!data) return null;

  const selectedPeriod = filters.payPeriod;

  const periodData = data.payPeriods.map(p => {
    const otRows = filteredOT.filter(r => r.payPeriod === p);
    const bonusRows = filteredBonus.filter(r => r.payPeriod === p);
    const ppdRows = filteredPPD.filter(r => r.payPeriod === p);
    const facilities = new Set([...otRows.map(r => r.facility), ...bonusRows.map(r => r.facility), ...ppdRows.map(r => r.facility)]);
    
    return {
      p,
      facilities: facilities.size,
      ot: sumNum(otRows, 'otDollars'),
      hrs: sumNum(otRows, 'otHours'),
      bonus: sumNum(bonusRows, 'bonusDollars')
    };
  }).filter(r => r.ot > 0 || r.bonus > 0 || r.facilities > 0).sort((a, b) => a.p.localeCompare(b.p));

  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Pay Period Overview — ${periodData.length} Periods with Activity`}>
        <DataTable
          headers={['Pay Period', 'Facilities Active', 'OT $', 'OT Hrs', 'Bonus $']}
          rows={periodData.map(r => [
            r.p, r.facilities,
            <span className="font-bold text-red-700">{fmt$(r.ot)}</span>,
            fmtN(Math.round(r.hrs)),
            <span className="font-bold text-amber-700">{fmt$(r.bonus)}</span>
          ])}
          onRowClick={i => updateFilter('payPeriod', periodData[i].p)}
        />
        <div className="px-5 py-2 text-[9px] text-slate-400 font-bold">Click a period to filter all tabs</div>
      </SectionCard>

      {selectedPeriod && (
        <SectionCard title={`Facility Detail for ${selectedPeriod}`}>
          <DataTable
            headers={['Facility', 'Acq Group', 'Region', 'Pay Cycle', 'OT $', 'OT Hrs', 'Bonus $']}
            rows={data.facilities.map(f => {
              const otR = filteredOT.filter(r => r.facility === f.name && r.payPeriod === selectedPeriod);
              const bonusR = filteredBonus.filter(r => r.facility === f.name && r.payPeriod === selectedPeriod);
              const ot = sumNum(otR, 'otDollars');
              const hrs = sumNum(otR, 'otHours');
              const bonus = sumNum(bonusR, 'bonusDollars');
              if (ot === 0 && bonus === 0) return null;
              return [f.name, f.subgroup, f.region, f.payCycle, fmt$(ot), fmtN(Math.round(hrs)), fmt$(bonus)];
            }).filter(Boolean) as any[][]}
            onRowClick={(i) => {
              // Row click logic for filtered facilities array requires mapping back to original facility name.
              // We'll skip click handler here for simplicity since the array is filtered above.
            }}
          />
        </SectionCard>
      )}
    </div>
  );
}
