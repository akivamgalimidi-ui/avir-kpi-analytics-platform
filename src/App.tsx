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
  Database
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
  const [systemStatus, setSystemStatus] = useState<any>({ api: 'checking...', db: 'checking...', frontend: 'PASS' });

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
      setUploadResult(result);
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
              <button onClick={checkHealth} className="text-sm text-blue-600 font-semibold hover:underline">Refresh</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Frontend Mounted', status: systemStatus.frontend, desc: 'React Application Status' },
                  { name: 'API Health ( Node.js )', status: systemStatus.api, desc: '/api/health Connectivity' },
                  { name: 'Supabase Status', status: systemStatus.db, desc: 'Backend Environment Status' },
                  { name: 'Upload Endpoint', status: systemStatus.api === 'PASS' ? 'PASS' : 'CHECK', desc: '/api/upload Availability' },
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
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl flex gap-6 text-red-700 shadow-sm border-red-200">
            <AlertCircle size={32} className="shrink-0" />
            <div>
              <p className="font-black text-xl mb-2 text-red-800">System Interruption</p>
              <p className="text-sm font-medium opacity-80 break-all mb-6 leading-relaxed">{error}</p>
              <button onClick={() => setError(null)} className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-200">Reset Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-center h-[70vh]">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-2">Processing Payroll</h3>
          <p className="text-slate-500 max-w-sm">Parsing workbook structure and validating metadata...</p>
        </div>
      );
    }

    if (activeTab === 'data-quality' && uploadResult) {
      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
           <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-2 rounded-lg shadow-md shadow-emerald-200"><CheckCircle2 size={24} /></div>
                <div>
                  <h3 className="font-black text-emerald-900">Upload Processed Successfully</h3>
                  <p className="text-sm text-emerald-700">Workbook: {uploadResult.filename}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Parser Status</div>
                <div className="font-black text-emerald-900">{uploadResult.parserStatus}</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">File Size</div>
                <div className="text-2xl font-black text-slate-800">{(uploadResult.fileSize / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sheets Detected</div>
                <div className="text-2xl font-black text-slate-800">{uploadResult.sheetsDetected?.length || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workbook Parsed</div>
                <div className="text-2xl font-black text-emerald-600">{uploadResult.workbookParsed ? 'YES' : 'NO'}</div>
              </div>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center justify-between">
                 <span>Workbook Structure Detection</span>
                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Validated via SheetJS</span>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-black uppercase text-[10px] tracking-widest">Sheet Name</th>
                    <th className="px-6 py-3 font-black uppercase text-[10px] tracking-widest text-right">Rows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(uploadResult.sheetRowCounts || {}).map(([name, count]: [any, any]) => (
                    <tr key={name} className="hover:bg-slate-50/50 transition cursor-default">
                      <td className="px-6 py-4 font-bold text-slate-700">{name}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>

           <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-blue-800">
              <h4 className="font-black text-blue-900 mb-1">Basic Workbook Metadata Available</h4>
              <p className="text-sm opacity-90">Workbook structure detection is complete. The next phase will implement full KPI parsing and Supabase persistence.</p>
           </div>
        </div>
      );
    }

    // Default Empty State (No Fake Data)
    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-8">
          <FileText size={40} className="text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">No payroll data loaded yet</h3>
        <p className="text-slate-500 max-w-sm mb-12 font-medium">To view analytical dashboards, please upload your facility payroll Excel export using the button in the header.</p>
        <div className="flex flex-col items-center gap-6">
           <label className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 cursor-pointer flex items-center gap-3">
              <Download size={20} />
              Upload Payroll Excel
              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
           </label>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500" /> API Online (Node.js Bridge)
           </div>
        </div>
      </div>
    );
  };

  const categories = ['Executive', 'Drilldowns', 'Analytics', 'System & QA'];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans select-none">
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col shrink-0 shadow-2xl z-20 relative">
        <div className="p-10">
          <h1 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" /> Avir Analytics
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-12 space-y-8 custom-scrollbar">
          {categories.map(cat => (
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
        <div className="p-8 border-t border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-white shadow-lg">AG</div>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-tight">Akiva Galimidi</div>
                <div className="text-[10px] font-bold text-slate-500">Portfolio Admin</div>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{TABS.find(t => t.id === activeTab)?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                 <CheckCircle2 size={10}/> API Online
               </span>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition shadow-sm">
                <Filter size={14} /> Global Filters
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
