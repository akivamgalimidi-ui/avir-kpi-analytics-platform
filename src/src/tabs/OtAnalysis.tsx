import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, fmt$, fmtN, fmt2 } from '../components/shared';
import { KpiLineChart } from '../components/Visuals';

export default function OtAnalysis() {
  const { data, filteredOT } = useData();

  const totalOT = filteredOT.reduce((sum, r) => sum + r.otDollars, 0);
  const totalHrs = filteredOT.reduce((sum, r) => sum + r.otHours, 0);

  const facilityOT = useMemo(() => {
    const map: Record<string, { ot: number; hrs: number }> = {};
    filteredOT.forEach(r => {
      if (!map[r.facility]) map[r.facility] = { ot: 0, hrs: 0 };
      map[r.facility].ot += r.otDollars;
      map[r.facility].hrs += r.otHours;
    });
    return Object.entries(map)
      .map(([f, vals]) => ({ f, ...vals }))
      .sort((a, b) => b.ot - a.ot);
  }, [filteredOT]);

  const empOT = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOT.forEach(r => map[r.employee] = (map[r.employee] || 0) + r.otDollars);
    return Object.entries(map)
      .map(([e, ot]) => ([e, fmt$(ot)]))
      .sort((a, b) => parseFloat(b[1].replace(/[^0-9.-]+/g,"")) - parseFloat(a[1].replace(/[^0-9.-]+/g,"")))
      .slice(0, 15);
  }, [filteredOT]);

  const periodOT = useMemo(() => {
    const map: Record<string, { ot: number; hrs: number }> = {};
    filteredOT.forEach(r => {
      if (!map[r.payPeriod]) map[r.payPeriod] = { ot: 0, hrs: 0 };
      map[r.payPeriod].ot += r.otDollars;
      map[r.payPeriod].hrs += r.otHours;
    });
    return Object.entries(map)
      .map(([p, vals]) => ({ p, ...vals }))
      .sort((a, b) => a.p.localeCompare(b.p));
  }, [filteredOT]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} color="red" />
        <StatCard label="Total OT Hours" value={fmtN(Math.round(totalHrs))} color="amber" />
        <StatCard label="Facilities w/ OT" value={fmtN(facilityOT.length)} color="blue" />
        <StatCard label="OT Employee Records" value={fmtN(empOT.length)} color="indigo" />
      </div>

      <SectionCard title="OT by Pay Period">
        <DataTable
          headers={['Pay Period', 'OT $', 'OT Hours']}
          rows={periodOT.map(p => [p.p, fmt$(p.ot), fmtN(Math.round(p.hrs))])}
        />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="OT by Facility (Top 15)">
          <DataTable
            headers={['Facility', 'OT $', 'OT Hours']}
            rows={facilityOT.slice(0, 15).map(f => [f.f, fmt$(f.ot), fmtN(Math.round(f.hrs))])}
          />
        </SectionCard>
        <SectionCard title="Top OT Earners (Employee)">
          <DataTable
            headers={['Employee', 'OT Dollars']}
            rows={empOT}
          />
        </SectionCard>
      </div>
    </div>
  );
}
