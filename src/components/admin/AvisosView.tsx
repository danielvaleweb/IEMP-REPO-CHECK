import React, { useState, useEffect, useRef } from "react";
import { Bell, Send, Calendar, Clock, Users, Trash2, CheckCircle2, AlertCircle, Loader2, Download, Image as ImageIcon, MessageSquare, Sparkles, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GoogleGenAI } from "@google/genai";
import { toPng } from "html-to-image";

// Polyfill for process.env in Vite if needed
const getApiKey = () => {
  try {
    if (typeof process !== "undefined" && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  
  const envKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  
  return "AIzaSyBiX-jCmF5SAhmU83_hnnu5jLsIRAnN_g4";
};

export function AvisosView({ isDark }: { isDark?: boolean }) {
  // Form Fields
  const [type, setType] = useState("Comunicado");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [reason, setReason] = useState("");
  const [hasVerse, setHasVerse] = useState(false);
  const [verse, setVerse] = useState("");
  
  // Image Options
  const [formatType, setFormatType] = useState<"square" | "vertical">("square");
  const [bgColor, setBgColor] = useState("#BF76FF");
  const [bgRef, setBgRef] = useState("");
  const [generatedBgUrl, setGeneratedBgUrl] = useState<string | null>(null);
  
  // States
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  
  // Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Targeting
  const [targetMode, setTargetMode] = useState<"all" | "segmented">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const artboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escutar Avisos
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Buscar Usuarios
    const fetchUsers = async () => {
      const snap = await getDocs(query(collection(db, "members")));
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();

    return () => unsubscribe();
  }, []);

  const handleGenerateText = async () => {
    setIsGeneratingText(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `Você é um assistente da "Igreja Evangélica Ministério Profecia".
Sua tarefa é escrever uma mensagem de WhatsApp para enviar aos membros, baseada nas informações abaixo.

Tipo de Aviso: ${type}
Título: ${title}
Mensagem/Detalhes: ${message}
Data: ${date}
Hora: ${time}
Local: ${location}
Motivo: ${reason}
${hasVerse ? `Versículo: ${verse}` : ""}
Responsável: ${auth.currentUser?.displayName || auth.currentUser?.email || "Liderança"}

Instruções de tom (Variações):
- Se for "Urgência": Dê um destaque forte no título, passe uma sensação de urgência real, utilize emojis de alerta (🚨, ⚠️).
- Se for "Evento": Crie um clima bem vibrante, animado, acolhedor e convidativo. Emojis festivos (🎉, ✨, 🙌).
- Se for "Comunicado": Seja mais focado em informar de forma clara, sóbria e direta, mas com muito respeito.

Escreva apenas a mensagem final pronta para copiar e colar no WhatsApp, use negrito nas palavras chave (ex: *Data*).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setGeneratedText(response.text?.trim() || "");
    } catch (error: any) {
      console.error(error);
      alert("Erro ao gerar texto: " + error.message);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateBgImage = async () => {
    if (!bgRef) {
      alert("Descreva a imagem que deseja gerar no campo correspondente.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      
      let styleInstruction = "";
      if (type === "Urgência") styleInstruction = "Cores fortes e impactantes, estilo dramático e urgente.";
      if (type === "Evento") styleInstruction = "Visual vibrante, acolhedor, iluminado, convidativo e com celebração.";
      if (type === "Comunicado") styleInstruction = "Visual limpo, moderno, sóbrio, com espaços negativos.";

      const prompt = `Crie uma imagem de fundo (background) para um aviso de igreja. 
ESTRITAMENTE PROIBIDO COLOCAR QUALQUER TEXTO, LETRAS OU PALAVRAS NA IMAGEM.
Descrição do usuário: ${bgRef}. 
Estilo: ${styleInstruction}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: formatType === "square" ? "1:1" : "9:16"
          }
        }
      });

      let foundImage = false;
      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64String = part.inlineData.data;
            const mime = part.inlineData.mimeType || 'image/jpeg';
            setGeneratedBgUrl(`data:${mime};base64,${base64String}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("A IA não retornou uma imagem. Tente alterar o prompt.");
      }

    } catch (error: any) {
      console.error(error);
      const isQuota = error?.message?.includes("Quota") || error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED";
      if (isQuota) {
        alert("O seu limite diário para gerar imagens com Inteligência Artificial foi atingido. Tente novamente amanhã. Não se preocupe, você ainda pode enviar sua comunicação normalmente usando a cor de fundo escolhida!");
      } else {
        alert("Erro ao gerar imagem: " + error.message);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!artboardRef.current) return;
    try {
      const dataUrl = await toPng(artboardRef.current, { cacheBust: true, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `Aviso_${type}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao baixar:", err);
      alert("Erro ao baixar imagem.");
    }
  };

  const handleSaveHistory = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: title || type,
        message: generatedText || message,
        type,
        targetMode,
        sentTo: targetMode === "all" ? "Todos" : selectedUsers,
        author: auth.currentUser?.displayName || auth.currentUser?.email || "Desconhecido",
        createdAt: serverTimestamp(),
      });
      alert("Aviso salvo no histórico!");
      // Limpeza opcional
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar histórico.");
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsAppUrl = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      alert("Número inválido.");
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-[#25D366]" />
        </div>
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>Gerador de Avisos (WhatsApp)</h2>
          <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>Crie imagens exclusivas e mensagens personalizadas para enviar aos membros.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna do Formulário */}
        <div className="lg:col-span-5 space-y-6">
          <div className={cn("p-6 rounded-[32px] border", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <h3 className={cn("font-bold mb-6 flex items-center gap-2", isDark ? "text-white" : "text-black")}>
              Informações Gerais
            </h3>

            <div className="space-y-4">
              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Tipo de Aviso</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={cn("w-full h-12 rounded-2xl px-4 border transition-all appearance-none cursor-pointer", isDark ? "bg-black border-white/5 text-white" : "bg-white border-black/5 text-black")}
                >
                  <option value="Comunicado">Comunicado (Sóbrio)</option>
                  <option value="Evento">Evento (Vibrante)</option>
                  <option value="Urgência">Urgência (Destaque/Alerta)</option>
                </select>
              </div>

              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Título</label>
                <Input 
                  value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião Geral Extraordinária"
                  className={cn("h-12 rounded-2xl border bg-transparent", isDark ? "border-white/5 text-white" : "border-black/5 text-black")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Data</label>
                  <Input 
                    type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className={cn("h-12 rounded-2xl border bg-transparent [color-scheme:dark]", isDark ? "border-white/5 text-white" : "border-black/5 text-black [color-scheme:light]")}
                  />
                </div>
                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Hora</label>
                  <Input 
                    type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className={cn("h-12 rounded-2xl border bg-transparent [color-scheme:dark]", isDark ? "border-white/5 text-white" : "border-black/5 text-black [color-scheme:light]")}
                  />
                </div>
              </div>

              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Local</label>
                <Input 
                  value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Templo Sede"
                  className={cn("h-12 rounded-2xl border bg-transparent", isDark ? "border-white/5 text-white" : "border-black/5 text-black")}
                />
              </div>

              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Mensagem/Detalhes</label>
                <Textarea 
                  value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Detalhes adicionais..."
                  className={cn("min-h-[80px] rounded-2xl border bg-transparent", isDark ? "border-white/5 text-white" : "border-black/5 text-black")}
                />
              </div>

              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Motivo (Opcional)</label>
                <Input 
                  value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Por que estamos avisando?"
                  className={cn("h-12 rounded-2xl border bg-transparent", isDark ? "border-white/5 text-white" : "border-black/5 text-black")}
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" id="hasVerse" checked={hasVerse} onChange={(e) => setHasVerse(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="hasVerse" className={cn("text-xs font-bold", isDark ? "text-white" : "text-black")}>Deseja incluir um versículo?</label>
              </div>

              {hasVerse && (
                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Qual Versículo?</label>
                  <Textarea 
                    value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="Tudo posso naquele que me fortalece..."
                    className={cn("min-h-[60px] rounded-2xl border bg-transparent", isDark ? "border-white/5 text-white" : "border-black/5 text-black")}
                  />
                </div>
              )}

            </div>
          </div>

          <div className={cn("p-6 rounded-[32px] border", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <h3 className={cn("font-bold mb-6 flex items-center gap-2", isDark ? "text-white" : "text-black")}>
              Configuração Visual da Imagem
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setFormatType("square")}
                  variant={formatType === "square" ? "default" : "outline"}
                  className={cn("h-12 rounded-2xl font-bold transition-all border", formatType === "square" ? "bg-[#BF76FF] hover:bg-[#a656f0] text-white" : (isDark ? "bg-black border-white/5 text-white hover:text-white" : "bg-white border-black/5 text-black hover:text-black"))}
                >
                  Quadrado (Instagram)
                </Button>
                <Button 
                  onClick={() => setFormatType("vertical")}
                  variant={formatType === "vertical" ? "default" : "outline"}
                  className={cn("h-12 rounded-2xl font-bold transition-all border", formatType === "vertical" ? "bg-[#BF76FF] hover:bg-[#a656f0] text-white" : (isDark ? "bg-black border-white/5 text-white hover:text-white" : "bg-white border-black/5 text-black hover:text-black"))}
                >
                  Vertical (Story)
                </Button>
              </div>

              <div>
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-white/40" : "text-gray-500")}>Cor Principal</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                  />
                  <Input 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className={cn("h-12 rounded-xl flex-1 border font-mono font-bold", isDark ? "bg-black border-white/5 text-white" : "bg-white border-black/5 text-black")}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest mb-1 block ml-2", isDark ? "text-[#BF76FF]" : "text-[#a656f0]")}>
                  Gerar Imagem de Fundo (Integração IA)
                </label>
                <Textarea 
                  value={bgRef} 
                  onChange={(e) => setBgRef(e.target.value)} 
                  placeholder="Ex: Um pôr do sol urbano, luzes douradas e uma igreja iluminada..."
                  className={cn("min-h-[80px] rounded-2xl border bg-[#BF76FF]/5 mb-3", isDark ? "border-[#BF76FF]/20 text-white" : "border-[#BF76FF]/20 text-black")}
                />
                <Button 
                  onClick={handleGenerateBgImage}
                  disabled={isGeneratingImage || !bgRef}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white font-bold cursor-pointer"
                >
                  {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Sparkles className="w-4 h-4 mr-2" /> Gerar Fundo com IA</>}
                </Button>
              </div>
              
              {generatedBgUrl && (
                 <Button 
                  onClick={() => setGeneratedBgUrl(null)}
                  variant="ghost"
                  className="w-full text-red-500 font-bold hover:bg-red-500/10 h-10 rounded-xl mt-2 cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" /> Remover Imagem da IA
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Coluna da Imagem e WhatsApp */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pré-visualização Mágica */}
          <div className={cn("p-6 rounded-[32px] border overflow-hidden flex flex-col items-center", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <div className="w-full flex items-center justify-between mb-4">
               <h3 className={cn("font-bold flex items-center gap-2", isDark ? "text-white" : "text-black")}>
                 <ImageIcon className="w-4 h-4" /> Pré-visualização da Arte
               </h3>
               <Button onClick={handleDownloadImage} className="h-10 px-6 rounded-2xl bg-black hover:bg-black/80 text-white font-bold cursor-pointer" variant="outline">
                 <Download className="w-4 h-4 mr-2" /> Baixar 
               </Button>
            </div>
            
            <div className="w-full p-4 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10" style={{ maxHeight: '600px' }}>
              <div 
                ref={artboardRef}
                style={{
                  width: formatType === "square" ? "400px" : "360px",
                  height: formatType === "square" ? "400px" : "640px",
                  backgroundColor: bgColor,
                  backgroundImage: generatedBgUrl ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${generatedBgUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                className="relative overflow-hidden shrink-0 flex flex-col p-8 text-white shadow-xl rounded-none"
              >
                {!generatedBgUrl && (
                  <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/50 pointer-events-none" />
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="uppercase tracking-widest text-[10px] font-black opacity-80 mb-2">
                    {type}
                  </div>
                  <h1 className={cn("font-black mb-4 leading-tight", 
                    formatType === "square" ? "text-4xl" : "text-4xl mt-10",
                    type === "Urgência" ? "text-red-400" : "text-white"
                  )}>
                    {title || "Escreva um Título"}
                  </h1>
                  
                  <p className="text-sm opacity-90 mb-auto leading-relaxed overflow-hidden">
                     {message ? (message.length > 150 ? message.substring(0, 150) + "..." : message) : "A mensagem ou os detalhes aparecerão aqui."}
                  </p>

                  <div className="space-y-2 mt-4 bg-black/30 p-4 rounded-2xl backdrop-blur-md">
                    {date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-bold">{format(new Date(date + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR })}</span>
                      </div>
                    )}
                    {time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-bold">{time}</span>
                      </div>
                    )}
                    {location && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-bold truncate">{location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 text-[8px] uppercase tracking-widest font-bold opacity-50 text-center">
                    Igreja Evangélica Ministério Profecia
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gerador de Texto */}
          <div className={cn("p-6 rounded-[32px] border", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("font-bold flex items-center gap-2", isDark ? "text-white" : "text-black")}>
                Mensagem Para Disparo
              </h3>
              <Button 
                onClick={handleGenerateText} 
                disabled={isGeneratingText || (!title && !message)}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white font-bold cursor-pointer"
              >
                {isGeneratingText ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Gerar Texto
              </Button>
            </div>
            
            <Textarea 
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              placeholder="Gere o texto clicando no botão acima ou digite manualmente sua mensagem..."
              className={cn("min-h-[150px] rounded-2xl border p-4 font-medium transition-all text-sm mb-4", isDark ? "bg-black border-white/5 text-white/90" : "bg-gray-50 border-black/5 text-black")}
            />

            {/* Ações de Envio */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setTargetMode("all")}
                  variant={targetMode === "all" ? "default" : "outline"}
                  className={cn("h-12 rounded-2xl font-bold transition-all border cursor-pointer", targetMode === "all" ? "bg-black text-white hover:opacity-90" : (isDark ? "bg-black border-white/5 text-white hover:text-white" : "bg-white border-black/5 text-black hover:text-black"))}
                >
                  Lista de Transmissão (Todos)
                </Button>
                <Button 
                  onClick={() => setTargetMode("segmented")}
                  variant={targetMode === "segmented" ? "default" : "outline"}
                  className={cn("h-12 rounded-2xl font-bold transition-all border cursor-pointer", targetMode === "segmented" ? "bg-black text-white hover:opacity-90" : (isDark ? "bg-black border-white/5 text-white hover:text-white" : "bg-white border-black/5 text-black hover:text-black"))}
                >
                  Envio Fragmentado
                </Button>
              </div>

              {targetMode === "all" && (
                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-[#25D366]/5 border-[#25D366]/20" : "bg-[#25D366]/5 border-[#25D366]/20")}>
                  <p className={cn("text-sm font-medium mb-3", isDark ? "text-white/70" : "text-gray-600")}>
                    Para enviar para todos de uma vez e evitar bloqueios pelo WhatsApp, recomendamos usar a funcionalidade de <strong>Lista de Transmissão</strong> no seu celular ou copiar a mensagem pronta abaixo e enviar no grupo da igreja.
                  </p>
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedText);
                      alert("Mensagem copiada! Abra o WhatsApp e cole no grupo ou janela desejada.");
                    }}
                    className="w-full h-12 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-2xl shadow-lg shadow-[#25D366]/20 cursor-pointer"
                  >
                    <Copy className="w-5 h-5 mr-2" /> Copiar Mensagem para WhatsApp
                  </Button>
                </div>
              )}

              {targetMode === "segmented" && (
                <div className="space-y-3 pt-2">
                  <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-400")}>Selecione os membros</p>
                  <div className={cn("max-h-60 overflow-y-auto pr-2 space-y-2", isDark ? "scrollbar-dark" : "scrollbar-light")}>
                    {members.filter(m => m.phone).map(m => (
                      <div key={m.id} className={cn("flex items-center justify-between p-3 rounded-xl border", isDark ? "bg-black/50 border-white/5" : "bg-white border-black/5")}>
                        <div className="flex items-center gap-3">
                           <input 
                             type="checkbox" 
                             checked={selectedUsers.includes(m.id)}
                             onChange={() => toggleUserSelection(m.id)}
                             className="w-4 h-4 rounded appearance-none checked:bg-[#25D366] border border-gray-400 cursor-pointer"
                           />
                           <div>
                             <p className={cn("text-sm font-bold leading-none", isDark ? "text-white" : "text-black")}>{m.name}</p>
                             <p className="text-[10px] text-gray-500 mt-1">{m.phone || "Sem contato"} • {m.role || "Visitante"}</p>
                           </div>
                        </div>
                        <Button
                          disabled={!generatedText || !m.phone}
                          onClick={() => openWhatsAppUrl(m.phone, generatedText)}
                          className="h-8 text-xs bg-[#25D366] hover:bg-[#1DA851] text-white cursor-pointer"
                        >
                          Enviar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSaveHistory}
                disabled={isSaving || (!title && !generatedText)}
                className="w-full h-14 rounded-[20px] bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white font-black uppercase tracking-widest shadow-xl shadow-[#BF76FF]/20 mt-4 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar no Histórico de Avisos"}
              </Button>
            </div>
          </div>

          {/* Histórico Column */}
          <div className={cn("p-6 rounded-[32px] border", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Histórico de Avisos</h3>
              <div className="bg-[#BF76FF]/10 text-[#BF76FF] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {announcements.length} Registros
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#BF76FF]" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center opacity-40 py-10">
                <p className="text-sm font-bold">Nenhum aviso no histórico.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {announcements.map((ann) => (
                  <div key={ann.id} className={cn("p-4 rounded-2xl border flex items-start justify-between group", isDark ? "bg-black/50 border-white/5" : "bg-gray-50 border-black/5")}>
                    <div>
                      <h4 className={cn("font-bold text-sm", isDark ? "text-white" : "text-black")}>{ann.title}</h4>
                      <p className={cn("text-[10px] mt-1 font-medium", isDark ? "text-[#BF76FF]" : "text-[#a656f0]")}>{ann.type} • Autor: {ann.author}</p>
                      <p className={cn("text-xs mt-2 line-clamp-2", isDark ? "text-white/60" : "text-gray-600")}>{ann.message}</p>
                      <p className={cn("text-[10px] mt-2 opacity-50", isDark ? "text-white" : "text-black")}>
                        {ann.createdAt ? format(ann.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ""}
                      </p>
                    </div>
                    <button 
                      onClick={async () => {
                         if(confirm("Excluir este hitórico?")) await deleteDoc(doc(db, "announcements", ann.id));
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all shrink-0 cursor-pointer"
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
