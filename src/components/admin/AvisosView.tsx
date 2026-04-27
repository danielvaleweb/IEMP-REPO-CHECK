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
      const response = await fetch("/services/push/broadcast", {
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
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-black")}>Central de Avisos</h2>
          <p className="text-sm text-gray-500">Envie notificações push para o aplicativo móvel e Web</p>
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
          <div className={cn("p-6 rounded-3xl border", isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <h3 className={cn("font-bold mb-6 flex items-center gap-2", isDark ? "text-white" : "text-black")}>
              <Send className="w-4 h-4 text-[#BF76FF]" /> Novo Disparo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Título</label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Novo Evento Confirmado!"
                  className={cn("h-12 rounded-xl", isDark ? "bg-white/5 border-white/10" : "bg-gray-50")}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Mensagem</label>
                <Textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva o alerta..."
                  className={cn("min-h-[100px] rounded-xl", isDark ? "bg-white/5 border-white/10" : "bg-gray-50")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setTarget("all")}
                  variant={target === "all" ? "default" : "outline"}
                  className={cn("h-12 rounded-xl font-bold transition-all", target === "all" && "bg-[#BF76FF] hover:bg-[#a656f0]")}
                >
                  Para Todos
                </Button>
                <Button 
                  onClick={() => setTarget("specific")}
                  variant={target === "specific" ? "default" : "outline"}
                  className={cn("h-12 rounded-xl font-bold transition-all", target === "specific" && "bg-amber-500 hover:bg-amber-600")}
                  disabled
                >
                  Segmentado
                </Button>
              </div>

              <div className="pt-4 border-t border-dashed border-white/10">
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Agendar para o Futuro (Opcional)</label>
                <Input 
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={cn("h-12 rounded-xl", isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50")}
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button 
                  onClick={handleSendImmediate}
                  disabled={isSubmitting || !!scheduledAt || !title || !message}
                  className="h-14 rounded-2xl bg-[#BF76FF] hover:bg-[#a656f0] text-white font-black uppercase tracking-widest shadow-lg shadow-[#BF76FF]/20"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Disparar Agora"}
                </Button>

                {scheduledAt && (
                  <Button 
                    onClick={handleSchedule}
                    disabled={isSubmitting || !title || !message}
                    variant="outline"
                    className="h-14 rounded-2xl border-[#BF76FF] text-[#BF76FF] hover:bg-[#BF76FF]/5 font-black uppercase tracking-widest"
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
          <div className={cn("p-6 rounded-3xl border min-h-[500px]", isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={cn("font-bold", isDark ? "text-white" : "text-black")}>Histórico & Fila</h3>
              <div className="bg-[#BF76FF]/10 text-[#BF76FF] text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                {announcements.length} Enventos
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#BF76FF]" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Bell className="w-12 h-12 mb-4 opacity-10" />
                <p>Nenhuma notificação enviada ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className={cn("p-4 rounded-2xl border flex items-center justify-between group", isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5")}>
                    <div className="flex items-start gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                        ann.status === "sent" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {ann.status === "sent" ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm", isDark ? "text-white" : "text-black")}>{ann.title}</h4>
                        <p className={cn("text-xs line-clamp-1", isDark ? "text-gray-400" : "text-gray-600")}>{ann.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 
                            {ann.sentAt 
                              ? format(new Date(ann.sentAt), "dd/MM 'às' HH:mm", { locale: ptBR })
                              : format(new Date(ann.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })
                            }
                          </span>
                          <span className={cn("text-[10px] font-bold uppercase", 
                            ann.status === "sent" ? "text-green-500" : "text-blue-500"
                          )}>
                            {ann.status === "sent" ? "Enviado" : "Agendado"}
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
