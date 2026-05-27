import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Smile, 
  Paperclip, 
  Send, 
  ArrowLeft, 
  Plus, 
  User, 
  Check, 
  CheckCheck, 
  Loader2, 
  Image as ImageIcon,
  MessageSquare,
  X,
  Clock,
  Heart,
  CornerUpRight,
  ChevronDown,
  CornerUpLeft,
  Pin,
  Copy,
  Lock,
  Link as LinkIcon
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { cn, getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// Cloudinary connection keys as configured in UploadImages.tsx
const CLOUD_NAME = 'dvkgodvhm';
const UPLOAD_PRESET = 'site_uploads';

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  timestamp: any;
  read?: boolean;
  replyToText?: string;
  replyToSenderName?: string;
  reactions?: Record<string, string>;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  lastSenderId: string;
  unreadCount?: Record<string, number>;
  systemChat?: boolean;
  pinnedMessageId?: string | null;
  pinnedMessageText?: string | null;
  pinnedMessageSenderName?: string | null;
  isSupport?: boolean;
  status?: string;
  requesterId?: string;
  requesterName?: string;
  assignedAdminId?: string;
}

interface ChatInboxViewProps {
  isDark: boolean;
  profile: any;
  members: any[];
  activeChats: Chat[];
  chatMessages: Message[];
  activeChatUser: any;
  setActiveChatUser: (user: any) => void;
  activeChatId?: string | null;
  setActiveChatId?: (id: string | null) => void;
  setChatMessages: (msgs: Message[]) => void;
}

const POPULAR_EMOJIS = [
  '😄', '😊', '😂', '🤣', '😍', '😘', '😜', '🤪', '😎', '🤩',
  '👍', '🙌', '👏', '🙏', '❤️', '💖', '🔥', '✨', '🌟', '🎉',
  '😢', '😭', '😡', '😱', '🤔', '🤫', '😴', '🚀', '👑', '💯'
];

const getSupportStatusTag = (chat: any) => {
  if (!chat.isSupport) return null;
  if (chat.status === 'open') return { label: 'Bot atendendo', className: 'bg-blue-500 text-white border-transparent shadow-sm' };
  if (chat.status === 'closed') return { label: 'Encerrado', className: 'bg-gray-500 text-white border-transparent shadow-sm' };
  if (chat.status === 'solved') return { label: 'Solucionado', className: 'bg-green-500 text-white border-transparent shadow-sm' };
  if (chat.status === 'in_progress') {
    if (chat.lastSenderId === chat.requesterId) {
      return { label: 'Aguardando suporte', className: 'bg-orange-500 text-white border-transparent shadow-sm' };
    } else if (chat.lastSenderId === chat.assignedAdminId) {
      return { label: 'Aguardando membro', className: 'bg-yellow-500 text-white border-transparent shadow-sm' };
    } else {
      const adminName = chat.assignedAdminName ? chat.assignedAdminName.split(' ')[0] : 'Admin';
      return { label: `${adminName} atendendo`, className: 'bg-purple-500 text-white border-transparent shadow-sm' };
    }
  }
  return { label: 'Suporte', className: 'bg-orange-500 text-white border-transparent shadow-sm' };
};

