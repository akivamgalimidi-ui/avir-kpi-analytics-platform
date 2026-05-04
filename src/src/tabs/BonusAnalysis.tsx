import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { StatCard, SectionCard, DataTable, fmt$, fmtN } from '../components/shared';

export default function BonusAnalysis() {
  const { data, filteredBonus } = useData();

  const totalBonus = filteredBonus.reduce((sum, r) => sum + r.bonusDollars, 0);

  const facBonus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBonus.forEach(r => map[r.facility] = (map[r.facility] || 0) + r.bonusDollars);
    return Object.entries(map)
      .map(([f, val]) => ({ f, val }))
      .sort((a, b) => b.val - a.val);
  }, [filteredBonus]);

  const typeBonus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBonus.forEach(r => map[r.bonusType] = (map[r.bonusType] || 0) + r.bonusDollars);
    return Object.entries(map)
      .map(([t, val]) => ([t, fmt$(val)]))
      .sort((a, b) => parseFloat(b[1].replace(/[^0-9.-]+/g,"")) - parseFloat(a[1].replace(/[^0-9.-]+/g,"")));
  }, [filteredBonus]);

  const periodBonus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBonus.forEach(r => map[r.payPeriod] = (map[r.payPeriod] || 0) + r.bonusDollars);
    return Object.entries(map)
      .map(([p, val]) => ({ p, val }))
      .sort((a, b) => a.p.localeCompare(b.p));
  }, [filteredBonus]);

  const sgBonus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBonus.forEach(r => map[r.subgroup] = (map[r.subgroup] || 0) + r.bonusDollars);
    return Object.entries(map)
      .map(([sg, val]) => ({ sg, val }))
      .sort((a, b) => b.val - a.val);
  }, [filteredBonus]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bonus $" value={fmt$(totalBonus)} color="amber" />
        <StatCard label="Facilities w/ Bonus" value={fmtN(facBonus.length)} color="orange" />
        <StatCard label="Bonus Types" value={fmtN(typeBonus.length)} color="purple" />
        <StatCard label="Bonus Records" value={fmtN(filteredBonus.length)} color="indigo" />
      </div>

      <SectionCard title="Bonus by Pay Period">
        <DataTable
          headers={['Pay Period', 'Bonus $']}
          rows={periodBonus.map(p => [p.p, fmt$(p.val)])}
        />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Bonus by Type">
          <DataTable
            headers={['Bonus Type', 'Total Dollars']}
            rows={typeBonus}
          />
        </SectionCard>
        <SectionCard title="Bonus by Facility (Top 15)">
          <DataTable
            headers={['Facility', 'Bonus Dollars']}
            rows={facBonus.slice(0, 15).map(f => [f.f, fmt$(f.val)])}
          />
        </SectionCard>
      </div>
    </div>
  );
}
