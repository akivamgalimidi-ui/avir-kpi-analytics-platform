import React, { useState } from 'react';
import { useData } from './context/DataContext';
import { parseWorkbook } from './utils/parseWorkbook';
import { buildExcelExport, downloadBlob } from './utils/exportWorkbook';
import {
  LayoutDashboard, BarChart3, TrendingUp, MapPin, Globe, Users, Clock,
  DollarSign, ShieldCheck, Activity, Download, Settings, AlertCircle,
  Loader2, FileText, Filter, X, ChevronDown, FileDown
} from 'lucide-react';

import ExecutiveDashboard from './tabs/ExecutiveDashboard';
import KpiByPeriod from './tabs/KpiByPeriod';
import FacilityTrends from './tabs/FacilityTrends';
import FacilityDrilldown from './tabs/FacilityDrilldown';
import RegionDashboard from './tabs/RegionDashboard';
import AcqGroupDashboard from './tabs/AcqGroupDashboard';
import PayPeriodDashboard from './tabs/PayPeriodDashboard';
import OtAnalysis from './tabs/OtAnalysis';
import BonusAnalysis from './tabs/BonusAnalysis';
import HppdPpdAnalysis from './tabs/HppdPpdAnalysis';
import LaborPressureRanking from './tabs/LaborPressureRanking';
import EmployeeReview from './tabs/EmployeeReview';
import PayCycleMapping from './tabs/PayCycleMapping';
import DataQuality from './tabs/DataQuality';
import Reconciliation from './tabs/Reconciliation';
import ExportCenter from './tabs/ExportCenter';
import type { Filters } from './context/DataContext';

const TABS = [
  { id: 'executive', name: 'Executive Portfolio', icon: LayoutDashboard, category: 'Executive' },
  { id: 'kpi-period', name: 'KPI by Period', icon: BarChart3, category: 'Executive' },
  { id: 'facility-trends', name: 'Facility Trends', icon: TrendingUp, category: 'Drilldowns' },
  { id: 'facility', name: 'Facility Drilldown', icon: MapPin, category: 'Drilldowns' },
  { id: 'region', name: 'Region Dashboard', icon: Globe, category: 'Drilldowns' },
  { id: 'acq-group', name: 'Acq Group Dashboard', icon: Users, category: 'Drilldowns' },
  { id: 'pay-period', name: 'Pay Period Dashboard', icon: Clock, category: 'Drilldowns' },
  { id: 'ot', name: 'OT Analysis', icon: Clock, category: 'Analytics' },
  { id: 'bonus', name: 'Bonus Analysis', icon: DollarSign, category: 'Analytics' },
  { id: 'hppd-ppd', name: 'HPPD / PPD Analysis', icon: Activity, category: 'Analytics' },
  { id: 'labor-pressure', name: 'Labor Pressure Ranking', icon: ShieldCheck, category: 'Analytics' },
  { id: 'employee', name: 'Employee Review', icon: Users, category: 'Analytics' },
  { id: 'export-center', name: 'Export Center', icon: FileDown, category: 'System & QA' },
  { id: 'pay-cycle', name: 'Pay Cycle Mapping', icon: Settings, category: 'System & QA' },
  { id: 'data-quality', name: 'Data Quality', icon: ShieldCheck, category: 'System & QA' },
  { id: 'reconciliation', name: 'QA / Reconciliation', icon: ShieldCheck, category: 'System & QA' },
];

const TAB_MAP: Record<string, React.ComponentType> = {
  executive: ExecutiveDashboard, 'kpi-period': KpiByPeriod,
  'facility-trends': FacilityTrends, facility: FacilityDrilldown,
  region: RegionDashboard, 'acq-group': AcqGroupDashboard,
  'pay-period': PayPeriodDashboard, ot: OtAnalysis,
  bonus: BonusAnalysis, 'hppd-ppd': HppdPpdAnalysis,
  'labor-pressure': LaborPressureRanking, employee: EmployeeReview,
  'export-center': ExportCenter,
  'pay-cycle': PayCycleMapping, 'data-quality': DataQuality,
  reconciliation: Reconciliation,
};

