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

// Lazy loading pages
const Home = lazy(() => import("@/pages/Home"));
const Live = lazy(() => import("@/pages/Live"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const Admin = lazy(() => import("@/pages/Admin"));
const Google = lazy(() => import("@/pages/Google"));
const About = lazy(() => import("@/pages/About"));
const Bible = lazy(() => import("@/pages/Bible"));
const Departments = lazy(() => import("@/pages/Departments"));
const Discipleship = lazy(() => import("@/pages/Discipleship"));
const EBD = lazy(() => import("@/pages/EBD"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Formulario = lazy(() => import("@/pages/Formulario"));
const StaticPages = lazy(() => import("@/pages/StaticPages"));
import Maintenance from "@/pages/Maintenance";
const EventDetails = lazy(() => import("@/pages/EventDetails"));
const NoticiaDetalhe = lazy(() => import("@/pages/NoticiaDetalhe"));
const Noticias = lazy(() => import("@/pages/Noticias"));
const Solicitacao = lazy(() => import("@/pages/Solicitacao"));
const Videos = lazy(() => import("@/pages/Videos"));
const RadioPage = lazy(() => import("@/pages/Radio"));
const Servicos = lazy(() => import("@/pages/Servicos"));
const ResetarSenha = lazy(() => import("@/pages/ResetarSenha"));

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
        const data = await firestoreService.getDoc<any>("settings", "general", 1000 * 60 * 60); // 1 hour TTL
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
