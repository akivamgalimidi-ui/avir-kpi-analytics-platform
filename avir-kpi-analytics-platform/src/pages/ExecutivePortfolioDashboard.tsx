import React from 'react';

const ExecutivePortfolioDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Executive Portfolio Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-pulse">
            <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
            <div className="h-8 w-32 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-500">
        No payroll data has been uploaded yet. Upload a payroll workbook to populate this dashboard.
      </div>
    </div>
  );
};

export default ExecutivePortfolioDashboard;
