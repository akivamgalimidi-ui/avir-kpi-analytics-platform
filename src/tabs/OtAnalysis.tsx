import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN, sumNum, groupBy } from '../components/shared';

export default function OtAnalysis() {
  const { data, filteredOT, updateFilter } = useData();
  if (!data) return null;

  const totalOT = sumNum(filteredOT, 'otDollars');
  const totalHrs = sumNum(filteredOT, 'otHours');

  const byFac = groupBy(filteredOT, r => r.facility);
  const facilityOT = Object.entries(byFac)
    .map(([fac, rows]) => {
      const f = data.facilities.find(x => x.name === fac);
      return { fac, region: f?.region || '—', sg: f?.subgroup || '—', ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') };
    }).filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot);

  const byRegion = groupBy(filteredOT, r => {
    const f = data.facilities.find(x => x.name === r.facility);
    return f?.region || 'Unknown';
  });
  const regionOT = Object.entries(byRegion)
    .map(([region, rows]) => ({ region, ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') }))
    .filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot);

  const bySG = groupBy(filteredOT, r => r.subgroup || 'Unknown');
  const sgOT = Object.entries(bySG)
    .map(([sg, rows]) => ({ sg, ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') }))
    .filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot);

  const byEmp = groupBy(filteredOT, r => r.employee);
  const empOT = Object.entries(byEmp)
    .map(([emp, rows]) => ({ emp, fac: rows[0]?.facility || '—', pos: rows[0]?.position || '—', ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') }))
    .filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot).slice(0, 50);

  const byPeriod = groupBy(filteredOT, r => r.payPeriod);
  const periodOT = Object.entries(byPeriod)
    .map(([p, rows]) => ({ p, ot: sumNum(rows, 'otDollars'), hrs: sumNum(rows, 'otHours') }))
    .sort((a, b) => a.p.localeCompare(b.p));

  return (
    <div className="p-6 space-y-6 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} color="red" />
        <StatCard label="Total OT Hours" value={fmtN(Math.round(totalHrs))} color="amber" />
        <StatCard label="Facilities w/ OT" value={fmtN(facilityOT.length)} color="blue" />
        <StatCard label="OT Employee Records" value={fmtN(empOT.length)} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="OT Dollar Trend by Pay Period">
          <div className="p-4">
            <KpiLineChart data={periodOT} xKey="p" yKey="ot" name="OT Dollars" color="#dc2626" />
          </div>
        </SectionCard>
        <SectionCard title="OT Hours Trend by Pay Period">
          <div className="p-4">
            <KpiLineChart data={periodOT} xKey="p" yKey="hrs" name="OT Hours" color="#d97706" />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="OT by Pay Period">
        <DataTable
          headers={['Pay Period', 'OT $', 'OT Hours']}
          rows={periodOT.map(r => [r.p, fmt$(r.ot), fmtN(Math.round(r.hrs))])}
          onRowClick={i => updateFilter('payPeriod', periodOT[i].p)}
        />
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="OT by Acq Group">
          <DataTable
            headers={['Acq Group', 'OT $', 'OT Hours']}
            rows={sgOT.map(r => [r.sg, <span className="font-black text-red-700">{fmt$(r.ot)}</span>, fmtN(Math.round(r.hrs))])}
            onRowClick={i => updateFilter('subgroup', sgOT[i].sg)}
          />
        </SectionCard>

        <SectionCard title="OT by Region">
          <DataTable
            headers={['Region', 'OT $', 'OT Hours']}
            rows={regionOT.map(r => [r.region, fmt$(r.ot), fmtN(Math.round(r.hrs))])}
            onRowClick={i => updateFilter('region', regionOT[i].region)}
          />
        </SectionCard>
      </div>

      <SectionCard title={`OT by Facility (${facilityOT.length} facilities)`}>
        <DataTable
          headers={['Facility', 'Acq Group', 'Region', 'OT $', 'OT Hours']}
          rows={facilityOT.slice(0, 150).map(r => [
            r.fac, r.sg, r.region,
            <span className="font-black text-red-700">{fmt$(r.ot)}</span>,
            fmtN(Math.round(r.hrs))
          ])}
          onRowClick={i => updateFilter('facility', facilityOT[i].fac)}
        />
      </SectionCard>

      <SectionCard title={`Top OT Employees (${empOT.length})`}>
        <DataTable
          headers={['Employee', 'Facility', 'Position', 'OT $', 'OT Hours']}
          rows={empOT.map(r => [r.emp, r.fac, r.pos, fmt$(r.ot), fmtN(Math.round(r.hrs))])}
        />
      </SectionCard>
    </div>
  );
}