export function ChatInboxView({
  isDark,
  profile,
  members,
  activeChats,
  chatMessages,
  activeChatUser,
  setActiveChatUser,
  activeChatId,
  setActiveChatId,
  setChatMessages
}: ChatInboxViewProps) {
  const [chatSearch, setChatSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [forwardImageUrl, setForwardImageUrl] = useState<string | null>(null);
  const [selectedForwardMembers, setSelectedForwardMembers] = useState<string[]>([]);
  const [forwardSearch, setForwardSearch] = useState("");

  const hasSupportAccess = profile?.role === 'Administrador Master' || profile?.role === 'Desenvolvedor' || profile?.role === 'Administrador';

  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [inboxTab, setInboxTab] = useState<'mensagens' | 'suporte'>('mensagens');

  // Close context menus on click anywhere
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuMessageId(null);
      setActiveReactionMessageId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapse info panel by default on conversation change
  useEffect(() => {
    setShowInfoPanel(false);
  }, [activeChatUser?.id]);

  // Auto scroll to bottom when message arrives
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle Mark Messages as Read
  useEffect(() => {
    if (!profile?.id || !activeChatUser?.id) return;
    const chatId = activeChatId || [profile.id, activeChatUser.id].sort().join('_');
    
    // Find unread messages received from the other user
    const unreadMsgs = chatMessages.filter(m => m.senderId !== profile.id && !m.read);
    
    unreadMsgs.forEach(msg => {
      updateDoc(doc(db, "chats", chatId, "messages", msg.id), { read: true })
        .catch(err => console.error("Error setting read status:", err));
    });

    // Reset unread count for current user in Chat index
    const chat = activeChats.find(c => c.id === chatId);
    if (chat && chat.unreadCount?.[profile.id] > 0) {
      updateDoc(doc(db, "chats", chatId), {
        [`unreadCount.${profile.id}`]: 0
      }).catch(err => console.error("Error resetting unreadCount:", err));
    }
  }, [profile?.id, activeChatUser?.id, chatMessages, activeChats]);

  // Image Upload handler
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id || !activeChatUser?.id) return;

    if (!file.type.startsWith('image/')) {
      alert("Apenas arquivos de imagem são aceitos.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 4MB.");
      return;
    }

    setUploading(true);
    const chatId = activeChatId || [profile.id, activeChatUser.id].sort().join('_');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Cloudinary upload failed");
      const data = await res.json();
      const imageUrl = data.secure_url;

      // Update Chat Index
      await setDoc(doc(db, "chats", chatId), {
        participants: [profile.id, activeChatUser.id],
        lastMessage: "📷 Imagem anexada",
        lastMessageTime: serverTimestamp(),
        lastSenderId: profile.id,
        [`unreadCount.${activeChatUser.id}`]: increment(1)
      }, { merge: true });

      // Add image message to messages subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), {
        imageUrl,
        senderId: profile.id,
        timestamp: serverTimestamp(),
        read: false
      });

      // Add Notification
      await addDoc(collection(db, "notifications"), {
        userId: activeChatUser.id,
        title: "Nova imagem",
        message: `${profile.name} enviou uma imagem para você`,
        read: false,
        type: "chat",
        senderId: profile.id,
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error("Error uploading chat image:", err);
      alert("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !profile?.id || !activeChatUser?.id) return;

    const chatId = activeChatId || [profile.id, activeChatUser.id].sort().join('_');
    const msgText = chatInput.trim();
    setChatInput(""); // Clear field instantly
    setEmojiDrawerOpen(false);

    try {
      // Update Chat Index
      await setDoc(doc(db, "chats", chatId), {
        participants: [profile.id, activeChatUser.id],
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        lastSenderId: profile.id,
        [`unreadCount.${activeChatUser.id}`]: increment(1)
      }, { merge: true });

      // Add to messages subcollection with reply metadata
      const msgData: any = {
        text: msgText,
        senderId: profile.id,
        timestamp: serverTimestamp(),
        read: false
      };

      if (replyingToMessage) {
        msgData.replyToText = replyingToMessage.text || "📷 Imagem";
        msgData.replyToSenderName = replyingToMessage.senderId === profile.id ? "Você" : activeChatUser.name;
        setReplyingToMessage(null); // Clear state
      }

      await addDoc(collection(db, "chats", chatId, "messages"), msgData);

      // Add Notification
      await addDoc(collection(db, "notifications"), {
        userId: activeChatUser.id,
        title: "Nova mensagem",
        message: `${profile.name} enviou uma mensagem para você`,
        read: false,
        type: "chat",
        senderId: profile.id,
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleForwardImage = async () => {
    if (!forwardImageUrl || selectedForwardMembers.length === 0 || !profile?.id) return;
    const imageUrl = forwardImageUrl;
    const recipients = [...selectedForwardMembers];
    setForwardImageUrl(null);
    setSelectedForwardMembers([]);
    setForwardSearch('');
    try {
      for (const recipientId of recipients) {
        const chatId = [profile.id, recipientId].sort().join('_');
        await setDoc(doc(db, "chats", chatId), {
          participants: [profile.id, recipientId],
          lastMessage: "📷 Imagem encaminhada",
          lastMessageTime: serverTimestamp(),
          lastSenderId: profile.id,
          [`unreadCount.${recipientId}`]: increment(1)
        }, { merge: true });
        await addDoc(collection(db, "chats", chatId, "messages"), {
          imageUrl,
          senderId: profile.id,
          timestamp: serverTimestamp(),
          read: false
        });
        await addDoc(collection(db, "notifications"), {
          userId: recipientId,
          title: "Imagem encaminhada",
          message: `${profile.name} encaminhou uma imagem para você`,
          read: false,
          type: "chat",
          senderId: profile.id,
          createdAt: serverTimestamp()
        });
      }
      alert("Imagem encaminhada com sucesso!");
    } catch (err) {
      console.error("Error forwarding image:", err);
      alert("Erro ao encaminhar imagem.");
    }
  };

  // Format timestamp to HH:MM
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Group Messages by date
  const formatMessageDateGroup = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };



  const handleAssumeSupport = async (chatId: string) => {
    if (!profile?.id) return;
    try {
      const chat = activeChats.find(c => c.id === chatId);
      const adminName = profile.name || profile.displayName || "Especialista";
      const firstName = adminName.split(" ")[0];
      const greeting = `Olá, aqui é o(a) ${firstName}, especialista de suporte da Iemp. Como posso ajudá-lo(a)?`;

      await updateDoc(doc(db, "chats", chatId), {
        status: "in_progress",
        assignedAdminId: profile.id,
        assignedAdminName: adminName,
        assignedAdminPhoto: profile.photoURL || null,
        participants: [chat?.requesterId, profile.id],
        lastMessage: greeting,
        lastMessageTime: serverTimestamp(),
        lastSenderId: profile.id
      });

      // System message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: `${adminName.toUpperCase()} ASSUMIU O ATENDIMENTO.`,
        isSystem: true,
        timestamp: serverTimestamp()
      });

      // Greeting
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: greeting,
        senderId: profile.id,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error assuming support", err);
    }
  };

  const handleSolveSupport = async (chatId: string) => {
    if (!profile?.id) return;
    try {
      const adminName = profile.name || profile.displayName || "Especialista";
      const message = "O seu atendimento foi marcado como solucionado! Por favor, avalie o nosso suporte e se precisar de algo mais, basta iniciar um novo chat.";
      
      await updateDoc(doc(db, "chats", chatId), {
        status: "solved",
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        lastSenderId: profile.id
      });

      // System message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: `ATENDIMENTO SOLUCIONADO POR ${adminName.toUpperCase()}.`,
        isSystem: true,
        timestamp: serverTimestamp()
      });

      // Avaliation request message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: message,
        senderId: profile.id,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error solving support", err);
    }
  };

  const handleCloseSupport = async (chatId: string) => {
    if (!profile?.id) return;
    try {
      // Deletar as mensagens primeiro
      const messagesRef = collection(db, "chats", chatId, "messages");
      const msgsSnapshot = await getDocs(messagesRef);
      const deletePromises = msgsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Deletar o chat principal
      await deleteDoc(doc(db, "chats", chatId));

      setActiveChatUser(null);
      setActiveChatId?.(null);
    } catch (err) {
      console.error("Error closing/deleting support", err);
    }
  };

  // Filter Active Chats list
  const filteredChats = useMemo(() => {
    return activeChats.filter(chat => {
      if (inboxTab === 'suporte') {
        if (!chat.isSupport) return false;
        // Removido: if (chat.status === 'closed') return false; para exibir encerrados
      } else {
        if (chat.isSupport) return false;
      }

      const otherUserId = chat.isSupport 
        ? (chat.requesterId === profile?.id ? chat.assignedAdminId : chat.requesterId)
        : chat.participants?.find((p: string) => p !== profile?.id) || "";

      // Se for um suporte aberto e não assumido, e eu não sou o requester, mostramos
      const otherUser = members.find(m => m.id === otherUserId) || { 
        id: chat.requesterId, 
        name: chat.requesterName || "Usuário", 
        photoURL: null, 
        status_online: 'offline' 
      };

      if (!otherUser.name) return false;
      return otherUser.name.toLowerCase().includes(chatSearch.toLowerCase());
    });
  }, [activeChats, chatSearch, members, profile?.id, inboxTab]);

  // Filter Contacts for starting a new chat
  const filteredContacts = useMemo(() => {
    return members
      .filter(m => m.id !== profile?.id && m.status !== "pending")
      .filter(m => m.name?.toLowerCase().includes(newChatSearch.toLowerCase()));
  }, [members, profile?.id, newChatSearch]);

  const filteredForwardContacts = useMemo(() => {
    return members
      .filter(m => m.id !== profile?.id && m.status !== "pending")
      .filter(m => m.name?.toLowerCase().includes(forwardSearch.toLowerCase()));
  }, [members, profile?.id, forwardSearch]);
  const currentChat = useMemo(() => {
    if (!profile?.id || !activeChatUser?.id) return null;
    
    if (activeChatId) {
      return activeChats.find(c => c.id === activeChatId) || null;
    }

    // O ID do chat padrão é a combinação dos IDs
    const standardChatId = [profile.id, activeChatUser.id].sort().join('_');
    
    // Procuramos primeiro um chat de suporte que bate com o otherUser
    const supportChat = activeChats.find(c => c.isSupport && (c.requesterId === activeChatUser.id || c.assignedAdminId === activeChatUser.id));
    
    return supportChat || activeChats.find(c => c.id === standardChatId) || null;
  }, [activeChats, profile?.id, activeChatUser?.id, activeChatId]);
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!profile?.id || !activeChatUser?.id) return;
    const chatId = activeChatId || [profile.id, activeChatUser.id].sort().join('_');
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
        [`reactions.${profile.id}`]: emoji
      });
    } catch (err) {
      console.error("Error setting reaction:", err);
    }
  };

  const handlePinMessage = async (msg: Message) => {
    if (!profile?.id || !activeChatUser?.id) return;
    const chatId = activeChatId || [profile.id, activeChatUser.id].sort().join('_');
    try {
      await updateDoc(doc(db, "chats", chatId), {
        pinnedMessageId: msg.id,
        pinnedMessageText: msg.text || "📷 Imagem",
        pinnedMessageSenderName: msg.senderId === profile.id ? "Você" : activeChatUser.name
      });
      alert("Mensagem fixada com sucesso!");
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  };

  // Shared attachments in conversation
  const sharedAttachments = useMemo(() => {
    return chatMessages.filter(m => !!m.imageUrl).map(m => m.imageUrl!);
  }, [chatMessages]);

  // Group chatMessages by date heading
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; msgs: Message[] }[] = [];
    chatMessages.forEach(msg => {
      const dateLabel = formatMessageDateGroup(msg.timestamp);
      const existingGroup = groups.find(g => g.dateLabel === dateLabel);
      if (existingGroup) {
        existingGroup.msgs.push(msg);
      } else {
        groups.push({ dateLabel, msgs: [msg] });
      }
    });
    return groups;
  }, [chatMessages]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full flex-1 min-h-0 bg-[#0c0f1d] text-white overflow-hidden md:rounded-[32px] md:border border-white/5 relative">
      
      {/* 1. CHAT LIST PANEL (Left) */}
      <div className={cn(
        "w-full md:w-[340px] lg:w-[380px] bg-[#121829] border-r border-white/5 flex flex-col shrink-0 overflow-hidden transition-all duration-300",
        activeChatUser && "hidden md:flex" // Hide list on mobile when chat is active
      )}>
        {/* Header with Search and New Chat button */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Mensagens</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-10 h-10 rounded-xl bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Nova Conversa"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
                         <div className="relative mb-3">
              <Search className={cn("w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-gray-500" : "text-gray-400")} />
              <input 
                type="text" 
                placeholder="Buscar conversa..." 
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className={cn("w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition-colors", isDark ? "bg-white/5 hover:bg-white/10 text-white placeholder:text-gray-500 focus:bg-white/10" : "bg-gray-100 hover:bg-gray-200 text-black placeholder:text-gray-400 focus:bg-gray-200")}
              />
            </div>

            {hasSupportAccess && (
              <div className="flex bg-[#232323] p-1 rounded-2xl w-full">
                <button 
                  onClick={() => setInboxTab('mensagens')}
                  className={cn("flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all duration-300", inboxTab === 'mensagens' ? "bg-[#BF76FF] text-white shadow-md scale-105" : "text-gray-400 hover:text-white")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", inboxTab === 'mensagens' ? "bg-white" : "bg-transparent")} />
                    Mensagens
                  </div>
                </button>
                <button 
                  onClick={() => setInboxTab('suporte')}
                  className={cn("flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all duration-300", inboxTab === 'suporte' ? "bg-[#BF76FF] text-white shadow-md scale-105" : "text-gray-400 hover:text-white")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", inboxTab === 'suporte' ? "bg-white" : "bg-transparent")} />
                    Suporte
                  </div>
                </button>
              </div>
            )}
          </div>

        {/* Chats scroll area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {filteredChats.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
              <MessageSquare className="w-12 h-12 mb-4 text-[#BF76FF]" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma conversa ativa</p>
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#BF76FF] hover:underline"
              >
                Iniciar Nova Conversa
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUserId = chat.isSupport 
                ? (chat.requesterId === profile?.id ? chat.assignedAdminId : chat.requesterId)
                : chat.participants?.find((p: string) => p !== profile?.id) || "";
              
              const m = members.find(member => member.id === otherUserId) || {
                id: chat.requesterId,
                name: chat.requesterName || "Suporte",
                photoURL: null,
                status_online: 'online'
              };

              if (!m) return null;
              
              const isSelected = activeChatUser?.id === m.id && activeChatId === chat.id;
              const hasUnread = (chat.unreadCount?.[profile?.id] || 0) > 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatUser(m);
                    setActiveChatId?.(chat.id);
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300",
                    isSelected 
                      ? "bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white shadow-lg shadow-[#D946EF]/20" 
                      : "bg-[#182033]/40 border border-transparent hover:border-white/5 hover:bg-[#182033]"
                  )}
                >
                  <div className="relative shrink-0">
                    {m.photoURL || m.photoUrl ? (
                      <img src={getImageUrl(m.photoURL || m.photoUrl)} className="w-12 h-12 rounded-full object-cover border-2 border-white/10" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/5 text-lg font-bold flex items-center justify-center text-[#BF76FF]">
                        {m.name?.[0]}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#121829] rounded-full" style={{ backgroundColor: m.status_online === 'online' ? '#22c55e' : m.status_online === 'busy' ? '#ef4444' : m.status_online === 'away' ? '#f59e0b' : '#6b7280' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={cn("font-bold text-sm truncate", isSelected ? "text-white" : "text-gray-100")}>
                        {m.name} 
                        {chat.isSupport && (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md ml-1 uppercase border", getSupportStatusTag(chat)?.className)}>
                            {getSupportStatusTag(chat)?.label}
                          </span>
                        )}
                      </h4>
                      <span className={cn("text-[9px] font-bold opacity-50 uppercase tabular-nums", isSelected ? "text-white/80" : "text-gray-400")}>
                        {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate font-semibold", isSelected ? "text-white/70" : hasUnread ? "text-white font-bold" : "text-gray-500")}>
                      {chat.lastSenderId === profile?.id ? "Você: " : ""}
                      {chat.lastMessage}
                    </p>
                  </div>
                  {hasUnread && !isSelected && (
                    <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-md animate-pulse">
                      {chat.unreadCount?.[profile?.id]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CHAT TIMELINE PANEL (Center) */}
      <div className={cn(
        "flex-1 bg-[#0c0f1d] flex flex-col overflow-hidden relative",
        !activeChatUser && "hidden md:flex" // Hide on mobile when no chat is active
      )}>
        {activeChatUser ? (
          <>
            {/* Active chat header */}
            <div className="px-4 md:px-6 py-4 bg-[#121829] border-b border-white/5 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveChatUser(null);
                    setActiveChatId?.(null);
                  }}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors md:hidden text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none"
                  title="Clique para ver informações do contato"
                >
                  <div className="relative shrink-0">
                    {activeChatUser.photoURL || activeChatUser.photoUrl ? (
                      <img src={getImageUrl(activeChatUser.photoURL || activeChatUser.photoUrl)} className="w-11 h-11 rounded-full object-cover border border-white/10" alt="" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-white/5 text-lg font-bold flex items-center justify-center text-[#BF76FF]">
                        {activeChatUser.name?.[0]}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#121829] rounded-full" style={{ backgroundColor: activeChatUser.status_online === 'online' ? '#22c55e' : activeChatUser.status_online === 'busy' ? '#ef4444' : activeChatUser.status_online === 'away' ? '#f59e0b' : '#6b7280' }} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[15px] leading-tight text-white">{activeChatUser.name}</h3>
                    <p className={cn("text-[9px] font-black uppercase tracking-widest mt-0.5", activeChatUser.status_online === 'online' ? 'text-[#22c55e]' : activeChatUser.status_online === 'busy' ? 'text-red-500' : activeChatUser.status_online === 'away' ? 'text-amber-500' : 'text-gray-500')}>
                      {activeChatUser.status_online === 'online' ? 'Online agora' : activeChatUser.status_online === 'busy' ? 'Ocupado' : activeChatUser.status_online === 'away' ? 'Ausente' : 'Offline'}
                    </p>
                  </div>
                  </div>
                </div>
                {/* Botões de Suporte no canto direito */}
                {currentChat?.isSupport && (
                  <div className="flex items-center gap-2">
                    {currentChat.status === 'open' && (
                      <Button 
                        onClick={() => handleAssumeSupport(currentChat.id)}
                        className="h-8 text-[10px] font-black uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md"
                      >
                        Assumir
                      </Button>
                    )}
                    {currentChat.status === 'in_progress' && (
                      <Button 
                        onClick={() => handleSolveSupport(currentChat.id)}
                        className="h-8 text-[10px] font-black uppercase tracking-widest bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md"
                      >
                        Solucionado
                      </Button>
                    )}
                    {(currentChat.status === 'solved' || currentChat.status === 'closed') && (
                      <Button 
                        onClick={() => handleCloseSupport(currentChat.id)}
                        className="h-8 text-[10px] font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md"
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                )}
            </div>

            {/* Pinned Message Banner */}
            {currentChat?.pinnedMessageId && (
              <div className="px-6 py-2 bg-[#1c2438] border-b border-white/5 flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                  <Pin className="w-3.5 h-3.5 text-[#BF76FF] fill-current" />
                  <span className="font-bold text-[#BF76FF]">{currentChat.pinnedMessageSenderName}:</span>
                  <span className="truncate max-w-xs md:max-w-md font-semibold">{currentChat.pinnedMessageText}</span>
                </div>
                <button
                  onClick={async () => {
                    const chatId = activeChatId || [profile.id, activeChatUser.id].sort().join('_');
                    await updateDoc(doc(db, "chats", chatId), {
                      pinnedMessageId: null,
                      pinnedMessageText: null,
                      pinnedMessageSenderName: null
                    }).catch(err => console.error("Error unpinning:", err));
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
                >
                  Desafixar
                </button>
              </div>
            )}

            {/* Message scroll area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 flex flex-col scrollbar-hide min-h-0">
              {groupedMessages.map((group, gIdx) => (
                <div key={`group-${gIdx}`} className="space-y-4 flex flex-col">
                  {/* Date Divider badge */}
                  <div className="flex justify-center my-2">
                    <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {group.dateLabel}
                    </span>
                  </div>

                  {group.msgs.map((msg) => {
                    if (msg.isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2 w-full">
                          <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl shadow-sm text-center max-w-sm w-full mx-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                              {msg.text}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const isMe = msg.senderId === profile?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[80%] md:max-w-[70%] group",
                          isMe ? "self-end ml-auto items-end" : "self-start mr-auto items-start"
                        )}
                      >
                        {/* Bubble and Actions container */}
                        <div className={cn(
                          "flex items-center gap-2.5 w-full relative group/row",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          {/* Forward icon (always on the left side of the bubble) */}
                          {msg.imageUrl && (
                            <button
                              onClick={() => { setForwardImageUrl(msg.imageUrl || null); setSelectedForwardMembers([]); setForwardSearch(''); }}
                              className="opacity-0 group-hover/row:opacity-100 p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
                              title="Encaminhar imagem"
                            >
                              <CornerUpRight className="w-4 h-4" />
                            </button>
                          )}

                          {/* Message Bubble wrapper with relative positioning for menus */}
                          <div className="relative group/bubble max-w-sm">
                            
                            {/* Down Arrow for context menu (styled after WhatsApp) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                                setActiveReactionMessageId(null);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover/bubble:opacity-100 transition-opacity cursor-pointer z-40 shadow-md"
                              title="Opções"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Pinned Icon indicator */}
                            {currentChat?.pinnedMessageId === msg.id && (
                              <div className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/40 text-white z-40 shadow-md">
                                <Pin className="w-3 h-3 text-[#BF76FF] fill-current" />
                              </div>
                            )}

                            {/* Message Bubble */}
                            {(() => {
                              const isOnlyUrl = msg.text && msg.text.trim().match(/^(https?:\/\/[^\s]+)$/);
                              return (
                              <div
                                className={cn(
                                  "shadow-md leading-relaxed break-words relative",
                                  msg.imageUrl && !msg.text ? "p-0 overflow-hidden rounded-2xl" : 
                                  (isOnlyUrl && !msg.replyToText && !msg.imageUrl) ? "p-0 bg-transparent shadow-none" :
                                  "p-3.5 px-4 rounded-2xl",
                                  (isOnlyUrl && !msg.replyToText && !msg.imageUrl) 
                                    ? "" 
                                    : isMe 
                                      ? "bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white rounded-tr-sm" 
                                      : "bg-gradient-to-r from-[#F97316] to-[#EF4444] text-white rounded-tl-sm"
                                )}
                              >
                              {/* Replied Message Quote Box */}
                              {msg.replyToText && (
                                <div className="mb-2 p-2 px-3 bg-black/20 rounded-xl border-l-2 border-[#BF76FF] text-left select-none text-[11px] leading-relaxed flex flex-col gap-0.5 max-w-xs">
                                  <span className="font-black text-[#BF76FF] uppercase tracking-wider text-[9px]">
                                    {msg.replyToSenderName}
                                  </span>
                                  <span className="text-gray-300 font-semibold truncate">
                                    {msg.replyToText}
                                  </span>
                                </div>
                              )}

                              {/* Image inside message */}
                              {msg.imageUrl && (
                                <div className={cn(
                                  "overflow-hidden max-w-sm bg-black/20 aspect-video",
                                  msg.text ? "rounded-xl border border-white/10 mb-2" : "w-full h-full"
                                )}>
                                  <img src={getImageUrl(msg.imageUrl)} className="w-full h-full object-cover cursor-zoom-in" alt="Chat attachment" onClick={() => setActiveLightboxImage(msg.imageUrl || null)} />
                                </div>
                              )}
                              
                              {/* Text content */}
                              {msg.text && (
                                <p className={cn("text-sm font-semibold whitespace-pre-wrap", (msg.text && msg.text.trim().match(/^(https?:\/\/[^\s]+)$/) && !msg.replyToText && !msg.imageUrl) ? "" : "pr-4")}>
                                  {(() => {
                                    if (!msg.text) return null;
                                    const isOnlyUrl = msg.text.trim().match(/^(https?:\/\/[^\s]+)$/) && !msg.replyToText && !msg.imageUrl;
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
                                                ? cn("px-5 py-3 rounded-2xl", isMe ? "bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white rounded-tr-sm hover:brightness-110" : "bg-gradient-to-r from-[#F97316] to-[#EF4444] text-white rounded-tl-sm hover:brightness-110")
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
                                </p>
                              )}
                            </div>
                            );
                            })()}

                            {/* Context Action Menu Dropdown */}
                            {activeMenuMessageId === msg.id && (
                              <div 
                                className={cn(
                                  "absolute top-8 bg-[#182033] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-[80] w-40 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150",
                                  isMe ? "right-2" : "left-2"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              > 
                                <button
                                  onClick={() => {
                                    setReplyingToMessage(msg);
                                    setActiveMenuMessageId(null);
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left w-full"
                                >
                                  <CornerUpLeft className="w-3.5 h-3.5" />
                                  <span>Responder</span>
                                </button>

                                {msg.text && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.text || "");
                                      setActiveMenuMessageId(null);
                                      alert("Mensagem copiada!");
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left w-full"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setActiveReactionMessageId(msg.id);
                                    setActiveMenuMessageId(null);
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left w-full"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                  <span>Reagir</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setForwardImageUrl(msg.imageUrl || null);
                                    setActiveMenuMessageId(null);
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left w-full"
                                >
                                  <CornerUpRight className="w-3.5 h-3.5" />
                                  <span>Encaminhar</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handlePinMessage(msg);
                                    setActiveMenuMessageId(null);
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left w-full"
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                  <span>Fixar</span>
                                </button>
                              </div>
                            )}

                            {/* Reaction Emojis Picker Panel */}
                            {activeReactionMessageId === msg.id && (
                              <div 
                                className={cn(
                                  "absolute -top-12 bg-[#182033] border border-white/10 rounded-full p-2 py-1 shadow-2xl z-[90] flex gap-2 animate-in fade-in zoom-in-95 duration-150",
                                  isMe ? "right-2" : "left-2"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              > 
                                {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      handleReactToMessage(msg.id, emoji);
                                      setActiveReactionMessageId(null);
                                    }}
                                    className="text-xl hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setActiveReactionMessageId(null)}
                                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Reaction badges overlapping bubble */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={cn(
                                "absolute bg-[#182033] border border-white/10 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 z-30 select-none animate-in zoom-in-75 duration-150",
                                isMe ? "left-3 -bottom-3.5" : "right-3 -bottom-3.5"
                              )}>
                                {Object.entries(msg.reactions).map(([uid, emoji]) => (
                                  <span key={uid} className="text-xs" title={members.find(m => m.id === uid)?.name || "Membro"}>
                                    {emoji as string}
                                  </span>
                                ))}
                              </div>
                            )}

                          </div>
                        </div>

                        {/* Metadata: Time and Read Receipt checkmarks */}
                        <div className="flex items-center gap-1.5 mt-1.5 px-1 opacity-50 hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 tabular-nums">
                            {formatTime(msg.timestamp)}
                          </span>
                          
                          {isMe && (
                            <span className="flex items-center">
                              {msg.read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#D946EF]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Input area footer */}
            <div className="px-2 md:px-4 py-3 md:py-4 pb-24 md:pb-4 bg-[#121829] border-t border-white/5 shrink-0 relative flex flex-col">
              {currentChat?.isSupport && currentChat.status !== 'in_progress' ? (
                <div className="flex items-center justify-center p-4 bg-[#1c2338] border border-white/5 rounded-3xl mb-4 md:mb-0">
                  <p className="text-gray-400 font-semibold text-xs text-center uppercase tracking-widest">
                    {currentChat.status === 'closed' ? "Este ticket de suporte foi encerrado. O histórico é apenas para leitura." : "Assuma o ticket no cabeçalho para liberar o envio de mensagens."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Custom Emoji Picker Drawer */}
                  {emojiDrawerOpen && (
                <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-[#182033] border border-white/5 rounded-3xl p-4 shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]">Inserir Emojis</span>
                    <button onClick={() => setEmojiDrawerOpen(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-3 max-h-36 overflow-y-auto scrollbar-hide py-1">
                    {POPULAR_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setChatInput(prev => prev + emoji)}
                        className="text-2xl hover:scale-125 transition-transform duration-200 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Replying Banner */}
              {replyingToMessage && (
                <div className="mb-2.5 p-3 bg-[#1c2338] border border-white/5 rounded-3xl flex items-center justify-between shrink-0 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex flex-col border-l-2 border-[#BF76FF] pl-3 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]">
                      Respondendo a {replyingToMessage.senderId === profile.id ? "Você" : activeChatUser.name}
                    </span>
                    <span className="text-xs text-gray-400 truncate max-w-sm font-semibold mt-0.5">
                      {replyingToMessage.text || "📷 Imagem"}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingToMessage(null)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Message inputs */}
              <div className="flex items-center gap-3.5 p-2 bg-[#1c2338] border border-white/5 rounded-3xl transition-all focus-within:border-[#BF76FF]/40">
                {/* Emoji trigger */}
                <button
                  type="button"
                  onClick={() => setEmojiDrawerOpen(!emojiDrawerOpen)}
                  className="p-2 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-[#BF76FF] transition-all cursor-pointer shrink-0"
                >
                  <Smile className="w-5.5 h-5.5" />
                </button>

                {/* Upload Image Trigger */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-[#BF76FF] transition-all cursor-pointer shrink-0"
                >
                  {uploading ? (
                    <Loader2 className="w-5.5 h-5.5 animate-spin text-[#BF76FF]" />
                  ) : (
                    <Paperclip className="w-5.5 h-5.5" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                />

                {/* Text input area */}
                <textarea
                  rows={1}
                  placeholder={currentChat?.status === 'solved' ? "O atendimento foi solucionado." : currentChat?.status === 'closed' ? "O atendimento foi encerrado." : "Digite uma mensagem..."}
                  disabled={currentChat?.status === 'solved' || currentChat?.status === 'closed'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 resize-none max-h-24 scrollbar-hide text-white placeholder:text-gray-600"
                  onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = (e.currentTarget.scrollHeight) + 'px';
                  }}
                />

                {/* Send action */}
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || currentChat?.status === 'solved' || currentChat?.status === 'closed'}
                  className="w-9 h-9 shrink-0 bg-gradient-to-tr from-[#D946EF] to-[#8B5CF6] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-md flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              </>
            )}
            </div>
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-20 h-20 rounded-full bg-[#BF76FF]/10 flex items-center justify-center mb-6 text-[#BF76FF] animate-pulse">
              <MessageSquare className="w-10 h-10" />
            </div>
            
            <h4 className="text-2xl font-black uppercase tracking-tight mb-3 text-white">
              Chat Ministério Profecia
            </h4>
            
            <p className="text-sm text-gray-400 max-w-md leading-relaxed font-semibold">
              O chat foi feito para comunicados e conversas entre membros.
            </p>

            <div className="mt-8 p-4 px-5 rounded-2xl bg-white/[0.03] border border-white/5 max-w-sm flex items-center gap-3 text-left">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Criptografado</span>
                <span className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                  As mensagens são protegidas de ponta à ponta.
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowNewChatModal(true)}
              className="mt-8 bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] text-white rounded-2xl font-bold text-xs uppercase tracking-widest px-8 h-12 shadow-lg shadow-[#D946EF]/10 hover:opacity-95 hover:scale-105 active:scale-95 transition-all"
            >
              Iniciar Nova Conversa
            </Button>

            <div className="mt-12 text-[9px] font-black uppercase tracking-widest text-gray-600">
              © Copywriter Ministério Profecia
            </div>
          </div>
        )}
      </div>

      {/* 3. PROFILE INFO PANEL (Right) */}
      {activeChatUser && showInfoPanel && (
        <div className={cn(
          "w-full lg:w-[320px] bg-[#121829] border-l border-white/5 flex flex-col shrink-0 overflow-hidden",
          "fixed inset-y-0 right-0 z-[120] lg:relative lg:z-0 lg:flex animate-in slide-in-from-right duration-300"
        )}>
          <div className="p-6 border-b border-white/5 text-center flex-shrink-0 relative">
            <button
              onClick={() => setShowInfoPanel(false)}
              className="absolute right-4 top-4 p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white cursor-pointer"
              title="Fechar Informações"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Informações</h4>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {activeChatUser.photoURL || activeChatUser.photoUrl ? (
                  <img src={getImageUrl(activeChatUser.photoURL || activeChatUser.photoUrl)} className="w-32 h-32 rounded-full object-cover border-2 border-white/10 shadow-xl" alt="" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/5 text-3xl font-bold flex items-center justify-center text-[#BF76FF]">
                    {activeChatUser.name?.[0]}
                  </div>
                )}
                <div className="absolute bottom-1 right-2.5 w-5 h-5 border-[3.5px] border-[#121829] rounded-full z-10 shadow-lg" style={{ backgroundColor: activeChatUser.status_online === 'online' ? '#22c55e' : activeChatUser.status_online === 'busy' ? '#ef4444' : activeChatUser.status_online === 'away' ? '#f59e0b' : '#6b7280' }} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">{activeChatUser.name}</h3>
              <p className="text-[#BF76FF] font-black uppercase text-[10px] tracking-widest mt-1">
                {activeChatUser.role || activeChatUser.profession || 'Membro'}
              </p>
            </div>
          </div>

          {/* Shared attachments uploader */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Anexos Compartilhados</span>
                <span className="text-[9px] font-bold text-[#BF76FF] bg-[#BF76FF]/10 px-2 py-0.5 rounded-full">{sharedAttachments.length}</span>
              </div>
              
              {sharedAttachments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl opacity-40">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma imagem enviada</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {sharedAttachments.map((url, idx) => (
                    <div
                      key={`attachment-${idx}`}
                      onClick={() => setActiveLightboxImage(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5 cursor-zoom-in hover:scale-105 transition-transform duration-200"
                    >
                      <img src={getImageUrl(url)} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. NEW CHAT / CONTACT SELECTOR OVERLAY */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#121829] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter">Nova Conversa</h3>
                <button
                  onClick={() => { setShowNewChatModal(false); setNewChatSearch(''); }}
                  className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou cargo..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/5 focus:border-[#BF76FF]/30 text-white rounded-xl pl-12 pr-4 text-xs font-semibold placeholder:text-gray-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide">
              {filteredContacts.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <User className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                  <p className="text-xs font-bold uppercase">Nenhum membro encontrado</p>
                </div>
              ) : (
                filteredContacts.map(member => (
                  <div
                    key={member.id}
                    onClick={() => {
                      setActiveChatUser(member);
                      setActiveChatId?.(null);
                      setShowNewChatModal(false);
                      setNewChatSearch('');
                    }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <div className="relative shrink-0">
                      {member.photoURL ? (
                        <img src={getImageUrl(member.photoURL)} className="w-10 h-10 rounded-xl object-cover border border-white/5" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-[#BF76FF]">
                          {member.name?.[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border border-[#121829] rounded-full" style={{ backgroundColor: member.status_online === 'online' ? '#22c55e' : member.status_online === 'busy' ? '#ef4444' : member.status_online === 'away' ? '#f59e0b' : '#6b7280' }} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-gray-100 group-hover:text-white truncate transition-colors">{member.name}</span>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{member.role || 'Membro'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div 
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <button 
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all border border-white/5 shadow-xl"
            title="Fechar imagem"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
            <img 
              src={getImageUrl(activeLightboxImage)}
              className="max-w-full max-h-[80vh] object-contain rounded-[24px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
              alt="Visualização ampliada"
            />
          </div>
        </div>
      )}

      {/* FORWARD IMAGE MODAL OVERLAY */}
      {forwardImageUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[160] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#121829] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Encaminhar Imagem</h3>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mt-0.5">Selecione os membros para quem deseja encaminhar</p>
                </div>
                <button
                  onClick={() => { setForwardImageUrl(null); setSelectedForwardMembers([]); setForwardSearch(''); }}
                  className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Image Preview thumbnail inside Forward Modal */}
              <div className="h-28 rounded-2xl overflow-hidden border border-white/5 relative bg-black/20 shrink-0 flex items-center justify-center">
                <img src={getImageUrl(forwardImageUrl)} className="h-full object-contain" alt="Preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-4 text-[9px] font-black uppercase tracking-widest text-white bg-black/40 px-2 py-0.5 rounded-md border border-white/10">Pré-visualização</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar membro..."
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/5 focus:border-[#BF76FF]/30 text-white rounded-xl pl-12 pr-4 text-xs font-semibold placeholder:text-gray-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide">
              {filteredForwardContacts.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <User className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                  <p className="text-xs font-bold uppercase">Nenhum membro encontrado</p>
                </div>
              ) : (
                filteredForwardContacts.map(member => {
                  const isChecked = selectedForwardMembers.includes(member.id);
                  return (
                    <div
                      key={`forward-${member.id}`}
                      onClick={() => {
                        setSelectedForwardMembers(prev => 
                          isChecked ? prev.filter(id => id !== member.id) : [...prev, member.id]
                        );
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group",
                        isChecked ? "bg-[#BF76FF]/10 border border-[#BF76FF]/20" : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative shrink-0">
                          {member.photoURL ? (
                            <img src={getImageUrl(member.photoURL)} className="w-10 h-10 rounded-xl object-cover border border-white/5" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-[#BF76FF]">
                              {member.name?.[0]}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border border-[#121829] rounded-full" style={{ backgroundColor: member.status_online === 'online' ? '#22c55e' : member.status_online === 'busy' ? '#ef4444' : member.status_online === 'away' ? '#f59e0b' : '#6b7280' }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-gray-100 group-hover:text-white truncate transition-colors">{member.name}</span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{member.role || 'Membro'}</span>
                        </div>
                      </div>

                      {/* Custom checkbox */}
                      <div className={cn(
                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0",
                        isChecked 
                          ? "bg-[#BF76FF] border-[#BF76FF] text-white shadow-md"
                          : "border-white/20 text-transparent"
                      )}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Bar when checked is active */}
            {selectedForwardMembers.length > 0 && (
              <div className="p-4 bg-[#182033]/60 border-t border-white/5 shrink-0 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]">
                  {selectedForwardMembers.length} {selectedForwardMembers.length === 1 ? 'membro selecionado' : 'membros selecionados'}
                </span>
                <button
                  onClick={handleForwardImage}
                  className="px-5 h-11 bg-gradient-to-tr from-[#D946EF] to-[#8B5CF6] text-white rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer font-bold text-xs uppercase tracking-widest"
                >
                  <Send className="w-4 h-4" />
                  Encaminhar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
