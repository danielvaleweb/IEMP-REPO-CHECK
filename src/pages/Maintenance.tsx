import React from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { VirtualAssistant } from "@/components/admin/VirtualAssistant";

export default function Maintenance({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-roxo-bg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#BF76FF]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg w-full border border-white/10 relative z-10 transition-all hover:border-white/20">
        <div className="w-20 h-20 bg-[#BF76FF]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(191,118,255,0.3)]">
          <ShieldCheck className="w-10 h-10 text-[#BF76FF] animate-pulse" strokeWidth={2} />
        </div>

        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Manutenção Programada</h1>
        <p className="text-gray-300 mb-8 text-lg whitespace-pre-wrap font-medium">
          {message || "Estamos trabalhando para melhorar a segurança e o desempenho do nosso site.\n\nVoltaremos em breve. Agradecemos a compreensão de todos!"}
        </p>

        <div className="bg-[#BF76FF]/10 rounded-2xl p-6 border border-[#BF76FF]/20">
          <p className="text-xs font-black text-[#BF76FF] uppercase tracking-widest mb-4">Dúvidas ou Suporte?</p>
          <a
            href="https://wa.me/5532999194640"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#BF76FF] to-[#E684FF] hover:opacity-90 text-white py-4 px-6 rounded-xl font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(191,118,255,0.3)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(191,118,255,0.5)]"
          >
            <MessageCircle className="w-5 h-5" />
            Fale Conosco
          </a>
        </div>
      </div>
      
      <VirtualAssistant isDarkMode={true} loginMode={true} />
    </div>
  );
}
