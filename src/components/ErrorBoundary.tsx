import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center text-white select-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-black tracking-wider text-white mb-2">
            Terjadi Kendala Sistem
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
            Komponen ini mengalami kendala teknis sementara. Data Anda aman dan sistem siap dipulihkan kembali.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-transform active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Coba Lagi
            </button>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
