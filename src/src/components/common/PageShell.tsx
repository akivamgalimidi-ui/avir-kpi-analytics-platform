import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  isDataLoading?: boolean;
}

export default function PageShell({ title, children, headerAction, isDataLoading }: Props) {
  return (
    <ErrorBoundary pageName={title}>
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
        <header className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Active Dataset</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <main className="max-w-[1600px] mx-auto p-8 pb-24">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
