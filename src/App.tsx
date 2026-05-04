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
  Search,
  Filter,
  CheckCircle2
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>({ api: 'checking...', db: 'checking...', frontend: 'PASS', css: 'PASS' });

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const result = await api.health();
      setSystemStatus((prev: any) => ({ 
        ...prev, 
        api: 'PASS', 
        db: result.supabaseUrlConfigured ? 'PASS' : 'WARNING',
        error: null
      }));
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
      setData(result.dashboard_data);
      setActiveTab('executive');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'system') {
      return (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                System Health Status
              </h3>
              <button onClick={checkHealth} className="text-sm text-blue-600 font-semibold hover:underline">Refresh</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Frontend Mounted', status: systemStatus.frontend, desc: 'React Application Status' },
                  { name: 'CSS / Tailwind', status: systemStatus.css, desc: 'Style Injection Status' },
                  { name: 'API Health ( /api/health )', status: systemStatus.api, desc: 'Serverless Function Connectivity' },
                  { name: 'Supabase Configured', status: systemStatus.db, desc: 'Backend Environment Status' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black">
                       {item.status === 'PASS' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}
                       <span className={item.status === 'PASS' ? 'text-emerald-600' : 'text-red-600'}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 mx-auto max-w-4xl">
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex gap-4 text-red-700">
            <AlertCircle size={24} className="shrink-0" />
            <div>
              <p className="font-bold mb-1">Application Error</p>
              <p className="text-sm font-mono opacity-80 break-all">{error}</p>
              <button onClick={() => setError(null)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Clear Error</button>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-center h-[70vh]">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-2">Uploading Payroll</h3>
          <p className="text-slate-500 max-w-sm">Verifying API connectivity and upload stability...</p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="p-20 flex flex-col items-center justify-center text-center opacity-60">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
            <FileText size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No payroll data loaded yet</h3>
          <p className="text-slate-500 max-w-sm mb-8">Upload an Excel payroll report to populate this dashboard.</p>
          <label className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg cursor-pointer">
             Get Started - Upload Excel
             <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
          </label>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
           <h3 className="text-xl font-bold text-slate-800 mb-2">{TABS.find(t => t.id === activeTab)?.name} Ready</h3>
           <p className="text-slate-500">Foundation is stable. Visualization modules will be connected to the parser engine next.</p>
        </div>
      </div>
    );
  };

  const categories = ['Executive', 'Drilldowns', 'Analytics', 'System & QA'];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col shrink-0 shadow-xl z-20">
        <div className="p-8">
          <h1 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" /> Avir Analytics
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-8 space-y-6 custom-scrollbar">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="px-4 text-[10px] uppercase tracking-widest font-black text-slate-600 mb-2">{cat}</h3>
              <div className="space-y-0.5">
                {TABS.filter(t => t.category === cat).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800'
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
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0 z-10">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{TABS.find(t => t.id === activeTab)?.name}</h2>
          <div className="flex gap-4">
             <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600">
                <Filter size={14} /> Global Filters
             </div>
             <label className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2 cursor-pointer ${
               loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
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
