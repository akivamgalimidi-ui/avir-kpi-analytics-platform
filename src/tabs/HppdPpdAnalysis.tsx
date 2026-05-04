import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN, fmt2, sumNum, groupBy } from '../components/shared';

export default function HppdPpdAnalysis() {
  const { data, filteredPPD, updateFilter } = useData();
  if (!data) return null;

  const hppdRows = filteredPPD.filter(r => r.metricType === 'Direct Care HPPD');
  const dcPpdRows = filteredPPD.filter(r => r.metricType === 'Direct Care PPD $');
  const olPpdRows = filteredPPD.filter(r => r.metricType === 'Overall Labor PPD $');

  const avg = (rows: typeof filteredPPD) => rows.length ? sumNum(rows, 'value') / rows.length : 0;

  const byFac = groupBy(hppdRows, r => r.facility);
  const facHppd = Object.entries(byFac)
    .map(([fac, rows]) => {
      const f = data.facilities.find(x => x.name === fac);
      const dcPpd = dcPpdRows.filter(r => r.facility === fac);
      const olPpd = olPpdRows.filter(r => r.facility === fac);
      return {
        fac, sg: f?.subgroup || '—', region: f?.region || '—',
        hppd: avg(rows), dcPpd: avg(dcPpd), olPpd: avg(olPpd)
      };
    }).sort((a, b) => b.olPpd - a.olPpd);

  const byPeriod = groupBy(filteredPPD, r => r.payPeriod);
  const periodData = Object.entries(byPeriod)
    .map(([p, rows]) => ({
      p,
      hppd: avg(rows.filter(r => r.metricType === 'Direct Care HPPD')),
      dcPpd: avg(rows.filter(r => r.metricType === 'Direct Care PPD $')),
      olPpd: avg(rows.filter(r => r.metricType === 'Overall Labor PPD $')),
    }))
    .filter(r => r.hppd > 0 || r.olPpd > 0)
    .sort((a, b) => a.p.localeCompare(b.p));

  const byRegion = groupBy(hppdRows, r => data.facilities.find(f => f.name === r.facility)?.region || 'Unknown');
  const regionData = Object.entries(byRegion)
    .map(([region, rows]) => {
      const olPpd = olPpdRows.filter(r => data.facilities.find(f => f.name === r.facility)?.region === region);
      return { region, hppd: avg(rows), olPpd: avg(olPpd) };
    });

  return (
    <div className="p-6 space-y-6 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Avg Direct Care HPPD" value={avg(hppdRows) ? fmt2(avg(hppdRows)) : '—'} sub="Hours Per Patient Day" color="blue" />
        <StatCard label="Avg Direct Care PPD $" value={avg(dcPpdRows) ? fmt$(avg(dcPpdRows)) : '—'} sub="Direct Labor Per Patient Day" color="teal" />
        <StatCard label="Avg Overall Labor PPD $" value={avg(olPpdRows) ? fmt$(avg(olPpdRows)) : '—'} sub="Total Labor Per Patient Day" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Avg Direct Care HPPD Trend">
          <div className="p-4">
            <KpiLineChart data={periodData} xKey="p" yKey="hppd" name="HPPD" color="#2563eb" />
          </div>
        </SectionCard>
        <SectionCard title="Avg Overall Labor PPD $ Trend">
          <div className="p-4">
            <KpiLineChart data={periodData} xKey="p" yKey="olPpd" name="PPD $" color="#4f46e5" />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="HPPD & PPD Trend by Pay Period">
        <DataTable
          headers={['Pay Period', 'Avg HPPD', 'Avg DC PPD $', 'Avg Overall PPD $']}
          rows={periodData.map(r => [
            r.p,
            r.hppd ? <span className="font-bold text-blue-700">{fmt2(r.hppd)}</span> : '—',
            r.dcPpd ? fmt$(r.dcPpd) : '—',
            r.olPpd ? <span className="font-bold text-indigo-700">{fmt$(r.olPpd)}</span> : '—'
          ])}
          onRowClick={i => updateFilter('payPeriod', periodData[i].p)}
        />
      </SectionCard>

      <SectionCard title={`HPPD & PPD by Facility (${facHppd.length} facilities)`}>
        <DataTable
          headers={['Facility', 'Acq Group', 'Region', 'Avg HPPD', 'Avg DC PPD $', 'Avg Overall PPD $']}
          rows={facHppd.slice(0, 150).map(r => [
            r.fac, r.sg, r.region,
            r.hppd ? fmt2(r.hppd) : '—',
            r.dcPpd ? fmt$(r.dcPpd) : '—',
            r.olPpd ? <span className="font-bold text-indigo-700">{fmt$(r.olPpd)}</span> : '—'
          ])}
          onRowClick={i => updateFilter('facility', facHppd[i].fac)}
        />
      </SectionCard>

      <SectionCard title="HPPD & PPD by Region">
        <DataTable
          headers={['Region', 'Avg HPPD', 'Avg Overall PPD $']}
          rows={regionData.map(r => [r.region, r.hppd ? fmt2(r.hppd) : '—', r.olPpd ? fmt$(r.olPpd) : '—'])}
          onRowClick={i => updateFilter('region', regionData[i].region)}
        />
      </SectionCard>
    </div>
  );
}
