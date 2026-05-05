import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN, sumNum, groupBy } from '../components/shared';
import { KpiLineChart, KpiBarChart } from '../components/Visuals';

export default function BonusAnalysis() {
  const { data, filteredBonus, updateFilter } = useData();
  if (!data) return null;
  const totalBonus = sumNum(filteredBonus,'bonusDollars');
  const byFac = groupBy(filteredBonus, r=>r.facility);
  const facBonus = Object.entries(byFac).map(([fac,rows])=>{const f=data.facilities.find(x=>x.name===fac);return{fac,sg:f?.subgroup||'—',bonus:sumNum(rows,'bonusDollars')};}).filter(r=>r.bonus>0).sort((a,b)=>b.bonus-a.bonus);
  const bySG = groupBy(filteredBonus,r=>r.subgroup||'Unknown');
  const sgBonus = Object.entries(bySG).map(([sg,rows])=>({sg,bonus:sumNum(rows,'bonusDollars')})).filter(r=>r.bonus>0).sort((a,b)=>b.bonus-a.bonus);
  const byType = groupBy(filteredBonus,r=>r.bonusType||'Unknown');
  const typeBonus = Object.entries(byType).map(([type,rows])=>({type,bonus:sumNum(rows,'bonusDollars'),count:rows.length})).filter(r=>r.bonus>0).sort((a,b)=>b.bonus-a.bonus);
  const byEmp = groupBy(filteredBonus,r=>r.employee);
  const empBonus = Object.entries(byEmp).map(([emp,rows])=>({emp,fac:rows[0]?.facility||'—',type:rows[0]?.bonusType||'—',bonus:sumNum(rows,'bonusDollars')})).filter(r=>r.bonus>0).sort((a,b)=>b.bonus-a.bonus).slice(0,50);
  const byPeriod = groupBy(filteredBonus,r=>r.payPeriod);
  const periodBonus = Object.entries(byPeriod).map(([p,rows])=>({p,bonus:sumNum(rows,'bonusDollars')})).sort((a,b)=>a.p.localeCompare(b.p));

  return (
    <div className="p-6 space-y-6 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} color="amber" />
        <StatCard label="Facilities w/ Bonus" value={fmtN(facBonus.length)} color="orange" />
        <StatCard label="Bonus Types" value={fmtN(typeBonus.length)} color="purple" />
        <StatCard label="Bonus Records" value={fmtN(filteredBonus.length)} color="indigo" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Bonus Trend by Pay Period"><div className="h-56 p-4"><KpiLineChart data={periodBonus} xKey="p" yKey="bonus" name="Bonus $" color="#d97706" /></div></SectionCard>
        <SectionCard title="Bonus by Acq Group"><div className="h-56 p-4"><KpiBarChart data={sgBonus} xKey="sg" yKey="bonus" name="Bonus $" color="#2563eb" /></div></SectionCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Bonus by Type"><DataTable headers={['Bonus Type','Total $','Records']} rows={typeBonus.map(r=>[r.type,fmt$(r.bonus),fmtN(r.count)])} /></SectionCard>
        <SectionCard title="Bonus by Acq Group"><DataTable headers={['Acq Group','Bonus $']} rows={sgBonus.map(r=>[r.sg,fmt$(r.bonus)])} onRowClick={i=>updateFilter('subgroup',sgBonus[i].sg)} /></SectionCard>
      </div>
      <SectionCard title={`Bonus by Facility (${facBonus.length})`}><DataTable headers={['Facility','Acq Group','Bonus $']} rows={facBonus.slice(0,150).map(r=>[r.fac,r.sg,<span className="font-black text-amber-700">{fmt$(r.bonus)}</span>])} onRowClick={i=>updateFilter('facility',facBonus[i].fac)} /></SectionCard>
      <SectionCard title="Top Bonus Employees"><DataTable headers={['Employee','Facility','Type','Bonus $']} rows={empBonus.map(r=>[r.emp,r.fac,r.type,fmt$(r.bonus)])} /></SectionCard>
    </div>
  );
}
