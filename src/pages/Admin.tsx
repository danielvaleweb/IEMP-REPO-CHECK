import { useState, useEffect, useMemo, ChangeEvent } from "react";
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
  X,
  ShieldCheck,
  TrendingUp,
  Heart,
  ArrowLeft,
  Upload,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EventosView } from "@/components/admin/EventosView";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  setDoc,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const safeFormatDate = (dateStr: any) => {
  if (!dateStr) return "";
  try {
    // If it's the new format: DD/MM/YYYY - HH:mm - HH:mm
    if (typeof dateStr === 'string' && dateStr.includes(' - ')) {
      return dateStr.split(' - ')[0];
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};

const safeFormatTime = (dateStr: any) => {
  if (!dateStr) return "";
  try {
    // If it's already a time-like string but not ISO, try to extract time
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const timePart = parts[1].trim();
        if (/^\d{2}:\d{2}$/.test(timePart)) return timePart;
      }
    }
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return "";
    return format(d, "HH:mm");
  } catch (e) {
    return "";
  }
};

function CalendarView({ 
  agenda, 
  onNewEvent, 
  onViewEvent, 
  onEditEvent, 
  onDeleteEvent 
}: { 
  agenda: any[], 
  onNewEvent: (date: Date) => void, 
  onViewEvent: (item: any) => void, 
  onEditEvent: (item: any) => void, 
  onDeleteEvent: (item: any) => void 
}) {
  const { user, profile, isAdmin } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const selectedDayEvents = selectedDay ? agenda.filter(event => event.date && isSameDay(parseISO(event.date), selectedDay)) : [];

  return (
    <>
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
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[100px] p-2 rounded-xl border border-white/5 transition-all cursor-pointer",
                  isCurrentMonth ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/30 opacity-50",
                  "hover:border-[#BF76FF]/50"
                )}
              >
                <div className="text-right text-xs font-bold text-gray-400 mb-2">{format(day, dateFormat)}</div>
                <div className="space-y-1">
                  {dayEvents.map((event, j) => (
                    <div 
                      key={j}
                      className="text-[10px] bg-[#BF76FF]/20 text-[#BF76FF] p-1.5 rounded truncate hover:bg-[#BF76FF]/40 transition-colors relative group"
                    >
                      {event.title}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black border border-white/10 text-white p-3 rounded-xl shadow-xl z-50">
                        <p className="font-bold text-sm mb-1 whitespace-normal">{event.title}</p>
                        <p className="text-xs text-gray-400">{safeFormatTime(event.date)}</p>
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

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedDay ? format(selectedDay, "dd 'de' MMMM, yyyy", { locale: ptBR }) : ""}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event, idx) => {
                const isCreator = user?.uid === event.authorId;
                const isEditor = profile?.role === "editor";
                const canEdit = isCreator || isEditor || isAdmin;
                const canDelete = isCreator || isAdmin;

                return (
                  <div key={idx} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 space-y-3">
                    <div>
                      <h4 className="font-bold text-lg">{event.title}</h4>
                      <p className="text-sm text-gray-400">{safeFormatTime(event.date)} • {event.location || "Sem local"}</p>
                      <p className="text-xs text-[#BF76FF] mt-1">Adicionado por: {event.authorName || "Admin"}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 bg-white/5 hover:bg-white/10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(null);
                          onViewEvent(event);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" /> Ver
                      </Button>
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(null);
                            onEditEvent(event);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(null);
                            onDeleteEvent(event);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum evento cadastrado para este dia.</p>
              </div>
            )}
            
            <Button 
              className="w-full bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white font-bold cursor-pointer mt-4"
              onClick={() => {
                if (selectedDay) {
                  onNewEvent(selectedDay);
                  setSelectedDay(null);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Cadastrar novo evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


export default function Admin() {
  const { user, profile, login, logout, isAdmin, setCustomLogin } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("agenda");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [authError, setAuthError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (user && profile?.status === "pending") {
      setAuthError("Seu cadastro via Google ainda está em análise. Aguarde a aprovação do administrador.");
    }
  }, [user, profile]);
  
  // Sign Up States
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [showSignUpSuccessModal, setShowSignUpSuccessModal] = useState(false);
  const [signUpData, setSignUpData] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    birthDate: "", 
    churchRole: "", 
    phone: "",
    password: "",
    confirmPassword: ""
  });
  
  // Data States
  const [posts, setPosts] = useState<any[]>([]);
  const [musics, setMusics] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState<any>({});
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<any>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await response.json();
      if (data.url) {
        // Update the appropriate field based on the active tab
        if (activeTab === "equipe") {
          setFormData({ ...formData, photoURL: data.url });
        } else if (activeTab === "musica") {
          setFormData({ ...formData, thumbnail: data.url });
        } else {
          setFormData({ ...formData, image: data.url });
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao fazer upload da imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  // Real-time listeners
  useEffect(() => {
    if (!isAdmin) return;

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
  }, [isAdmin]);

  // Search Logic
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (activeTab === "eventos") return posts.filter(p => p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query));
    if (activeTab === "musica") return musics.filter(m => m.title?.toLowerCase().includes(query));
    if (activeTab === "equipe") return members.filter(m => m.name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query));
    if (activeTab === "agenda") return agenda.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query));
    return [];
  }, [activeTab, searchQuery, posts, musics, members, agenda]);

  const handleSave = async () => {
    try {
      const collectionName = activeTab === "eventos" ? "posts" : activeTab === "musica" ? "musics" : activeTab === "equipe" ? "members" : "agenda";
      
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
      const collectionName = activeTab === "eventos" ? "posts" : activeTab === "musica" ? "musics" : activeTab === "equipe" ? "members" : "agenda";
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6">
        {/* Header / Back Button */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center pb-20">
          <h1 className="text-4xl font-bold mb-6">
            {isSignUpMode ? (
              <>Solicitar <span className="text-[#BF76FF]">Acesso</span></>
            ) : (
              <>Área de <span className="text-[#BF76FF]">Membros</span></>
            )}
          </h1>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl mb-6 flex items-center justify-between">
              <span>{authError}</span>
              <button onClick={() => setAuthError("")} className="hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isSignUpMode ? (
            <>
              <div className="space-y-4 mb-8">
                {/* Email Input */}
                <div className="relative group">
                  <Input 
                    type="email" 
                    placeholder="membro@ministerioprofecia.com.br" 
                    className="h-16 bg-[#1a1a1a] border-none rounded-2xl px-6 text-lg focus-visible:ring-1 focus-visible:ring-[#BF76FF]/50 transition-all text-white"
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
                    className="h-16 bg-[#1a1a1a] border-none rounded-2xl px-6 text-lg focus-visible:ring-1 focus-visible:ring-[#BF76FF]/50 transition-all text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors cursor-pointer"
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
                className="w-full h-16 bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#BF76FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                onClick={async () => {
                  setAuthError("");
                  if (!email) {
                    setAuthError("Por favor, insira seu e-mail.");
                    return;
                  }
                  
                  setIsSubmitting(true);
                  
                  if (email === "iempministerioprofecia@gmail.com" && password === "admin") {
                    setCustomLogin(true, {
                      name: "Administrador",
                      email: email,
                      role: "admin"
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  
                  try {
                    const q = query(collection(db, "members"), where("email", "==", email));
                    const querySnapshot = await getDocs(q);
                    
                    if (querySnapshot.empty) {
                      setAuthError("Usuário não encontrado.");
                      setIsSubmitting(false);
                      return;
                    }
                    
                    const memberDoc = querySnapshot.docs[0];
                    const memberData = memberDoc.data();
                    
                    if (memberData.password && memberData.password !== password) {
                      setAuthError("Senha incorreta.");
                      setIsSubmitting(false);
                      return;
                    } else if (!memberData.password && password !== "admin") {
                      // Fallback for old accounts without password
                      setAuthError("Senha incorreta.");
                      setIsSubmitting(false);
                      return;
                    }
                    
                    if (memberData.status === "pending") {
                      setAuthError("Seu cadastro ainda está em análise.");
                      setIsSubmitting(false);
                      return;
                    }
                    
                    if (memberData.status === "rejected") {
                      setAuthError("Seu cadastro foi reprovado.");
                      setIsSubmitting(false);
                      return;
                    }
                    
                    setCustomLogin(true, { id: memberDoc.id, ...memberData });
                    
                    if (memberData.role !== "admin") {
                      window.location.href = "/";
                    }
                  } catch (error) {
                    console.error("Erro ao fazer login:", error);
                    setAuthError("Erro ao fazer login. Tente novamente.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? "Entrando..." : "Logar"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0a0a0a] px-2 text-gray-500">Ou continue com</span>
                </div>
              </div>

              <Button 
                variant="outline"
                className="w-full h-16 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full text-lg font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
                onClick={async () => {
                  try {
                    setAuthError("");
                    setIsSubmitting(true);
                    await login();
                  } catch (error: any) {
                    console.error("Erro no login Google:", error);
                    if (error.code === 'auth/unauthorized-domain') {
                      setAuthError(`Este domínio (${window.location.hostname}) não está autorizado no Firebase. Adicione-o na seção 'Authentication > Settings > Authorized domains' do Console do Firebase.`);
                    } else if (error.code === 'auth/popup-closed-by-user') {
                      setAuthError("A janela de login foi fechada antes de completar. Tente novamente.");
                    } else {
                      setAuthError("Erro ao entrar com Google: " + (error.message || "Tente novamente."));
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    setAuthError("Dica: Se a janela não abrir, verifique se o seu navegador não está bloqueando pop-ups ou tente usar uma aba anônima.");
                  }}
                  className="text-xs text-gray-500 hover:text-[#BF76FF] transition-colors cursor-pointer"
                >
                  Problemas com o login do Google?
                </button>
              </div>

              <div className="mt-8 text-center space-y-4">
                <p className="text-sm font-medium text-white">
                  Esqueceu a senha? <button className="text-[#BF76FF] hover:underline transition-colors cursor-pointer">clique aqui</button>
                </p>
                <p className="text-sm font-medium text-white">
                  Não tem uma conta? <button onClick={() => { setIsSignUpMode(true); setAuthError(""); }} className="text-[#BF76FF] hover:underline transition-colors cursor-pointer">Cadastre-se</button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</label>
                    <Input 
                      className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                      value={signUpData.firstName}
                      onChange={(e) => setSignUpData({...signUpData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sobrenome</label>
                    <Input 
                      className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                      value={signUpData.lastName}
                      onChange={(e) => setSignUpData({...signUpData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">E-mail</label>
                  <Input 
                    type="email"
                    className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                    <Input 
                      type="date"
                      className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white [color-scheme:dark]" 
                      value={signUpData.birthDate}
                      onChange={(e) => setSignUpData({...signUpData, birthDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Telefone/WhatsApp</label>
                    <Input 
                      className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                      placeholder="11999999999"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Qual sua função na igreja?</label>
                  <Input 
                    className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                    placeholder="Ex: Membro, Mídia, Louvor..."
                    value={signUpData.churchRole}
                    onChange={(e) => setSignUpData({...signUpData, churchRole: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Senha</label>
                    <Input 
                      type="password"
                      className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirmar Senha</label>
                    <Input 
                      type="password"
                      className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white" 
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-16 bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#BF76FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                onClick={async () => {
                  setAuthError("");
                  if (!signUpData.firstName || !signUpData.email || !signUpData.password) {
                    setAuthError("Por favor, preencha nome, e-mail e senha.");
                    return;
                  }
                  
                  if (signUpData.password !== signUpData.confirmPassword) {
                    setAuthError("As senhas não coincidem.");
                    return;
                  }
                  
                  setIsSubmitting(true);
                  
                  const newMember = {
                    name: `${signUpData.firstName} ${signUpData.lastName}`,
                    email: signUpData.email,
                    phone: signUpData.phone,
                    birthDate: signUpData.birthDate,
                    churchRole: signUpData.churchRole,
                    password: signUpData.password,
                    role: "member",
                    status: "pending",
                    createdAt: new Date().toISOString()
                  };
                  
                  try {
                    console.log("DEBUG: Iniciando processo de cadastro para:", newMember.email);
                    
                    // Add a safety timeout to prevent infinite "Solicitando..."
                    const safetyTimeout = setTimeout(() => {
                      if (isSubmitting) {
                        console.error("DEBUG: Timeout de segurança atingido!");
                        setAuthError("Tempo limite excedido. O banco de dados está demorando para responder. Tente atualizar a página.");
                        setIsSubmitting(false);
                      }
                    }, 15000);

                    console.log("DEBUG: Chamando addDoc para 'members'...");
                    const newMemberRef = await addDoc(collection(db, "members"), newMember);
                    console.log("DEBUG: Membro salvo com sucesso, ID:", newMemberRef.id);
                    
                    console.log("DEBUG: Chamando addDoc para 'notifications'...");
                    await addDoc(collection(db, "notifications"), {
                      title: "Novo Cadastro",
                      message: `${newMember.name} solicitou acesso ao painel.`,
                      type: "registration",
                      memberId: newMemberRef.id,
                      read: false,
                      createdAt: new Date().toISOString()
                    });
                    console.log("DEBUG: Notificação salva com sucesso");
                    
                    clearTimeout(safetyTimeout);
                    setIsSignUpMode(false);
                    setShowSignUpSuccessModal(true);
                    setSignUpData({ firstName: "", lastName: "", email: "", birthDate: "", churchRole: "", phone: "", password: "", confirmPassword: "" });
                  } catch (error: any) {
                    console.error("DEBUG: Erro capturado no catch:", error);
                    let errorMessage = "Erro ao solicitar cadastro. ";
                    
                    if (error.code === 'permission-denied') {
                      errorMessage += "Permissão negada no banco de dados.";
                    } else if (error.message && error.message.includes('offline')) {
                      errorMessage += "Você parece estar offline ou a conexão foi recusada.";
                    } else {
                      errorMessage += error.message || "Tente novamente.";
                    }
                    
                    setAuthError(errorMessage);
                  } finally {
                    console.log("DEBUG: Finalizando bloco try-catch-finally");
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? "Solicitando..." : "Solicitar Acesso"}
              </Button>

              <div className="mt-8 text-center">
                <p className="text-sm font-medium text-white">
                  Já tem uma conta? <button onClick={() => { setIsSignUpMode(false); setAuthError(""); }} className="text-[#BF76FF] hover:underline transition-colors cursor-pointer">Faça login</button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sign Up Success Modal */}
        <Dialog open={showSignUpSuccessModal} onOpenChange={setShowSignUpSuccessModal}>
          <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center mb-2">Cadastro Solicitado!</DialogTitle>
            </DialogHeader>
            <p className="text-gray-400 mt-2">
              Seu cadastro foi solicitado com sucesso. Retornaremos em breve com a confirmação de acesso ao painel.
            </p>
            <Button 
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer mt-6 h-12 rounded-xl"
              onClick={() => setShowSignUpSuccessModal(false)}
            >
              Fechar
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Sidebar 1: Wide Navigation */}
      <aside className="md:w-64 w-full md:h-full h-16 flex md:flex-col flex-row items-start justify-between md:py-6 px-4 md:px-4 border-t md:border-t-0 md:border-r border-white/5 bg-[#0a0a0a] z-50 order-last md:order-first overflow-y-auto">
        <div className="hidden md:flex flex-col w-full mb-8">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium mb-8 uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Voltar ao site
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#BF76FF]/20 flex items-center justify-center text-[#BF76FF]">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="flex items-center text-xl font-bold">
              <span className="text-white">MP</span>
              <span className="text-[#BF76FF]">DASH</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 flex md:flex-col flex-row gap-2 w-full overflow-x-auto md:overflow-visible">
          <SidebarItem icon={LayoutDashboard} active={activeTab === "visao-geral"} onClick={() => setActiveTab("visao-geral")} label="Visão Geral" />
          <SidebarItem icon={Calendar} active={activeTab === "eventos"} onClick={() => setActiveTab("eventos")} label="Eventos" />
          <SidebarItem icon={FileText} active={activeTab === "oracao"} onClick={() => setActiveTab("oracao")} label="Pedidos de Oração" />
          <SidebarItem icon={ShieldCheck} active={activeTab === "ministerios"} onClick={() => setActiveTab("ministerios")} label="Ministérios" />
          <SidebarItem icon={Users} active={activeTab === "membros"} onClick={() => setActiveTab("membros")} label="Membros" />
          <SidebarItem icon={Heart} active={activeTab === "doacoes"} onClick={() => setActiveTab("doacoes")} label="Doações" />
          <SidebarItem icon={Calendar} active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} label="Agenda" />
          <SidebarItem icon={TrendingUp} active={activeTab === "relatorios"} onClick={() => setActiveTab("relatorios")} label="Relatórios" />
          
          <div className="md:mt-auto pt-4 border-t border-white/5 w-full hidden md:block">
            <SidebarItem icon={Settings} active={activeTab === "config"} onClick={() => setActiveTab("config")} label="Configurações" />
            <SidebarItem icon={Video} active={activeTab === "live"} onClick={() => setActiveTab("live")} label="Live" />
            <button 
              className="w-full h-12 px-4 rounded-xl flex items-center gap-3 transition-all relative group bg-transparent text-red-500 hover:bg-red-500/10 font-medium mt-2"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm whitespace-nowrap">Sair</span>
            </button>
          </div>
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <div className="relative">
            <button 
              className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#BF76FF] rounded-full"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute bottom-full left-0 md:bottom-auto md:top-0 md:left-full md:ml-4 mb-4 md:mb-0 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                  <h3 className="font-bold text-white">Notificações</h3>
                  <button 
                    className="text-xs text-[#BF76FF] hover:underline cursor-pointer"
                    onClick={async () => {
                      notifications.filter(n => !n.read).forEach(n => {
                        updateDoc(doc(db, "notifications", n.id), { read: true });
                      });
                    }}
                  >
                    Marcar lidas
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Nenhuma notificação</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors",
                          !notif.read ? "bg-[#BF76FF]/5" : ""
                        )}
                        onClick={async () => {
                          if (!notif.read) {
                            await updateDoc(doc(db, "notifications", notif.id), { read: true });
                          }
                          if (notif.type === "registration" && notif.memberId) {
                            setActiveTab("equipe");
                            const member = members.find(m => m.id === notif.memberId);
                            if (member) {
                              setSelectedItem(member);
                              setFormData(member);
                              setIsEditing(true);
                              setIsReadOnly(true);
                            }
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <h4 className="text-sm font-bold text-white mb-1">{notif.title}</h4>
                        <p className="text-xs text-gray-400">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center cursor-pointer"
            onClick={logout}
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Sidebar 2: Item List (Hidden on mobile if editing) */}
      <aside className={cn(
        "md:w-80 w-full border-r border-white/5 bg-[#0f0f0f] flex flex-col overflow-y-auto",
        isEditing ? "hidden md:flex" : "flex flex-1 md:flex-none",
        (activeTab === "agenda" || activeTab === "eventos") ? "hidden md:hidden" : ""
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

        <div className="flex-1 px-4 overflow-y-auto">
          <div className="space-y-2 pb-6">
            {filteredItems.map((item) => (
              <ListItem 
                key={item.id}
                title={item.title || item.name || ""}
                subtitle={item.date ? (activeTab === "eventos" ? item.date : safeFormatDate(item.date)) : item.email || item.category || ""}
                image={item.image || item.photoURL}
                icon={
                  activeTab === "eventos" ? Calendar : 
                  activeTab === "oracao" ? FileText : 
                  activeTab === "ministerios" ? ShieldCheck : 
                  activeTab === "membros" ? Users : 
                  activeTab === "doacoes" ? Heart : 
                  activeTab === "agenda" ? Calendar : 
                  activeTab === "relatorios" ? TrendingUp : 
                  File
                }
                active={selectedItem?.id === item.id}
                status={item.status}
                onClick={() => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsReadOnly(false);
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
        </div>

        <div className="p-4">
          <Button 
            className="w-full bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-xl h-12 font-bold cursor-pointer"
            onClick={() => {
              setSelectedItem(null);
              setFormData({});
              setIsReadOnly(false);
              setIsEditing(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Item
          </Button>
        </div>
      </aside>

      {/* Main Content Area (Hidden on mobile if not editing and not agenda/eventos) */}
      <main className={cn(
        "flex-1 flex flex-col bg-[#0a0a0a]",
        !isEditing && activeTab !== "agenda" && activeTab !== "eventos" ? "hidden md:flex" : "flex"
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
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {isEditing ? (
              <Card className="bg-[#111] border-white/5 rounded-3xl p-4 md:p-8">
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold mb-4 text-white">
                    {isReadOnly ? "Visualizar" : selectedItem ? "Editar" : "Novo"} {activeTab}
                  </h4>

                  {/* Pending Member Approval UI */}
                  {activeTab === "equipe" && selectedItem?.status === "pending" && (
                    <div className="bg-[#BF76FF]/10 border border-[#BF76FF]/30 rounded-2xl p-6 mb-6">
                      <h5 className="text-[#BF76FF] font-bold mb-2 flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Solicitação de Cadastro Pendente
                      </h5>
                      <p className="text-sm text-gray-300 mb-6">
                        Este usuário solicitou acesso ao painel. Verifique as informações abaixo e decida se deseja aprovar ou reprovar.
                      </p>
                      <div className="flex gap-4">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
                          onClick={async () => {
                            await updateDoc(doc(db, "members", selectedItem.id), { status: "approved" });
                            const msg = `Olá ${selectedItem.name}, seu cadastro no painel do Ministério Profecia foi APROVADO! Você já pode acessar usando seu e-mail e a senha padrão (admin).`;
                            if (selectedItem.phone) {
                              window.open(`https://wa.me/55${selectedItem.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }
                            setIsEditing(false);
                            setSelectedItem(null);
                          }}
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" /> Aprovar
                        </Button>
                        <Button 
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-lg"
                          onClick={async () => {
                            let reason = "Não atende aos requisitos no momento.";
                            try {
                              const userReason = window.prompt("Motivo da reprovação:");
                              if (userReason === null) return; // Cancelled
                              if (userReason) reason = userReason;
                            } catch (e) {
                              // Prompt blocked, use default reason
                            }
                            await updateDoc(doc(db, "members", selectedItem.id), { status: "rejected", rejectReason: reason });
                            const msg = `Olá ${selectedItem.name}, seu cadastro no painel do Ministério Profecia foi REPROVADO. Motivo: ${reason}`;
                            if (selectedItem.phone) {
                              window.open(`https://wa.me/55${selectedItem.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }
                            setIsEditing(false);
                            setSelectedItem(null);
                          }}
                        >
                          <X className="w-5 h-5 mr-2" /> Reprovar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "agenda" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título do Evento</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          value={formData.title || ""}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          readOnly={isReadOnly}
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
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Local</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.location || ""}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "eventos" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">URL da Imagem</label>
                        <div className="flex gap-2">
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white flex-1" 
                            placeholder="https://exemplo.com/imagem.jpg"
                            value={formData.image || ""}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                            readOnly={isReadOnly}
                          />
                          {!isReadOnly && (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="image-upload-event"
                                onChange={handleFileUpload}
                              />
                              <Button
                                type="button"
                                className="h-14 px-6 rounded-2xl bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF]/20 border border-[#BF76FF]/30 font-bold flex items-center gap-2"
                                onClick={() => document.getElementById('image-upload-event')?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                {isUploading ? "..." : "Upload"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título do Evento</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          value={formData.title || ""}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          readOnly={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bio do Evento</label>
                        <Textarea 
                          className="bg-[#1a1a1a] border-none min-h-[100px] rounded-2xl p-6 text-white" 
                          value={formData.content || ""}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          readOnly={isReadOnly}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data e Horários</label>
                          <Button 
                            type="button"
                            variant="outline"
                            disabled={isReadOnly}
                            className="w-full bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white flex justify-start font-normal hover:bg-[#222]"
                            onClick={() => {
                              // Pre-fill if exists
                              if (formData.date) {
                                const parts = formData.date.split(' - ');
                                if (parts.length >= 3) {
                                  // Format: DD/MM/YYYY - HH:mm - HH:mm
                                  const dateParts = parts[0].split('/');
                                  if (dateParts.length === 3) {
                                    setTempDate(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                                  }
                                  setTempStartTime(parts[1]);
                                  setTempEndTime(parts[2]);
                                }
                              } else {
                                setTempDate("");
                                setTempStartTime("");
                                setTempEndTime("");
                              }
                              setIsDatePickerOpen(true);
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2 text-[#BF76FF]" />
                            {formData.date || "Selecionar data e horários"}
                          </Button>

                          <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Configurar Data e Horários</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data do Evento</label>
                                  <Input 
                                    type="date"
                                    className="bg-[#1a1a1a] border-none h-12 rounded-xl px-4 text-white"
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Início</label>
                                    <Input 
                                      type="time"
                                      className="bg-[#1a1a1a] border-none h-12 rounded-xl px-4 text-white"
                                      value={tempStartTime}
                                      onChange={(e) => setTempStartTime(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Término</label>
                                    <Input 
                                      type="time"
                                      className="bg-[#1a1a1a] border-none h-12 rounded-xl px-4 text-white"
                                      value={tempEndTime}
                                      onChange={(e) => setTempEndTime(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsDatePickerOpen(false)}>Cancelar</Button>
                                <Button 
                                  className="bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white font-bold"
                                  onClick={() => {
                                    if (tempDate && tempStartTime && tempEndTime) {
                                      const [year, month, day] = tempDate.split('-');
                                      const formattedDate = `${day}/${month}/${year} - ${tempStartTime} - ${tempEndTime}`;
                                      setFormData({ ...formData, date: formattedDate });
                                      setIsDatePickerOpen(false);
                                    } else {
                                      alert("Por favor, preencha todos os campos.");
                                    }
                                  }}
                                >
                                  Confirmar
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Organização</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.organization || ""}
                            onChange={(e) => setFormData({...formData, organization: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Local (Rua/bairro/cidade/ponto de referência)</label>
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          value={formData.location || ""}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          readOnly={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações do Evento</label>
                        <Textarea 
                          className="bg-[#1a1a1a] border-none min-h-[100px] rounded-2xl p-6 text-white" 
                          placeholder="Ex: equipamentos que precisa, ponto de energia pegar na casa da Maria..."
                          value={formData.observations || ""}
                          onChange={(e) => setFormData({...formData, observations: e.target.value})}
                          readOnly={isReadOnly}
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
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">E-mail</label>
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                            value={formData.email || ""}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            readOnly={isReadOnly}
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
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cargo</label>
                          <select 
                            className="w-full bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 outline-none text-white"
                            value={formData.role || "member"}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            disabled={isReadOnly}
                          >
                            <option value="member">Membro</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Foto (URL)</label>
                        <div className="flex gap-2">
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white flex-1" 
                            placeholder="https://exemplo.com/foto.jpg"
                            value={formData.photoURL || ""}
                            onChange={(e) => setFormData({...formData, photoURL: e.target.value})}
                            readOnly={isReadOnly}
                          />
                          {!isReadOnly && (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="image-upload-member"
                                onChange={handleFileUpload}
                              />
                              <Button
                                type="button"
                                className="h-14 px-6 rounded-2xl bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF]/20 border border-[#BF76FF]/30 font-bold flex items-center gap-2"
                                onClick={() => document.getElementById('image-upload-member')?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                {isUploading ? "..." : "Upload"}
                              </Button>
                            </div>
                          )}
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
                          readOnly={isReadOnly}
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
                          readOnly={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thumbnail (URL)</label>
                        <div className="flex gap-2">
                          <Input 
                            className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white flex-1" 
                            placeholder="https://exemplo.com/thumb.jpg"
                            value={formData.thumbnail || ""}
                            onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                            readOnly={isReadOnly}
                          />
                          {!isReadOnly && (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="image-upload-music"
                                onChange={handleFileUpload}
                              />
                              <Button
                                type="button"
                                className="h-14 px-6 rounded-2xl bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF]/20 border border-[#BF76FF]/30 font-bold flex items-center gap-2"
                                onClick={() => document.getElementById('image-upload-music')?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                {isUploading ? "..." : "Upload"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-6">
                    {selectedItem && !isReadOnly && (
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-500/10 rounded-2xl h-12 px-6 cursor-pointer"
                        onClick={() => handleDelete(selectedItem.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    )}
                    <div className="flex gap-4 ml-auto">
                      <Button variant="ghost" className="rounded-2xl h-12 px-8 text-gray-400 cursor-pointer" onClick={() => setIsEditing(false)}>
                        {isReadOnly ? "Voltar" : "Cancelar"}
                      </Button>
                      {!isReadOnly && (
                        <Button className="bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer" onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" /> Salvar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : activeTab === "eventos" && !isEditing ? (
              <EventosView 
                events={posts} 
                onNewEvent={() => {
                  setSelectedItem(null);
                  setFormData({});
                  setIsReadOnly(false);
                  setIsEditing(true);
                }}
                onViewEvent={(item) => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsReadOnly(true);
                  setIsEditing(true);
                }}
                onEditEvent={(item) => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsReadOnly(false);
                  setIsEditing(true);
                }}
                onDeleteEvent={(item) => {
                  handleDelete(item.id);
                }}
              />
            ) : activeTab === "agenda" ? (
              <CalendarView 
                agenda={agenda} 
                onNewEvent={(date) => {
                  setSelectedItem(null);
                  setFormData({ date: format(date, "yyyy-MM-dd'T'19:00") });
                  setIsReadOnly(false);
                  setIsEditing(true);
                }}
                onViewEvent={(item) => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsReadOnly(true);
                  setIsEditing(true);
                }}
                onEditEvent={(item) => {
                  setSelectedItem(item);
                  setFormData(item);
                  setIsReadOnly(false);
                  setIsEditing(true);
                }}
                onDeleteEvent={(item) => {
                  handleDelete(item.id);
                }}
              />
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
                    setIsReadOnly(false);
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
        </div>

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
      <aside className="hidden lg:flex w-80 border-l border-white/5 bg-[#0f0f0f] flex-col p-6 overflow-y-auto">

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

function SidebarItem({ icon: Icon, active, onClick, label }: { icon: any, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full h-12 px-4 rounded-xl flex items-center gap-3 transition-all relative group",
        active ? "bg-white/10 text-white font-bold" : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-[#BF76FF]" : "text-gray-400 group-hover:text-gray-300")} />
      <span className="text-sm whitespace-nowrap">
        {label}
      </span>
      {active && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-[#BF76FF] rounded-r-full" />}
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
  status?: string;
  onClick: () => void;
}

function ListItem({ title, subtitle, image, icon: Icon, active, status, onClick }: ListItemProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all",
        active ? "bg-[#1a1a1a] border border-white/5" : "hover:bg-white/5"
      )}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#222] flex items-center justify-center shrink-0">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : Icon ? (
          <Icon className="w-6 h-6 text-gray-500" />
        ) : (
          <File className="w-6 h-6 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-bold truncate flex items-center gap-2", active ? "text-white" : "text-gray-300")}>
          {title}
          {status === "pending" && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Pendente</span>}
          {status === "approved" && <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Aprovado</span>}
          {status === "rejected" && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">Reprovado</span>}
        </h4>
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
