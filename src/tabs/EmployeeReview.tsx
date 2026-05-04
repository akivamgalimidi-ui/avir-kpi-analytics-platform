import React from 'react';
import { useData } from '../context/DataContext';
import { SectionCard, DataTable, fmt$, sumNum, groupBy, Badge } from '../components/shared';

export default function EmployeeReview() {
  const { data, filteredOT, filteredBonus } = useData();
  if (!data) return null;

  const otByEmp = groupBy(filteredOT, r => r.employee);
  const bonusByEmp = groupBy(filteredBonus, r => r.employee);

  const allEmps = new Set([...Object.keys(otByEmp), ...Object.keys(bonusByEmp)]);

  const empData = Array.from(allEmps)
    .map(emp => {
      const otRows = otByEmp[emp] || [];
      const bonusRows = bonusByEmp[emp] || [];
      const ot = sumNum(otRows, 'otDollars');
      const hrs = sumNum(otRows, 'otHours');
      const bonus = sumNum(bonusRows, 'bonusDollars');
      const combined = ot + bonus;
      const fac = otRows[0]?.facility || bonusRows[0]?.facility || '—';
      const pos = otRows[0]?.position || bonusRows[0]?.position || '—';
      const dept = otRows[0]?.department || '—';
      const flag = combined > 10000 ? 'High Priority' : combined > 5000 ? 'Moderate' : 'Normal';
      return { emp, fac, pos, dept, ot, hrs, bonus, combined, flag };
    })
    .filter(r => r.combined > 0)
    .sort((a, b) => b.combined - a.combined);

  return (
    <div className="p-6 space-y-6">
      <SectionCard title={`Employee Review — ${empData.length} Employees with Activity`}>
        <DataTable
          headers={['Employee', 'Facility', 'Dept', 'Position', 'OT $', 'OT Hrs', 'Bonus $', 'Combined $', 'Flag']}
          rows={empData.slice(0, 200).map(r => [
            r.emp, r.fac, r.dept, r.pos,
            r.ot > 0 ? <span className="text-red-700 font-bold">{fmt$(r.ot)}</span> : '—',
            r.hrs > 0 ? Math.round(r.hrs) : '—',
            r.bonus > 0 ? <span className="text-amber-700 font-bold">{fmt$(r.bonus)}</span> : '—',
            <strong key={r.emp}>{fmt$(r.combined)}</strong>,
            <Badge key={r.emp}
              label={r.flag}
              color={r.flag === 'High Priority' ? 'red' : r.flag === 'Moderate' ? 'amber' : 'emerald'}
            />
          ])}
        />
      </SectionCard>
    </div>
  );
}
