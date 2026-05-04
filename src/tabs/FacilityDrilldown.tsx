import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmt2, sumField, groupBy, EmptyState } from '../components/shared';

export default function FacilityDrilldown() {
  const { data, filteredMetrics, updateFilters } = useData();
  const facility = data.filters.facility;

  if (!facility) {
    const facilities = data.facilities.slice(0, 20);
    return (
      <div className="p-8 space-y-4">
        <div className="text-sm font-bold text-slate-500 mb-4">Select a facility to drill down. Showing first 20 — use the Filters bar or click from Facility Trends.</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {facilities.map(f => (
            <button key={f.name} onClick={() => updateFilters({ facility: f.name })}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:shadow-md transition group">
              <div className="text-xs font-black text-slate-800 group-hover:text-blue-700">{f.name}</div>
              <div className="text-[10px] text-slate-400 mt-1">{f.region || '—'}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const facInfo = data.facilities.find(f => f.name === facility);
  const byPeriod = groupBy(filteredMetrics, m => m.payPeriod);

  const totalOT = sumField(filteredMetrics, 'otDollars');
  const totalBonus = sumField(filteredMetrics, 'bonusDollars');
  const hppdRows = filteredMetrics.filter(r => r.hppd > 0);
  const avgHppd = hppdRows.length ? sumField(hppdRows, 'hppd') / hppdRows.length : 0;
  const ppdRows = filteredMetrics.filter(r => r.ppdDollars > 0);
  const avgPpd = ppdRows.length ? sumField(ppdRows, 'ppdDollars') / ppdRows.length : 0;

  const periodRows = Object.entries(byPeriod).map(([period, rows]) => [
    period, fmt$(sumField(rows, 'otDollars')), fmt$(sumField(rows, 'bonusDollars')),
    fmt2(rows.filter(r => r.hppd > 0).reduce((s, r, _, a) => s + r.hppd / a.length, 0)),
    fmt$(rows.filter(r => r.ppdDollars > 0).reduce((s, r, _, a) => s + r.ppdDollars / a.length, 0))
  ]);

  const facilityEmployees = data.employees.filter(e => e.facility === facility || !e.facility);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">{facility}</h2>
          <div className="text-sm text-slate-500 mt-1">
            Region: <strong>{facInfo?.region || '—'}</strong> · Group: <strong>{facInfo?.group || '—'}</strong>
          </div>
        </div>
        <button onClick={() => updateFilters({ facility: null })} className="text-xs font-bold text-blue-600 hover:underline">← All Facilities</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total OT $" value={fmt$(totalOT)} accent="bg-red-50 text-red-700" />
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Avg HPPD" value={avgHppd ? avgHppd.toFixed(2) : '—'} accent="bg-blue-50 text-blue-700" />
        <StatCard label="Avg PPD $" value={fmt$(avgPpd)} accent="bg-emerald-50 text-emerald-700" />
      </div>

      <SectionCard title="Trend by Pay Period">
        {filteredMetrics.length === 0
          ? <EmptyState message="No metrics for this facility" />
          : <DataTable headers={['Period', 'OT $', 'Bonus $', 'HPPD', 'PPD $']} rows={periodRows} />}
      </SectionCard>

      {facilityEmployees.length > 0 && (
        <SectionCard title="Employees at this Facility">
          <DataTable
            headers={['Employee', 'OT $', 'Bonus $', 'Period']}
            rows={facilityEmployees.slice(0, 50).map(e => [e.name, fmt$(e.otDollars), fmt$(e.bonusDollars), e.payPeriod || '—'])}
          />
        </SectionCard>
      )}
    </div>
  );
}
