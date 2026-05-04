import React, { useState } from 'react';
import { useData } from './context/DataContext';
import { parseWorkbook } from './utils/parseWorkbook';
import { 
  LayoutDashboard, BarChart3, TrendingUp, MapPin, Globe, Users, Clock,
  DollarSign, ShieldCheck, Activity, Download, Settings, AlertCircle,
  Loader2, FileText, Filter, Database, X, ChevronDown
} from 'lucide-react';

// Tab imports
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
  { id: 'pay-cycle', name: 'Pay Cycle Mapping', icon: Settings, category: 'System & QA' },
  { id: 'data-quality', name: 'Data Quality', icon: Database, category: 'System & QA' },
  { id: 'reconciliation', name: 'QA / Reconciliation', icon: ShieldCheck, category: 'System & QA' },
];

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  'executive': ExecutiveDashboard,
  'kpi-period': KpiByPeriod,
  'facility-trends': FacilityTrends,
  'facility': FacilityDrilldown,
  'region': RegionDashboard,
  'acq-group': AcqGroupDashboard,
  'pay-period': PayPeriodDashboard,
  'ot': OtAnalysis,
  'bonus': BonusAnalysis,
  'hppd-ppd': HppdPpdAnalysis,
  'labor-pressure': LaborPressureRanking,
  'employee': EmployeeReview,
  'pay-cycle': PayCycleMapping,
  'data-quality': DataQuality,
  'reconciliation': Reconciliation,
};

export default function App() {
  const { data, setFromParseResult, resetData, updateFilters, filteredMetrics } = useData();
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasData = data.facilities.length > 0 || data.metrics.length > 0;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-upload of same file

    setLoading(true);
    setError(null);
    try {
      const result = await parseWorkbook(file);
      setFromParseResult(result);
      setActiveTab('data-quality');
    } catch (err: any) {
      setError(err.message || 'Failed to parse workbook');
    } finally {
      setLoading(false);
    }
  };

  const ActiveTab = TAB_COMPONENTS[activeTab] || ExecutiveDashboard;

  const activeFiltersCount = Object.values(data.filters).filter(Boolean).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="px-8 py-7 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity size={16} className="text-white" />
            </div>
            <span className="text-white text-lg font-black tracking-tight">Avir Analytics</span>
          </div>
          {hasData && (
            <div className="mt-3 px-3 py-2 bg-slate-800 rounded-xl">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Dataset</div>
              <div className="text-xs text-slate-300 font-medium truncate mt-0.5">{data.filename}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {data.facilities.length} facilities · {data.metrics.length} metric rows
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {['Executive', 'Drilldowns', 'Analytics', 'System & QA'].map(cat => (
            <div key={cat}>
              <div className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{cat}</div>
              {TABS.filter(t => t.category === cat).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all mb-0.5 text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={15} className="shrink-0" />
                  {tab.name}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <label className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
            loading ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
          }`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {loading ? 'Parsing...' : hasData ? 'Upload New File' : 'Upload Payroll'}
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} disabled={loading} />
          </label>
          {hasData && (
            <button
              onClick={resetData}
              className="w-full py-2 rounded-xl text-[10px] font-bold text-slate-600 hover:text-red-400 hover:bg-slate-800 transition uppercase tracking-widest"
            >
              Clear Dataset
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
              {TABS.find(t => t.id === activeTab)?.name}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {hasData ? 'Data Loaded' : 'Awaiting Upload'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-1.5">
                {data.filters.facility && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-bold">
                    {data.filters.facility}
                    <button onClick={() => updateFilters({ facility: null })}><X size={10} /></button>
                  </span>
                )}
                {data.filters.region && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold">
                    {data.filters.region}
                    <button onClick={() => updateFilters({ region: null })}><X size={10} /></button>
                  </span>
                )}
                {data.filters.payPeriod && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold">
                    {data.filters.payPeriod}
                    <button onClick={() => updateFilters({ payPeriod: null })}><X size={10} /></button>
                  </span>
                )}
                <button onClick={() => updateFilters({ facility: null, region: null, group: null, payPeriod: null })}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 ml-1">Clear All</button>
              </div>
            )}

            {/* Filter Button */}
            {hasData && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition ${
                  showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={13} />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
            )}
          </div>
        </header>

        {/* Filter Panel */}
        {showFilters && hasData && (
          <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 shadow-sm">
            {[
              { label: 'Facility', key: 'facility' as const, options: data.facilities.map(f => f.name) },
              { label: 'Region', key: 'region' as const, options: data.regions },
              { label: 'Acq Group', key: 'group' as const, options: data.groups },
              { label: 'Pay Period', key: 'payPeriod' as const, options: data.payPeriods },
            ].map(({ label, key, options }) => (
              <div key={key} className="relative">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
                <select
                  value={data.filters[key] || ''}
                  onChange={e => updateFilters({ [key]: e.target.value || null })}
                  className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                >
                  <option value="">All {label}s</option>
                  {options.slice(0, 200).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 bottom-2.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-black text-sm">Parse Error</div>
              <div className="text-xs mt-1 font-mono">{error}</div>
            </div>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Content */}
        <section className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <Loader2 size={48} className="text-blue-600 animate-spin" />
              <div className="text-center">
                <div className="text-xl font-black text-slate-800">Parsing Workbook</div>
                <div className="text-slate-500 mt-2 text-sm">Extracting facilities, metrics, and KPI dimensions…</div>
                <div className="text-xs text-orange-500 font-bold mt-2 uppercase tracking-widest">Do not close or refresh</div>
              </div>
            </div>
          ) : !hasData ? (
            <div className="h-full flex flex-col items-center justify-center gap-8 p-12 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center">
                <FileText size={44} className="text-slate-300" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">No Data Loaded</h3>
                <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
                  Upload your <strong>Payroll Analysis Updated.xlsx</strong> file using the button in the sidebar to populate all 15 analytical dashboards.
                </p>
              </div>
              <label className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm cursor-pointer hover:bg-blue-700 transition shadow-xl shadow-blue-500/20">
                <Download size={20} />
                Upload Payroll Excel
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <ActiveTab />
          )}
        </section>
      </main>
    </div>
  );
}
