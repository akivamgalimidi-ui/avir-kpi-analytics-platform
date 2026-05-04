import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable } from '../components/shared';

function inferPayCycle(periods: string[]): string {
  if (periods.length < 2) return 'Unknown';
  // Sort periods and compute gaps
  const sorted = [...periods].sort();
  const first = sorted[0];
  // Try to detect biweekly vs weekly etc.
  if (sorted.length >= 2) {
    const d1 = new Date(sorted[0]);
    const d2 = new Date(sorted[1]);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 'Biweekly (Inferred)';
    const diff = Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 7) return 'Weekly';
    if (diff <= 14) return 'Biweekly';
    if (diff <= 16) return 'Biweekly';
    return 'Semi-Monthly';
  }
  return 'Biweekly (Inferred)';
}

export default function PayCycleMapping() {
  const { data } = useData();

  const facilityPeriods: Record<string, string[]> = {};
  for (const m of data.metrics) {
    if (!facilityPeriods[m.facility]) facilityPeriods[m.facility] = [];
    if (m.payPeriod && !facilityPeriods[m.facility].includes(m.payPeriod)) {
      facilityPeriods[m.facility].push(m.payPeriod);
    }
  }

  const rows = Object.entries(facilityPeriods)
    .map(([fac, periods]) => {
      const cycle = inferPayCycle(periods);
      const latest = periods.sort().at(-1) || '—';
      const prior = periods.sort().at(-2) || '—';
      const comparable = prior !== '—' ? '✅ Comparable' : '⚠️ No Prior';
      return [fac, String(periods.length), cycle, latest, prior, comparable];
    })
    .sort((a, b) => a[0].localeCompare(String(b[0])));

  return (
    <div className="p-8 space-y-6">
      <SectionCard title={`Pay Cycle Mapping — ${rows.length} Facilities`}>
        <DataTable
          headers={['Facility', 'Periods Detected', 'Inferred Cycle', 'Latest Period', 'Prior Period', 'Comparable Status']}
          rows={rows}
        />
      </SectionCard>
    </div>
  );
}
