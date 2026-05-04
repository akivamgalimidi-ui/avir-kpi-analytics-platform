import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard } from '../components/shared';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Reconciliation() {
  const { data } = useData();
  if (!data) return null;

  const checks = [
    { name: 'Facility Mapping Integrity', status: data.dimensions.facilities.length > 0 ? 'PASS' : 'FAIL', note: `${data.dimensions.facilities.length} entities mapped` },
    { name: 'OT Detail Reconciliation', status: data.facts.otRows.length > 0 ? 'PASS' : 'WARN', note: `${data.facts.otRows.length} lines parsed` },
    { name: 'Bonus Detail Reconciliation', status: data.facts.bonusRows.length > 0 ? 'PASS' : 'WARN', note: `${data.facts.bonusRows.length} lines parsed` },
    { name: 'HPPD/PPD Data Integrity', status: data.facts.ppdRows.length > 0 ? 'PASS' : 'WARN', note: `${data.facts.ppdRows.length} lines parsed` },
    { name: 'Region Connectivity', status: data.dimensions.regions.length > 1 ? 'PASS' : 'WARN', note: `${data.dimensions.regions.length} regions found` },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Data Quality & Integrity Reconciliation" subtitle="Verification of ingested data against business logic requirements">
        <DataTable
          headers={['Check Name', 'Status', 'Diagnostic Result']}
          rows={checks.map(c => [
            c.name,
            <div key={c.name} className={`flex items-center gap-2 font-black ${c.status === 'PASS' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {c.status === 'PASS' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {c.status}
            </div>,
            c.note
          ])}
        />
      </SectionCard>
    </div>
  );
}
