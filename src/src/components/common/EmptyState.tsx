import React from 'react';
import { Database, AlertTriangle, Filter, Search } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  icon?: 'data' | 'filter' | 'search' | 'warning';
  action?: React.ReactNode;
}

export default function EmptyState({ title, message, icon = 'data', action }: Props) {
  const Icon = {
    data: Database,
    filter: Filter,
    search: Search,
    warning: AlertTriangle
  }[icon];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-[24px] flex items-center justify-center mb-6">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed mb-8">
        {message}
      </p>
      {action}
    </div>
  );
}
