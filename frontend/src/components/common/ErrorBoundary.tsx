import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CareBridge AI UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D1117] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold mb-2">CareBridge AI Display Recovery</h2>
          <p className="text-sm text-surface-400 max-w-md mb-6 leading-relaxed">
            The application experienced a temporary rendering interruption. Click reload to refresh the hospital system interface.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary-600/25 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 font-semibold text-sm flex items-center gap-2 border border-surface-700 transition-all"
            >
              <Home className="w-4 h-4" />
              Return to Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
