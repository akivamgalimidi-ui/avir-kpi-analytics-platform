import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  Map, 
  Users, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Activity,
  Download,
  Settings,
  AlertCircle,
  Loader2,
  FileText,
  Filter,
  CheckCircle2,
  Table,
  Database,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

const TABS = [
  { id: 'executive', name: 'Executive Portfolio Dashboard', icon: LayoutDashboard, category: 'Executive' },
  { id: 'kpi-period', name: 'KPI Dashboard by Period', icon: BarChart3, category: 'Executive' },
  { id: 'portfolio-trends', name: 'Portfolio Facility Trends', icon: TrendingUp, category: 'Drilldowns' },
  { id: 'facility', name: 'Facility Drilldown', icon: Map, category: 'Drilldowns' },
  { id: 'region', name: 'Region Dashboard', icon: Map, category: 'Drilldowns' },
  { id: 'acq-group', name: 'Acq Group Dashboard', icon: Users, category: 'Drilldowns' },
  { id: 'pay-period', name: 'Pay Period Dashboard', icon: Clock, category: 'Drilldowns' },
  { id: 'ot', name: 'OT Analysis', icon: Clock, category: 'Analytics' },
  { id: 'bonus', name: 'Bonus Analysis', icon: DollarSign, category: 'Analytics' },
  { id: 'hppd-ppd', name: 'HPPD / PPD Analysis', icon: Activity, category: 'Analytics' },
  { id: 'labor-pressure', name: 'Labor Pressure Ranking', icon: ShieldCheck, category: 'Analytics' },
  { id: 'employee', name: 'Employee Review', icon: Users, category: 'Analytics' },
  { id: 'pay-cycle', name: 'Pay Cycle Mapping', icon: Settings, category: 'System & QA' },
  { id: 'data-quality', name: 'Data Quality Dashboard', icon: ShieldCheck, category: 'System & QA' },
  { id: 'reconciliation', name: 'QA / Reconciliation', icon: ShieldCheck, category: 'System & QA' },
  { id: 'system', name: 'System Status', icon: Activity, category: 'System & QA' },
];

function App() {
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [filters, setFilters] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>({ api: 'checking...', db: 'checking...', frontend: 'PASS' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const [health, filterData] = await Promise.all([
        api.health(),
        api.filters()
      ]);
      setSystemStatus((prev: any) => ({ ...prev, api: 'PASS', db: health.supabaseUrlConfigured ? 'PASS' : 'WARNING' }));
      setFilters(filterData);
    } catch (err: any) {
      setSystemStatus((prev: any) => ({ ...prev, api: 'FAIL', db: 'FAIL', error: err.message }));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    setError(null);

    try {
      const file = e.target.files[0];
      const result = await api.uploadPayroll(file);
      setUploadResult(result);
      await refreshData();
      setActiveTab('data-quality');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboardCard = (title: string, value: any, icon: any, color: string) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 ${color.replace('text-', 'bg-')} group-hover:scale-110 transition`}>
          {React.createElement(icon, { size: 24 })}
        </div>
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-3xl font-black text-slate-800 tracking-tight">{value || '--'}</div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-center h-[70vh]">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-2">Deep Parsing Workbook</h3>
          <p className="text-slate-500 max-w-sm">Extracting KPIs, normalizing facilities, and persisting to database...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 mx-auto max-w-4xl">
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl flex gap-6 text-red-700 shadow-sm">
            <AlertCircle size={32} className="shrink-0" />
            <div>
              <p className="font-black text-xl mb-2">System Interruption</p>
              <p className="text-sm font-medium opacity-80 leading-relaxed">{error}</p>
              <button onClick={() => setError(null)} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition">Reset Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'executive' && uploadResult) {
      const summary = uploadResult.summary;
      return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {renderDashboardCard('Total Facilities', summary.facilities, Map, 'text-blue-600')}
              {renderDashboardCard('Regional Hubs', summary.regions, Table, 'text-emerald-600')}
              {renderDashboardCard('Parsed KPI Rows', summary.metricEntries, BarChart3, 'text-amber-600')}
              {renderDashboardCard('Upload Status', 'ACTIVE', ShieldCheck, 'text-indigo-600')}
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 font-black text-slate-800 tracking-tight flex items-center gap-2">
                 <Clock size={18} className="text-blue-500" /> Recent Parsed Metrics Preview
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500">
                  <tr>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest">Facility</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest">Period</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest">Metric</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploadResult.parsedData?.recentMetrics.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4 font-bold text-slate-700">{m.facility}</td>
                      <td className="px-8 py-4 text-slate-500">{m.payPeriod}</td>
                      <td className="px-8 py-4 uppercase text-[10px] font-black text-blue-600 tracking-widest">{m.metric}</td>
                      <td className="px-8 py-4 text-right font-black text-slate-800">{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      );
    }

    if (activeTab === 'data-quality' && uploadResult) {
      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
           <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-2 rounded-lg shadow-md"><CheckCircle2 size={24} /></div>
                <div>
                  <h3 className="font-black text-emerald-900">Upload Processed (Full Engine)</h3>
                  <p className="text-sm text-emerald-700">Database Status: {uploadResult.databaseStatus}</p>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">Workbook Structure</div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-black uppercase text-[10px] tracking-widest">Sheet Name</th>
                    <th className="px-6 py-3 font-black uppercase text-[10px] tracking-widest text-right">Rows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(uploadResult.sheetRowCounts || {}).map(([name, count]: [any, any]) => (
                    <tr key={name} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-700">{name}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      );
    }

    // Default Empty State
    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-8">
          <FileText size={40} className="text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">No payroll data loaded yet</h3>
        <p className="text-slate-500 max-w-sm mb-12 font-medium">To view analytical dashboards, please upload your facility payroll Excel export.</p>
        <label className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 cursor-pointer flex items-center gap-3">
           <Download size={20} />
           Upload Payroll Excel
           <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
        </label>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans select-none">
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col shrink-0 shadow-2xl z-20 relative">
        <div className="p-10">
          <h1 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" /> Avir Analytics
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-12 space-y-8 custom-scrollbar">
          {['Executive', 'Drilldowns', 'Analytics', 'System & QA'].map(cat => (
            <div key={cat}>
              <h3 className="px-4 text-[10px] uppercase tracking-widest font-black text-slate-600 mb-4">{cat}</h3>
              <div className="space-y-1">
                {TABS.filter(t => t.category === cat).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/60' : 'hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-600'} />
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{TABS.find(t => t.id === activeTab)?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                 <CheckCircle2 size={10}/> API Online
               </span>
               {filters?.facilities?.length > 0 && (
                 <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1.5 px-2 bg-blue-50 rounded-full border border-blue-100">
                    <Database size={10}/> {filters.facilities.length} Facilities Persisted
                 </span>
               )}
            </div>
          </div>
          <div className="flex gap-4">
             <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition shadow-sm">
                <Filter size={14} /> Global Filters ({filters?.facilities?.length || 0})
             </div>
             <label className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 cursor-pointer ${
               loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
             }`}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Upload Payroll
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} disabled={loading} />
             </label>
          </div>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
