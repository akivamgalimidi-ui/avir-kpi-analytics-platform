import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { 
  Activity, 
  Download, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Database,
  FileText
} from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Auto-clear success after 10 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        // We keep it for now for diagnostics
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStatus(`Preparing ${file.name}...`);

    try {
      setStatus(`Uploading ${file.size.toLocaleString()} bytes to /api/upload...`);
      
      const data = await api.uploadPayroll(file);
      
      setStatus('Success! Workbook metadata retrieved.');
      setResult(data);
    } catch (err: any) {
      console.error("Upload Error:", err);
      setError(err.message || String(err));
      setStatus('Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {/* Persistent Status Bar */}
      <div className="bg-slate-900 text-white px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500 animate-pulse" size={20} />
          <h1 className="font-black tracking-tight text-lg">AVIR ANALYTICS</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            loading ? 'bg-blue-600 animate-pulse' : error ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
            {loading ? 'Processing' : error ? 'System Error' : 'System Online'}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Status: <span className="text-white ml-2">{status}</span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-12">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[40px] shadow-xl mb-12 animate-in slide-in-from-top duration-500">
            <div className="flex gap-6 text-red-700">
              <AlertCircle size={48} className="shrink-0" />
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight">Backend Handshake Failed</h3>
                <div className="p-6 bg-white/80 rounded-3xl font-mono text-xs leading-relaxed border border-red-100 shadow-inner overflow-auto max-h-60">
                  {error}
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition active:scale-95"
                >
                  Clear & Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {result && (
          <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[40px] shadow-xl mb-12 animate-in slide-in-from-top duration-500">
            <div className="flex gap-6 text-emerald-700">
              <CheckCircle2 size={48} className="shrink-0" />
              <div className="space-y-4 w-full">
                <h3 className="text-2xl font-black tracking-tight">Upload Successful</h3>
                <p className="font-bold opacity-80 uppercase text-[10px] tracking-widest">Workbook Metadata Captured</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white p-6 rounded-3xl border border-emerald-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Sheets Detected</div>
                      <div className="flex flex-wrap gap-2">
                        {result.sheetsDetected?.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold">{s}</span>
                        ))}
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-emerald-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Payload Data</div>
                      <div className="text-lg font-black text-slate-800">{result.fileSize?.toLocaleString()} Bytes</div>
                      <div className="text-[10px] font-bold text-slate-400">{result.filename}</div>
                   </div>
                </div>

                <button 
                  onClick={() => setResult(null)}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition active:scale-95"
                >
                  Process New File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ready State */}
        {!error && !result && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-[40px] flex items-center justify-center mb-10 shadow-inner">
              <FileText size={48} className="text-blue-600" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Awaiting Payroll Data</h2>
            <p className="text-slate-500 max-w-md mb-12 text-lg font-medium leading-relaxed">
              Please upload the <strong>Payroll Analysis Updated.xlsx</strong> file to synchronize the analytical dashboards.
            </p>

            <label 
              className={`relative group px-12 py-5 rounded-[30px] font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center gap-4 cursor-pointer overflow-hidden ${
                loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-500/30'
              }`}
            >
               {loading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
               {loading ? 'Sending to Vercel...' : 'Synchronize Payroll'}
               <input 
                 type="file" 
                 className="absolute inset-0 opacity-0 cursor-pointer" 
                 onChange={handleUpload} 
                 disabled={loading}
                 accept=".xlsx,.xls"
               />
            </label>

            {loading && (
              <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                 <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                 DO NOT REFRESH PAGE
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-6 py-2 rounded-full shadow-lg text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
           Avir Analytics Platform • v1.0.0-Stable
        </div>
      </footer>
    </div>
  );
}

export default App;
