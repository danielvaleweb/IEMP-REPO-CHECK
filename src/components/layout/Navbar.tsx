import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut,
  LogIn,
  Heart,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { motion, AnimatePresence } from "framer-motion";

const menuGroups = [
  {
    name: "Igreja",
    items: [
      { name: "Agenda", path: "/agenda" },
      { name: "Quem Somos", path: "/quem-somos" },
      { name: "Discipulado", path: "/discipulado" },
      { name: "EBD", path: "/ebd" },
    ]
  },
  {
    name: "Conteúdo",
    items: [
      { name: "Bíblia Online", path: "/biblia" },
      { name: "Galeria de fotos", path: "/galeria" },
      { name: "Galeria de Vídeos", path: "/#videos" },
    ]
  },
  {
    name: "Conecte-se",
    items: [
      { name: "Pedidos de Oração", path: "/oracao" },
      { name: "Fale conosco", path: "/contato" },
      { name: "Localização", path: "/#localizacao" },
    ]
  }
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  const location = useLocation();
  const { user, login, logout, isAdmin } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (location.pathname === "/admin") {
    return null;
  }

  return (
    <>
      <nav className={cn(
        "fixed top-6 left-0 right-0 z-50 transition-all duration-500 px-6",
        isScrolled ? "translate-y-0" : "translate-y-0"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <span className="text-white font-extralight text-xl tracking-tight opacity-100">Ministério</span>
            <span className="text-white font-bold text-xl tracking-tight ml-1.5 opacity-100">Profecia</span>
          </Link>

          {/* Desktop Nav - Centered Pill */}
          <div className="hidden lg:flex items-center bg-[#0f0d11] border border-white/10 rounded-full p-1.5 shadow-2xl">
            <Link
              to="/"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 text-white opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              )}
            >
              Início
            </Link>

            {menuGroups.map((group) => (
              <div 
                key={group.name}
                onMouseEnter={() => setOpenMenu(group.name)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <DropdownMenu open={openMenu === group.name} onOpenChange={(open) => !open && setOpenMenu(null)}>
                  <DropdownMenuTrigger
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1 outline-none",
                      group.items.some(item => location.pathname === item.path)
                        ? "text-white opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        : "text-white/60 hover:text-white hover:opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    )}
                  >
                    {group.name} <ChevronDown className="w-4 h-4 opacity-40" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" sideOffset={0} className="bg-[#0f0d11] border-white/10 text-white min-w-[200px] rounded-2xl p-2 shadow-2xl">
                    {group.items.map((item) => (
                      <DropdownMenuItem 
                        key={item.path} 
                        render={<Link to={item.path} />} 
                        nativeButton={false}
                        className={cn(
                          "rounded-xl cursor-pointer py-3 px-4 transition-all duration-300 outline-none",
                          "focus:bg-transparent focus:!text-white hover:bg-transparent hover:!text-white",
                          location.pathname === item.path
                            ? "!text-white opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                            : "text-white/60 hover:opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] focus:opacity-100 focus:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        )}
                      >
                        {item.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {/* Right Side - Auth & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Favorites Icon in Navbar */}
            <Link to="/favoritos" className="relative p-2 text-white hover:bg-white/5 rounded-xl transition-all group cursor-pointer outline-none">
              <Heart className="w-6 h-6 fill-white stroke-white" />
              {favorites.length > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px]">
                  {/* External Pulse Effect */}
                  <motion.span
                    animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-[#BF76FF] rounded-full"
                  />
                  {/* Main Counter */}
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full bg-[#BF76FF] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border border-white/20"
                  >
                    {favorites.length}
                  </motion.span>
                </div>
              )}
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 bg-[#0f0d11] border border-white/10 rounded-full p-1 pr-4 hover:bg-white/5 transition-all"
                >
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.displayName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white/80 hidden sm:block">{user.displayName?.split(' ')[0]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#0f0d11] border-white/10 text-white rounded-2xl mt-4 p-2 shadow-2xl" align="end">
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-white/40">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem render={<Link to="/perfil" />} nativeButton={false} className="rounded-xl focus:bg-white/10 hover:bg-white/10 focus:!text-white hover:!text-white py-3 px-4 transition-colors">
                    Meu Perfil
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem render={<Link to="/admin" />} nativeButton={false} className="rounded-xl focus:bg-white/10 hover:bg-white/10 focus:!text-white hover:!text-white py-3 px-4 text-primary transition-colors">
                      Painel Administrativo
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl focus:bg-red-500/10 hover:bg-red-500/10 focus:!text-red-500 hover:!text-red-500 cursor-pointer py-3 px-4 text-red-500 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={login} 
                className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-11 font-bold transition-all active:scale-95 shadow-xl shadow-white/10 hidden md:flex"
              >
                Login
              </Button>
            )}

            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger
                  className="text-white hover:bg-white/10 rounded-full h-10 w-10 flex items-center justify-center transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#0f0d11] border-white/10 text-white w-[85%] sm:w-[400px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-white/10">
                      <SheetTitle className="flex items-center">
                        <span className="text-white font-extralight text-xl tracking-tight">Ministério</span>
                        <span className="text-white font-bold text-xl tracking-tight ml-1.5">Profecia</span>
                      </SheetTitle>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <Link
                        to="/"
                        className={cn(
                          "block text-xl font-medium transition-all duration-300",
                          location.pathname === "/" 
                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                            : "text-white/60"
                        )}
                      >
                        Início
                      </Link>
                      
                      {menuGroups.map((group) => (
                        <div key={group.name} className="space-y-3">
                          <button 
                            onClick={() => setMobileMenuOpen(mobileMenuOpen === group.name ? null : group.name)}
                            className="flex items-center justify-between w-full text-xl font-medium text-white/60 hover:text-white transition-colors"
                          >
                            {group.name}
                            <ChevronRight className={cn(
                              "w-5 h-5 transition-transform duration-300",
                              mobileMenuOpen === group.name ? "rotate-90" : ""
                            )} />
                          </button>
                          
                          <AnimatePresence>
                            {mobileMenuOpen === group.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden flex flex-col gap-3 pl-4 border-l border-white/10"
                              >
                                {group.items.map((item) => (
                                  <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                      "text-lg font-medium transition-all duration-300",
                                      location.pathname === item.path
                                        ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                        : "text-white/40 hover:text-white"
                                    )}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/20">
                      {!user ? (
                        <Button onClick={login} className="w-full bg-white text-black hover:bg-white/90 rounded-full h-12 font-bold shadow-xl shadow-white/5">
                          Login
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-white/5">
                            <Avatar className="h-10 w-10 border border-white/20">
                              <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                              <AvatarFallback className="bg-primary/20 text-primary">{user.displayName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold truncate">{user.displayName}</span>
                              <span className="text-[10px] text-white/40 truncate">{user.email}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button render={<Link to="/perfil" />} variant="outline" className="rounded-full border-white/10 h-11 text-sm">
                              Perfil
                            </Button>
                            <Button onClick={logout} variant="ghost" className="rounded-full text-red-500 hover:bg-red-500/10 h-11 text-sm">
                              Sair
                            </Button>
                          </div>
                          {isAdmin && (
                            <Button render={<Link to="/admin" />} className="w-full rounded-full bg-primary/20 text-primary hover:bg-primary/30 h-11 text-sm border border-primary/20">
                              Painel Admin
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
