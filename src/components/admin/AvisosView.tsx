import React, { useState } from "react";
import { Bell, Send, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Componente simplificado para geração e envio de avisos via Push Notification.
 * Conforme solicitado: Título, Mensagem, Campo de Imagem e Botão de Envio.
 */
export function AvisosView({ isDark }: { isDark?: boolean }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSendingPush, setIsSendingPush] = useState(false);

  const handleSendPush = async () => {
    if (!title || !message) {
      alert("Por favor, preencha o título e a mensagem.");
      return;
    }

    if (!window.confirm("Isso enviará uma notificação para TODOS os membros. Deseja continuar?")) return;

    setIsSendingPush(true);
    try {
      const res = await fetch("/backend/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          message: message,
          image: imageUrl,
          target: "all"
        })
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro do servidor (${res.status}): ${text.substring(0, 100)}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error("O servidor não retornou JSON. Verifique se o backend está rodando corretamente.");
      }

      const data = await res.json();
      
      if (data.success) {
        alert("Sucesso! Notificação disparada para todos os dispositivos.");
        // Limpa os campos após o envio
        setTitle("");
        setMessage("");
        setImageUrl("");
      } else {
        alert("Erro ao enviar: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao enviar push:", error);
      alert("Falha na conexão com o servidor de notificações.");
    } finally {
      setIsSendingPush(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
          <Bell className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h2 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>
            Gerador de Aviso
          </h2>
          <p className={cn("text-base opacity-60 font-medium", isDark ? "text-white" : "text-gray-600")}>
            Envie notificações instantâneas para todos os membros do aplicativo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Formulário Principal */}
        <div className={cn(
          "p-8 rounded-[40px] border transition-all",
          isDark 
            ? "bg-[#121212] border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
            : "bg-white border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
        )}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2", isDark ? "text-white/30" : "text-gray-400")}>
                Título da Mensagem
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Culto de Celebração Hoje"
                className={cn(
                  "h-14 rounded-2xl border-2 bg-transparent px-6 text-lg font-bold transition-all focus:ring-0",
                  isDark ? "border-white/5 focus:border-blue-500/50 text-white" : "border-gray-100 focus:border-blue-500/30 text-black"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2", isDark ? "text-white/30" : "text-gray-400")}>
                Mensagem do Aviso
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva o que os membros devem saber..."
                className={cn(
                  "min-h-[180px] rounded-2xl border-2 bg-transparent p-6 text-base font-medium transition-all focus:ring-0 resize-none",
                  isDark ? "border-white/5 focus:border-blue-500/50 text-white" : "border-gray-100 focus:border-blue-500/30 text-black"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] ml-2", isDark ? "text-white/30" : "text-gray-400")}>
                URL da Imagem (Opcional)
              </label>
              <div className="relative">
                <ImageIcon className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5", isDark ? "text-white/20" : "text-gray-400")} />
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://suaimagem.com/foto.jpg"
                  className={cn(
                    "h-14 pl-14 rounded-2xl border-2 bg-transparent px-6 font-medium transition-all focus:ring-0",
                    isDark ? "border-white/5 focus:border-blue-500/50 text-white" : "border-gray-100 focus:border-blue-500/30 text-black"
                  )}
                />
              </div>
            </div>

            <Button
              onClick={handleSendPush}
              disabled={isSendingPush || !title || !message}
              className={cn(
                "w-full h-16 rounded-[28px] text-white font-black text-xl shadow-2xl transition-all active:scale-95 group",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
                "disabled:opacity-50 disabled:grayscale"
              )}
            >
              {isSendingPush ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-3">
                  Enviar Push Notification
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Visualização da Notificação */}
        <div className="hidden lg:block space-y-6 sticky top-6">
          <div className={cn(
            "p-8 rounded-[40px] border relative overflow-hidden flex flex-col",
            isDark ? "bg-black/20 border-white/5" : "bg-gray-50 border-black/5"
          )}>
            <h3 className={cn("text-xs font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2", isDark ? "text-white/40" : "text-gray-400")}>
              <AlertCircle className="w-4 h-4" /> Preview no Celular
            </h3>

            <div className={cn(
              "w-full rounded-3xl p-6 shadow-2xl space-y-4",
              isDark ? "bg-[#1A1A1A] border border-white/10" : "bg-white border border-gray-100"
            )}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-black text-lg truncate", isDark ? "text-white" : "text-black")}>
                    {title || "Título do Aviso"}
                  </p>
                  <p className={cn("text-sm line-clamp-3 mt-1", isDark ? "text-white/60" : "text-gray-600")}>
                    {message || "O conteúdo da sua mensagem aparecerá aqui para os usuários."}
                  </p>
                </div>
              </div>
              
              {imageUrl && (
                <div className="w-full h-44 rounded-2xl overflow-hidden mt-2 relative group shadow-lg">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
              )}
            </div>

            <div className="mt-10">
              <div className={cn("p-4 rounded-2xl border-2 border-dashed", isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-100/50")}>
                <p className={cn("text-xs text-center font-bold opacity-40 leading-relaxed", isDark ? "text-white" : "text-black")}>
                  A aparência final da notificação depende do dispositivo do usuário (Android ou iOS).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
