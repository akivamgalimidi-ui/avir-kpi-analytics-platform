import React from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, fmt$, fmtN, sumField, groupBy } from '../components/shared';

export default function ExecutiveDashboard() {
  const { filteredMetrics, data } = useData();

  const totalOT = sumField(filteredMetrics, 'otDollars');
  const totalBonus = sumField(filteredMetrics, 'bonusDollars');
  const totalHPPD = filteredMetrics.length ? sumField(filteredMetrics, 'hppd') / filteredMetrics.filter(m => m.hppd > 0).length || 0 : 0;
  const totalPPD = filteredMetrics.length ? sumField(filteredMetrics, 'ppdDollars') / filteredMetrics.filter(m => m.ppdDollars > 0).length || 0 : 0;

  // Top OT Facilities
  const byFacility = groupBy(filteredMetrics, m => m.facility);
  const topOT = Object.entries(byFacility)
    .map(([fac, rows]) => ({ fac, ot: sumField(rows, 'otDollars') }))
    .sort((a, b) => b.ot - a.ot)
    .slice(0, 10);

  const topBonus = Object.entries(byFacility)
    .map(([fac, rows]) => ({ fac, bonus: sumField(rows, 'bonusDollars') }))
    .sort((a, b) => b.bonus - a.bonus)
    .slice(0, 10);

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} sub={`${filteredMetrics.length} metric rows`} accent="bg-red-50 text-red-700" />
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} sub={`${data.facilities.length} facilities`} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Avg HPPD" value={totalHPPD ? totalHPPD.toFixed(2) : '—'} sub="Direct Care Hours PPD" accent="bg-blue-50 text-blue-700" />
        <StatCard label="Avg PPD $" value={fmt$(totalPPD)} sub="Overall Labor PPD" accent="bg-emerald-50 text-emerald-700" />
        <StatCard label="Facilities" value={fmtN(data.facilities.length)} accent="bg-indigo-50 text-indigo-700" />
        <StatCard label="Regions" value={fmtN(data.regions.length)} accent="bg-purple-50 text-purple-700" />
        <StatCard label="Acq Groups" value={fmtN(data.groups.length)} accent="bg-pink-50 text-pink-700" />
        <StatCard label="Pay Periods" value={fmtN(data.payPeriods.length)} accent="bg-teal-50 text-teal-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Top 10 OT Facilities">
          <DataTable
            headers={['Facility', 'OT $']}
            rows={topOT.map((r, i) => [
              <span key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[9px] font-black flex items-center justify-center">{i + 1}</span>
                {r.fac}
              </span>,
              <span key={i} className="font-black text-red-700">{fmt$(r.ot)}</span>
            ])}
          />
        </SectionCard>

        <SectionCard title="Top 10 Bonus Facilities">
          <DataTable
            headers={['Facility', 'Bonus $']}
            rows={topBonus.map((r, i) => [
              <span key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black flex items-center justify-center">{i + 1}</span>
                {r.fac}
              </span>,
              <span key={i} className="font-black text-amber-700">{fmt$(r.bonus)}</span>
            ])}
          />
        </SectionCard>
      </div>

      {data.warnings.length > 0 && (
        <SectionCard title="Parser Warnings">
          <div className="p-4 space-y-1">
            {data.warnings.map((w, i) => (
              <div key={i} className="text-xs font-medium text-amber-700 flex items-center gap-2">
                <span className="text-amber-500">⚠</span> {w}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
