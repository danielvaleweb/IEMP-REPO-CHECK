import React from "react";
import { MessageCircle } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl max-w-lg w-full border border-black/5">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Processo de Migração</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Estamos aumentando a segurança do nosso site e voltaremos hoje, 13/05/2026, às 20 horas.
          <br /><br />
          Pedimos desculpas pelo transtorno, mas é para o bem de todos!
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
