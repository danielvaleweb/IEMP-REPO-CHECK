import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  isDark?: boolean;
}

export default function Logo({ className, isDark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] flex items-center justify-center shadow-lg shadow-[#BF76FF]/20 transform group-hover:rotate-12 transition-transform duration-500">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-6 h-6 text-white"
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 3v18" />
            <path d="M17.17 7.76a9 9 0 1 0-10.34 0" />
            <path d="M12 11h.01" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div className="w-1.5 h-1.5 bg-[#BF76FF] rounded-full animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn("font-black text-xl tracking-tighter uppercase italic", isDark ? "text-white" : "text-black")}>
          Profecia
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 ml-0.5">
          Ministério
        </span>
      </div>
    </div>
  );
}
