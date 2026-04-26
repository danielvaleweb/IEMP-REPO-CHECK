import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Check, Clock, ShieldCheck, LogIn } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";

export default function Solicitacao() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const status = profile?.status || "pending";
  const isRejected = status === "rejected" || status === "reprovado";
  const isApproved = status === "approved" || status === "active" || status === "aprovado";
  
  // Níveis de progresso
  const steps = [
    { title: "Cadastro efetuado", icon: Check, completed: true },
    { title: "Verificação de dados", icon: Clock, completed: isApproved || isRejected },
    { title: "Aprovação", icon: ShieldCheck, completed: isApproved }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6">
      <div className="max-w-md w-full mx-auto flex flex-col h-full pt-12 pb-20">
        <Link to="/admin" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-8 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tighter uppercase">Minha <span className="text-[#BF76FF]">Solicitação</span></h1>
          <p className="text-gray-400">Acompanhe em tempo real o status da sua aprovação.</p>
        </div>

        <div className="space-y-8 relative">
          {/* Linha conectora */}
          <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-white/5 -z-10" />

          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isCurrent = (index === 1 && status === "pending");
            const isPointRejected = index >= 1 && isRejected;

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-6"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isPointRejected
                    ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : isCompleted 
                      ? "bg-[#25D366] text-black shadow-[0_0_20px_rgba(37,211,102,0.3)]" 
                      : isCurrent
                        ? "bg-[#BF76FF]/20 text-[#BF76FF] animate-pulse"
                        : "bg-white/5 text-gray-600"
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold uppercase tracking-widest text-sm ${isPointRejected ? "text-red-500" : isCompleted ? "text-white" : "text-gray-500"}`}>
                    Passo {index + 1}
                  </h3>
                  <p className={`text-lg font-medium ${isPointRejected ? "text-red-500" : isCompleted ? "text-[#25D366]" : isCurrent ? "text-[#BF76FF]" : "text-gray-600"}`}>
                    {isPointRejected && index === 1 ? "Cadastro Reprovado" : step.title}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20">
          {isApproved ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-[#25D366]/10 border border-[#25D366]/20 p-6 rounded-3xl text-center">
                <p className="text-[#25D366] font-bold mb-2 uppercase tracking-tighter text-xl">Parabéns! Cadastro Aprovado</p>
                <p className="text-gray-400 text-sm">Seu acesso foi liberado com sucesso. Clique no botão abaixo para entrar.</p>
              </div>
              <Button 
                onClick={() => navigate("/admin")}
                className="w-full h-16 bg-[#BF76FF] hover:bg-[#a656f0] text-white font-black uppercase tracking-tighter text-lg rounded-2xl shadow-xl shadow-[#BF76FF]/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <LogIn className="w-6 h-6" />
                Acessar Painel
              </Button>
            </motion.div>
          ) : isRejected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center">
                <p className="text-red-500 font-bold mb-2 uppercase tracking-tighter text-xl">Solicitação Reprovada</p>
                <p className="text-gray-400 text-sm">{profile?.rejectReason || "Infelizmente sua solicitação não foi aprovada neste momento."}</p>
              </div>
              <Button 
                onClick={async () => {
                  await logout();
                  navigate("/admin");
                }}
                className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-tighter text-lg rounded-2xl transition-all cursor-pointer"
              >
                Sair
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#BF76FF]/10 border border-[#BF76FF]/20 p-6 rounded-3xl text-center shadow-[0_0_50px_rgba(191,118,255,0.05)]">
                <p className="text-[#BF76FF] font-bold mb-2 uppercase tracking-tighter text-xl">Em Análise</p>
                <p className="text-gray-400 text-sm italic">"Você será notificado em breve no seu App ou por Whatsapp"</p>
              </div>
              <Button 
                onClick={async () => {
                  await logout();
                  navigate("/admin");
                }}
                variant="outline"
                className="w-full h-14 border-white/10 text-gray-400 hover:bg-white/5 rounded-2xl font-bold uppercase tracking-tighter cursor-pointer"
              >
                Voltar à Página Inicial
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
