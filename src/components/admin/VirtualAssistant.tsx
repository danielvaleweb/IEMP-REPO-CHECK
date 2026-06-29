import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimation } from "motion/react";
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
import { AlertCircle, Info, ChevronLeft, Video, X, MessageCircle, Send, Star, Link as LinkIcon, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy, updateDoc, doc, setDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";

const STATIC_AVATAR_URL = "https://res.cloudinary.com/dslmdkfoh/image/upload/v1779374398/broker_profiles/6ec53d62-d8f3-4a9f-9d63-ffce3fd00e6b_nwzigm.png";

const BOT_MESSAGES = [
  "Precisa de ajuda?",
  "Fale comigo!",
  "Eu sou o Assistente da IEMP",
  "Consigo te ajudar!"
];

export function VirtualAssistant({ isDarkMode = true, loginMode = false, activeTab = "" }: { isDarkMode?: boolean, loginMode?: boolean, activeTab?: string }) {
  const { profile } = useAuth();
  const [visitorId] = useState(() => {
    let vid = localStorage.getItem('virtual_assistant_visitor_id');
    if (!vid) {
      vid = 'visitor_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('virtual_assistant_visitor_id', vid);
    }
    return vid;
  });
  const effectiveUserId = profile?.id || visitorId;
  
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('virtual_assistant_visitor_name') || "Visitante");
  const effectiveUserName = profile?.name || visitorName;
  const canTakeOver = profile?.role === "Administradores" || profile?.role === "Desenvolvedor" || profile?.role === "Administrador Master";

  const [currentMessage, setCurrentMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Views: "menu", "chat", "faq", "forgotPassword", "ticketForm", "ticketSuccess", "ticketList"
  const [view, setView] = useState<"menu" | "chat" | "faq" | "forgotPassword" | "ticketForm" | "ticketSuccess" | "ticketList">("menu");
  const [forgotEmail, setForgotEmail] = useState("");

  const [ticketContactName, setTicketContactName] = useState(profile?.name || "");
  const [ticketCompanyName, setTicketCompanyName] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketIdSuccess, setTicketIdSuccess] = useState("");
  const [userTickets, setUserTickets] = useState<any[]>([]);

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
  const [hoverRating, setHoverRating] = useState(0);

  const dragControls = useAnimation();
  const [isLeftAligned, setIsLeftAligned] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hasShownHiddenTooltip = useRef(false);
  const [showHiddenTooltip, setShowHiddenTooltip] = useState(false);

  useEffect(() => {
    if (isHidden && !hasShownHiddenTooltip.current) {
      hasShownHiddenTooltip.current = true;
      setShowHiddenTooltip(true);
      const t = setTimeout(() => setShowHiddenTooltip(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isHidden]);

  const handleDragEnd = async (e: any, info: any) => {
    setIsDragging(false);
    
    // Check if dropped in the bottom center area (the X zone)
    const dropX = info.point.x;
    const dropY = info.point.y;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (dropY > screenHeight - 150 && dropX > screenWidth / 2 - 80 && dropX < screenWidth / 2 + 80) {
      setIsHidden(true);
      dragControls.set({ x: 0, y: 0 });
      setIsOpen(false);
      return;
    }

    const isLeft = info.point.x < window.innerWidth / 2;
    
    // Calculate target X relative to the current anchored side
    const buttonWidth = 85; // rough width + padding
    
    let targetX = 0;
    if (isLeft && !isLeftAligned) {
      targetX = -(screenWidth - buttonWidth);
    } else if (!isLeft && isLeftAligned) {
      targetX = screenWidth - buttonWidth;
    }
    
    // Animate to the snapped position
    await dragControls.start({
      x: targetX,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    });

    // Reset the drag transform and update the CSS anchor to keep it snapped without translation
    dragControls.set({ x: 0 });
    setIsLeftAligned(isLeft);
  };

  const [botSettings, setBotSettings] = useState<{ botEnabled?: boolean, botPrompt?: string, botName?: string, botImage?: string, botGif?: string, botMessagesLogin?: string, botMessagesDashboard?: string, botMessagesAgenda?: string, botMessagesDefault?: string, botTicketRoles?: string[] }>({});

  const handleTicketSubmit = async () => {
    if (!ticketContactName.trim() || !ticketCompanyName.trim() || !ticketSubject.trim() || !ticketDescription.trim()) return;
    setIsSubmittingTicket(true);
    try {
      const randomId = "TKT-" + Math.floor(1000 + Math.random() * 9000).toString();
      const ticketData = {
        id: randomId,
        title: ticketSubject.trim(),
        client: ticketCompanyName.trim(),
        status: "open",
        priority: ticketPriority,
        createdAt: new Date().toLocaleString("pt-BR"),
        updatedAt: new Date().toLocaleString("pt-BR"),
        description: `Relatado por: ${ticketContactName.trim()}\n\n${ticketDescription.trim()}`,
        ownerId: "danielvaleweb_master",
        requesterId: effectiveUserId,
        assignee: "",
        replies: [],
        deviceLogs: { url: window.location.href, userAgent: navigator.userAgent }
      };
      
      await setDoc(doc(db, "tickets", randomId), ticketData);
      
      setTicketIdSuccess(randomId);
      setView("ticketSuccess");
      
      // Reset form
      setTicketSubject("");
      setTicketDescription("");
      setTicketPriority("medium");
    } catch(err) {
      console.error("Error creating ticket:", err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (snap) => {
      if (snap.exists()) {
        setBotSettings(snap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  // Fetch tickets for the current user
  useEffect(() => {
    if (!effectiveUserId) return;
    const q = query(
      collection(db, "tickets"),
      where("requesterId", "==", effectiveUserId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUserTickets(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [effectiveUserId]);

  // Escutar chat de suporte ativo do usuário
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const q = query(
      collection(db, "chats"), 
      where("isSupport", "==", true),
      where("requesterId", "==", effectiveUserId),
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
  }, [effectiveUserId, supportChatId, ticketStatus]);

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
    if (!chatInput.trim() || !effectiveUserId || isSending) return;
    
    const text = chatInput.trim();
    setChatInput("");
    setIsSending(true);
    
    try {
      let currentChatId = supportChatId;

      if (!currentChatId) {
        const chatRef = await addDoc(collection(db, "chats"), {
          isSupport: true,
          status: "open",
          requesterId: effectiveUserId,
          requesterName: effectiveUserName,
          participants: [effectiveUserId],
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          lastSenderId: effectiveUserId,
          createdAt: serverTimestamp(),
        });
        currentChatId = chatRef.id;
      } else {
        await updateDoc(doc(db, "chats", currentChatId), {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          lastSenderId: effectiveUserId
        });
      }

      await addDoc(collection(db, "chats", currentChatId, "messages"), {
        text,
        senderId: effectiveUserId,
        timestamp: serverTimestamp()
      });

      // Lógica de resposta automática do bot com Gemini
      if (ticketStatus === "open" || !supportChatId) {
        setIsBotTyping(true);
        
        try {
          let botReplyText = "";
          
          botReplyText = "TRANSFER_HUMAN";
          
          if (botReplyText.includes("TRANSFER_HUMAN")) {
            botReplyText = "Entendido! Vou transferir você agora mesmo para um de nossos atendentes humanos. Por favor, aguarde um instante.";
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
      
      let rawMessages = "";
      if (loginMode) {
        rawMessages = botSettings.botMessagesLogin || "Dúvidas ao fazer login?\nPrecisa de ajuda?";
      } else if (activeTab === "visao-geral") {
        rawMessages = botSettings.botMessagesDashboard || "Bem-vindo de volta!\nComo posso ajudar hoje?";
      } else if (activeTab === "agenda" || activeTab === "agenda-direcao") {
        rawMessages = botSettings.botMessagesAgenda || "Dúvidas na agenda?\nQuer agendar algo?";
      } else {
        rawMessages = botSettings.botMessagesDefault || "Precisa de ajuda?\nFale comigo!\nEu sou o Assistente da IEMP\nConsigo te ajudar!";
      }
      
      let messagesArray = rawMessages.split('\n').map(s => s.trim()).filter(Boolean);
      if (messagesArray.length === 0) {
        messagesArray = ["Precisa de ajuda?"];
      }
      
      const randomMsg = messagesArray[Math.floor(Math.random() * messagesArray.length)];
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
  }, [isOpen, loginMode, activeTab, botSettings.botMessagesLogin, botSettings.botMessagesDashboard, botSettings.botMessagesAgenda, botSettings.botMessagesDefault]);

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
          userId: effectiveUserId,
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
  const effectiveBotName = botSettings.botName || "Assistente da IEMP";
  const effectiveBotImage = botSettings.botImage || STATIC_AVATAR_URL;
  const headerName = isHuman && supportChat?.assignedAdminName ? supportChat.assignedAdminName : effectiveBotName;
  const headerPhoto = isHuman && supportChat?.assignedAdminPhoto ? supportChat.assignedAdminPhoto : effectiveBotImage;

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
  const effectiveBotGif = botSettings.botGif || effectiveBotImage;

  if (botSettings.botEnabled === false) return null;

  if (isHidden) {
    const portalTarget = document.getElementById("bot-portal-target");
    if (portalTarget) {
      return createPortal(
        <div className="relative flex items-center justify-center">
          {/* Overlay de Foco */}
          <AnimatePresence>
            {showHiddenTooltip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-[90]"
                style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}
              />
            )}
          </AnimatePresence>

          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setShowHiddenTooltip(false); setIsHidden(false); }}
            className={cn(
              "rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all w-8 h-8 border-2 border-[#BF76FF] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow-[0_0_15px_rgba(191,118,255,0.4)] relative z-[100]",
              !isDarkMode && "bg-white"
            )}
            title="Mostrar Assistente"
          >
            <img src={effectiveBotImage} alt="Bot" className="w-full h-full object-cover" />
          </motion.button>

          {/* Tooltip */}
          <AnimatePresence>
            {showHiddenTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[200px] z-[100]"
              >
                <div className="bg-[#BF76FF] text-white text-[8px] uppercase tracking-widest font-black px-3 py-1.5 rounded-lg shadow-lg relative whitespace-nowrap">
                  Estou aqui encima, caso precise!
                  {/* Seta para cima */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#BF76FF] rotate-45" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        portalTarget
      );
    }
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isDragging && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.5 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center pointer-events-none shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-sm"
          >
            <X className="w-8 h-8 text-red-500" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        drag={!isOpen}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        animate={dragControls}
        onDragEnd={handleDragEnd}
        className={cn(
          "z-[100] flex flex-col pointer-events-none",
          loginMode 
            ? "absolute top-14 right-0"
            : cn(
                "fixed bottom-24 md:bottom-6",
                isLeftAligned ? "left-6 items-start" : "right-6 items-end"
              ),
          (loginMode && !isOpen) ? "hidden" : "flex"
        )}
        style={{ touchAction: 'none' }}
      >  <AnimatePresence>
          {isOpen && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn("relative w-[340px] sm:w-[380px] pointer-events-auto rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border cursor-move", BG_PANEL, BORDER_COLOR)}
              style={{ maxHeight: 'min(700px, 80vh)' }}
            >
              
              {/* === MENU VIEW === */}
              {view === "menu" && (
                <div className={cn("flex flex-col h-full", BG_PANEL)}>
                  {/* Header */}
                  <div className="px-6 py-8 flex items-center gap-4 text-white" style={{ backgroundColor: isDarkMode ? "#1A1A1A" : "#1A1A1A", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-white shadow-inner">
                        <img src={effectiveBotImage} alt="Bot" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-[#1A1A1A] rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-tight uppercase bg-gradient-to-r from-[#BF76FF] to-[#FF76B8] bg-clip-text text-transparent mb-1">
                        {effectiveBotName}
                      </h3>
                      <p 
                        className="text-[9px] tracking-wide text-gray-400 opacity-60"
                        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 300 }}
                      >
                        ® Todos direitos reservados - <a href="https://danielvaleweb.com.br" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors" style={{ fontWeight: 500 }}>danielvaleweb</a>
                      </p>
                    </div>
                  </div>

                  {/* Body Options */}
                  <div className="p-6 space-y-4">
                    <p className={cn("text-[14px] font-bold mb-2", TEXT_SECONDARY)}>Como podemos te ajudar hoje?</p>
                    
                    {loginMode && (
                      <button 
                        onClick={() => setView("forgotPassword")}
                        className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-blue-500/10" : "bg-white border-gray-100 hover:bg-blue-50/50")}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Key className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Esqueci minha senha</h4>
                          <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Recupere seu acesso pelo WhatsApp</p>
                        </div>
                      </button>
                    )}

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
                      onClick={() => {
                        setView("menu");
                        setIsOpen(false);
                        window.dispatchEvent(new CustomEvent('open-bug-report'));
                      }}
                      className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-red-500/10" : "bg-white border-gray-100 hover:bg-red-50/50")}
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Reportar um Problema</h4>
                        <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Descreva falhas para nossa equipe</p>
                      </div>
                    </button>

                    {(botSettings.botTicketRoles || []).includes(profile?.role || "") && (
                      <button 
                        onClick={() => setView("ticketList")}
                        className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-indigo-500/10" : "bg-white border-gray-100 hover:bg-indigo-50/50")}
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Problemas com o site?</h4>
                          <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Abra um chamado técnico</p>
                        </div>
                      </button>
                    )}

                    <button 
                      onClick={() => setView("faq")}
                      className={cn("w-full border shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all text-left", isDarkMode ? "bg-white/5 border-white/5 hover:bg-amber-500/10" : "bg-white border-gray-100 hover:bg-amber-50/50")}
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-sm uppercase tracking-tight", TEXT_PRIMARY)}>Dúvidas Frequentes</h4>
                        <p className={cn("text-[11px] font-medium mt-0.5 leading-tight", TEXT_SECONDARY)}>Encontre respostas rápidas aqui</p>
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

                  {/* Chat Area */}
                  <div 
                    className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide cursor-default" 
                    ref={chatScrollRef}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {/* Bot Message Block Initial */}
                    {supportMessages.length === 0 && !showRating && (
                      <div className="flex items-end gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white shrink-0 mb-5">
                          <img src={effectiveBotImage} alt="Bot" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                          <div className={cn("border shadow-sm p-4 rounded-2xl rounded-bl-sm text-[13px] font-medium leading-relaxed", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-gray-200" : "bg-white border-gray-100 text-gray-800")}>
                            <p>Paz do Senhor, {effectiveUserName?.split(" ")[0] || "usuário"}! ✨</p>
                            <p className="mt-2">É sempre um prazer enorme falar com você.</p>
                            <p className="mt-4">Como posso ajudar a tornar o seu dia mais ágil e produtivo hoje?</p>
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold ml-1">Assistente • Agora</span>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {supportMessages.map((msg, idx) => {
                      if (msg.isSystem) {
                        return (
                          <div key={idx} className="flex justify-center my-3 w-full">
                            <div className={cn("px-4 py-2 rounded-2xl shadow-sm text-center max-w-[85%] w-full mx-auto", isDarkMode ? "bg-orange-500/10 border border-orange-500/20" : "bg-orange-50 border border-orange-200")}>
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", isDarkMode ? "text-orange-500" : "text-orange-600")}>
                                {msg.text}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const isMe = msg.senderId === effectiveUserId;
                      const isBot = msg.senderId === "bot";
                      return (
                        <div key={idx} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white shrink-0 mb-5 flex items-center justify-center text-[#BF76FF] font-bold">
                              {isBot ? (
                                <img src={effectiveBotImage} alt="Bot" className="w-full h-full object-cover" />
                              ) : supportChat?.assignedAdminPhoto ? (
                                <img src={supportChat.assignedAdminPhoto} alt="Admin" className="w-full h-full object-cover" />
                              ) : (
                                supportChat?.assignedAdminName?.[0] || "S"
                              )}
                            </div>
                          )}
                          <div className={cn("flex flex-col gap-1 max-w-[85%]", isMe ? "items-end" : "items-start")}>
                            {(() => {
                              const isOnlyUrl = msg.text && msg.text.trim().match(/^(https?:\/\/[^\s]+)$/);
                              return (
                              <div className={cn(
                                "shadow-sm whitespace-pre-wrap leading-relaxed relative",
                                isOnlyUrl ? "p-0 bg-transparent shadow-none" : "p-3.5 px-4 text-[13px] font-medium",
                                isOnlyUrl 
                                  ? ""
                                  : isMe ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white" : cn("rounded-2xl rounded-bl-sm border", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-gray-200" : "bg-white border-gray-100 text-gray-800")
                              )}>
                                {(() => {
                                  if (!msg.text) return null;
                                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                                  const parts = msg.text.split(urlRegex);
                                  return parts.map((part: string, i: number) => {
                                    if (part.match(urlRegex)) {
                                      return (
                                        <a 
                                          key={i} 
                                          href={part} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className={cn(
                                            "inline-flex items-center gap-2 transition-all font-black text-[12px] shadow-sm no-underline align-middle cursor-pointer",
                                            isOnlyUrl
                                              ? cn("px-5 py-3 rounded-2xl", isMe ? "bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white rounded-br-sm hover:brightness-110" : cn("rounded-bl-sm border", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-gray-200" : "bg-white border-gray-100 text-gray-800 hover:brightness-95"))
                                              : "px-2.5 py-1 rounded-md bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 mx-1"
                                          )}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <LinkIcon className={cn(isOnlyUrl ? "w-4 h-4" : "w-3.5 h-3.5")} />
                                          Acessar Link
                                        </a>
                                      );
                                    }
                                    const boldRegex = /\*\*(.*?)\*\*/g;
                                    const textParts = part.split(boldRegex);
                                    return (
                                      <span key={i}>
                                        {textParts.map((str, idx) => {
                                          if (idx % 2 === 1) {
                                            return <strong key={idx} className="font-extrabold">{str}</strong>;
                                          }
                                          return <span key={idx}>{str}</span>;
                                        })}
                                      </span>
                                    );
                                  });
                                })()}
                              </div>
                              );
                            })()}
                            <span className="text-[9px] text-gray-500 font-bold mx-1">
                              {isMe ? "Você" : msg.senderId === "bot" ? effectiveBotName : "Suporte"}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isBotTyping && (
                      <div className="flex items-end gap-2 justify-start mt-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white shrink-0 mb-5">
                          <img src={effectiveBotImage} alt="Bot" className="w-full h-full object-cover" />
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
                             <button 
                               key={star} 
                               onClick={() => handleRating(star)}
                               onMouseEnter={() => setHoverRating(star)}
                               onMouseLeave={() => setHoverRating(0)}
                               className={cn("transition-all hover:scale-110", star <= hoverRating ? "text-yellow-400" : "text-gray-300")}
                             >
                                <Star className={cn("w-8 h-8", star <= hoverRating ? "fill-current" : "")} />
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  {!showRating && (
                    <div className={cn("p-4 shrink-0 pb-6 border-t cursor-default", isDarkMode ? "bg-[#0A0A0A] border-white/5" : "bg-[#F7F8FA] border-black/5")} onPointerDown={(e) => e.stopPropagation()}>
                      <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="relative flex items-center"
                      >
                        <Input 
                          placeholder="Sua mensagem..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={isSending || isBotTyping}
                          autoComplete="off"
                          className={cn("w-full h-12 pl-4 pr-14 rounded-[16px] border shadow-sm text-[13px] focus-visible:ring-1 focus-visible:ring-[#BF76FF]", isDarkMode ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-500 disabled:opacity-50" : "bg-white border-gray-200 text-black disabled:opacity-50")}
                        />
                        <button 
                          type="submit"
                          disabled={isSending || isBotTyping || !chatInput.trim()}
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
                  )}
                </div>
              )}

              {/* === FAQ VIEW === */}
              {view === "faq" && (
                <div className={cn("flex flex-col h-full min-h-[400px]", BG_PANEL)}>
                  <div className={cn("px-4 py-4 flex items-center gap-3 border-b", BORDER_COLOR)}>
                    <button onClick={() => setView("menu")} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className={cn("font-black text-sm uppercase tracking-widest", TEXT_PRIMARY)}>
                      Dúvidas Frequentes
                    </h3>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                       <div className={cn("rounded-[20px] p-5 border transition-all", isDarkMode ? "bg-white/5 border-white/5" : "border-gray-100 bg-gray-50")}>
                          <h4 className={cn("font-bold text-sm flex items-center gap-2 mb-2", TEXT_PRIMARY)}>
                            <span className="w-2 h-2 rounded-full bg-[#BF76FF]" />
                            Como aprovar um novo membro?
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            Acesse a aba de "Cadastros" no menu lateral. Lá você encontrará todas as solicitações pendentes e poderá aprovar ou reprovar os novos membros.
                          </p>
                       </div>
                       
                       <div className={cn("rounded-[20px] p-5 border transition-all", isDarkMode ? "bg-white/5 border-white/5" : "border-gray-100 bg-gray-50")}>
                          <h4 className={cn("font-bold text-sm flex items-center gap-2 mb-2", TEXT_PRIMARY)}>
                            <span className="w-2 h-2 rounded-full bg-[#BF76FF]" />
                            Como criar um evento?
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            Vá em "Agenda da Igreja", clique em "Novo Evento" no canto superior direito e preencha os detalhes como título, horário, local e descrição.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TICKET FORM VIEW === */}
              {view === "ticketForm" && (
                <div className={cn("flex flex-col h-full min-h-[500px]", BG_PANEL)}>
                  <div className={cn("px-4 py-4 flex items-center gap-3 border-b", BORDER_COLOR)}>
                    <button onClick={() => setView("menu")} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className={cn("font-black text-sm uppercase tracking-widest", TEXT_PRIMARY)}>
                      Abertura de Chamado
                    </h3>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div>
                      <label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 block", TEXT_SECONDARY)}>Seu Nome</label>
                      <Input 
                        value={ticketContactName}
                        onChange={(e) => setTicketContactName(e.target.value)}
                        className={cn("h-11 rounded-xl", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50")} 
                      />
                    </div>
                    <div>
                      <label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 block", TEXT_SECONDARY)}>Empresa / Projeto</label>
                      <Input 
                        value={ticketCompanyName}
                        onChange={(e) => setTicketCompanyName(e.target.value)}
                        placeholder="Ex: TechFlow Solutions"
                        className={cn("h-11 rounded-xl", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50")} 
                      />
                    </div>
                    <div>
                      <label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 block", TEXT_SECONDARY)}>Assunto / Título</label>
                      <Input 
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="O que está acontecendo?"
                        className={cn("h-11 rounded-xl", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50")} 
                      />
                    </div>
                    <div>
                      <label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 block", TEXT_SECONDARY)}>Descrição detalhada</label>
                      <Textarea 
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Descreva o problema em detalhes..."
                        className={cn("h-24 rounded-xl resize-none", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50")} 
                      />
                    </div>
                    <div>
                      <label className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 block", TEXT_SECONDARY)}>Prioridade</label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        className={cn("w-full h-11 px-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#BF76FF]", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900")}
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="critical">Crítica</option>
                      </select>
                    </div>
                    
                    <Button 
                      onClick={handleTicketSubmit}
                      disabled={isSubmittingTicket || !ticketContactName.trim() || !ticketCompanyName.trim() || !ticketSubject.trim() || !ticketDescription.trim()}
                      className="w-full h-12 rounded-xl text-white font-black uppercase tracking-widest mt-4"
                      style={{ backgroundColor: THEME_COLOR }}
                    >
                      {isSubmittingTicket ? "Enviando..." : "Abrir Chamado"}
                    </Button>
                  </div>
                </div>
              )}

              {/* === TICKET SUCCESS VIEW === */}
              {view === "ticketSuccess" && (
                <div className={cn("flex flex-col h-full min-h-[400px] items-center justify-center p-8 text-center", BG_PANEL)}>
                  <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
                    <Star className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className={cn("text-xl font-black uppercase tracking-tighter mb-2", TEXT_PRIMARY)}>Chamado Aberto!</h3>
                  <p className={cn("text-sm font-medium leading-relaxed", TEXT_SECONDARY)}>
                    Seu chamado técnico foi aberto com sucesso com o identificador <strong className={TEXT_PRIMARY}>ID {ticketIdSuccess}</strong>! Nossa equipe NOC já foi acionada. Qualquer resposta ou atualização aparecerá logo abaixo.
                  </p>
                  <Button 
                    onClick={() => setView("ticketList")}
                    className={cn("w-full h-12 rounded-xl mt-8 font-black uppercase tracking-widest", isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}
                  >
                    Ver Meus Chamados
                  </Button>
                </div>
              )}

              {/* === TICKET LIST VIEW === */}
              {view === "ticketList" && (
                <div className={cn("flex flex-col h-full min-h-[500px]", BG_PANEL)}>
                  <div className={cn("px-4 py-4 flex items-center gap-3 border-b", BORDER_COLOR)}>
                    <button onClick={() => setView("menu")} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className={cn("font-black text-sm uppercase tracking-widest", TEXT_PRIMARY)}>
                      Seus Chamados
                    </h3>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto flex flex-col">
                    <div className="flex-1 space-y-4">
                      {userTickets.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                          <p className={cn("text-xs font-bold uppercase tracking-widest", TEXT_SECONDARY)}>Nenhum chamado aberto</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userTickets.map(ticket => (
                            <div key={ticket.docId} className={cn("p-4 rounded-2xl border transition-all hover:scale-[1.02]", isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-sm")}>
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]">{ticket.id}</span>
                                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", 
                                  ticket.status === "open" ? "bg-yellow-500/10 text-yellow-500" : 
                                  ticket.status === "closed" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                  {ticket.status === "open" ? "Aberto" : ticket.status === "closed" ? "Resolvido" : "Em Andamento"}
                                </span>
                              </div>
                              <h4 className={cn("font-bold text-sm tracking-tight mb-1 line-clamp-1", TEXT_PRIMARY)}>{ticket.title}</h4>
                              <p className={cn("text-[10px] font-medium mt-1 truncate", TEXT_SECONDARY)}>
                                {ticket.createdAt}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 shrink-0">
                      <Button 
                        onClick={() => setView("ticketForm")}
                        className="w-full h-12 rounded-xl text-white font-black uppercase tracking-widest shadow-md"
                        style={{ backgroundColor: THEME_COLOR }}
                      >
                        Abrir Novo Chamado
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* === FORGOT PASSWORD VIEW === */}
              {view === "forgotPassword" && (
                <div className={cn("flex flex-col h-full min-h-[400px]", BG_PANEL)}>
                  <div className={cn("px-4 py-4 flex items-center gap-3 border-b", BORDER_COLOR)}>
                    <button onClick={() => setView("menu")} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className={cn("font-black text-sm uppercase tracking-widest", TEXT_PRIMARY)}>
                      Recuperar Senha
                    </h3>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                    <div>
                      <p className={cn("text-xs font-medium mb-4", TEXT_SECONDARY)}>Para recuperar sua senha, precisamos do seu e-mail cadastrado no sistema.</p>
                      <Input 
                        placeholder="Seu e-mail cadastrado..." 
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className={cn("h-12 rounded-xl mb-4", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50")} 
                      />
                      <Button 
                        disabled={!forgotEmail.trim()}
                        onClick={() => {
                          const msg = `esqueci minha senha meu email é ${forgotEmail.trim()}`;
                          window.open(`https://wa.me/5532999194640?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-full h-12 rounded-xl text-white font-black uppercase tracking-widest shadow-md" 
                        style={{ backgroundColor: THEME_COLOR }}
                      >
                        Continuar no WhatsApp
                      </Button>
                    </div>

                    <div className={cn("pt-6 border-t", BORDER_COLOR)}>
                      <p className={cn("text-xs font-medium mb-4 text-center", TEXT_SECONDARY)}>Não lembra o e-mail cadastrado?</p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const msg = "Esqueci meu Email e senha preciso de ajuda.";
                          window.open(`https://wa.me/5532999194640?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className={cn("w-full h-12 rounded-xl font-bold uppercase tracking-widest border-2 bg-transparent", isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-50 text-gray-900")} 
                      >
                        Falar com Suporte
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Message Balloon (Only when closed) */}
        <AnimatePresence>
          {showMessage && !isOpen && !loginMode && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={cn("px-5 py-3 rounded-[16px] shadow-lg relative pointer-events-auto max-w-[200px] mb-2", isLeftAligned ? "ml-2" : "mr-2")}
              style={{ backgroundColor: THEME_COLOR, color: "white", ...(isLeftAligned ? { borderBottomLeftRadius: '4px' } : { borderBottomRightRadius: '4px' }) }}
            >
              <p className="text-[13px] font-bold tracking-tight text-center leading-snug">{currentMessage}</p>
              <div 
                className={cn("absolute -bottom-1.5 w-3 h-3 rotate-45", isLeftAligned ? "left-6" : "right-6")}
                style={{ backgroundColor: THEME_COLOR }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        {!loginMode && (
          <div className="pointer-events-auto relative mt-2">
            <button 
              className={cn(
                "w-[60px] h-[60px] rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center z-[110]",
                isOpen 
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
                  : "bg-white border-[3px] border-white shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              )}
              onClick={toggleOpen}
            >
              {isOpen ? (
                <X className="w-7 h-7 text-white" />
              ) : (
                <img
                  src={effectiveBotGif}
                  alt="Bot Avatar"
                  className={cn("w-full h-full object-cover rounded-full", isDarkMode ? "opacity-90" : "")}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = effectiveBotImage;
                  }}
                />
              )}
            </button>
          </div>
        )}
        
      </motion.div>

      {loginMode && (
        <div className="relative flex flex-col items-end z-[50] mr-2">
          {/* Animated Message Balloon inline absolute */}
          <AnimatePresence>
            {showMessage && !isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute right-0 bottom-full mb-2 px-5 py-3 rounded-[16px] shadow-lg pointer-events-auto w-[200px]"
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

          <button 
            className={cn(
              "w-[60px] h-[60px] rounded-full overflow-hidden pointer-events-auto shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center z-[110]",
              isOpen 
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
                : "bg-white border-[3px] border-white shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            )}
            onClick={toggleOpen}
          >
            {isOpen ? (
              <X className="w-7 h-7 text-white" />
            ) : (
              <img
                src={effectiveBotGif}
                alt="Bot Avatar"
                className={cn("w-full h-full object-cover rounded-full", isDarkMode ? "opacity-90" : "")}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = effectiveBotImage;
                }}
              />
            )}
          </button>
        </div>
      )}
    </>
  );
}
