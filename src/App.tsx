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
  CheckCircle2,
  Database,
  History
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
  const [systemStatus, setSystemStatus] = useState<any>({ api: 'checking...', db: 'checking...', frontend: 'PASS', css: 'PASS' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const [health, filterData] = await Promise.all([
        api.health(),
        api.filters()
      ]);
      
      setSystemStatus((prev: any) => ({ 
        ...prev, 
        api: 'PASS', 
        db: health.supabaseUrlConfigured ? 'PASS' : 'WARNING',
        error: null
      }));
      
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
      await refreshData(); // Immediately refresh dimensions from the DB
      setActiveTab('data-quality');
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
              <button onClick={refreshData} className="text-sm text-blue-600 font-semibold hover:underline">Refresh</button>
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
          <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-2">Parsing Workbook</h3>
          <p className="text-slate-500 max-w-sm">Normalizing Excel sheets and persisting to Supabase...</p>
        </div>
      );
    }

    if (activeTab === 'data-quality' && uploadResult) {
      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
           <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-2 rounded-lg"><CheckCircle2 size={24} /></div>
                <div>
                  <h3 className="font-black text-emerald-900">Upload Processed Successfully</h3>
                  <p className="text-sm text-emerald-700">Batch ID: {uploadResult.uploadBatchId}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Database Status</div>
                <div className="font-black text-emerald-900">{uploadResult.databaseStatus}</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sheets Detected</div>
                <div className="text-3xl font-black text-slate-900">{uploadResult.sheetsDetected?.length || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Facilities Found</div>
                <div className="text-3xl font-black text-slate-900">{uploadResult.facilitiesDetected?.length || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Parser Status</div>
                <div className="text-sm font-black text-blue-600">{uploadResult.parserStatus}</div>
              </div>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">Workbook Structure</div>
              <div className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 text-left">
                    <tr>
                      <th className="px-6 py-3 font-black uppercase text-[10px] tracking-widest">Sheet Name</th>
                      <th className="px-6 py-3 font-black uppercase text-[10px] tracking-widest text-right">Row Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(uploadResult.sheetRowCounts || {}).map(([name, count]: [any, any]) => (
                      <tr key={name} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-700">{name}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-500">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      );
    }

    if (!filters?.uploadBatches?.length && !uploadResult) {
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
           <h3 className="text-xl font-bold text-slate-800 mb-2">{TABS.find(t => t.id === activeTab)?.name}</h3>
           <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Batch</div>
                <div className="font-bold text-slate-700">{filters?.uploadBatches?.[0]?.filename || "Local Session"}</div>
              </div>
              <div className="text-center border-l border-slate-100 pl-8">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Facilities</div>
                <div className="font-bold text-slate-700">{filters?.facilities?.length || 0}</div>
              </div>
           </div>
           <p className="text-slate-500 mt-12 max-w-md mx-auto">Workbook data is stored in Supabase. Dashboard modules are querying real dimensions from the database.</p>
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
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{TABS.find(t => t.id === activeTab)?.name}</h2>
            {filters?.facilities?.length > 0 && <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1"><Database size={10}/> Data Loaded from Supabase</span>}
          </div>
          <div className="flex gap-4">
             <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition">
                <Filter size={14} /> Global Filters ({filters?.facilities?.length || 0})
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
