import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#CED0D4] text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-[#050505]">
                Algo no cargó correctamente
              </h2>
              <p className="text-xs text-[#65676B] leading-relaxed">
                Detectamos un problema temporal al renderizar la aplicación. Puedes reintentar o restaurar la sesión para continuar.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="space-y-2 text-left">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <p className="text-xs font-bold">{this.state.error.message}</p>
                </div>
                {this.state.error.stack && (
                  <details className="text-[10px] text-gray-500 font-mono">
                    <summary className="cursor-pointer hover:underline text-gray-700">Ver detalle técnico</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-36">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>

              <button
                onClick={this.handleResetAndReload}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] font-semibold text-xs border border-[#CED0D4] transition-all cursor-pointer"
              >
                <span>Restaurar datos y volver a entrar</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
