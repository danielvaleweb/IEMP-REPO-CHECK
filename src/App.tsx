/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Live from "@/pages/Live";
import Gallery from "@/pages/Gallery";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import Bible from "@/pages/Bible";
import Departments from "@/pages/Departments";
import Discipleship from "@/pages/Discipleship";
import EBD from "@/pages/EBD";
import Favorites from "@/pages/Favorites";
import StaticPages from "@/pages/StaticPages";
import { cn } from "@/lib/utils";

import EventDetails from "@/pages/EventDetails";
import NoticiaDetalhe from "@/pages/NoticiaDetalhe";

import Solicitacao from "@/pages/Solicitacao";
import Videos from "@/pages/Videos";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isSolicitacaoPage = location.pathname.startsWith("/solicitacao");
  const isEventPage = location.pathname.startsWith("/evento/");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {!isAdminPage && !isEventPage && !isSolicitacaoPage && <Navbar />}
      <main className={cn("flex-grow", !isHomePage && !isAdminPage && !isEventPage && !isSolicitacaoPage && "pt-20", !isAdminPage && !isEventPage && !isSolicitacaoPage && "pb-20")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ao-vivo" element={<Live />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/solicitacao" element={<Solicitacao />} />
          <Route path="/evento/:id" element={<EventDetails />} />
          <Route path="/noticia/:id" element={<NoticiaDetalhe />} />
          <Route path="/quem-somos" element={<About />} />
          <Route path="/biblia" element={<Bible />} />
          <Route path="/departamentos/:dept" element={<Departments />} />
          <Route path="/discipulado" element={<Discipleship />} />
          <Route path="/ebd" element={<EBD />} />
          <Route path="/:page" element={<StaticPages />} />
        </Routes>
      </main>
      {!isAdminPage && !isSolicitacaoPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
          <AppContent />
        </Router>
      </FavoritesProvider>
    </AuthProvider>
  );
}


