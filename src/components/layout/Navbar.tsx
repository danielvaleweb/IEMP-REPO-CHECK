import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(!isHomePage);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  const { user, login, logout, isAdmin, error: authError, clearError, loading: authLoading } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authError, clearError]);

  useEffect(() => {
    console.log("DEBUG Navbar: Usuário atual:", user?.email, "Admin:", isAdmin);
  }, [user, isAdmin]);

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[100] w-full py-4",
        isHomePage ? "transition-all duration-700" : "",
        isScrolled ? "bg-black/90 backdrop-blur-md shadow-lg" : "bg-transparent"
      )}>
        {authError && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-2xl z-[110]"
          >
            {authError}
          </motion.div>
        )}
        <div className="w-full px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-white font-extralight text-xl tracking-tight">Ministério</span>
            <span className="text-white font-bold text-xl tracking-tight ml-1.5">Profecia</span>
          </Link>

          {/* Desktop Nav - Centered */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all duration-300 text-white hover:text-primary",
                location.pathname === "/" ? "opacity-100" : "opacity-70 hover:opacity-100"
              )}
            >
              Início
            </Link>

            {menuGroups.map((group) => (
              <div 
                key={group.name}
                className="relative"
                onMouseEnter={() => handleMouseEnter(group.name)}
                onMouseLeave={handleMouseLeave}
              >
                <button className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-1 outline-none",
                  group.items.some(item => location.pathname === item.path)
                    ? "text-white opacity-100"
                    : "text-white opacity-70 hover:opacity-100 hover:text-white"
                )}>
                  {group.name} <ChevronDown className={cn("w-4 h-4 opacity-40 transition-transform duration-200", openMenu === group.name && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {openMenu === group.name && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 min-w-[200px] z-50"
                    >
                      <div className={cn(
                        "text-white rounded-xl p-2 shadow-2xl backdrop-blur-xl transition-colors duration-700",
                        isScrolled ? "bg-black/90" : "bg-transparent"
                      )}>
                        {group.items.map((item) => (
                          <Link 
                            key={item.path} 
                            to={item.path}
                            onClick={() => setOpenMenu(null)}
                            className={cn(
                              "block rounded-lg cursor-pointer py-3 px-4 transition-all duration-300 outline-none",
                              "focus:bg-white/10 focus:text-white hover:bg-white/10 hover:text-white",
                              location.pathname === item.path
                                ? "text-white opacity-100 bg-white/5"
                                : "text-white/60"
                            )}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Side - Icons Only (Minimalist) */}
          <div className="flex items-center gap-4 md:gap-6">
            {isAdmin && (
              <Link 
                to="/admin" 
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#BF76FF]/10 text-[#BF76FF] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#BF76FF]/20 transition-all border border-[#BF76FF]/20"
              >
                Dashboard
              </Link>
            )}

            {/* Favorites Icon - Only if has items */}
            {favorites.length > 0 && (
              <Link to="/favoritos" className="relative p-2 text-white/90 hover:text-white transition-all group cursor-pointer outline-none">
                <Heart className="w-6 h-6 fill-white stroke-white" />
                <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px]">
                  <motion.span
                    animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-[#BF76FF] rounded-full"
                  />
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full bg-[#BF76FF] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border border-white/20"
                  >
                    {favorites.length}
                  </motion.span>
                </div>
              </Link>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity outline-none group">
                      <div className="text-right hidden xl:block">
                        <p className="text-sm font-bold text-white leading-none">{user.displayName?.split(' ')[0]}</p>
                      </div>
                      <Avatar className="h-9 w-9 border border-white/20 group-hover:border-[#BF76FF]/50 transition-colors">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.displayName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </button>
                  }
                />
                <DropdownMenuContent className="w-56 bg-black border-white/10 text-white rounded-xl mt-4 p-2 shadow-2xl" align="end">
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-white/40">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem render={<Link to="/admin" />} className="rounded-lg focus:bg-white/10 hover:bg-white/10 focus:!text-white hover:!text-white py-3 px-4 transition-colors">
                    Acessar Painel
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/perfil" />} className="rounded-lg focus:bg-white/10 hover:bg-white/10 focus:!text-white hover:!text-white py-3 px-4 transition-colors">
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="rounded-lg focus:bg-red-500/10 hover:bg-red-500/10 focus:!text-red-500 hover:!text-red-500 cursor-pointer py-3 px-4 text-red-500 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link 
                to="/admin" 
                className="text-white hover:bg-white/10 rounded-full px-6 h-10 font-bold border border-white/10 flex items-center gap-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Área de Membro</span>
              </Link>
            )}

            {/* Menu Toggle */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10 rounded-full">
                      <Menu className="w-6 h-6" />
                    </Button>
                  }
                />
                <SheetContent side="right" className="bg-black border-white/10 text-white w-[85%] sm:w-[400px] p-0">
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
                          ? "text-white" 
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
                                      ? "text-white"
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
                      <Link 
                        to="/admin" 
                        className="w-full bg-white text-black hover:bg-white/90 rounded-full h-12 font-bold shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                      >
                        Área de Membro
                      </Link>
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
                          <Button render={<Link to="/admin" />} variant="outline" className="rounded-full border-white/10 h-11 text-sm">
                            Acessar Painel
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
