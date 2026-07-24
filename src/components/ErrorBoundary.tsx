import React, { Component, ErrorInfo, ReactNode } from "react";
import Maintenance from "@/pages/Maintenance";

interface Props {
  children?: ReactNode;
  isAdminPage: boolean;
}

interface State {
  hasError: boolean;
  isFirebaseQuotaError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isFirebaseQuotaError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorString = error.toString().toLowerCase();

    const isQuotaError =
      errorString.includes("quota limit") ||
      errorString.includes("quota exceeded") ||
      errorString.includes("cannot exceed free quota limits");

    const isChunkError =
      errorString.includes("failed to fetch dynamically imported module") ||
      errorString.includes("expected a javascript-or-wasm module script") ||
      errorString.includes("mime type of \"text/html\"") ||
      errorString.includes("loading chunk");

    if (isChunkError && typeof window !== "undefined" && !sessionStorage.getItem("chunk_refreshed")) {
      sessionStorage.setItem("chunk_refreshed", "true");
      window.location.reload();
    }

    return {
      hasError: true,
      isFirebaseQuotaError: isQuotaError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Erro de quota Firebase
      if (this.state.isFirebaseQuotaError) {
        // Tela especial para admin
        if (this.props.isAdminPage) {
          return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#111] text-white">
              <div className="max-w-lg">
                <h1 className="text-2xl font-bold mb-4 text-red-500">
                  Limite de Quota Atingido
                </h1>

                <p className="text-gray-400 mb-6">
                  {this.props.isAdminPage 
                    ? "O limite gratuito do Firestore foi excedido. Se você já assinou o plano Blaze, aguarde alguns instantes para a propagação total ou verifique o console do Firebase."
                    : "O sistema está passando por uma manutenção programada. Por favor, tente novamente em instantes."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-[#BF76FF] text-white rounded-full font-bold"
                  >
                    Tentar novamente
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    className="px-6 py-2 border border-white/20 text-white hover:bg-white/5 rounded-full font-bold transition-colors"
                  >
                    Limpar Cache e Recarregar
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // Usuários normais veem tela de manutenção
        return <Maintenance />;
      }

      // Erro genérico
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-4">
              Oops, algo deu errado!
            </h1>

            <p className="text-gray-500 mb-6">
              Estamos trabalhando para resolver o problema.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-black text-white rounded-full font-bold"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}