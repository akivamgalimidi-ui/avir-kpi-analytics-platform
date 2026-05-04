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
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [filters, setFilters] = useState<any>(null);

  // Load last result from storage on mount (Diagnostic)
  useEffect(() => {
    const saved = localStorage.getItem('last_upload_result');
    const savedErr = localStorage.getItem('last_upload_error');
    if (saved) setUploadResult(JSON.parse(saved));
    if (savedErr) setError(savedErr);
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const filterData = await api.filters();
      setFilters(filterData);
    } catch (err) {
      console.warn("Filters failed to load", err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setLoading(true);
    setError(null);
    setUploadStatus('Reading file bytes...');

    try {
      const file = e.target.files[0];
      setUploadStatus(`Sending ${file.name} to Vercel...`);
      
      const result = await api.uploadPayroll(file);
      
      setUploadStatus('Processing result...');
      setUploadResult(result);
      localStorage.setItem('last_upload_result', JSON.stringify(result));
      localStorage.removeItem('last_upload_error');
      
      await refreshData();
      setActiveTab('data-quality');
    } catch (err: any) {
      const errMsg = err.message || String(err);
      setError(errMsg);
      localStorage.setItem('last_upload_error', errMsg);
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-center h-[70vh]">
          <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
          <h3 className="text-2xl font-black text-slate-800 mb-2">{uploadStatus}</h3>
          <p className="text-slate-500 max-w-sm">Please do not refresh the page. We are awaiting the server handshake.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 mx-auto max-w-4xl">
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl flex gap-6 text-red-700 shadow-sm">
            <AlertCircle size={32} className="shrink-0" />
            <div className="flex-1">
              <p className="font-black text-xl mb-2">Upload Failed</p>
              <div className="p-4 bg-white/50 rounded-xl font-mono text-xs break-all border border-red-200">
                {error}
              </div>
              <button 
                onClick={() => { setError(null); localStorage.removeItem('last_upload_error'); }} 
                className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition"
              >
                Clear Error
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (uploadResult) {
      return (
        <div className="p-8 space-y-6">
           <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <div>
                  <h3 className="font-black text-emerald-900">Success: {uploadResult.message || 'File Processed'}</h3>
                  <p className="text-sm text-emerald-700">Size: {uploadResult.fileSize} bytes | Sheets: {uploadResult.sheetsDetected?.length}</p>
                </div>
              </div>
              <button onClick={() => { setUploadResult(null); localStorage.removeItem('last_upload_result'); }} className="text-xs font-bold text-emerald-700 underline">Clear Result</button>
           </div>
           
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold">Workbook Sheets</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-6">
                {uploadResult.sheetsDetected?.map((s: string) => (
                  <div key={s} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">
                    <Table size={16} className="text-blue-500" /> {s}
                  </div>
                ))}
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-8">
          <FileText size={40} className="text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Ready for Payroll Ingestion</h3>
        <p className="text-slate-500 max-w-sm mb-12 font-medium">Please upload the 'Payroll Analysis Updated.xlsx' file to begin the analytical process.</p>
        
        <label 
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
          className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 cursor-pointer flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
           <Download size={20} />
           Upload Payroll Excel
           <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
        </label>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col shrink-0 shadow-2xl z-20 relative">
        <div className="p-10">
          <h1 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" /> Avir Analytics
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-12 space-y-2 custom-scrollbar">
          {TABS.map(tab => (
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
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{TABS.find(t => t.id === activeTab)?.name}</h2>
          <div className="flex items-center gap-4">
             {loading && <span className="text-[10px] font-black text-blue-600 animate-pulse uppercase tracking-widest">Server Processing...</span>}
             <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600">
                <Database size={14} /> System Online
             </div>
          </div>
        </header>
        <section className="flex-1 overflow-auto custom-scrollbar relative">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}

// Minimal icons used but imported above
const CheckCircle2 = ({ size, className }: any) => <Activity size={size} className={className} />;

export default App;
