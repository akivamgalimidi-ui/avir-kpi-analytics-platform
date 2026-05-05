import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy } from '../components/shared';

export default function AcqGroupDashboard() {
  const { data, filteredOT, filteredBonus, filters, updateFilter } = useData();
  if (!data) return null;
  const bySG = groupBy(filteredOT, r=>r.subgroup||'Unknown');
  const bonusBySG = groupBy(filteredBonus, r=>r.subgroup||'Unknown');
  const sgData = data.subgroups.map(sg=>{ const otRows=bySG[sg]||[]; const bonusRows=bonusBySG[sg]||[]; const facilities=data.facilities.filter(f=>f.subgroup===sg); return{sg,facilityCount:facilities.length,ot:sumNum(otRows,'otDollars'),bonus:sumNum(bonusRows,'bonusDollars')}; }).filter(r=>r.ot>0||r.bonus>0).sort((a,b)=>b.ot-a.ot);
  const selectedSG = filters.subgroup;
  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Acquisition Group Dashboard — ${sgData.length} Groups`} subtitle="Click a group to filter all tabs">
        <DataTable
          headers={['Acq Group','Facilities','OT $','Bonus $','Combined $']}
          rows={sgData.map(r=>[r.sg,r.facilityCount,<span className="font-bold text-red-700">{fmt$(r.ot)}</span>,<span className="font-bold text-amber-700">{fmt$(r.bonus)}</span>,<strong>{fmt$(r.ot+r.bonus)}</strong>])}
          onRowClick={i=>updateFilter('subgroup',sgData[i].sg)}
        />
      </SectionCard>
      {selectedSG && (
        <>
          <SectionCard title={`${selectedSG} — Facilities`}>
            <DataTable
              headers={['Facility','Pay Cycle','OT $','Bonus $','Comparable']}
              rows={data.facilities.filter(f=>f.subgroup===selectedSG).map(f=>{ const ot=sumNum(filteredOT.filter(r=>r.facility===f.name),'otDollars'); const bonus=sumNum(filteredBonus.filter(r=>r.facility===f.name),'bonusDollars'); return[f.name,f.payCycle,fmt$(ot),fmt$(bonus),f.comparableStatus||'—']; })}
              onRowClick={i=>{const facs=data.facilities.filter(f=>f.subgroup===selectedSG);updateFilter('facility',facs[i].name);}}
            />
          </SectionCard>
          <SectionCard title={`${selectedSG} — Top OT Employees`}>
            <DataTable
              headers={['Employee','Facility','OT $']}
              rows={filteredOT.filter(r=>r.subgroup===selectedSG).reduce((acc,r)=>{ const ex=acc.find((x:any)=>x.emp===r.employee); if(ex)ex.ot+=r.otDollars; else acc.push({emp:r.employee,fac:r.facility,ot:r.otDollars}); return acc; },[]).sort((a:any,b:any)=>b.ot-a.ot).slice(0,20).map((r:any)=>[r.emp,r.fac,fmt$(r.ot)])}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
