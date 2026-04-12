import { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Settings, 
  LogOut,
  Plus,
  Trash2,
  Edit,
  Save,
  Youtube,
  LogIn,
  ChevronLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Bell,
  MoreHorizontal,
  Phone,
  Video,
  Pin,
  Users,
  ChevronDown,
  ChevronRight,
  File,
  Link as LinkIcon,
  Send,
  Calendar,
  MessageSquare,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  getDocs
} from "firebase/firestore";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function CalendarView({ agenda, onSelectEvent }: { agenda: any[], onSelectEvent: (item: any) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const dayEvents = agenda.filter(event => event.date && isSameDay(parseISO(event.date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div 
              key={i} 
              className={cn(
                "min-h-[100px] p-2 rounded-xl border border-white/5 transition-all",
                isCurrentMonth ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/30 opacity-50",
                "hover:border-[#BF76FF]/50"
              )}
            >
              <div className="text-right text-xs font-bold text-gray-400 mb-2">{format(day, dateFormat)}</div>
              <div className="space-y-1">
                {dayEvents.map((event, j) => (
                  <div 
                    key={j}
                    onClick={() => onSelectEvent(event)}
                    className="text-[10px] bg-[#BF76FF]/20 text-[#BF76FF] p-1.5 rounded cursor-pointer truncate hover:bg-[#BF76FF]/40 transition-colors relative group"
                  >
                    {event.title}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black border border-white/10 text-white p-3 rounded-xl shadow-xl z-50">
                      <p className="font-bold text-sm mb-1 whitespace-normal">{event.title}</p>
                      <p className="text-xs text-gray-400">{format(parseISO(event.date), "HH:mm")}</p>
                      <p className="text-xs text-gray-400 mt-1">Local: {event.location || "N/A"}</p>
                      <p className="text-[10px] text-[#BF76FF] mt-2 border-t border-white/10 pt-2">Por: {event.authorName || "Admin"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function Admin() {
  const { user, login, logout, isAdmin } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("agenda");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data States
  const [posts, setPosts] = useState<any[]>([]);
  const [musics, setMusics] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState<any>({});
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<any>(null);

  // Real-time listeners
  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "posts"));

    const unsubMusics = onSnapshot(query(collection(db, "musics"), orderBy("createdAt", "desc")), (snap) => {
      setMusics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "musics"));

    const unsubMembers = onSnapshot(collection(db, "members"), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "members"));

    const unsubAgenda = onSnapshot(query(collection(db, "agenda"), orderBy("date", "asc")), (snap) => {
      setAgenda(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "agenda"));

    const unsubNotifs = onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "notifications"));

    return () => {
      unsubPosts();
      unsubMusics();
      unsubMembers();
      unsubAgenda();
      unsubNotifs();
    };
  }, [isLoggedIn]);

  // Search Logic
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (activeTab === "blog") return posts.filter(p => p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query));
    if (activeTab === "musica") return musics.filter(m => m.title?.toLowerCase().includes(query));
    if (activeTab === "equipe") return members.filter(m => m.name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query));
    if (activeTab === "agenda") return agenda.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query));
    return [];
  }, [activeTab, searchQuery, posts, musics, members, agenda]);

  const handleSave = async () => {
    try {
      const collectionName = activeTab === "blog" ? "posts" : activeTab === "musica" ? "musics" : activeTab === "equipe" ? "members" : "agenda";
      
      if (selectedItem?.id) {
        await updateDoc(doc(db, collectionName, selectedItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, collectionName), {
          ...formData,
          createdAt: serverTimestamp(),
          authorId: user?.uid,
          authorName: user?.displayName || "Admin"
        });
      }
      setIsEditing(false);
      setSelectedItem(null);
      setFormData({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, activeTab);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const collectionName = activeTab === "blog" ? "posts" : activeTab === "musica" ? "musics" : activeTab === "equipe" ? "members" : "agenda";
      await deleteDoc(doc(db, collectionName, id));
      setSelectedItem(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, activeTab);
    }
  };

  const openWhatsApp = (member: any) => {
    if (!member.phone) {
      alert("Este membro não possui um número de WhatsApp cadastrado.");
      return;
    }
    setShowWhatsAppModal(member);
  };

  const confirmWhatsApp = (member: any, message: string) => {
    if (!member.phone) return;
    const phone = member.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowWhatsAppModal(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6">
        {/* Header / Back Button */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center pb-20">
          <h1 className="text-4xl font-bold mb-10">
            Área de <span className="text-[#BF76FF]">Membros</span>
          </h1>

          <div className="space-y-4 mb-8">
            {/* Email Input */}
            <div className="relative group">
              <Input 
                type="email" 
                placeholder="membro@ministerioprofecia.com.br" 
                className="h-16 bg-[#1a1a1a] border-none rounded-2xl px-6 text-lg focus-visible:ring-1 focus-visible:ring-[#BF76FF]/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#BF76FF]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="h-16 bg-[#1a1a1a] border-none rounded-2xl px-6 text-lg focus-visible:ring-1 focus-visible:ring-[#BF76FF]/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="text-center mb-10">
            <p className="text-sm text-[#666666]">
              Ao clicar, você concorda com termos da igreja Evangelica ministério Profecia.<br />
              <Link to="/terms" className="underline hover:text-white">Termos de uso</Link> & <Link to="/privacy" className="underline hover:text-white">Política de privacidade</Link>
            </p>
          </div>

          <Button 
            className="w-full h-16 bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#BF76FF]/20 transition-all active:scale-[0.98]"
            onClick={() => {
              if (password === "admin") setIsLoggedIn(true);
              else alert("Senha incorreta (Dica: admin)");
            }}
          >
            Logar
          </Button>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-white">
              Esqueceu a senha? <button className="text-[#BF76FF] hover:underline transition-colors">clique aqui</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Sidebar 1: Narrow Navigation (Bottom on mobile, Left on desktop) */}
      <aside className="md:w-20 w-full md:h-full h-16 flex md:flex-col flex-row items-center justify-between md:py-8 px-4 md:px-0 border-t md:border-t-0 md:border-r border-white/5 bg-[#0a0a0a] z-50 order-last md:order-first">
        <div className="hidden md:flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] items-center justify-center text-white font-bold text-2xl mb-12 shadow-lg shadow-[#BF76FF]/20">
          P
        </div>
        
        <nav className="flex-1 flex md:flex-col flex-row gap-2 md:gap-6 items-center justify-center w-full">
          <SidebarIcon icon={Calendar} active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} label="Agenda" />
          <SidebarIcon icon={FileText} active={activeTab === "blog"} onClick={() => setActiveTab("blog")} label="Blog" />
          <SidebarIcon icon={Users} active={activeTab === "equipe"} onClick={() => setActiveTab("equipe")} label="Equipe" />
          <SidebarIcon icon={Music} active={activeTab === "musica"} onClick={() => setActiveTab("musica")} label="Música" />
          <SidebarIcon icon={Settings} active={activeTab === "config"} onClick={() => setActiveTab("config")} label="Config" />
          <SidebarIcon icon={Video} active={activeTab === "live"} onClick={() => setActiveTab("live")} label="Live" />
        </nav>

        <button 
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#1a1a1a] hover:bg-red-500 transition-all flex items-center justify-center group cursor-pointer"
          onClick={() => setIsLoggedIn(false)}
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-white rotate-180" />
        </button>
      </aside>

      {/* Sidebar 2: Item List (Hidden on mobile if editing) */}
      <aside className={cn(
        "md:w-80 w-full border-r border-white/5 bg-[#0f0f0f] flex flex-col",
        isEditing ? "hidden md:flex" : "flex flex-1 md:flex-none"
      )}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 capitalize text-white">{activeTab}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full bg-[#1a1a1a] border-none rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-[#BF76FF]/50 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-6">
            {filteredItems.map((item) => (
              <ListItem 
                key={item.id}
                title={item.title || item.name || ""}
                subtitle={item.date ? format(new Date(item.date), "dd/MM/yyyy") : item.email || item.category || ""}
                image={item.image || item.photoURL}
                icon={activeTab === "musica" ? Youtube : activeTab === "agenda" ? Calendar : undefined}
                active={selectedItem?.id === item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsEditing(true);
                }}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                Nenhum item encontrado
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4">
          <Button 
            className="w-full bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-xl h-12 font-bold cursor-pointer"
            onClick={() => {
              setSelectedItem(null);
              setFormData({});
              setIsEditing(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Item
          </Button>
        </div>
      </aside>

      {/* Main Content Area (Hidden on mobile if not editing and not agenda) */}
      <main className={cn(
        "flex-1 flex flex-col bg-[#0a0a0a]",
        !isEditing && activeTab !== "agenda" ? "hidden md:flex" : "flex"
      )}>
        {/* Main Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            {isEditing && (
              <button 
                className="md:hidden p-2 rounded-full hover:bg-white/5 text-white cursor-pointer"
                onClick={() => setIsEditing(false)}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h3 className="text-lg font-bold text-white">Visualização Detalhada</h3>
            {isEditing && <span className="px-2 py-0.5 rounded bg-[#BF76FF]/10 text-[#BF76FF] text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">Editando</span>}
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search" 
                className="bg-[#1a1a1a] border-none rounded-full py-2 pl-10 pr-4 text-sm text-white w-64 outline-none"
              />
            </div>
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors relative cursor-pointer">
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#BF76FF] rounded-full border-2 border-[#0a0a0a]"></span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{user?.displayName || "Admin"}</p>
                <p className="text-[10px] text-gray-500">{isAdmin ? "Administrador Master" : "Editor"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] p-0.5">
                <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-[#BF76FF]" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {isEditing ? (
              <Card className="bg-[#111] border-white/5 rounded-3xl p-4 md:p-8">
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold mb-4 text-white">{selectedItem ? "Editar" : "Novo"} {activeTab}</h4>
                  
                  {activeTab === "agenda" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título do Evento</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          value={formData.title || ""}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data e Hora</label>
                          <Input 
                            type="datetime-local"
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.date || ""}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Local</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.location || ""}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "blog" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título do Post</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          value={formData.title || ""}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Conteúdo</label>
                        <Textarea 
                          className="bg-[#1a1a1a] border-none min-h-[300px] rounded-2xl p-6 text-white" 
                          value={formData.content || ""}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {activeTab === "equipe" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.name || ""}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">E-mail</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.email || ""}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">WhatsApp (com DDD)</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            placeholder="11999999999"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cargo</label>
                          <select 
                            className="w-full bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 outline-none text-white"
                            value={formData.role || "member"}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                          >
                            <option value="member">Membro</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "musica" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Música</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          value={formData.title || ""}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Link do YouTube</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          placeholder="https://youtube.com/watch?v=..."
                          value={formData.youtubeUrl || ""}
                          onChange={(e) => {
                            const url = e.target.value;
                            const videoId = url.split('v=')[1]?.split('&')[0];
                            setFormData({...formData, youtubeUrl: url, videoId});
                          }}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-6">
                    {selectedItem && (
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-500/10 rounded-2xl h-12 px-6 cursor-pointer"
                        onClick={() => handleDelete(selectedItem.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    )}
                    <div className="flex gap-4 ml-auto">
                      <Button variant="ghost" className="rounded-2xl h-12 px-8 text-gray-400 cursor-pointer" onClick={() => setIsEditing(false)}>Cancelar</Button>
                      <Button className="bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" /> Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : activeTab === "agenda" ? (
              <CalendarView agenda={agenda} onSelectEvent={(item) => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsEditing(true);
              }} />
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-10 h-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-white">Selecione um item para editar</h4>
                <p className="text-gray-400">Ou clique no botão "Novo Item" para criar um novo registro.</p>
                <Button 
                  className="mt-6 bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-xl h-12 px-8 font-bold cursor-pointer"
                  onClick={() => {
                    setSelectedItem(null);
                    setFormData({});
                    setIsEditing(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Novo Item
                </Button>
              </div>
            )}

            {/* Activity Style Feed */}
            <div className="space-y-6">
              <h5 className="font-bold text-gray-400 uppercase tracking-widest text-xs">Histórico de Alterações</h5>
              <div className="space-y-4">
                <ActivityItem user="Admin" action="adicionou uma nova imagem" time="6:15 pm" />
                <ActivityItem user="Mídia" action="editou o título do post" time="6:25 pm" />
                <ActivityItem user="Admin" action="publicou o conteúdo" time="6:30 pm" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Quick Action Bar (Like chat input) */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button className="p-2 rounded-xl hover:bg-white/5 text-gray-400 cursor-pointer"><ImageIcon className="w-5 h-5" /></button>
              <button className="p-2 rounded-xl hover:bg-white/5 text-gray-400 cursor-pointer"><LinkIcon className="w-5 h-5" /></button>
            </div>
            <input 
              type="text" 
              placeholder="Escreva uma nota rápida sobre esta edição..." 
              className="w-full bg-[#1a1a1a] border-none rounded-2xl py-4 pl-24 pr-16 text-sm text-white outline-none focus:ring-1 focus:ring-[#BF76FF]/30"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#BF76FF] flex items-center justify-center text-white shadow-lg shadow-[#BF76FF]/20 cursor-pointer">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Sidebar 3: Stats & Files (Hidden on mobile) */}
      <aside className="hidden lg:flex w-80 border-l border-white/5 bg-[#0f0f0f] flex-col p-6">

        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            <ActionIcon icon={Phone} />
            <ActionIcon icon={Video} />
            <ActionIcon icon={Pin} />
            <ActionIcon icon={Users} />
          </div>
        </div>

        <div className="space-y-8">
          {/* Members/Team Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">Equipe</h4>
              <button className="text-[#BF76FF] text-xs font-bold" onClick={() => setActiveTab("equipe")}>Ver todos</button>
            </div>
            <div className="space-y-4">
              {members.slice(0, 5).map(member => (
                <TeamMember 
                  key={member.id} 
                  name={member.name || ""} 
                  role={member.role || ""} 
                  active={member.email === user?.email}
                  onWhatsApp={() => openWhatsApp(member)}
                />
              ))}
              {members.length === 0 && <p className="text-xs text-gray-500">Nenhum membro cadastrado</p>}
            </div>
          </div>

          {/* Files Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">Arquivos Recentes</h4>
              <button className="text-gray-500 hover:text-white transition-colors"><ChevronDown className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <FileCategory icon={ImageIcon} label="Fotos do Evento" count={115} active />
              <FileCategory icon={File} label="Documentos" count={208} />
              <FileCategory icon={LinkIcon} label="Links Compartilhados" count={47} />
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="mt-4 rounded-3xl bg-[#1a1a1a] overflow-hidden border border-white/5">
            <img src="https://picsum.photos/seed/stats/400/200" alt="" className="w-full h-40 object-cover opacity-50" />
            <div className="p-4">
              <p className="text-xs font-bold text-gray-500 mb-1">CAPA ATUAL</p>
              <p className="text-sm font-bold">banner_principal_v2.jpg</p>
            </div>
          </div>
        </div>
      </aside>
      {/* WhatsApp Modal */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full"
            >
              <h4 className="text-2xl font-bold mb-4">Contato com {showWhatsAppModal.name}</h4>
              <p className="text-gray-400 mb-6">O que você gostaria de tratar com este membro da equipe?</p>
              <Textarea 
                id="wa-message"
                className="bg-[#1a1a1a] border-none min-h-[120px] rounded-2xl p-4 mb-6"
                placeholder="Escreva sua mensagem aqui..."
              />
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 rounded-2xl" onClick={() => setShowWhatsAppModal(null)}>Cancelar</Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold"
                  onClick={() => {
                    const msg = (document.getElementById('wa-message') as HTMLTextAreaElement).value;
                    confirmWhatsApp(showWhatsAppModal, msg);
                  }}
                >
                  Enviar WhatsApp
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarIcon({ icon: Icon, active, onClick, label }: { icon: any, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group",
        active ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" : "bg-transparent text-gray-500 hover:bg-white/5"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
        {label}
      </span>
      {active && <motion.div layoutId="active-pill" className="absolute -left-4 w-1 h-6 bg-[#BF76FF] rounded-r-full" />}
    </button>
  );
}

interface ListItemProps {
  key?: string;
  title: string;
  subtitle: string;
  image?: string;
  icon?: any;
  active?: boolean;
  onClick: () => void;
}

function ListItem({ title, subtitle, image, icon: Icon, active, onClick }: ListItemProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all",
        active ? "bg-[#1a1a1a] border border-white/5" : "hover:bg-white/5"
      )}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#222] flex items-center justify-center shrink-0">
        {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <Icon className="w-6 h-6 text-gray-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-bold truncate", active ? "text-white" : "text-gray-300")}>{title}</h4>
        <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>
      </div>
      {active && <div className="w-2 h-2 rounded-full bg-[#BF76FF] shadow-[0_0_8px_#BF76FF]" />}
    </div>
  );
}

function ActivityItem({ user, action, time }: { user: string, action: string, time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#BF76FF]/20 flex items-center justify-center text-[#BF76FF] text-[10px] font-bold">
          {user ? user[0] : "A"}
        </div>
        <p className="text-sm">
          <span className="font-bold">{user || "Sistema"}</span> <span className="text-gray-500">{action}</span>
        </p>
      </div>
      <span className="text-[10px] text-gray-600 font-medium">{time}</span>
    </div>
  );
}

interface TeamMemberProps {
  key?: string;
  name: string;
  role: string;
  active?: boolean;
  onWhatsApp: () => void;
}

function TeamMember({ name, role, active, onWhatsApp }: TeamMemberProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold">
            {name[0]}
          </div>
          {active && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f0f]" />}
        </div>
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="text-[10px] text-gray-500">{role}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onWhatsApp}
          className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all cursor-pointer"
        >
          <WhatsAppIcon className="w-4 h-4" />
        </button>
        <button className="text-gray-600 hover:text-white transition-colors cursor-pointer"><MoreHorizontal className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function FileCategory({ icon: Icon, label, count, active }: { icon: any, label: string, count: number, active?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all",
      active ? "bg-[#1a1a1a] border border-white/5" : "hover:bg-white/5"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", active ? "bg-[#BF76FF]/20 text-[#BF76FF]" : "bg-white/5 text-gray-500")}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 font-bold">{count}</span>
        <ChevronRight className="w-3 h-3 text-gray-700" />
      </div>
    </div>
  );
}

function ActionIcon({ icon: Icon }: { icon: any }) {
  return (
    <button className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#BF76FF] transition-all">
      <Icon className="w-5 h-5" />
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
