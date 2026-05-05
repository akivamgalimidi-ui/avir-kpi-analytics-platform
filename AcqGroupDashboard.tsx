import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, Badge } from '../components/shared';

export default function PayCycleMapping() {
  const { data } = useData();
  if (!data) return null;
  const cycleA = data.facilities.filter(f=>f.payCycle==='Cycle A');
  const cycleB = data.facilities.filter(f=>f.payCycle==='Cycle B');
  const unknown = data.facilities.filter(f=>f.payCycle==='Unknown');
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Facilities" value={data.facilities.length} color="blue" />
        <StatCard label="Cycle A (3/28, 4/11)" value={cycleA.length} sub="Odd-week facilities" color="emerald" />
        <StatCard label="Cycle B (4/4, 4/18)" value={cycleB.length} sub="Even-week facilities" color="teal" />
        <StatCard label="Unknown Cycle" value={unknown.length} color="amber" />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 text-xs font-bold">
        <div className="font-black mb-1">Pay Cycle Logic</div>
        Cycle A: data present in 3/28 and/or 4/11 periods (every 2 weeks from 3/28)<br/>
        Cycle B: data present in 4/4 and/or 4/18 periods (every 2 weeks from 4/4)<br/>
        Deltas always compare latest vs prior within the same cycle — never cross-cycle.
      </div>
      <SectionCard title={`Facility Pay Cycle Mapping — ${data.facilities.length} Facilities`}>
        <DataTable
          headers={['Facility','Acq Group','Pay Cycle','Latest Period','Prior Period','Comparable']}
          rows={data.facilities.map(f=>[
            f.name, f.subgroup, f.payCycle,
            f.latestPeriod||'—', f.priorPeriod||'—',
            <Badge key={f.name} label={f.comparableStatus||'—'} color={f.comparableStatus==='Comparable'?'emerald':f.comparableStatus==='New'?'blue':'amber'} />
          ])}
        />
      </SectionCard>
    </div>
  );
}
