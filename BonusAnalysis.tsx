import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumNum, groupBy } from '../components/shared';

export default function RegionDashboard() {
  const { data, filteredOT, filteredBonus, filters, updateFilter } = useData();
  if (!data) return null;
  const getRegion = (fac: string) => data.facilities.find(f=>f.name===fac)?.region||'Unknown';
  const byRegion = groupBy(filteredOT, r=>getRegion(r.facility));
  const bonusByRegion = groupBy(filteredBonus, r=>getRegion(r.facility));
  const regionData = [...new Set(data.facilities.map(f=>f.region))].filter(r=>r&&r!=='Unassigned').map(region=>({ region, facilities: data.facilities.filter(f=>f.region===region).length, ot: sumNum(byRegion[region]||[],'otDollars'), bonus: sumNum(bonusByRegion[region]||[],'bonusDollars') })).filter(r=>r.ot>0||r.bonus>0).sort((a,b)=>b.ot-a.ot);
  if (regionData.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800 text-sm font-bold">
          <div className="font-black mb-2">Region data not available in this workbook</div>
          <p>The source file (ltc) shows region data only as aggregated columns in "Analysis by Region", not per facility. Use <strong>Acq Group Dashboard</strong> or <strong>Pay Cycle Mapping</strong> for portfolio segmentation.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Region Dashboard — ${regionData.length} Regions`} subtitle="Click a region to filter">
        <DataTable headers={['Region','Facilities Active','OT $','Bonus $','Combined $']} rows={regionData.map(r=>[r.region,r.facilities,<span className="font-bold text-red-700">{fmt$(r.ot)}</span>,<span className="font-bold text-amber-700">{fmt$(r.bonus)}</span>,<strong>{fmt$(r.ot+r.bonus)}</strong>])} onRowClick={i=>updateFilter('region',regionData[i].region)} />
      </SectionCard>
      {filters.region && (
        <SectionCard title={`Facilities in ${filters.region}`}>
          <DataTable headers={['Facility','Acq Group','Pay Cycle','OT $','Bonus $']} rows={data.facilities.filter(f=>f.region===filters.region).map(f=>[f.name,f.subgroup,f.payCycle,fmt$(sumNum(filteredOT.filter(r=>r.facility===f.name),'otDollars')),fmt$(sumNum(filteredBonus.filter(r=>r.facility===f.name),'bonusDollars'))])} onRowClick={i=>{const facs=data.facilities.filter(f=>f.region===filters.region);updateFilter('facility',facs[i].name);}} />
        </SectionCard>
      )}
    </div>
  );
}
