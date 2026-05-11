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
    isFirebaseQuotaError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if error is related to Firebase Quota limit
    const errorString = error.toString().toLowerCase();
    const isQuotaError = errorString.includes("quota limit") || 
                         errorString.includes("quota exceeded") || 
                         errorString.includes("cannot exceed free quota limits");
    
    return { hasError: true, isFirebaseQuotaError: isQuotaError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.isFirebaseQuotaError) {
        if (this.props.isAdminPage) {
          return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#111] text-white">
              <div className="max-w-lg">
                <h1 className="text-2xl font-bold mb-4 text-red-500">Limite de Quota Atingido</h1>
                <p className="text-gray-400 mb-6">O limite diário gratuito do Firestore foi excedido. O banco de dados retornará ao normal amanhã.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-[#BF76FF] text-white rounded-full font-bold"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          );
        }
        // If it's a quota error for normal users, show the maintenance screen
        return <Maintenance />;
      }
      
      // Fallback UI for non-quota errors
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-4">Oops, algo deu errado!</h1>
            <p className="text-gray-500 mb-6">Estamos trabalhando para resolver o problema.</p>
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
