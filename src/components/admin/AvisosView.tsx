import React, { useState, useEffect } from "react";
import { Bell, Send, Calendar, Clock, Users, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AvisosView({ isDark }: { isDark?: boolean }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSendImmediate = async () => {
    if (!title || !message) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/backend/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, target })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}: ${errorText}`);
        throw new Error(`Servidor retornou ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setTitle("");
        setMessage("");
        alert(`Disparo realizado com sucesso para ${data.sent} dispositivos!`);
      } else {
        alert("Erro ao enviar: " + data.message);
      }
    } catch (error: any) {
      console.error(error);
      alert("Erro na conexão: " + (error.message || "Verifique o console"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!title || !message || !scheduledAt) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title,
        message,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: "pending",
        target,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setMessage("");
      setScheduledAt("");
      alert("Notificação agendada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao agendar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (confirm("Deseja realmente excluir este aviso?")) {
      await deleteDoc(doc(db, "announcements", id));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-[#BF76FF]" />
        </div>
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>Central de Avisos</h2>
          <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>Envie notificações push para o aplicativo móvel e Web</p>
          <div className="flex gap-2 mt-2">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", isDark ? "border-white/10 text-white/40" : "border-black/5 text-gray-400")}>
              Web Push: {('serviceWorker' in navigator) ? 'Suportado' : 'Não Suportado'}
            </span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", isDark ? "border-white/10 text-white/40" : "border-black/5 text-gray-400")}>
              VAPID: {(import.meta as any).env.VITE_FIREBASE_VAPID_KEY ? 'Configurado' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className={cn("p-6 rounded-[32px] border", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <h3 className={cn("font-bold mb-6 flex items-center gap-2", isDark ? "text-white" : "text-black")}>
              <Send className="w-4 h-4 text-[#BF76FF]" /> Novo Disparo
            </h3>

            <div className="space-y-4">
              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Título</label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Novo Evento Confirmado!"
                  className={cn("h-12 rounded-2xl border transition-all", isDark ? "bg-black border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                />
              </div>

              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Mensagem</label>
                <Textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva o alerta..."
                  className={cn("min-h-[100px] rounded-2xl border transition-all", isDark ? "bg-black border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setTarget("all")}
                  variant={target === "all" ? "default" : "outline"}
                  className={cn("h-12 rounded-2xl font-bold transition-all border", target === "all" ? "bg-[#BF76FF] hover:bg-[#a656f0] text-white" : isDark ? "bg-black border-white/5 text-white placeholder:text-gray-500 hover:text-white" : "bg-white border-black/5 text-black hover:text-black")}
                >
                  Para Todos
                </Button>
                <Button 
                  onClick={() => setTarget("specific")}
                  variant={target === "specific" ? "default" : "outline"}
                  className={cn("h-12 rounded-2xl font-bold transition-all border", target === "specific" ? "bg-amber-500 text-white" : isDark ? "bg-black border-white/5 text-white placeholder:text-gray-500 hover:text-white" : "bg-white border-black/5 text-black hover:text-black")}
                  disabled
                >
                  Segmentado
                </Button>
              </div>

              <div className={cn("pt-4 border-t border-dashed", isDark ? "border-white/10" : "border-black/5")}>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Agendar para o Futuro (Opcional)</label>
                <Input 
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={cn("h-12 rounded-2xl border transition-all", isDark ? "bg-black border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button 
                  onClick={handleSendImmediate}
                  disabled={isSubmitting || !!scheduledAt || !title || !message}
                  className="h-14 rounded-[20px] bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white font-black uppercase tracking-widest shadow-xl shadow-[#BF76FF]/20"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Disparar Agora"}
                </Button>

                {scheduledAt && (
                  <Button 
                    onClick={handleSchedule}
                    disabled={isSubmitting || !title || !message}
                    variant="ghost"
                    className={cn("h-14 rounded-[20px] border border-[#BF76FF]/30 text-[#BF76FF] hover:bg-[#BF76FF]/5 font-black uppercase tracking-widest transition-all", isDark ? "bg-[#BF76FF]/10" : "")}
                  >
                    Agendar Envio
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className={cn("p-6 rounded-[32px] border min-h-[500px]", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Histórico & Fila</h3>
              <div className="bg-[#BF76FF]/10 text-[#BF76FF] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {announcements.length} Disparos
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#BF76FF]" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 opacity-20">
                <Bell className="w-16 h-16 mb-4 text-[#BF76FF]" />
                <p className="font-bold">Nenhuma notificação enviada ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className={cn("p-5 rounded-[24px] border flex items-center justify-between group transition-all", isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-black/5 hover:shadow-md")}>
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", 
                        ann.status === "sent" ? "bg-green-500/10 text-green-500" : "bg-[#BF76FF]/10 text-[#BF76FF]"
                      )}>
                        {ann.status === "sent" ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-base leading-tight", isDark ? "text-white/90" : "text-black")}>{ann.title}</h4>
                        <p className={cn("text-xs mt-1 line-clamp-1", isDark ? "text-white/40" : "text-gray-500")}>{ann.message}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className={cn("text-[10px] font-bold flex items-center gap-1.5", isDark ? "text-white/30" : "text-gray-400")}>
                            <Calendar className="w-3.5 h-3.5" /> 
                            {ann.sentAt 
                              ? format(new Date(ann.sentAt), "dd/MM 'às' HH:mm", { locale: ptBR })
                              : format(new Date(ann.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })
                            }
                          </span>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", 
                            ann.status === "sent" ? "text-green-500" : "text-[#BF76FF]"
                          )}>
                            {ann.status === "sent" ? "● Enviado" : "● Agendado"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
