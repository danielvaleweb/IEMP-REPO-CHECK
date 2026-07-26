/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { RadioProvider } from "@/contexts/RadioContext";
import { AppModalProvider } from "@/contexts/AppModalContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalPlayer from "@/components/GlobalPlayer";
import DevBanner from "@/components/DevBanner";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { firestoreService } from "@/services/firestoreService";

// Helper for lazy loading pages with automatic retry on chunk load error after deployments
function lazyWithRetry(componentImport: () => Promise<any>) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem("chunk_refreshed");
    try {
      const component = await componentImport();
      sessionStorage.removeItem("chunk_refreshed");
      return component;
    } catch (error: any) {
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem("chunk_refreshed", "true");
        
        // Em caso de falha de chunk, desregistra service workers problemáticos 
        // e força um recarregamento ignorando o cache do navegador/CDN.
        if ('serviceWorker' in navigator) {
          try {
            navigator.serviceWorker.getRegistrations().then(regs => {
              for (const reg of regs) {
                reg.unregister();
              }
            });
          } catch (e) {
            console.error('Erro ao limpar service worker:', e);
          }
        }
        
        // Recarrega com timestamp para ignorar qualquer cache
        window.location.href = window.location.pathname + '?nocache=' + Date.now();
        return { default: () => null };
      }
      
      // Limpa para não ficar travado para sempre se o erro persistir
      sessionStorage.removeItem("chunk_refreshed");
      throw error;
    }
  });
}

// Lazy loading pages
const Home = lazyWithRetry(() => import("@/pages/Home"));
const Live = lazyWithRetry(() => import("@/pages/Live"));
const Gallery = lazyWithRetry(() => import("@/pages/Gallery"));
const Admin = lazyWithRetry(() => import("@/pages/Admin"));
const Google = lazyWithRetry(() => import("@/pages/Google"));
const About = lazyWithRetry(() => import("@/pages/About"));
const Bible = lazyWithRetry(() => import("@/pages/Bible"));
const Departments = lazyWithRetry(() => import("@/pages/Departments"));
const Discipleship = lazyWithRetry(() => import("@/pages/Discipleship"));
const EBD = lazyWithRetry(() => import("@/pages/EBD"));
const Favorites = lazyWithRetry(() => import("@/pages/Favorites"));
const Formulario = lazyWithRetry(() => import("@/pages/Formulario"));
const StaticPages = lazyWithRetry(() => import("@/pages/StaticPages"));
import Maintenance from "@/pages/Maintenance";
const EventDetails = lazyWithRetry(() => import("@/pages/EventDetails"));
const NoticiaDetalhe = lazyWithRetry(() => import("@/pages/NoticiaDetalhe"));
const Noticias = lazyWithRetry(() => import("@/pages/Noticias"));
const Solicitacao = lazyWithRetry(() => import("@/pages/Solicitacao"));
const Videos = lazyWithRetry(() => import("@/pages/Videos"));
const RadioPage = lazyWithRetry(() => import("@/pages/Radio"));
const Servicos = lazyWithRetry(() => import("@/pages/Servicos"));
const ResetarSenha = lazyWithRetry(() => import("@/pages/ResetarSenha"));
const ClearCache = lazyWithRetry(() => import("@/pages/ClearCache"));
const Gestao = lazyWithRetry(() => import("@/pages/Gestao"));
const ConfirmarConvite = lazyWithRetry(() => import("@/pages/ConfirmarConvite"));
const Agenda = lazyWithRetry(() => import("@/pages/Agenda"));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isGooglePage = location.pathname === "/google";
  const isSolicitacaoPage = location.pathname.startsWith("/solicitacao");
  const isEventPage = location.pathname.startsWith("/evento/");
  const isResetPage = location.pathname.startsWith("/resetar-senha");

  const { isAdmin, profile, user } = useAuth();
  const isDeveloper = profile?.role?.toLowerCase() === 'desenvolvedor' || user?.email?.toLowerCase().trim() === 'iempministerioprofecia@gmail.com';

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const data = await firestoreService.getDoc<any>("settings", "general", 1000 * 60 * 5); // 5 minutes TTL
        if (data && data.maintenanceMode) {
          setMaintenanceMode(true);
          setMaintenanceMessage(data.maintenanceMessage || "");
        } else {
          setMaintenanceMode(false);
        }
      } catch (err: any) {
        console.error("Error checking maintenance settings", err);
        if (err.message && err.message.toLowerCase().includes("quota")) {
          setMaintenanceMode(true);
        }
      }
    };

    checkMaintenance();
  }, []);

  if (maintenanceMode && !isAdminPage && !isDeveloper) {
    return <Maintenance message={maintenanceMessage} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary pt-[var(--dev-banner-height,0px)] transition-[padding] duration-300">
      {!isAdminPage && !isGooglePage && !isEventPage && !isSolicitacaoPage && !isResetPage && <Navbar />}
      <main className="flex-grow flex flex-col">
        <ErrorBoundary isAdminPage={isAdminPage}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ao-vivo" element={<Live />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/radio" element={<RadioPage />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/formulario" element={<Formulario />} />
              <Route path="/google" element={<Google />} />
              <Route path="/solicitacao" element={<Solicitacao />} />
              <Route path="/evento/:id" element={<EventDetails />} />
              <Route path="/noticia/:id" element={<NoticiaDetalhe />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/quem-somos" element={<About />} />
              <Route path="/biblia" element={<Bible />} />
              <Route path="/departamentos/:dept" element={<Departments />} />
              <Route path="/discipulado" element={<Discipleship />} />
              <Route path="/ebd" element={<EBD />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/resetar-senha" element={<ResetarSenha />} />
              <Route path="/limpar-cache" element={<ClearCache />} />
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/confirmar-convite" element={<ConfirmarConvite />} />
              <Route path="/confirmar-presenca" element={<ConfirmarConvite />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/:page" element={<StaticPages />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdminPage && !isGooglePage && !isSolicitacaoPage && !isResetPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary isAdminPage={false}>
      <AppModalProvider>
        <AuthProvider>
          <FavoritesProvider>
            <RadioProvider>
              <Router>
                <DevBanner />
                <AppContent />
              </Router>
              <GlobalPlayer />
            </RadioProvider>
          </FavoritesProvider>
        </AuthProvider>
      </AppModalProvider>
    </ErrorBoundary>
  );
}
