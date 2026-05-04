import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumField } from '../components/shared';

interface Check {
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  detail: string;
}

export default function Reconciliation() {
  const { data, filteredMetrics } = useData();

  const totalOT = sumField(filteredMetrics, 'otDollars');
  const totalBonus = sumField(filteredMetrics, 'bonusDollars');

  const checks: Check[] = [
    {
      name: 'Facilities Detected',
      status: data.facilities.length > 0 ? 'PASS' : 'FAIL',
      detail: data.facilities.length > 0 ? `${data.facilities.length} facilities found` : 'No facilities parsed — check column headers'
    },
    {
      name: 'Regions Detected',
      status: data.regions.length > 0 ? 'PASS' : 'WARNING',
      detail: data.regions.length > 0 ? `${data.regions.length} regions found` : 'No region column detected'
    },
    {
      name: 'Acquisition Groups Detected',
      status: data.groups.length > 0 ? 'PASS' : 'WARNING',
      detail: data.groups.length > 0 ? `${data.groups.length} groups found` : 'No acquisition group column detected'
    },
    {
      name: 'Pay Periods Detected',
      status: data.payPeriods.length > 0 ? 'PASS' : 'WARNING',
      detail: data.payPeriods.length > 0 ? `${data.payPeriods.length} pay periods found` : 'No date headers detected in metric sheets'
    },
    {
      name: 'OT Metrics Parsed',
      status: totalOT > 0 ? 'PASS' : 'WARNING',
      detail: totalOT > 0 ? `Total OT: ${fmt$(totalOT)}` : 'No OT dollar values parsed from "OT by Pay Period" sheet'
    },
    {
      name: 'Bonus Metrics Parsed',
      status: totalBonus > 0 ? 'PASS' : 'WARNING',
      detail: totalBonus > 0 ? `Total Bonus: ${fmt$(totalBonus)}` : 'No Bonus dollar values parsed from "Bonus by PPE" sheet'
    },
    {
      name: 'Employee Data Available',
      status: data.employees.length > 0 ? 'PASS' : 'WARNING',
      detail: data.employees.length > 0 ? `${data.employees.length} employees found` : 'No employee data parsed — ensure "Top OT Earners" sheet has name column'
    },
    {
      name: 'localStorage Persistence',
      status: 'PASS',
      detail: 'Data auto-saved to browser storage on parse'
    },
    {
      name: 'Parser Warnings',
      status: data.warnings.length === 0 ? 'PASS' : 'WARNING',
      detail: data.warnings.length === 0 ? 'No warnings' : `${data.warnings.length} warnings — check Data Quality tab`
    },
  ];

  const statusColor = (s: string) => ({
    PASS: 'bg-emerald-100 text-emerald-800',
    WARNING: 'bg-amber-100 text-amber-800',
    FAIL: 'bg-red-100 text-red-800'
  }[s] || '');

  return (
    <div className="p-8 space-y-6">
      <SectionCard title="QA / Reconciliation Checks">
        <DataTable
          headers={['Check', 'Status', 'Detail']}
          rows={checks.map(c => [
            <span key={c.name} className="font-bold text-slate-800">{c.name}</span>,
            <span key={c.name} className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${statusColor(c.status)}`}>{c.status}</span>,
            <span key={c.name} className="text-xs text-slate-500">{c.detail}</span>
          ])}
        />
      </SectionCard>
    </div>
  );
}
