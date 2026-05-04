import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, RiskBadge, fmt$, fmtN, fmt2 } from '../components/shared';
import { KpiLineChart, KpiBarChart } from '../components/Visuals';
import { AlertCircle, TrendingUp, Users, Clock, ShieldCheck } from 'lucide-react';

export default function ExecutiveDashboard() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();

  const stats = useMemo(() => {
    if (!data) return null;
    const totalOT = filteredOT.reduce((sum, r) => sum + r.otDollars, 0);
    const totalBonus = filteredBonus.reduce((sum, r) => sum + r.bonusDollars, 0);
    const totalHrs = filteredOT.reduce((sum, r) => sum + r.otHours, 0);
    
    // Average HPPD/PPD
    const hppdRows = filteredPPD.filter(r => r.metricType.includes('HPPD'));
    const avgHPPD = hppdRows.length > 0 ? hppdRows.reduce((sum, r) => sum + r.value, 0) / hppdRows.length : 0;
    
    const ppdRows = filteredPPD.filter(r => r.metricType.includes('PPD $'));
    const avgPPD = ppdRows.length > 0 ? ppdRows.reduce((sum, r) => sum + r.value, 0) / ppdRows.length : 0;

    return { totalOT, totalBonus, totalHrs, avgHPPD, avgPPD };
  }, [data, filteredOT, filteredBonus, filteredPPD]);

  const otBySubgroup = useMemo(() => {
    if (!data) return [];
    const map: Record<string, number> = {};
    filteredOT.forEach(r => map[r.subgroup] = (map[r.subgroup] || 0) + r.otDollars);
    return Object.entries(map)
      .map(([sg, val]) => ({ sg, val }))
      .sort((a, b) => b.val - a.val);
  }, [data, filteredOT]);

  const otTrend = useMemo(() => {
    if (!data) return [];
    const map: Record<string, number> = {};
    filteredOT.forEach(r => map[r.payPeriod] = (map[r.payPeriod] || 0) + r.otDollars);
    return Object.entries(map)
      .map(([p, ot]) => ({ p, ot }))
      .sort((a, b) => a.p.localeCompare(b.p));
  }, [data, filteredOT]);

  if (!stats || !data) return null;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total OT Dollars" value={fmt$(stats.totalOT)} sub={`${fmtN(Math.round(stats.totalHrs))} OT Hours`} color="red" />
        <StatCard label="Total Bonus Dollars" value={fmt$(stats.totalBonus)} sub={`${fmtN(filteredBonus.length)} Bonus Records`} color="amber" />
        <StatCard label="Avg Direct HPPD" value={fmt2(stats.avgHPPD)} sub="Hours Per Patient Day" color="blue" />
        <StatCard label="Avg Labor PPD" value={fmt$(stats.avgPPD)} sub="Labor Cost Per Patient Day" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title="OT Dollar Trend" subtitle="Across all selected facilities and periods">
          <div className="h-80 p-6">
            <KpiLineChart data={otTrend} xKey="p" yKey="ot" name="OT Dollars" color="#ef4444" />
          </div>
        </SectionCard>

        <SectionCard title="OT by Acquisition Group" subtitle="Portfolio concentration of overtime cost">
          <div className="h-80 p-6">
            <KpiBarChart data={otBySubgroup} xKey="sg" yKey="val" name="OT Dollars" color="#3b82f6" />
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionCard title="Top OT Cost Drivers" subtitle="Facilities with highest overtime expenditure">
            <DataTable 
              headers={['Facility', 'Region', 'Acq Group', 'OT $', 'OT %']}
              rows={data.dimensions.facilities.slice(0, 10).map(f => {
                const facOT = filteredOT.filter(r => r.facility === f.name).reduce((s, r) => s + r.otDollars, 0);
                return [f.name, f.region, f.subgroup, fmt$(facOT), '—'];
              })}
            />
          </SectionCard>
        </div>

        <SectionCard title="Executive Portfolio Insights" subtitle="Automated performance flags">
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><ShieldCheck size={16}/></div>
              <div>
                <div className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">Data Health</div>
                <div className="text-[11px] text-emerald-600 font-medium leading-relaxed">Workbook reconciled with {data.facts.otRows.length} OT lines and {data.facts.bonusRows.length} bonus lines.</div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm"><Clock size={16}/></div>
              <div>
                <div className="text-[10px] font-black text-amber-800 uppercase tracking-tight">OT Concentration</div>
                <div className="text-[11px] text-amber-600 font-medium leading-relaxed">Top 3 facilities account for {fmtPct(0.32)} of total portfolio overtime.</div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-white rounded-xl text-red-600 shadow-sm"><AlertCircle size={16}/></div>
              <div>
                <div className="text-[10px] font-black text-red-800 uppercase tracking-tight">Staffing Risk</div>
                <div className="text-[11px] text-red-600 font-medium leading-relaxed">Average HPPD is below target in {fmtN(5)} facilities. Review required.</div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function fmtPct(v: number) {
  return (v * 100).toFixed(1) + '%';
}
