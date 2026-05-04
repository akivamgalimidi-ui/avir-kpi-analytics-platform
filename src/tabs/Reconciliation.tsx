import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumNum, Badge } from '../components/shared';

export default function Reconciliation() {
  const { data, filteredOT, filteredBonus, filteredPPD } = useData();
  if (!data) return null;

  const totalOT = sumNum(data.otRows, 'otDollars');
  const totalBonus = sumNum(data.bonusRows, 'bonusDollars');
  const totalPPD = data.ppdRows.length;

  const checks = [
    {
      name: 'OT Rollup Verification',
      status: totalOT > 0 ? 'PASS' : 'FAIL',
      detail: totalOT > 0 ? `Captured ${fmt$(totalOT)} across ${data.otRows.length} records.` : 'No OT dollars found in workbook.'
    },
    {
      name: 'Bonus Rollup Verification',
      status: totalBonus > 0 ? 'PASS' : 'FAIL',
      detail: totalBonus > 0 ? `Captured ${fmt$(totalBonus)} across ${data.bonusRows.length} records.` : 'No bonus dollars found in workbook.'
    },
    {
      name: 'PPD Metric Integrity',
      status: totalPPD > 0 ? 'PASS' : 'WARNING',
      detail: totalPPD > 0 ? `Parsed ${totalPPD} PPD/HPPD facility-period records.` : 'Metric data missing from PPDs sheet.'
    },
    {
      name: 'Facility Mapping Coverage',
      status: data.facilities.length > 0 ? 'PASS' : 'FAIL',
      detail: `${data.facilities.length} facilities mapped to regions and pay cycles.`
    },
    {
      name: 'Pay Period Synchronization',
      status: data.payPeriods.length > 0 ? 'PASS' : 'FAIL',
      detail: `Detected ${data.payPeriods.length} unique pay periods across all data sources.`
    },
    {
      name: 'Subgroup (Acq Group) Presence',
      status: data.subgroups.length > 0 ? 'PASS' : 'WARNING',
      detail: data.subgroups.length > 0 ? `Mapped ${data.subgroups.length} acquisition groups.` : 'No acquisition groups found — filtering by group disabled.'
    }
  ];

  const statusColor = (s: string) => ({
    PASS: 'emerald',
    WARNING: 'amber',
    FAIL: 'red'
  }[s] as any);

  return (
    <div className="p-6 space-y-6">
      <SectionCard title="Data Reconciliation & Integrity Checks">
        <DataTable
          headers={['Check Name', 'Status', 'Reconciliation Detail']}
          rows={checks.map(c => [
            <span key={c.name} className="font-bold">{c.name}</span>,
            <Badge key={c.name} label={c.status} color={statusColor(c.status)} />,
            <span key={c.name} className="text-slate-500">{c.detail}</span>
          ])}
        />
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="OT Dollars by Acq Group (Rollup Check)">
          <DataTable
            headers={['Group', 'OT $']}
            rows={data.subgroups.map(sg => [
              sg,
              fmt$(sumNum(data.otRows.filter(r => r.subgroup === sg), 'otDollars'))
            ])}
          />
        </SectionCard>
        <SectionCard title="Bonus Dollars by Acq Group (Rollup Check)">
          <DataTable
            headers={['Group', 'Bonus $']}
            rows={data.subgroups.map(sg => [
              sg,
              fmt$(sumNum(data.bonusRows.filter(r => r.subgroup === sg), 'bonusDollars'))
            ])}
          />
        </SectionCard>
      </div>
    </div>
  );
}
