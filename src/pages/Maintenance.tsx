import React from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl max-w-lg w-full border border-black/5">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-blue-500" strokeWidth={2} />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Processo de Migração</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Estamos aumentando a segurança do nosso site e voltaremos hoje, 13/05/2026, às 20 horas.
          <br /><br />
          Agradecemos a compreensão de todos!
        </p>

        <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/20">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Informações e Fotos</p>
          <a
            href="https://wa.me/5532999194640"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-[#00A859] hover:bg-[#008A49] text-white py-4 px-6 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,168,89,0.3)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,168,89,0.5)]"
          >
            <MessageCircle className="w-5 h-5" />
            (32) 99919-4640
          </a>
        </div>
      </div>
    </div>
  );
}
