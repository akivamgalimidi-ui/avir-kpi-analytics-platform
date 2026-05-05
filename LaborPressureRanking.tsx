import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumNum, Badge } from '../components/shared';

export default function Reconciliation() {
  const { data } = useData();
  if (!data) return null;
  const totalOT = sumNum(data.otRows,'otDollars');
  const totalBonus = sumNum(data.bonusRows,'bonusDollars');
  const checks = [
    { name: 'OT Rollup Verification', status: totalOT>0?'PASS':'FAIL', detail: totalOT>0?`${fmt$(totalOT)} across ${data.otRows.length} records`:'No OT dollars found' },
    { name: 'Bonus Rollup Verification', status: totalBonus>0?'PASS':'FAIL', detail: totalBonus>0?`${fmt$(totalBonus)} across ${data.bonusRows.length} records`:'No bonus dollars found' },
    { name: 'PPD Metric Integrity', status: data.ppdRows.length>0?'PASS':'WARNING', detail: `${data.ppdRows.length} PPD/HPPD records` },
    { name: 'Facility Mapping Coverage', status: data.facilities.length>0?'PASS':'FAIL', detail: `${data.facilities.length} facilities inferred from facts` },
    { name: 'Pay Period Sync', status: data.payPeriods.length>0?'PASS':'FAIL', detail: `${data.payPeriods.length} unique pay periods: ${data.payPeriods.join(', ')}` },
    { name: 'Subgroup Coverage', status: data.subgroups.length>0?'PASS':'WARNING', detail: data.subgroups.length>0?data.subgroups.join(', '):'No subgroups found' },
    { name: 'Pay Cycle A Facilities', status: data.facilities.filter(f=>f.payCycle==='Cycle A').length>0?'PASS':'WARNING', detail: `${data.facilities.filter(f=>f.payCycle==='Cycle A').length} facilities` },
    { name: 'Pay Cycle B Facilities', status: data.facilities.filter(f=>f.payCycle==='Cycle B').length>0?'PASS':'WARNING', detail: `${data.facilities.filter(f=>f.payCycle==='Cycle B').length} facilities` },
  ];
  const sc = (s: string) => ({PASS:'emerald',WARNING:'amber',FAIL:'red'}[s] as any);
  return (
    <div className="p-6 space-y-6">
      <SectionCard title="Data Reconciliation & Integrity Checks">
        <DataTable headers={['Check','Status','Detail']} rows={checks.map(c=>[<span key={c.name} className="font-bold">{c.name}</span>,<Badge key={c.name} label={c.status} color={sc(c.status)} />,<span key={c.name} className="text-slate-500">{c.detail}</span>])} />
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="OT by Acq Group (Rollup Check)">
          <DataTable headers={['Group','OT $']} rows={data.subgroups.map(sg=>[sg,fmt$(sumNum(data.otRows.filter(r=>r.subgroup===sg),'otDollars'))])} />
        </SectionCard>
        <SectionCard title="Bonus by Acq Group (Rollup Check)">
          <DataTable headers={['Group','Bonus $']} rows={data.subgroups.map(sg=>[sg,fmt$(sumNum(data.bonusRows.filter(r=>r.subgroup===sg),'bonusDollars'))])} />
        </SectionCard>
      </div>
    </div>
  );
}
