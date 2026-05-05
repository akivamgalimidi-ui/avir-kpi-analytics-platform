import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum } from '../components/shared';

export default function PayPeriodDashboard() {
  const { data, filteredOT, filteredBonus, filteredPPD, filters, updateFilter } = useData();
  if (!data) return null;
  const selectedPeriod = filters.payPeriod;
  const periodData = data.payPeriods.map(p=>{
    const ot=filteredOT.filter(r=>r.payPeriod===p); const bonus=filteredBonus.filter(r=>r.payPeriod===p); const ppd=filteredPPD.filter(r=>r.payPeriod===p);
    const facs=new Set([...ot.map(r=>r.facility),...bonus.map(r=>r.facility),...ppd.map(r=>r.facility)]);
    return{p,facilities:facs.size,ot:sumNum(ot,'otDollars'),hrs:sumNum(ot,'otHours'),bonus:sumNum(bonus,'bonusDollars')};
  }).filter(r=>r.ot>0||r.bonus>0).sort((a,b)=>a.p.localeCompare(b.p));
  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Pay Period Overview — ${periodData.length} Active Periods`} subtitle="Click a period to filter all tabs">
        <DataTable
          headers={['Pay Period','Facilities Active','OT $','OT Hrs','Bonus $']}
          rows={periodData.map(r=>[r.p,r.facilities,<span className="font-bold text-red-700">{fmt$(r.ot)}</span>,fmtN(Math.round(r.hrs)),<span className="font-bold text-amber-700">{fmt$(r.bonus)}</span>])}
          onRowClick={i=>updateFilter('payPeriod',periodData[i].p)}
        />
      </SectionCard>
      {selectedPeriod && (
        <SectionCard title={`Facility Detail — ${selectedPeriod}`}>
          <DataTable
            headers={['Facility','Acq Group','Pay Cycle','OT $','OT Hrs','Bonus $']}
            rows={data.facilities.map(f=>{
              const ot=filteredOT.filter(r=>r.facility===f.name&&r.payPeriod===selectedPeriod);
              const bonus=filteredBonus.filter(r=>r.facility===f.name&&r.payPeriod===selectedPeriod);
              const otAmt=sumNum(ot,'otDollars'); const bonusAmt=sumNum(bonus,'bonusDollars');
              if(!otAmt&&!bonusAmt) return null;
              return[f.name,f.subgroup,f.payCycle,fmt$(otAmt),fmtN(Math.round(sumNum(ot,'otHours'))),fmt$(bonusAmt)];
            }).filter(Boolean) as React.ReactNode[][]}
          />
        </SectionCard>
      )}
    </div>
  );
}
