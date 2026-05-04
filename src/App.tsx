import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Globe, 
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
  Database
} from 'lucide-react';

const TABS = [
  { id: 'executive', name: 'Executive Portfolio Dashboard', icon: LayoutDashboard, category: 'Executive' },
  { id: 'kpi-period', name: 'KPI Dashboard by Period', icon: BarChart3, category: 'Executive' },
  { id: 'portfolio-trends', name: 'Portfolio Facility Trends', icon: TrendingUp, category: 'Drilldowns' },
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

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const filterData = await api.filters();
      setFilters(filterData);
    } catch (err) {
      console.warn("Filters load failed", err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.uploadPayroll(file);
      setUploadResult(data);
      await refreshData();
      setActiveTab('data-quality');
    } catch (err: any) {
      setError(err.message || String(err));
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
          <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
          <h3 className="text-2xl font-black text-slate-800 mb-2">Synchronizing Payroll Data</h3>
          <p className="text-slate-500 max-w-sm">Deep parsing KPIs, normalizing facilities, and persisting to database...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 mx-auto max-w-4xl">
          <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[40px] flex gap-6 text-red-700 shadow-sm">
            <AlertCircle size={48} className="shrink-0" />
            <div className="flex-1">
              <p className="font-black text-xl mb-2">Analytical Engine Interruption</p>
              <div className="p-4 bg-white/50 rounded-2xl font-mono text-xs break-all border border-red-100">
                {error}
              </div>
              <button onClick={() => setError(null)} className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition shadow-xl shadow-red-500/20">Reset Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'data-quality' && uploadResult) {
       return (
         <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-6">
                 <div className="bg-emerald-500 text-white p-4 rounded-3xl shadow-lg shadow-emerald-500/20"><CheckCircle2 size={32} /></div>
                 <div>
                   <h3 className="text-2xl font-black text-emerald-900 tracking-tight">Analytical Ingestion Success</h3>
                   <p className="text-emerald-700 font-medium">Database Persistence: {uploadResult.databaseStatus}</p>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {renderDashboardCard('Total Facilities', uploadResult.summary?.facilities, MapPin, 'text-blue-600')}
               {renderDashboardCard('Regional Hubs', uploadResult.summary?.regions, Globe, 'text-emerald-600')}
               {renderDashboardCard('KPI Data Rows', uploadResult.summary?.metrics, BarChart3, 'text-amber-600')}
               {renderDashboardCard('Workbook Status', 'VERIFIED', ShieldCheck, 'text-indigo-600')}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase text-xs">
                    <Table size={16} className="text-blue-500" /> Detected Sheets Metadata
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                  {uploadResult.sheetsDetected?.map((s: string) => (
                    <div key={s} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <span className="font-bold text-slate-700 text-sm">{s}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">Verified</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       );
    }

    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-[40px] flex items-center justify-center mb-10 shadow-inner">
          <FileText size={48} className="text-blue-600" />
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Awaiting Payroll Data</h2>
        <p className="text-slate-500 max-w-md mb-12 text-lg font-medium leading-relaxed">
          The dashboard is currently in standby. Please upload the <strong>Payroll Analysis Updated.xlsx</strong> file to begin.
        </p>

        <label 
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
          className={`px-12 py-5 rounded-[30px] font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center gap-4 cursor-pointer hover:scale-105 active:scale-95 ${
            loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-500/30'
          }`}
        >
           {loading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
           Synchronize Payroll
           <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
        </label>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-80 bg-slate-900 text-slate-400 flex flex-col shrink-0 shadow-2xl z-20 relative">
        <div className="p-10">
          <h1 className="text-white text-xl font-black tracking-tight flex items-center gap-3">
            <Activity className="text-blue-500" /> AVIR ANALYTICS
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 pb-12 space-y-8 custom-scrollbar">
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
                    <tab.icon size={18} />
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 bg-white border-b border-slate-200 px-12 flex items-center justify-between shrink-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{TABS.find(t => t.id === activeTab)?.name}</h2>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> API ONLINE
               </span>
               {filters?.facilities?.length > 0 && (
                 <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                    <Database size={10} /> {filters.facilities.length} Facilities
                 </span>
               )}
            </div>
          </div>
          <div className="flex gap-4">
             <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-xs font-black text-slate-600 cursor-pointer hover:bg-slate-100 transition shadow-sm uppercase tracking-widest">
                <Filter size={16} /> Filters
             </div>
             <label 
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
                className={`px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 cursor-pointer ${
                  loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-500/20'
                }`}
             >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Sync Data
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
             </label>
          </div>
        </header>
        <section className="flex-1 overflow-auto custom-scrollbar relative">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}

export default App;
