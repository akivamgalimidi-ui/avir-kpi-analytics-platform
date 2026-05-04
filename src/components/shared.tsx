// Shared helpers used across all tab components
import type { ParsedMetric } from '../utils/parseWorkbook';

export const fmt$ = (n: number) =>
  n === 0 ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const fmt2 = (n: number) =>
  n === 0 ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtN = (n: number) =>
  n === 0 ? '—' : n.toLocaleString('en-US');

export function sumField<K extends keyof ParsedMetric>(rows: ParsedMetric[], field: K): number {
  return rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent = 'bg-blue-50 text-blue-700' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
      <div className={`text-[9px] font-black uppercase tracking-widest mb-3 inline-flex px-2 py-0.5 rounded-lg ${accent}`}>{label}</div>
      <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 font-bold mt-1">{sub}</div>}
    </div>
  );
}

interface EmptyStateProps { message: string }
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
      <div className="text-4xl mb-3">📊</div>
      <div className="text-sm font-bold">{message}</div>
    </div>
  );
}

interface TableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  onRowClick?: (idx: number) => void;
}
export function DataTable({ headers, rows, onRowClick }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-10 text-slate-400 text-xs font-bold">No data to display</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} onClick={() => onRowClick?.(i)} className={`hover:bg-slate-50/80 transition ${onRowClick ? 'cursor-pointer' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3 text-slate-700 font-medium">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 font-black text-slate-800 uppercase tracking-tight text-xs">{title}</div>
      {children}
    </div>
  );
}
