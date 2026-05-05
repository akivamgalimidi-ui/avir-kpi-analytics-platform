import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmt$ = (n: number) =>
  n === 0 ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtN = (n: number) => new Intl.NumberFormat('en-US').format(n);

export const fmt2 = (n: number) =>
  n === 0 ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export function sumNum<T>(arr: T[], key: keyof T): number {
  return arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

export function groupBy<T>(arr: T[], fn: (r: T) => string): Record<string, T[]> {
  return arr.reduce((acc, r) => {
    const k = fn(r) || 'Unknown';
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'blue' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition ${colors[color] || colors.blue}`}>
      <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">{label}</div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      {sub && <div className="text-[10px] font-medium opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{title}</span>
          {subtitle && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable({ headers, rows, onRowClick }: {
  headers: string[];
  rows: React.ReactNode[][];
  onRowClick?: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-10 text-slate-400 font-bold">No data</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} onClick={() => onRowClick?.(i)}
              className={`hover:bg-slate-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-700 font-medium whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color }: { label: string; color: 'red' | 'amber' | 'emerald' | 'blue' | 'slate' }) {
  const map = { red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', emerald: 'bg-emerald-100 text-emerald-800', blue: 'bg-blue-100 text-blue-800', slate: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${map[color]}`}>{label}</span>;
}

// ── Risk ──────────────────────────────────────────────────────────────────────
export function riskBadge(score: number, max: number): React.ReactNode {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return <Badge label="Critical" color="red" />;
  if (pct >= 0.5) return <Badge label="High" color="amber" />;
  if (pct >= 0.25) return <Badge label="Medium" color="blue" />;
  return <Badge label="Low" color="emerald" />;
}

// ── TrendIndicator ────────────────────────────────────────────────────────────
export function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-slate-400 text-[10px]">→ No change</span>;
  const up = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-black ${up ? 'text-red-600' : 'text-emerald-600'}`}>
      {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {fmt$(Math.abs(value))}
    </span>
  );
}
