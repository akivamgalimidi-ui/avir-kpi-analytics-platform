import React, { useState } from 'react';
import { 
  LayoutDashboard, BarChart3, Clock, MapPin, Globe, 
  Users, DollarSign, Activity, Settings, ShieldCheck, 
  FileDown, Upload, Filter, X, ChevronRight, Menu, TrendingUp
} from 'lucide-react';
import { DataProvider, useData } from './context/DataContext';
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
import PageShell from './components/common/PageShell';
import DiagnosticPanel from './components/common/DiagnosticPanel';
import { parseWorkbook } from './utils/parseWorkbook';

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
  'pay-cycle': PayCycleMapping, 'data-quality': DataQuality,
  reconciliation: Reconciliation,
};

function AppContent() {
  const { data, filters, setFilters, setFromParseResult, resetFilters } = useData();
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasData = !!data;
  const ActiveTabComp = TAB_MAP[activeTab] || ExecutiveDashboard;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseWorkbook(file);
      setFromParseResult(result);
      setActiveTab('data-quality');
    } catch (err: any) {
      setError(err.message || 'Parse failed');
    } finally { setLoading(false); }
  };

  const clearFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
  };

  if (!hasData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />

        <div className="max-w-xl w-full z-10">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-12 rounded-[48px] text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/20 transform group-hover:rotate-6 transition-transform duration-500">
              <Upload className="text-white" size={40} />
            </div>

            <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase leading-none">
              Avir <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Analytics</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
              Precision KPI labor platform for nursing homes.<br />
              Upload your Excel workbook to begin.
            </p>

            <label className="block">
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleUpload} disabled={loading} />
              <div className="w-full py-5 bg-white text-slate-950 rounded-2xl text-sm font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50 transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                {loading ? 'Analyzing Workbook...' : 'Choose Excel File'}
              </div>
            </label>

            {error && (
              <div className="mt-8 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> {error}
              </div>
            )}
            
            <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-Facility Support</div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CFO Reporting Ready</div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            Proprietary LTC Labor Analytics Engine
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-white flex flex-col h-full border-r border-slate-800 shadow-2xl z-50">
        <div className="p-8 pb-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp size={16} />
          </div>
          <span className="text-sm font-black uppercase tracking-tighter">Avir <span className="text-slate-500">KPI</span></span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          {['Executive', 'Drilldowns', 'Analytics', 'System & QA'].map(cat => (
            <div key={cat} className="space-y-1">
              <div className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{cat}</div>
              {TABS.filter(t => t.category === cat).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-100' : 'text-slate-600'} />
                  {tab.name}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-900">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
              Status <span>Live</span>
            </div>
            <div className="text-[11px] font-bold text-slate-200 truncate">{data.filename}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              New Upload
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
        {/* Top Filter Bar */}
        <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pr-8">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-100 shrink-0">
              <Filter size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Global Filters</span>
            </div>

            {/* Subgroup / Acq Group */}
            <select 
              value={filters.subgroup}
              onChange={e => setFilters(prev => ({ ...prev, subgroup: e.target.value, region: '', facility: '' }))}
              className="bg-slate-100 border-none text-[11px] font-black uppercase tracking-tight rounded-xl px-4 py-2 hover:bg-slate-200 transition-all cursor-pointer focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Acq Groups</option>
              {data.dimensions.subgroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>

            {/* Region */}
            <select 
              value={filters.region}
              onChange={e => setFilters(prev => ({ ...prev, region: e.target.value, facility: '' }))}
              className="bg-slate-100 border-none text-[11px] font-black uppercase tracking-tight rounded-xl px-4 py-2 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <option value="">All Regions</option>
              {data.dimensions.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Facility */}
            <select 
              value={filters.facility}
              onChange={e => setFilters(prev => ({ ...prev, facility: e.target.value }))}
              className="bg-slate-100 border-none text-[11px] font-black uppercase tracking-tight rounded-xl px-4 py-2 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <option value="">All Facilities</option>
              {data.dimensions.facilities
                .filter(f => (!filters.subgroup || f.subgroup === filters.subgroup) && (!filters.region || f.region === filters.region))
                .map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>

            {/* Pay Period */}
            <select 
              value={filters.payPeriod}
              onChange={e => setFilters(prev => ({ ...prev, payPeriod: e.target.value }))}
              className="bg-slate-900 text-white border-none text-[11px] font-black uppercase tracking-tight rounded-xl px-4 py-2 hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-slate-900/10"
            >
              <option value="">All Pay Periods</option>
              {data.dimensions.payPeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {Object.values(filters).some(Boolean) && (
              <button 
                onClick={resetFilters}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0 pl-8 border-l border-slate-100">
             <button className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20 group relative">
               <FileDown size={18} />
               <span className="absolute right-0 top-12 bg-slate-900 text-white text-[9px] font-black uppercase py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Export CFO Report</span>
             </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 relative overflow-hidden">
          <PageShell title={TABS.find(t => t.id === activeTab)?.name || 'Dashboard'}>
            <ActiveTabComp />
          </PageShell>
        </div>
        
        {/* Persistent Diagnostic Panel (Minimized) */}
        <div className="absolute bottom-6 right-8 max-w-2xl w-full z-50">
          <DiagnosticPanel />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
