import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmt2, sumField, groupBy } from '../components/shared';

export default function HppdPpdAnalysis() {
  const { filteredMetrics, updateFilters } = useData();

  const hppdRows = filteredMetrics.filter(r => r.hppd > 0);
  const ppdRows = filteredMetrics.filter(r => r.ppdDollars > 0);
  const avgHppd = hppdRows.length ? sumField(hppdRows, 'hppd') / hppdRows.length : 0;
  const avgPpd = ppdRows.length ? sumField(ppdRows, 'ppdDollars') / ppdRows.length : 0;

  const byFacility = groupBy(filteredMetrics, m => m.facility);
  const facilityData = Object.entries(byFacility)
    .map(([fac, rows]) => {
      const hr = rows.filter(r => r.hppd > 0);
      const pr = rows.filter(r => r.ppdDollars > 0);
      return {
        fac,
        region: rows[0]?.region || '—',
        hppd: hr.length ? sumField(hr, 'hppd') / hr.length : 0,
        ppd: pr.length ? sumField(pr, 'ppdDollars') / pr.length : 0
      };
    })
    .filter(r => r.hppd > 0 || r.ppd > 0)
    .sort((a, b) => b.ppd - a.ppd);

  const byRegion = groupBy(filteredMetrics, m => m.region || 'Unassigned');
  const regionData = Object.entries(byRegion)
    .map(([region, rows]) => {
      const hr = rows.filter(r => r.hppd > 0);
      const pr = rows.filter(r => r.ppdDollars > 0);
      return {
        region,
        hppd: hr.length ? sumField(hr, 'hppd') / hr.length : 0,
        ppd: pr.length ? sumField(pr, 'ppdDollars') / pr.length : 0
      };
    })
    .filter(r => r.hppd > 0 || r.ppd > 0);

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Avg Direct Care HPPD" value={avgHppd ? fmt2(avgHppd) : '—'} sub="Hours Per Patient Day" accent="bg-blue-50 text-blue-700" />
        <StatCard label="Avg Overall PPD $" value={fmt$(avgPpd)} sub="Labor Cost Per Patient Day" accent="bg-emerald-50 text-emerald-700" />
        <StatCard label="Facilities w/ HPPD" value={String(hppdRows.length > 0 ? [...new Set(hppdRows.map(r => r.facility))].length : 0)} accent="bg-indigo-50 text-indigo-700" />
        <StatCard label="Facilities w/ PPD $" value={String(ppdRows.length > 0 ? [...new Set(ppdRows.map(r => r.facility))].length : 0)} accent="bg-teal-50 text-teal-700" />
      </div>

      <SectionCard title="HPPD & PPD $ by Facility">
        <DataTable
          headers={['Facility', 'Region', 'Avg HPPD', 'Avg PPD $']}
          rows={facilityData.slice(0, 100).map(r => [
            r.fac, r.region,
            r.hppd ? <span className="font-bold text-blue-700">{fmt2(r.hppd)}</span> : '—',
            r.ppd ? <span className="font-bold text-emerald-700">{fmt$(r.ppd)}</span> : '—'
          ])}
          onRowClick={i => updateFilters({ facility: facilityData[i].fac })}
        />
      </SectionCard>

      <SectionCard title="HPPD & PPD $ by Region">
        <DataTable
          headers={['Region', 'Avg HPPD', 'Avg PPD $']}
          rows={regionData.map(r => [r.region, r.hppd ? fmt2(r.hppd) : '—', r.ppd ? fmt$(r.ppd) : '—'])}
          onRowClick={i => updateFilters({ region: regionData[i].region })}
        />
      </SectionCard>
    </div>
  );
}
