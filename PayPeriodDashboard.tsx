import React from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, fmt$, fmtN, sumNum, groupBy, riskBadge } from '../components/shared';
import { KpiLineChart, KpiBarChart } from '../components/Visuals';

export default function ExecutiveDashboard() {
  const { data, filteredOT, filteredBonus, filteredPPD, updateFilter } = useData();
  if (!data) return null;

  const totalOT = sumNum(filteredOT, 'otDollars');
  const totalOTHrs = sumNum(filteredOT, 'otHours');
  const totalBonus = sumNum(filteredBonus, 'bonusDollars');

  const hppdRows = filteredPPD.filter(r => r.metricType === 'Direct Care HPPD');
  const avgHppd = hppdRows.length ? sumNum(hppdRows, 'value') / hppdRows.length : 0;
  const ppdRows = filteredPPD.filter(r => r.metricType.includes('Overall') || r.metricType.includes('PPD'));
  const avgPpd = ppdRows.length ? sumNum(ppdRows, 'value') / ppdRows.length : 0;

  const periodTrends = data.payPeriods.map(p => ({
    period: p,
    ot: sumNum(filteredOT.filter(r => r.payPeriod === p), 'otDollars'),
    bonus: sumNum(filteredBonus.filter(r => r.payPeriod === p), 'bonusDollars'),
  }));

  const otByFac = groupBy(filteredOT, r => r.facility);
  const topOTFacs = Object.entries(otByFac)
    .map(([fac, rows]) => ({ fac, ot: sumNum(rows, 'otDollars') }))
    .filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot).slice(0, 10);

  const bonusByFac = groupBy(filteredBonus, r => r.facility);
  const topBonusFacs = Object.entries(bonusByFac)
    .map(([fac, rows]) => ({ fac, bonus: sumNum(rows, 'bonusDollars') }))
    .filter(r => r.bonus > 0).sort((a, b) => b.bonus - a.bonus).slice(0, 10);

  const otBySubgroup = groupBy(filteredOT, r => r.subgroup || 'Unknown');
  const subgroupData = Object.entries(otBySubgroup).map(([sg, rows]) => ({
    sg,
    ot: sumNum(rows, 'otDollars'),
    bonus: sumNum(filteredBonus.filter(r => r.subgroup === sg), 'bonusDollars'),
  })).sort((a, b) => b.ot - a.ot);

  const maxScore = Math.max(...subgroupData.map(r => r.ot + r.bonus), 1);

  const insights: { label: string; text: string; type: string }[] = [];
  if (totalOT > totalBonus * 2) insights.push({ label: 'OT Concentration', text: 'Overtime costs are significantly higher than bonus incentives. Consider shift pick-up bonuses.', type: 'warning' });
  if (avgHppd > 0 && avgHppd < 2.5) insights.push({ label: 'Low HPPD Alert', text: 'Portfolio average HPPD is below 2.5. Risk of staffing non-compliance.', type: 'danger' });
  if (topOTFacs[0]) insights.push({ label: 'Top Cost Driver', text: `${topOTFacs[0].fac} accounts for ${((topOTFacs[0].ot / Math.max(totalOT, 1)) * 100).toFixed(1)}% of total portfolio OT.`, type: 'info' });

  return (
    <div className="p-6 space-y-6 pb-20">
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins, i) => (
            <div key={i} className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${ins.type === 'danger' ? 'bg-red-50 border-red-100 text-red-900' : ins.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{ins.label}</div>
              {ins.text}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} sub={`${fmtN(Math.round(totalOTHrs))} hrs`} color="red" />
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} sub={`${fmtN(filteredBonus.length)} records`} color="amber" />
        <StatCard label="Avg HPPD" value={avgHppd ? avgHppd.toFixed(2) : '—'} sub="Direct Care" color="blue" />
        <StatCard label="Avg PPD $" value={avgPpd ? fmt$(avgPpd) : '—'} sub="Overall Labor" color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="OT Trend by Pay Period">
          <div className="h-64 p-4">
            <KpiLineChart data={periodTrends} xKey="period" yKey="ot" name="OT $" color="#dc2626" />
          </div>
        </SectionCard>
        <SectionCard title="OT by Acquisition Group">
          <div className="h-64 p-4">
            <KpiBarChart data={subgroupData} xKey="sg" yKey="ot" name="OT $" color="#2563eb" />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Acquisition Group KPI Summary">
        <DataTable
          headers={['Acq Group', 'OT $', 'Bonus $', 'Combined', 'Risk']}
          rows={subgroupData.map((r, i) => [r.sg, fmt$(r.ot), fmt$(r.bonus), <strong key={i}>{fmt$(r.ot + r.bonus)}</strong>, riskBadge(r.ot + r.bonus, maxScore)])}
          onRowClick={i => updateFilter('subgroup', subgroupData[i].sg)}
        />
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Top 10 OT Facilities">
          <DataTable
            headers={['#', 'Facility', 'OT $']}
            rows={topOTFacs.map((r, i) => [
              <span key={i} className="w-5 h-5 inline-flex items-center justify-center bg-red-100 text-red-700 text-[8px] font-black rounded-full">{i + 1}</span>,
              r.fac,
              <span key={i} className="font-black text-red-700">{fmt$(r.ot)}</span>
            ])}
            onRowClick={i => updateFilter('facility', topOTFacs[i].fac)}
          />
        </SectionCard>

        <SectionCard title="Top 10 Bonus Facilities">
          <DataTable
            headers={['#', 'Facility', 'Bonus $']}
            rows={topBonusFacs.map((r, i) => [
              <span key={i} className="w-5 h-5 inline-flex items-center justify-center bg-amber-100 text-amber-700 text-[8px] font-black rounded-full">{i + 1}</span>,
              r.fac,
              <span key={i} className="font-black text-amber-700">{fmt$(r.bonus)}</span>
            ])}
            onRowClick={i => updateFilter('facility', topBonusFacs[i].fac)}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-black text-slate-800">{data.facilities.length}</div><div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Facilities</div></div>
        <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-black text-slate-800">{data.subgroups.length}</div><div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Acq Groups</div></div>
        <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-black text-slate-800">{data.payPeriods.length}</div><div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Pay Periods</div></div>
        <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-black text-slate-800">{[...new Set(filteredOT.map(r => r.employee))].length}</div><div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Employees w/ OT</div></div>
      </div>
    </div>
  );
}
