import React from 'react';
import { ChevronUp, ChevronDown, Minus, ArrowRight, AlertCircle, Info } from 'lucide-react';

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export const fmt$ = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
export const fmtN = (v: number) => new Intl.NumberFormat('en-US').format(v);
export const fmt2 = (v: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
export const fmtPct = (v: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(v);

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'purple' | 'teal';
  loading?: boolean;
}

export function StatCard({ label, value, sub, trend, color = 'blue', loading }: StatCardProps) {
  const colors = {
    blue: 'from-blue-600 to-blue-700 text-blue-600 bg-blue-50',
    emerald: 'from-emerald-600 to-emerald-700 text-emerald-600 bg-emerald-50',
    amber: 'from-amber-600 to-amber-700 text-amber-600 bg-amber-50',
    red: 'from-red-600 to-red-700 text-red-600 bg-red-50',
    indigo: 'from-indigo-600 to-indigo-700 text-indigo-600 bg-indigo-50',
    purple: 'from-purple-600 to-purple-700 text-purple-600 bg-purple-50',
    teal: 'from-teal-600 to-teal-700 text-teal-600 bg-teal-50',
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${trend > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {trend > 0 ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {Math.abs(trend * 100).toFixed(1)}%
          </div>
        )}
      </div>
      <div className={`text-3xl font-black text-slate-800 tracking-tighter mb-1`}>
        {value}
      </div>
      {sub && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{sub}</div>}
    </div>
  );
}

// ─── Data Table ──────────────────────────────────────────────────────────────

interface DataTableProps {
  headers: string[];
  rows: any[][];
  onRowClick?: (row: any[]) => void;
  emptyMessage?: string;
}

export function DataTable({ headers, rows, onRowClick, emptyMessage = 'No data found.' }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50/50">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 first:rounded-tl-2xl last:rounded-tr-2xl">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr 
              key={ri} 
              onClick={() => onRowClick?.(row)}
              className={`group hover:bg-slate-50/80 transition-colors cursor-pointer`}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-6 py-4 text-xs font-bold text-slate-700 border-b border-slate-50 group-last:border-none">
                  {typeof cell === 'number' ? (
                    cell > 1000 ? fmtN(cell) : cell % 1 !== 0 ? fmt2(cell) : cell
                  ) : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionCard({ title, subtitle, children, action }: SectionCardProps) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

// ─── Risk Badge ──────────────────────────────────────────────────────────────

export function RiskBadge({ score }: { score: number }) {
  const level = score > 80 ? 'CRITICAL' : score > 50 ? 'HIGH' : score > 20 ? 'MEDIUM' : 'LOW';
  const colors = {
    CRITICAL: 'bg-red-600 text-white shadow-red-200',
    HIGH: 'bg-red-50 text-red-600 border-red-100',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
    LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[level]} shadow-sm`}>
      {level} ({Math.round(score)})
    </div>
  );
}

// ─── Trend Indicator ─────────────────────────────────────────────────────────

export function TrendIndicator({ value, label }: { value: number; label?: string }) {
  const isUp = value > 0;
  const isZero = value === 0;
  
  if (isZero) return <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold"><Minus size={12}/> No Change</div>;

  return (
    <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${isUp ? 'text-red-600' : 'text-emerald-600'}`}>
      {isUp ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
      {fmt$(Math.abs(value))} {label}
    </div>
  );
}
