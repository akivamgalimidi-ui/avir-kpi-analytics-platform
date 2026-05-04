import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  pageName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in [${this.props.pageName}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50/30 border border-red-100 rounded-3xl m-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <AlertCircle size={32} />
          </div>
          
          <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
            Page could not render
          </h2>
          
          <p className="text-slate-600 text-sm mb-6 text-center max-w-md leading-relaxed font-medium">
            An unexpected error occurred in the <strong className="text-red-700">{this.props.pageName}</strong> component. 
            This is often caused by missing data or unexpected workbook structures.
          </p>

          <div className="bg-white border border-red-100 rounded-2xl p-4 w-full max-w-2xl mb-8 overflow-hidden shadow-sm">
            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Technical Diagnostic
            </div>
            <div className="text-[11px] font-mono text-slate-700 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
              {this.state.error?.toString()}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 opacity-50 border-t border-slate-100 pt-2 text-[9px]">
                  {this.state.errorInfo?.componentStack}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
            >
              <RefreshCcw size={14} /> Reset Application
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              <Home size={14} /> Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
