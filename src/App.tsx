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

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isEventPage = location.pathname.startsWith("/evento/") || location.pathname.startsWith("/noticia/");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {!isAdminPage && !isEventPage && <Navbar />}
      <main className={cn("flex-grow", !isHomePage && !isAdminPage && !isEventPage && "pt-20", !isAdminPage && !isEventPage && "pb-20")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ao-vivo" element={<Live />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/admin" element={<Admin />} />
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
      {!isAdminPage && <Footer />}
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


