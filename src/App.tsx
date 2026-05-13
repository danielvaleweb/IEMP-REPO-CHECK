/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { RadioProvider } from "@/contexts/RadioContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalPlayer from "@/components/GlobalPlayer";
import Home from "@/pages/Home";
import Live from "@/pages/Live";
import Gallery from "@/pages/Gallery";
import Admin from "@/pages/Admin";
import Google from "@/pages/Google";
import About from "@/pages/About";
import Bible from "@/pages/Bible";
import Departments from "@/pages/Departments";
import Discipleship from "@/pages/Discipleship";
import EBD from "@/pages/EBD";
import Favorites from "@/pages/Favorites";
import Formulario from "@/pages/Formulario";
import StaticPages from "@/pages/StaticPages";
import Maintenance from "@/pages/Maintenance";
import { cn } from "@/lib/utils";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { firestoreService } from "@/services/firestoreService";

import EventDetails from "@/pages/EventDetails";
import NoticiaDetalhe from "@/pages/NoticiaDetalhe";

import Solicitacao from "@/pages/Solicitacao";
import Videos from "@/pages/Videos";
import RadioPage from "@/pages/Radio";
import Servicos from "@/pages/Servicos";

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isGooglePage = location.pathname === "/google";
  const isSolicitacaoPage = location.pathname.startsWith("/solicitacao");
  const isEventPage = location.pathname.startsWith("/evento/");

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const data = await firestoreService.getDoc<any>("settings", "general", 1000 * 60 * 60); // 1 hour TTL
        if (data && data.maintenanceMode) {
          setMaintenanceMode(true);
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

  if (maintenanceMode && !isAdminPage) {
    return <Maintenance />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {!isAdminPage && !isGooglePage && !isEventPage && !isSolicitacaoPage && <Navbar />}
      <main className="flex-grow flex flex-col">
        <ErrorBoundary isAdminPage={isAdminPage}>
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
            <Route path="/quem-somos" element={<About />} />
            <Route path="/biblia" element={<Bible />} />
            <Route path="/departamentos/:dept" element={<Departments />} />
            <Route path="/discipulado" element={<Discipleship />} />
            <Route path="/ebd" element={<EBD />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/:page" element={<StaticPages />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {!isAdminPage && !isGooglePage && !isSolicitacaoPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary isAdminPage={false}>
      <AuthProvider>
        <FavoritesProvider>
          <RadioProvider>
            <Router>
              <AppContent />
            </Router>
            <GlobalPlayer />
          </RadioProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
