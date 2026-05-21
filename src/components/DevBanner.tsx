import { useState, useEffect } from "react";
import { Terminal, EyeOff, AlertTriangle } from "lucide-react";

export default function DevBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if we are running in localhost or local network IPs
  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local");

    if (isLocal) {
      setIsVisible(true);
      const savedCollapsed = localStorage.getItem("dev-banner-collapsed");
      if (savedCollapsed === "true") {
        setIsCollapsed(true);
      }
    }
  }, []);

  // Update layout spacing dynamically through a CSS variable
  useEffect(() => {
    if (isVisible && !isCollapsed) {
      document.documentElement.style.setProperty("--dev-banner-height", "36px");
    } else {
      document.documentElement.style.setProperty("--dev-banner-height", "0px");
    }
    return () => {
      document.documentElement.style.setProperty("--dev-banner-height", "0px");
    };
  }, [isVisible, isCollapsed]);

  const handleCollapse = () => {
    setIsCollapsed(true);
    localStorage.setItem("dev-banner-collapsed", "true");
  };

  const handleExpand = () => {
    setIsCollapsed(false);
    localStorage.setItem("dev-banner-collapsed", "false");
  };

  if (!isVisible) return null;

  if (isCollapsed) {
    return (
      <button
        onClick={handleExpand}
        className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.4)] border border-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95 group font-medium text-xs tracking-wider uppercase"
        title="Expandir Faixa de Desenvolvimento"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <Terminal className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
        <span>Dev Mode</span>
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-9 z-[99999] bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white flex items-center justify-between px-4 text-xs font-semibold select-none shadow-[0_2px_15px_rgba(239,68,68,0.35)] transition-all duration-300">
      {/* Background Micro-shimmer Effect */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-[shimmer_8s_infinite] pointer-events-none" />

      {/* Left Info Section */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="flex items-center justify-center bg-white/20 p-1 rounded-sm animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="hidden sm:inline tracking-wider uppercase font-bold text-[10px]">
          Ambiente Local de Desenvolvimento
        </span>
        <span className="inline sm:hidden tracking-wider uppercase font-bold text-[10px]">
          Modo Dev
        </span>
      </div>

      {/* Center Details */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-90 relative z-10 text-[10px] tracking-widest uppercase">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
        </span>
        <span>host: <span className="font-mono text-white/95 lowercase">{window.location.hostname}</span></span>
      </div>

      {/* Right Controls */}
      <button
        onClick={handleCollapse}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white px-2 py-1 rounded-sm transition-all border border-white/5 active:scale-95 relative z-10 text-[10px] tracking-wider uppercase cursor-pointer"
        title="Minimizar Faixa"
      >
        <EyeOff className="w-3 h-3" />
        <span className="hidden md:inline">Minimizar</span>
      </button>
    </div>
  );
}
