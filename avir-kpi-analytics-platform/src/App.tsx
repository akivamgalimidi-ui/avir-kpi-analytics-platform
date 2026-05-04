import React, { useState } from 'react';
import ExecutivePortfolioDashboard from './pages/ExecutivePortfolioDashboard';
import { 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  Map, 
  Users, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  FileText, 
  Activity,
  History,
  Download,
  Settings
} from 'lucide-react';

const TABS = [
  { id: 'executive', name: 'Executive Portfolio Dashboard', icon: LayoutDashboard },
  { id: 'kpi-period', name: 'KPI Dashboard by Period', icon: BarChart3 },
  { id: 'portfolio-trends', name: 'Portfolio Facility Trends', icon: TrendingUp },
  { id: 'facility', name: 'Facility Drilldown', icon: Map },
  { id: 'region', name: 'Region Dashboard', icon: Map },
  { id: 'acq-group', name: 'Acq Group Dashboard', icon: Users },
  { id: 'pay-period', name: 'Pay Period Dashboard', icon: Clock },
  { id: 'ot', name: 'OT Analysis', icon: Clock },
  { id: 'bonus', name: 'Bonus Analysis', icon: DollarSign },
  { id: 'hppd-ppd', name: 'HPPD / PPD Analysis', icon: Activity },
  { id: 'labor-pressure', name: 'Labor Pressure Ranking', icon: ShieldCheck },
  { id: 'employee', name: 'Employee Review', icon: Users },
  { id: 'pay-cycle', name: 'Pay Cycle Mapping', icon: Settings },
  { id: 'data-quality', name: 'Data Quality Dashboard', icon: ShieldCheck },
  { id: 'reconciliation', name: 'QA / Reconciliation', icon: ShieldCheck },
  { id: 'history', name: 'Upload History', icon: History },
  { id: 'export', name: 'Export Center', icon: Download },
  { id: 'system', name: 'System Status', icon: Activity },
];

function App() {
  const [activeTab, setActiveTab] = useState('executive');

  const renderContent = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutivePortfolioDashboard />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{TABS.find(t => t.id === activeTab)?.name}</h1>
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-500">
              No payroll data has been uploaded yet. Upload a payroll workbook to populate this dashboard.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" />
            Avir Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Labor KPI Platform</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-500'} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">{TABS.find(t => t.id === activeTab)?.name}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm flex items-center gap-2">
              <Download size={16} />
              Upload Payroll File
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
