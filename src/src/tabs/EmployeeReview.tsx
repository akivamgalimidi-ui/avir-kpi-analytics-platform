import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, StatCard, fmt$, fmtN } from '../components/shared';

export default function EmployeeReview() {
  const { data, filteredOT, filteredBonus } = useData();
  if (!data) return null;

  const employeeData = useMemo(() => {
    const map: Record<string, { ot: number; bonus: number; facility: string; pos: string; dept: string }> = {};
    
    filteredOT.forEach(r => {
      if (!map[r.employee]) map[r.employee] = { ot: 0, bonus: 0, facility: r.facility, pos: r.position, dept: r.department };
      map[r.employee].ot += r.otDollars;
    });

    filteredBonus.forEach(r => {
      if (!map[r.employee]) map[r.employee] = { ot: 0, bonus: 0, facility: r.facility, pos: r.position, dept: 'Other' };
      map[r.employee].bonus += r.bonusDollars;
    });

    return Object.entries(map)
      .map(([name, vals]) => ({ name, ...vals, total: vals.ot + vals.bonus }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);
  }, [filteredOT, filteredBonus]);

  return (
    <div className="space-y-6">
      <SectionCard title="Priority Employee Audit" subtitle="Top 50 labor cost drivers across OT and Bonuses">
        <DataTable
          headers={['Employee', 'Facility', 'Department', 'Position', 'OT $', 'Bonus $', 'Combined Total']}
          rows={employeeData.map(e => [
            e.name, e.facility, e.dept, e.pos, fmt$(e.ot), fmt$(e.bonus), fmt$(e.total)
          ])}
        />
      </SectionCard>
    </div>
  );
}
