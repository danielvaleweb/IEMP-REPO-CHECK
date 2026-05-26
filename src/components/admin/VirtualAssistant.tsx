import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, ChevronLeft, Video, X, MessageCircle, Send, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy, updateDoc, doc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

const STATIC_AVATAR_URL = "https://res.cloudinary.com/dslmdkfoh/image/upload/v1779374398/broker_profiles/6ec53d62-d8f3-4a9f-9d63-ffce3fd00e6b_nwzigm.png";

const BOT_MESSAGES = [
  "Precisa de ajuda?",
  "Fale comigo!",
  "Eu sou o Assistente da IEMP",
  "Consigo te ajudar!"
];

export function VirtualAssistant({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const { profile } = useAuth();
  const canTakeOver = profile?.role === "Administradores" || profile?.role === "Desenvolvedor" || profile?.role === "Administrador Master";

  const [currentMessage, setCurrentMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Views: "menu", "chat", "bug", "tutorials"
  const [view, setView] = useState<"menu" | "chat" | "bug" | "tutorials">("menu");

  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [supportChatId, setSupportChatId] = useState<string | null>(null);
  const [supportChat, setSupportChat] = useState<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [ticketStatus, setTicketStatus] = useState<string>("closed");
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingAdminId, setRatingAdminId] = useState<string | null>(null);

  // Escutar chat de suporte ativo do usuário
  useEffect(() => {
    if (!profile?.id) return;
    
    const q = query(
      collection(db, "chats"), 
      where("isSupport", "==", true),
      where("requesterId", "==", profile.id),
      where("status", "in", ["open", "in_progress"])
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setSupportChatId(d.id);
        setTicketStatus(d.data().status);
        setSupportChat(d.data());
        if (d.data().status === 'in_progress' && d.data().assignedAdminId) {
          setRatingAdminId(d.data().assignedAdminId);
        }
      } else {
        if (supportChatId && ticketStatus === 'in_progress') {
          setShowRating(true);
        }
        setSupportChatId(null);
        setTicketStatus("closed");
        setSupportChat(null);
      }
    });
    return () => unsub();
  }, [profile?.id, supportChatId, ticketStatus]);

  // Escutar mensagens do chat ativo
  useEffect(() => {
    if (!supportChatId) {
      setSupportMessages([]);
      return;
    }
    const q = query(collection(db, "chats", supportChatId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSupportMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [supportChatId]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !profile?.id || isSending) return;
    
    const text = chatInput.trim();
    setChatInput("");
    setIsSending(true);
    
    try {
      let currentChatId = supportChatId;

      if (!currentChatId) {
        const chatRef = await addDoc(collection(db, "chats"), {
          isSupport: true,
          status: "open",
          requesterId: profile.id,
          requesterName: profile.name,
          participants: [profile.id],
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        currentChatId = chatRef.id;
      } else {
        await updateDoc(doc(db, "chats", currentChatId), {
          lastMessage: text,
          lastMessageTime: serverTimestamp()
        });
      }

      await addDoc(collection(db, "chats", currentChatId, "messages"), {
        text,
        senderId: profile.id,
        timestamp: serverTimestamp()
      });

      // Lógica de resposta automática do bot com Gemini
      if (ticketStatus === "open" || !supportChatId) {
        setIsBotTyping(true);
        
        try {
          let botReplyText = "";
          
          if (import.meta.env.VITE_GEMINI_API_KEY) {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const prompt = `Você é o Assistente Virtual de suporte da IEMP.
Responda de forma concisa (1 ou 2 parágrafos). Seja educado e acolhedor.
Ajude com dúvidas do sistema.
Se for algo fora de seu conhecimento ou complexo, responda EXATAMENTE com "TRANSFER_HUMAN".
Pergunta: "${text}"`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            
            botReplyText = response.text || "";
          } else {
            botReplyText = "TRANSFER_HUMAN";
          }
          
          if (botReplyText.includes("TRANSFER_HUMAN")) {
            botReplyText = "Não entendi completamente ou não consigo resolver essa questão de forma automática. Vou encaminhar você para um de nossos atendentes humanos, por favor, aguarde um instante.";
          }

          await addDoc(collection(db, "chats", currentChatId, "messages"), {
            text: botReplyText,
            senderId: "bot",
            timestamp: serverTimestamp()
          });

          await updateDoc(doc(db, "chats", currentChatId), {
            lastMessage: botReplyText,
            lastMessageTime: serverTimestamp()
          });
        } catch (err) {
          console.error("Error auto-replying", err);
          const errorMsg = "Tive um pequeno problema técnico. Vou transferir você para um atendente humano. Por favor, aguarde.";
          await addDoc(collection(db, "chats", currentChatId, "messages"), {
            text: errorMsg,
            senderId: "bot",
            timestamp: serverTimestamp()
          });
          await updateDoc(doc(db, "chats", currentChatId), {
            lastMessage: errorMsg,
            lastMessageTime: serverTimestamp()
          });
        } finally {
          setIsBotTyping(false);
        }
      }

    } catch (err) {
      console.error("Error sending support message", err);
      setIsBotTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  // Random messages logic
  useEffect(() => {
    const cycleMessage = () => {
      if (isOpen) return;
      const randomMsg = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
      setCurrentMessage(randomMsg);
      setShowMessage(true);

      setTimeout(() => {
        setShowMessage(false);
      }, 5000);
    };

    const initialTimeout = setTimeout(cycleMessage, 3000);
    const interval = setInterval(cycleMessage, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [view, supportMessages, isBotTyping]); // just to trigger scroll occasionally, ideally triggered on new message

  const handleRating = async (stars: number) => {
    if (ratingAdminId) {
      try {
        await addDoc(collection(db, "members", ratingAdminId, "ratings"), {
          stars,
          userId: profile?.id,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Error saving rating", err);
      }
    }
    setShowRating(false);
    setRatingAdminId(null);
    setSupportMessages([]);
  };

  const isHuman = ticketStatus === 'in_progress';
  const headerName = isHuman && supportChat?.assignedAdminName ? supportChat.assignedAdminName : "Assistente da IEMP";
  const headerPhoto = isHuman && supportChat?.assignedAdminPhoto ? supportChat.assignedAdminPhoto : STATIC_AVATAR_URL;

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setShowMessage(false);
      setView("menu");
    } else {
      setIsOpen(false);
    }
  };

  const THEME_COLOR = isDarkMode ? "#BF76FF" : "#BF76FF";
  const BG_PANEL = isDarkMode ? "bg-[#0b0016]" : "bg-white";
  const TEXT_PRIMARY = isDarkMode ? "text-white" : "text-gray-900";
  const TEXT_SECONDARY = isDarkMode ? "text-gray-400" : "text-gray-500";
  const BORDER_COLOR = isDarkMode ? "border-white/10" : "border-black/5";
  const AVATAR_URL = "https://res.cloudinary.com/dslmdkfoh/image/upload/q_auto/f_auto/v1779481561/ezgif.com-video-to-gif-converter_nrzbrt.gif";
  return (
    <>
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
        
        {/* Main Floating Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn("relative w-[340px] sm:w-[380px] pointer-events-auto rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border", BG_PANEL, BORDER_COLOR)}
              style={{ maxHeight: 'min(700px, 80vh)' }}
            >
              
              {/* === MENU VIEW === */}
              {view === "menu" && (
                <div className={cn("flex flex-col h-full", BG_PANEL)}>
                  {/* Header */}
                  <div className="px-6 py-8 flex items-center gap-4 text-white" style={{ backgroundColor: isDarkMode ? "#1A1A1A" : "#1A1A1A", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-white shadow-inner">
                        <img src={STATIC_AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-[#1A1A1A] rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-tight uppercase flex items-center gap-1">
                        Assistente <span className="text-[#BF76FF]">da</span> IEMP
                      </h3>
                      <p className="text-sm font-medium opacity-90 text-gray-400">Assistente Virtual</p>
                    </div>
                  </div>

                  {/* Body Options */}
                  <div className="p-6 space-y-4">
                    <p className={cn("text-[14px] font-bold mb-2", TEXT_SECONDARY)}>Como podemos te ajudar hoje?</p>
                    
                    <button 
                      onClick={() => setView("chat")}
                      className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-gray-100 hover:bg-gray-50")}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#BF76FF]/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-[#BF76FF]" />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Fazer Pergunta</h4>
                        <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Inicie atendimento de suporte por IA</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setView("bug")}
                      className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-red-500/10" : "bg-white border-gray-100 hover:bg-red-50/50")}
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Reportar um Problema</h4>
                        <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Descreva falhas com abertura de logs</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setView("tutorials")}
                      className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-amber-500/10" : "bg-white border-gray-100 hover:bg-amber-50/50")}
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Tutoriais em Vídeo</h4>
                        <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Dúvidas operacionais passo a passo</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* === CHAT VIEW === */}
              {view === "chat" && (
                <div className={cn("flex flex-col h-[550px]", isDarkMode ? "bg-[#0A0A0A]" : "bg-[#F7F8FA]")}>
                  {/* Chat Header */}
                  <div className={cn("px-4 py-4 flex items-center gap-3 shrink-0 shadow-sm z-10 border-b", BORDER_COLOR, isDarkMode ? "bg-[#1A1A1A]" : "bg-white")}>
                    <button onClick={() => setView("menu")} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center text-[#BF76FF] font-bold">
                      {headerPhoto ? (
                        <img src={headerPhoto} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        headerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("font-bold text-[15px] leading-tight", TEXT_PRIMARY)}>{headerName}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isHuman ? "bg-green-500" : "bg-purple-500")} />
                        <span className={cn("text-[10px] font-bold tracking-wider uppercase", isHuman ? "text-green-500" : "text-[#BF76FF]")}>
                          {isHuman ? "SUPORTE HUMANO" : "ATENDIMENTO IA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Banner Assumir Chat */}
                  <div className={cn("px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-10", isDarkMode ? "bg-[#BF76FF]/10 border-b border-[#BF76FF]/20" : "bg-[#BF76FF]/5")}>
                    <div>
                      <p className={cn("text-[10px] font-black tracking-wider", isDarkMode ? "text-[#BF76FF]" : "text-purple-800")}>ATENDIMENTO POR IA</p>
                      <p className={cn("text-[9px] font-medium mt-0.5", isDarkMode ? "text-[#BF76FF]/70" : "text-purple-700")}>Para falar com suporte humano digite falar com suporte</p>
                    </div>
                    {canTakeOver && (
                      <Button className="h-8 text-[10px] font-black uppercase tracking-widest bg-[#BF76FF] hover:bg-[#a65ce6] text-white rounded-lg px-3 shadow-md">
                        Assumir Chat
                      </Button>
                    )}
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={chatScrollRef}>
                    {/* Bot Message Block Initial */}
                    {supportMessages.length === 0 && !showRating && (
                      <div className="flex items-end gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white shrink-0 mb-5">
                          <img src={STATIC_AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                          <div className={cn("border shadow-sm p-4 rounded-2xl rounded-bl-sm text-[13px] font-medium leading-relaxed", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-gray-200" : "bg-white border-gray-100 text-gray-800")}>
                            <p>Paz do Senhor, {profile?.name?.split(" ")[0] || "usuário"}! ✨</p>
                            <p className="mt-2">É sempre um prazer enorme falar com você.</p>
                            <p className="mt-4">Como posso ajudar a tornar o seu dia mais ágil e produtivo hoje?</p>
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold ml-1">Assistente • Agora</span>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {supportMessages.map((msg, idx) => {
                      const isMe = msg.senderId === profile?.id;
                      const isBot = msg.senderId === "bot";
                      return (
                        <div key={idx} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white shrink-0 mb-5 flex items-center justify-center text-[#BF76FF] font-bold">
                              {isBot ? (
                                <img src={STATIC_AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
                              ) : supportChat?.assignedAdminPhoto ? (
                                <img src={supportChat.assignedAdminPhoto} alt="Admin" className="w-full h-full object-cover" />
                              ) : (
                                supportChat?.assignedAdminName?.[0] || "S"
                              )}
                            </div>
                          )}
                          <div className={cn("flex flex-col gap-1 max-w-[85%]", isMe ? "items-end" : "items-start")}>
                            <div className={cn(
                              "p-3.5 px-4 text-[13px] font-medium shadow-sm",
                              isMe ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white" : cn("rounded-2xl rounded-bl-sm border", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-gray-200" : "bg-white border-gray-100 text-gray-800")
                            )}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold mx-1">
                              {isMe ? "Você" : msg.senderId === "bot" ? "Assistente" : "Suporte"}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isBotTyping && (
                      <div className="flex items-end gap-2 justify-start mt-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white shrink-0 mb-5">
                          <img src={STATIC_AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
                        </div>
                        <div className={cn("flex flex-col gap-1 max-w-[85%] items-start")}>
                          <div className={cn("p-3.5 px-4 text-[13px] font-medium shadow-sm rounded-2xl rounded-bl-sm border", isDarkMode ? "bg-[#1A1A1A] border-white/5" : "bg-white border-gray-100")}>
                            <div className="flex gap-1 h-3 items-center px-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </div>
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold mx-1">Assistente</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Rating System */}
                    {showRating && (
                      <div className="mt-4 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                         <div className="w-16 h-16 bg-[#BF76FF]/10 text-[#BF76FF] rounded-full mx-auto flex items-center justify-center">
                           <Star className="w-8 h-8" />
                         </div>
                         <h3 className="font-bold text-lg text-white">Atendimento Encerrado</h3>
                         <p className="text-sm text-gray-400">Por favor, avalie o atendimento que você recebeu para nos ajudar a melhorar!</p>
                         <div className="flex justify-center gap-2 pt-2">
                           {[1, 2, 3, 4, 5].map(star => (
                             <button key={star} onClick={() => handleRating(star)} className="text-gray-300 hover:text-yellow-400 hover:scale-110 transition-all">
                                <Star className="w-8 h-8 fill-current" />
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className={cn("p-4 shrink-0 pb-6 border-t", isDarkMode ? "bg-[#0A0A0A] border-white/5" : "bg-[#F7F8FA] border-black/5")}>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                      className="relative flex items-center"
                    >
                      <Input 
                        placeholder={showRating ? "Atendimento encerrado." : "Sua mensagem..."}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isSending || isBotTyping || showRating}
                        className={cn("w-full h-12 pl-4 pr-14 rounded-[16px] border shadow-sm text-[13px] focus-visible:ring-1 focus-visible:ring-[#BF76FF]", isDarkMode ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-500 disabled:opacity-50" : "bg-white border-gray-200 text-black disabled:opacity-50")}
                      />
                      <button 
                        type="submit"
                        disabled={isSending || isBotTyping || !chatInput.trim() || showRating}
                        className="absolute right-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50"
                        style={{ backgroundColor: THEME_COLOR }}
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-white ml-0.5" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* === BUG VIEW / TUTORIALS VIEW === */}
              {(view === "bug" || view === "tutorials") && (
                <div className={cn("flex flex-col h-full min-h-[400px]", BG_PANEL)}>
                  <div className={cn("px-4 py-4 flex items-center gap-3 border-b", BORDER_COLOR)}>
                    <button onClick={() => setView("menu")} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className={cn("font-black text-sm uppercase tracking-widest", TEXT_PRIMARY)}>
                      {view === "bug" ? "Reportar Problema" : "Tutoriais em Vídeo"}
                    </h3>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    {view === "bug" ? (
                      <div className="space-y-4">
                        <p className={cn("text-xs font-medium mb-4", TEXT_SECONDARY)}>Encontrou algo que não está funcionando certo? Descreva abaixo para a equipe consertar.</p>
                        <Input placeholder="Título do problema..." className={cn("h-12 rounded-xl", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50")} />
                        <Textarea placeholder="Explique o que aconteceu..." className={cn("min-h-[120px] rounded-xl resize-none", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50")} />
                        <Button className="w-full h-12 rounded-xl mt-4 text-white font-black uppercase tracking-widest shadow-md" style={{ backgroundColor: THEME_COLOR }}>
                          Enviar Relatório
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                         <div className={cn("rounded-[20px] p-5 border transition-all", isDarkMode ? "bg-white/5 border-white/5 hover:border-[#BF76FF]/50" : "border-gray-100 bg-gray-50 hover:border-[#BF76FF]/30")}>
                            <h4 className={cn("font-bold text-sm flex items-center gap-2 mb-2", TEXT_PRIMARY)}>
                              <span className="w-2 h-2 rounded-full bg-[#BF76FF]" />
                              Solicitar agendamento
                            </h4>
                            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">Aprenda como solicitar uma nova data para o seu evento ou culto diretamente pela agenda do sistema.</p>
                            <div className="rounded-xl overflow-hidden bg-black aspect-video relative flex items-center justify-center group cursor-pointer border border-gray-200 shadow-sm">
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-all">
                                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg">
                                  <Video className="w-5 h-5 ml-0.5" />
                                </div>
                              </div>
                              <img src="https://picsum.photos/seed/tut1/400/225" className="w-full h-full object-cover opacity-80" alt="Thumbnail" />
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Message Balloon (Only when closed) */}
        <AnimatePresence>
          {showMessage && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="px-5 py-3 rounded-[16px] shadow-lg relative pointer-events-auto max-w-[200px] mb-2 mr-2"
              style={{ backgroundColor: THEME_COLOR, color: "white", borderBottomRightRadius: '4px' }}
            >
              <p className="text-[13px] font-bold tracking-tight text-center leading-snug">{currentMessage}</p>
              <div 
                className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
                style={{ backgroundColor: THEME_COLOR }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        <div className="pointer-events-auto relative mt-2">
          <button 
            className="w-[60px] h-[60px] rounded-full overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center z-[110] border-[3px] border-white"
            style={{ backgroundColor: isOpen ? THEME_COLOR : "white" }}
            onClick={toggleOpen}
          >
            {isOpen ? (
              <X className="w-7 h-7 text-white" />
            ) : (
              <img 
                src={AVATAR_URL}
                alt="Bot"
                className="w-full h-full object-cover"
              />
            )}
          </button>
        </div>
        
      </div>
    </>
  );
}
