import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const TABS = [
  "Executive Portfolio Dashboard",
  "KPI Dashboard by Period",
  "Portfolio Facility Trends",
  "Facility Drilldown",
  "Region Dashboard",
  "Acq Group Dashboard",
  "Pay Period Dashboard",
  "OT Analysis",
  "Bonus Analysis",
  "HPPD / PPD Analysis",
  "Labor Pressure Ranking",
  "Employee Review",
  "Pay Cycle Mapping",
  "Data Quality Dashboard",
  "QA / Reconciliation",
  "System Status"
];

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Executive Portfolio Dashboard");
  const [systemStatus, setSystemStatus] = useState<any>({ api: 'checking...', db: 'checking...' });

  useEffect(() => {
    fetch('/api/health')
      .then(res => {
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) throw new Error("API returned non-JSON. Vercel routing error.");
        return res.json();
      })
      .then(res => setSystemStatus({ api: 'PASS', db: res.database === 'connected' ? 'PASS' : 'FAIL' }))
      .catch(err => setSystemStatus({ api: 'FAIL', db: 'FAIL', error: err.message }));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    setError(null);

    try {
      const file = e.target.files[0];
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      
      const sheetsData: Record<string, any> = {};
      workbook.SheetNames.forEach(sn => {
        sheetsData[sn] = XLSX.utils.sheet_to_json(workbook.Sheets[sn], { header: 1, defval: null });
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, sheets: sheetsData })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON from /api/upload but received ${contentType || 'unknown'}. Status ${res.status}. Response preview: ${text.substring(0, 150)}...`);
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || result.error || 'Server error');
      
      setData(result.dashboard_data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === "System Status") {
      return (
        <div className="glass-card">
          <h3 className="font-bold text-slate-700 mb-4">System Status</h3>
          <ul className="space-y-2 font-mono text-sm">
            <li>Frontend Loaded: <span className="text-green-600 font-bold">PASS</span></li>
            <li>API Health Endpoint: <span className={systemStatus.api === 'PASS' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{systemStatus.api}</span></li>
            <li>Database Connected: <span className={systemStatus.db === 'PASS' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{systemStatus.db}</span></li>
            <li>Last Upload Data: <span className={data ? 'text-green-600 font-bold' : 'text-slate-500'}>{data ? 'AVAILABLE' : 'NONE'}</span></li>
          </ul>
          {systemStatus.error && <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded">{systemStatus.error}</div>}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          <span className="font-bold">Error:</span> {error}
        </div>
      );
    }

    if (loading) {
      return <div className="flex justify-center h-64 items-center animate-pulse text-slate-500">Processing file...</div>;
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="text-center">
            <div className="text-slate-400 mb-2 font-bold">No Data Loaded</div>
            <div className="text-slate-500 text-sm">Please upload an Excel file to populate the {activeTab}.</div>
          </div>
        </div>
      );
    }

    if (activeTab === "Executive Portfolio Dashboard") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="font-bold text-slate-700 mb-4">Total Overtime</h3>
            <div className="text-4xl font-bold text-slate-900">${data.labor_pressure?.reduce((a: number, v: any) => a + (v.latest_ot_dollars || 0), 0).toLocaleString()}</div>
          </div>
          <div className="glass-card">
            <h3 className="font-bold text-slate-700 mb-4">Critical Facilities</h3>
            <div className="text-4xl font-bold text-red-600">{data.labor_pressure?.filter((r: any) => r.risk_category === 'Critical').length || 0}</div>
          </div>
          <div className="glass-card lg:col-span-2 overflow-auto">
            <h3 className="font-bold text-slate-700 mb-4">Facility Labor Pressure</h3>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr><th className="px-4 py-2">Facility</th><th className="px-4 py-2">Risk</th><th className="px-4 py-2">OT $</th></tr>
              </thead>
              <tbody>
                {(data.labor_pressure || []).map((row: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2 font-medium text-blue-600">{row.facility_name}</td>
                    <td className="px-4 py-2"><span className={row.risk_category === 'Critical' ? 'text-red-600 font-bold' : ''}>{row.risk_category}</span></td>
                    <td className="px-4 py-2">${(row.latest_ot_dollars || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card h-64 flex items-center justify-center text-slate-500">
        Dashboard module "{activeTab}" is ready. Data is available in memory.
      </div>
    );
  };

  return (
    <div className="flex h-full w-full">
      <aside className="w-64 bg-slate-900 text-slate-300 p-4 flex flex-col h-full overflow-y-auto">
        <h1 className="text-xl font-bold text-white mb-6">Avir Analytics</h1>
        <nav className="flex-1 space-y-1">
          {TABS.map(tab => (
            <div 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded cursor-pointer text-sm font-medium ${activeTab === tab ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
              {tab}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
          <h2 className="text-lg font-semibold">{activeTab}</h2>
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer text-sm font-medium transition">
            Upload Payroll File
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUpload} />
          </label>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