// Per-tab ErrorBoundary
class TabErrorBoundary extends React.Component<{ children: React.ReactNode; tabName: string }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e.message }; }
  render() {
    if (this.state.hasError) return (
      <div className="m-6 p-6 bg-red-50 border border-red-200 rounded-2xl">
        <h3 className="font-black text-red-700 mb-2">⚠️ {this.props.tabName} Error</h3>
        <p className="text-red-600 text-sm font-mono">{this.state.error}</p>
        <button className="mt-3 text-xs font-bold text-red-500 underline" onClick={() => this.setState({ hasError: false, error: '' })}>Try again</button>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  const { data, filters, setFromParseResult, resetData, updateFilter, clearFilters, filteredOT, filteredBonus, filteredPPD } = useData();
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasData = !!data;
  const ActiveTab = TAB_MAP[activeTab] || ExecutiveDashboard;
  const activeTabName = TABS.find(t => t.id === activeTab)?.name || 'Dashboard';
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);
    setError(null);
    try {
      const result = await parseWorkbook(file);
      console.log('Parsed:', result.facilities.length, 'facilities,', result.otRows.length, 'OT rows,', result.bonusRows.length, 'bonus rows');
      setFromParseResult(result);
      setActiveTab('data-quality');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!data) return;
    const blob = buildExcelExport(data, filteredOT, filteredBonus, filteredPPD);
    downloadBlob(blob, `Avir-Analytics-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const FILTER_DEFS = !data ? [] : [
    { key: 'subgroup' as keyof Filters, label: 'Acq Group', options: data.subgroups },
    { key: 'facility' as keyof Filters, label: 'Facility', options: data.facilities.map(f => f.name) },
    { key: 'payCycle' as keyof Filters, label: 'Pay Cycle', options: [...new Set(data.facilities.map(f => f.payCycle).filter(Boolean))] },
    { key: 'payPeriod' as keyof Filters, label: 'Pay Period', options: data.payPeriods },
    { key: 'department' as keyof Filters, label: 'Department', options: data.departments.slice(0, 200) },
    { key: 'position' as keyof Filters, label: 'Position', options: data.positions.slice(0, 200) },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white text-sm font-black tracking-tight">AVIR ANALYTICS</div>
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">KPI Platform</div>
            </div>
          </div>
          {hasData && (
            <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
              <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">✓ Dataset Active</div>
              <div className="text-[11px] text-slate-300 font-medium truncate">{data.filename}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{data.facilities.length} fac · {data.otRows.length} OT · {data.bonusRows.length} bonus</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {['Executive', 'Drilldowns', 'Analytics', 'System & QA'].map(cat => (
            <div key={cat}>
              <div className="px-2 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{cat}</div>
              {TABS.filter(t => t.category === cat).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all mb-0.5 text-left ${
                    activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}>
                  <tab.icon size={13} className="shrink-0" />{tab.name}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          {hasData && (
            <button onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-700 hover:bg-emerald-600 text-white transition">
              <FileDown size={13} /> Export Excel
            </button>
          )}
          <label className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all ${
            loading ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
          }`}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {loading ? 'Parsing…' : hasData ? 'Upload New' : 'Upload Payroll'}
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} disabled={loading} />
          </label>
          {hasData && (
            <button onClick={resetData}
              className="w-full py-1.5 rounded-xl text-[9px] font-bold text-slate-600 hover:text-red-400 hover:bg-slate-800 transition uppercase tracking-widest">
              Clear Dataset
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-13 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">{activeTabName}</h2>
            {hasData && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Data</span></div>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Active filter chips */}
            {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[9px] font-bold">
                {v}<button onClick={() => updateFilter(k as keyof Filters, null)}><X size={9} /></button>
              </span>
            ))}
            {activeFilterCount > 0 && <button onClick={clearFilters} className="text-[9px] font-bold text-slate-400 hover:text-red-500">Clear all</button>}
            {hasData && (
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${
                  showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                <Filter size={11} /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            )}
          </div>
        </header>

        {/* Filter panel */}
        {showFilters && hasData && (
          <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-end gap-3 shadow-sm flex-wrap">
            {FILTER_DEFS.map(({ key, label, options }) => (
              <div key={key} className="relative">
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</label>
                <select value={filters[key] || ''} onChange={e => updateFilter(key, e.target.value || null)}
                  className="pl-2.5 pr-7 py-1.5 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] appearance-none">
                  <option value="">All</option>
                  {options.slice(0, 300).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-2 bottom-2.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1 font-mono text-xs">{error}</span>
            <button onClick={() => setError(null)}><X size={13} /></button>
          </div>
        )}

        <section className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-5">
              <Loader2 size={44} className="text-blue-600 animate-spin" />
              <div className="text-center">
                <div className="text-lg font-black text-slate-800">Parsing Workbook</div>
                <div className="text-slate-500 mt-1 text-sm">Extracting OT, bonus, HPPD/PPD…</div>
                <div className="text-[10px] text-orange-500 font-bold mt-2 uppercase tracking-widest animate-pulse">Do not close or refresh</div>
              </div>
            </div>
          ) : !hasData ? (
            <div className="h-full flex flex-col items-center justify-center gap-8 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[28px] flex items-center justify-center">
                <FileText size={40} className="text-slate-300" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">No Dataset Loaded</h3>
                <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
                  Upload <strong>Payroll Analysis Updated ltc.xlsx</strong> to populate all dashboards with real data.
                </p>
              </div>
              <label className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm cursor-pointer hover:bg-blue-700 transition shadow-xl shadow-blue-500/20">
                <Download size={18} /> Upload Payroll Excel
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <TabErrorBoundary tabName={activeTabName}>
              <ActiveTab />
            </TabErrorBoundary>
          )}
        </section>
      </main>
    </div>
  );
}
