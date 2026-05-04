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
  const ppdRows = filteredPPD.filter(r => r.metricType.includes('PPD'));
  const avgPpd = ppdRows.length ? sumNum(ppdRows, 'value') / ppdRows.length : 0;

  // Charts data
  const periodTrends = data.payPeriods.map(p => {
    const ot = sumNum(filteredOT.filter(r => r.payPeriod === p), 'otDollars');
    const bonus = sumNum(filteredBonus.filter(r => r.payPeriod === p), 'bonusDollars');
    return { period: p, ot, bonus };
  });

  // Top 10 OT Facilities
  const otByFac = groupBy(filteredOT, r => r.facility);
  const topOTFacs = Object.entries(otByFac)
    .map(([fac, rows]) => ({ fac, ot: sumNum(rows, 'otDollars') }))
    .filter(r => r.ot > 0).sort((a, b) => b.ot - a.ot).slice(0, 10);

  // Subgroup breakdown
  const otBySubgroup = groupBy(filteredOT, r => r.subgroup || 'Unknown');
  const subgroupData = Object.entries(otBySubgroup)
    .map(([sg, rows]) => ({
      sg, 
      ot: sumNum(rows, 'otDollars'),
      bonus: sumNum(filteredBonus.filter(r => r.subgroup === sg), 'bonusDollars')
    }))
    .sort((a, b) => b.ot - a.ot);

  const maxScore = Math.max(...subgroupData.map(r => r.ot + r.bonus), 1);

  // Executive Insights logic
  const insights = [];
  if (totalOT > totalBonus * 2) insights.push({ label: 'OT Concentration', text: 'Overtime costs are significantly higher than bonus incentives. Consider shift-pick-up bonuses to reduce high-rate OT.', type: 'warning' });
  if (avgHppd < 2.5 && avgHppd > 0) insights.push({ label: 'Low HPPD Alert', text: 'Portfolio average HPPD is below target levels. Risk of staffing non-compliance in certain facilities.', type: 'danger' });
  const highestOTFac = topOTFacs[0];
  if (highestOTFac) insights.push({ label: 'Top Cost Driver', text: `${highestOTFac.fac} accounts for ${((highestOTFac.ot / totalOT) * 100).toFixed(1)}% of total portfolio OT.`, type: 'info' });

  return (
    <div className="p-6 space-y-6 pb-20">
      {/* Executive Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((ins, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${ins.type === 'danger' ? 'bg-red-50 border-red-100 text-red-900' : ins.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${ins.type === 'danger' ? 'bg-red-500' : ins.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{ins.label}</span>
            </div>
            <div className="text-xs font-bold leading-relaxed">{ins.text}</div>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} sub="Direct Labor Cost" color="red" />
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} sub="Incentive Pay" color="amber" />
        <StatCard label="Avg HPPD" value={avgHppd ? avgHppd.toFixed(2) : '—'} sub="Hours PPD" color="blue" />
        <StatCard label="Avg PPD $" value={avgPpd ? fmt$(avgPpd) : '—'} sub="Overall Cost PPD" color="teal" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="OT & Bonus Trend by Pay Period">
          <div className="p-4">
            <KpiLineChart data={periodTrends} xKey="period" yKey="ot" name="OT Dollars" color="#dc2626" />
          </div>
        </SectionCard>
        <SectionCard title="OT by Acquisition Group">
          <div className="p-4">
            <KpiBarChart data={subgroupData} xKey="sg" yKey="ot" name="OT Dollars" color="#2563eb" />
          </div>
        </SectionCard>
      </div>

      {/* Acq Group Table */}
      <SectionCard title="Acquisition Group KPI Summary">
        <DataTable
          headers={['Acq Group', 'OT $', 'Bonus $', 'Combined', 'Risk']}
          rows={subgroupData.map((r, i) => [
            r.sg, fmt$(r.ot), fmt$(r.bonus),
            <strong key={i}>{fmt$(r.ot + r.bonus)}</strong>,
            riskBadge(r.ot + r.bonus, maxScore)
          ])}
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
    </div>
  );
}
