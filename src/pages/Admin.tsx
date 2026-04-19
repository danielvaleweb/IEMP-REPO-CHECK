import { useState, useEffect, useMemo, useRef } from "react";
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
  Clock,
  MapPin,
  X,
  ShieldCheck,
  TrendingUp,
  Heart,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Sun,
  Moon,
  Star,
  Bookmark,
  Cake,
  Flame,
  CalendarDays,
  Menu,
  Mic,
  Paperclip,
  MoreVertical,
  Play,
  Pause,
} from "lucide-react";
import confetti from 'canvas-confetti';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
  getDocs,
  increment
} from "firebase/firestore";
import { 
  differenceInMonths,
  differenceInYears,
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
  parseISO,
  isAfter
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CandleIcon = ({ isDark }: { isDark: boolean }) => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className={cn("w-3 h-8 rounded-t-lg absolute bottom-1 shadow-sm", isDark ? "bg-pink-500/40" : "bg-pink-100")} />
    <div className="w-0.5 h-2 bg-gray-600 absolute bottom-9" />
    <motion.div
      animate={{ 
        scale: [1, 1.15, 1, 1.08, 1],
        y: [0, -1.5, 0, -1, 0],
        rotate: [-1.5, 1.5, -1.5, 0.8, -0.8]
      }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      className="absolute bottom-10"
    >
      <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
    </motion.div>
  </div>
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
  onDeleteEvent,
  isDark,
  canEdit = false,
  canDelete = false,
  modalTitle = "Compromissos do Dia",
  emptyMessage = "Nenhum evento cadastrado para este dia.",
  newEventButtonLabel = "Cadastrar novo evento"
}: { 
  agenda: any[], 
  onNewEvent: (date: Date) => void, 
  onViewEvent: (item: any) => void, 
  onEditEvent: (item: any) => void, 
  onDeleteEvent: (item: any) => void,
  isDark?: boolean,
  canEdit?: boolean,
  canDelete?: boolean,
  modalTitle?: string,
  emptyMessage?: string,
  newEventButtonLabel?: string
}) {
  const { user } = useAuth();
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
      <div className={cn(
        "border rounded-3xl p-4 md:p-8 transition-colors duration-500",
        isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl"
      )}>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className={cn("text-lg md:text-2xl font-bold capitalize transition-colors", isDark ? "text-white" : "text-black")}>
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-black/5")} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className={cn("w-4 h-4 md:w-5 h-5", isDark ? "text-white" : "text-black")} />
            </Button>
            <Button variant="ghost" size="icon" className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-black/5")} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className={cn("w-4 h-4 md:w-5 h-5", isDark ? "text-white" : "text-black")} />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest py-1 md:py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day, i) => {
            const dayEvents = agenda.filter(event => event.date && isSameDay(parseISO(event.date), day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div 
                key={i} 
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[50px] md:min-h-[100px] p-1 md:p-2 rounded-lg md:rounded-xl border transition-all cursor-pointer relative group",
                  isCurrentMonth 
                    ? isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5" 
                    : isDark ? "bg-[#1a1a1a]/30 border-white/5 opacity-50" : "bg-gray-50/30 border-black/5 opacity-50",
                  "hover:border-[#BF76FF]/50",
                  isSameDay(day, new Date()) && "ring-2 ring-[#BF76FF]",
                  day.getDay() === 6 && "md:border-black/5 border-green-500/50 dark:border-green-500/30 md:dark:border-white/5"
                )}
              >
                <div className={cn(
                  "text-right text-[8px] md:text-xs font-bold mb-1 md:mb-2 transition-colors",
                  day.getDay() === 6 ? "text-green-500 md:text-gray-400" : "text-gray-400"
                )}>{format(day, dateFormat)}</div>
                <div className="space-y-0.5 md:space-y-1">
                  {dayEvents.slice(0, 3).map((event, j) => (
                    <div 
                      key={j}
                      className={cn(
                        "text-[7px] md:text-[10px] p-0.5 md:p-1.5 rounded truncate transition-colors relative group/event",
                        day.getDay() === 6 
                          ? "bg-green-500/20 text-green-500 md:bg-[#BF76FF]/20 md:text-[#BF76FF]" 
                          : "bg-[#BF76FF]/20 text-[#BF76FF]"
                      )}
                    >
                      <span className="md:inline hidden">{event.title}</span>
                      <span className="md:hidden">●</span>
                      
                      {/* Tooltip Desktop Only */}
                      <div className={cn(
                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden md:group-hover/event:block w-56 border p-4 rounded-2xl shadow-2xl z-50 transition-all duration-300 backdrop-blur-md",
                        isDark ? "bg-black/90 border-white/10 text-white" : "bg-white/95 border-black/10 text-black"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#BF76FF]" />
                          <p className={cn("font-black text-sm whitespace-normal tracking-tight", isDark ? "text-white" : "text-black")}>{event.title}</p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{safeFormatTime(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{event.location || "Sem local definido"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[7px] text-gray-500 text-center font-bold">
                      +{dayEvents.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className={cn("border sm:max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col transition-colors rounded-[32px]", isDark ? "bg-[#111] border-white/10 text-white" : "bg-white border-black/10 text-black")}>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {modalTitle} ({selectedDay ? format(selectedDay, "dd/MM/yyyy") : ""})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-6">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, idx) => {
                  return (
                    <div key={idx} className={cn("p-4 rounded-2xl border space-y-3 transition-colors", isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5")}>
                      <div>
                        <h4 className="font-bold text-lg">{event.title}</h4>
                        <p className="text-sm text-gray-400">{safeFormatTime(event.date)} • {event.location || "Sem local"}</p>
                        <p className="text-xs text-[#BF76FF] mt-1">Adicionado por: {event.authorName || "Admin"}</p>
                      </div>
                      <div className={cn("flex gap-2 pt-2 border-t", isDark ? "border-white/5" : "border-black/5")}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn("flex-1 cursor-pointer transition-colors", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
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
                  <p>{emptyMessage}</p>
                </div>
              )}
              
              {canEdit && (
                <Button 
                  className="w-full bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white font-bold cursor-pointer mt-4"
                  onClick={() => {
                    if (selectedDay) {
                      onNewEvent(selectedDay);
                      setSelectedDay(null);
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> {newEventButtonLabel}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


// Helper to format roles
const formatRoles = (member: any) => {
  let roles: string[] = [];
  if (member.ministries && Array.isArray(member.ministries) && member.ministries.length > 0) {
    roles = member.ministries.map((m: any) => typeof m === 'string' ? m : m.name);
  } else if (member.role) {
    roles = [member.role];
  } else {
    roles = ["Membro"];
  }

  // Filter out duplicates and format
  const uniqueRoles = Array.from(new Set(roles));
  const mappedRoles = uniqueRoles.map(r => {
    if (r === "Administradores") return "Administrador Master";
    if (r === "Desenvolvimento") return "Desenvolvedor";
    return r;
  });

  if (mappedRoles.length > 1) {
    const last = mappedRoles.pop();
    return `${mappedRoles.join(", ")} e ${last}`;
  }
  return mappedRoles[0];
};

function MemberProfile({ member, onBack, onEdit, isDark, notifications, onChat }: { member: any, onBack: () => void, onEdit?: () => void, isDark: boolean, notifications: any[], onChat?: () => void }) {
  const isBirthdayToday = useMemo(() => {
    if (!member.birthDate) return false;
    try {
      const birth = parseISO(member.birthDate);
      const now = new Date();
      return birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth();
    } catch (e) { return false; }
  }, [member.birthDate]);

  useEffect(() => {
    if (isBirthdayToday) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isBirthdayToday]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className={cn("flex items-center gap-2 text-sm font-bold transition-colors mb-4", isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black")}
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para lista
      </button>

      <div className={cn("rounded-[40px] overflow-hidden border transition-all", isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-2xl")}>
        <div className="relative h-64 md:h-80">
          <img 
            src={member.coverImage || "https://picsum.photos/seed/church/1200/400"} 
            className="w-full h-full object-cover opacity-60"
            alt=""
          />
          <div className={cn("absolute inset-0 bg-gradient-to-t", isDark ? "from-[#111] to-transparent" : "from-white/80 to-transparent")} />
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-[#111] bg-[#1a1a1a] overflow-hidden shadow-2xl relative z-10">
                {member.photoURL ? (
                  <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#BF76FF]">
                    {member.name?.[0] || "M"}
                  </div>
                )}
              </div>
              <div className="text-center md:text-left pb-2">
                <h2 className={cn("text-3xl md:text-5xl font-black tracking-tighter transition-colors", isDark ? "text-white" : "text-black")}>
                  {member.name}
                </h2>
                <p className="text-[#BF76FF] font-bold uppercase tracking-[0.2em] text-xs md:text-sm mt-1">
                  {formatRoles(member)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
              {onEdit && (
                <Button 
                  onClick={onEdit}
                  className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs"
                >
                  <Edit className="w-4 h-4 mr-2" /> Editar Perfil
                </Button>
              )}
              <Button 
                variant="outline"
                className={cn("rounded-2xl h-14 px-6 border-white/10 transition-colors", isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10")}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-12 grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-12">
          <div className="xl:col-span-2 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  label: (() => {
                    try {
                      if (!member.joinedDate) return "Membro";
                      const start = parseISO(member.joinedDate);
                      const now = new Date();
                      return differenceInMonths(now, start) < 1 ? "Membro" : "Membro à";
                    } catch (e) { return "Membro"; }
                  })(), 
                  value: (() => {
                    try {
                      if (!member.joinedDate) return "Novo";
                      const start = parseISO(member.joinedDate);
                      const now = new Date();
                      const years = differenceInYears(now, start);
                      const months = differenceInMonths(now, start);
                      if (years >= 1) return years === 1 ? "1 ano" : `${years} anos`;
                      if (months >= 1) return months === 1 ? "1 mês" : `${months} meses`;
                      return "Novo";
                    } catch (e) { return "Novo"; }
                  })(), 
                  icon: Calendar, 
                  color: "text-blue-500" 
                },
                { label: "Status", value: "Ativo", icon: CheckCircle2, color: "text-green-500" },
                { 
                  label: "Aniversário", 
                  value: member.birthDate ? (() => {
                    if (isBirthdayToday) return "Hoje!";
                    try {
                      const d = parseISO(member.birthDate);
                      return format(d, "dd/MMMM", { locale: ptBR });
                    } catch (e) { return "Não informado"; }
                  })() : "Não informado", 
                  icon: isBirthdayToday ? CandleIcon : Cake, 
                  color: isBirthdayToday ? "text-orange-500 animate-pulse" : "text-pink-500" 
                }
              ].map((stat, i) => (
                <div key={i} className={cn("p-6 rounded-3xl border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5")}>
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 relative", isDark ? "bg-white/5" : "bg-white shadow-sm")}>
                    {stat.label === "Aniversário" && isBirthdayToday ? (
                      <CandleIcon isDark={isDark} />
                    ) : (
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    )}
                    {stat.label === "Aniversário" && isBirthdayToday && (
                      <Cake className="w-8 h-8 absolute -top-1 -right-1 text-pink-500/20 rotate-12" />
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={cn("text-xl font-black transition-colors uppercase", isDark ? "text-white" : "text-black")}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <h3 className={cn("text-xl font-bold transition-colors", isDark ? "text-white" : "text-black")}>Sobre o Membro</h3>
              <p className={cn("text-lg leading-relaxed transition-colors", isDark ? "text-gray-400" : "text-gray-600")}>
                {member.bio || "Nenhuma biografia informada para este membro. Adicione informações sobre sua jornada, ministérios e dons para que outros possam conhecê-lo melhor."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className={cn("text-xl font-bold transition-colors", isDark ? "text-white" : "text-black")}>Informações de Contato</h3>
                <div className="space-y-4">
            <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF]">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1 group cursor-pointer" onClick={onChat}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Conversas</p>
                      <p className={cn("font-bold transition-colors group-hover:text-[#BF76FF]", isDark ? "text-white" : "text-black")}>Iniciar Bate-papo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">E-mail</p>
                      <p className={cn("font-bold transition-colors", isDark ? "text-white" : "text-black")}>{member.email || "Não informado"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className={cn("text-xl font-bold transition-colors", isDark ? "text-white" : "text-black")}>Ministérios</h3>
                <div className="flex flex-wrap gap-2">
                  {member.ministries?.length > 0 ? Array.from(new Set(member.ministries.map((m: any) => typeof m === 'string' ? m : m.name))).map((mName: any, i: number) => {
                    const ministry = member.ministries.find((min: any) => (typeof min === 'string' ? min : min.name) === mName);
                    const isLeader = typeof ministry === 'object' && ministry.isLeader;
                    
                    // Display overrides for this section
                    let displayPath = mName === "Desenvolvedor" ? "Desenvolvimento" : 
                                      mName === "Administradores" ? "Administração" : 
                                      mName;

                    const getPreposition = (name: string) => {
                      const n = name.toLowerCase();
                      if (n.endsWith('a')) return 'da';
                      if (n.endsWith('as')) return 'das';
                      if (n.endsWith('s')) return 'dos';
                      return 'do';
                    };

                    const prep = getPreposition(displayPath);
                    
                    return (
                      <span key={i} className={cn("px-4 py-2 rounded-full text-xs font-bold", isLeader ? "bg-[#BF76FF] text-white" : "bg-[#BF76FF]/10 text-[#BF76FF]")}>
                        {isLeader ? `Líder ${prep} ${displayPath}` : `Participa ${prep} ${displayPath}`}
                      </span>
                    );
                  }) : (
                    <span className="text-sm text-gray-500 italic">Nenhum ministério vinculado</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className={cn("p-8 rounded-[32px] border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5")}>
              <h3 className={cn("text-xl font-bold mb-6 transition-colors", isDark ? "text-white" : "text-black")}>Atividade Recente</h3>
              <div className="space-y-6">
                {(() => {
                  const activities = (notifications || [])
                    .filter(n => n.memberId === member.id && n.type === "activity")
                    .slice(0, 5);
                  
                  if (activities.length === 0) {
                    return (
                      <div className="space-y-6">
                        {[
                          { action: "Participou do Culto de Domingo", time: "2 dias atrás" },
                          { action: "Bio atualizada", time: "Hoje" }
                        ].map((act, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-2 h-2 rounded-full bg-[#BF76FF] mt-1.5 shrink-0" />
                            <div>
                              <p className={cn("text-sm font-bold transition-colors", isDark ? "text-white" : "text-black")}>{act.action}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{act.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return activities.map((act, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#BF76FF] mt-1.5 shrink-0" />
                      <div>
                        <p className={cn("text-sm font-bold transition-colors", isDark ? "text-white" : "text-black")}>{act.message}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                          {act.createdAt ? (() => {
                            try {
                              const date = typeof act.createdAt === 'string' ? parseISO(act.createdAt) : (act.createdAt.toDate ? act.createdAt.toDate() : new Date(act.createdAt));
                              const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                              if (diff < 60) return "Agora mesmo";
                              if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
                              if (diff < 86400) return `${Math.floor(diff / 3600)} horas atrás`;
                              return date.toLocaleDateString();
                            } catch (e) { return "Recentemente"; }
                          })() : "Hoje"}
                        </p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className={cn("p-8 rounded-[32px] border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5")}>
              <h3 className={cn("text-xl font-bold mb-6 transition-colors", isDark ? "text-white" : "text-black")}>Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {(member.skills || ["Liderança", "Música", "Comunicação", "Organização"]).map((skill: string, i: number) => (
                  <span key={i} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors", isDark ? "bg-white/5 text-gray-400" : "bg-white text-gray-600 shadow-sm")}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, profile, login, logout, isAdmin, setCustomLogin, loading } = useAuth();
  const navigate = useNavigate();
  
  const [rightSidebarSearch, setRightSidebarSearch] = useState("");
  
  useEffect(() => {
    console.log("DEBUG Admin Component State:", { 
      hasUser: !!user, 
      email: user?.email, 
      isAdmin, 
      loading,
      profileRole: profile?.role 
    });
  }, [user, isAdmin, loading, profile]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1280);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [rightSidebarView, setRightSidebarView] = useState<"team" | "chat-list" | "chat-active" | "hidden">("team");
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

  // Reset unread count when chat becomes active
  useEffect(() => {
    if (rightSidebarView === "chat-active" && activeChatUser?.id && profile?.id) {
      const chatId = [profile.id, activeChatUser.id].sort().join('_');
      updateDoc(doc(db, "chats", chatId), {
        [`unreadCount.${profile.id}`]: 0
      }).catch(err => console.error("Error resetting unread count", err));
    }
  }, [rightSidebarView, activeChatUser?.id, profile?.id]);

  const renderMessageWithMentions = (text: string) => {
    if (!text) return null;

    // Detect format @{Name} or just links
    const parts = text.split(/(@\{[^}]+\})|(https?:\/\/[^\s]+)/g);
    return (
      <p className="text-sm whitespace-pre-wrap">
        {parts.filter(Boolean).map((part, i) => {
          if (part.startsWith("@{") && part.endsWith("}")) {
            const fullName = part.substring(2, part.length - 1);
            const member = members.find(m => m.name === fullName);
            
            if (member) {
              return (
                <span 
                  key={i} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("membros");
                    setViewingMember(member);
                  }}
                  className="font-bold text-blue-300 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
                >
                  @{fullName}
                </span>
              );
            }
            return `@${fullName}`;
          }

          if (part.startsWith("http")) {
            return (
              <a 
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {part}
              </a>
            );
          }

          return part;
        })}
      </p>
    );
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsSidebarCollapsed(true);
        if (rightSidebarView === "team") {
          setRightSidebarView("hidden");
        }
      } else {
        if (rightSidebarView === "hidden") {
          setRightSidebarView("team");
        }
      }
    };
    
    // Run once on mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time Chat Fetching
  useEffect(() => {
    if (!profile?.id || !activeChatUser?.id) return;
    
    // Create unique chat ID sorting by ID alphabetical order
    const chatId = [profile.id, activeChatUser.id].sort().join('_');
    
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));
    
    return () => unsub();
  }, [profile?.id, activeChatUser?.id]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !profile?.id || !activeChatUser?.id) return;
    
    const chatId = [profile.id, activeChatUser.id].sort().join('_');
    const msgText = chatInput.trim();
    setChatInput(""); // clear immediately
    
    try {
      // Update Chat Index with unread count
      await setDoc(doc(db, "chats", chatId), {
        participants: [profile.id, activeChatUser.id],
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${activeChatUser.id}`]: increment(1)
      }, { merge: true });

      // Add to messages subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: msgText,
        senderId: profile.id,
        timestamp: serverTimestamp()
      });
      
      // Notify the other user using the central notifications
      await addDoc(collection(db, "notifications"), {
        userId: activeChatUser.id,
        title: "Nova mensagem",
        message: `${profile.name || user?.displayName || 'Alguém'} enviou uma mensagem para você`,
        read: false,
        type: "chat",
        senderId: profile.id,
        createdAt: serverTimestamp()
      });
      
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
    }
  };

  // Data States
  const [posts, setPosts] = useState<any[]>([]);
  const [musics, setMusics] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [agendaDirecao, setAgendaDirecao] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [showPending, setShowPending] = useState(false);
  const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  
  // Computed
  const pendingMembers = members.filter(m => m.status === "pending" || m.status === "pending_approval");
  const activeMembersForDisplay = showPending ? pendingMembers : members.filter(m => m.status !== "pending" && m.status !== "pending_approval");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentPlayingMusic, setCurrentPlayingMusic] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (rightSidebarView === "chat-active") {
      scrollToBottom();
    }
  }, [chatMessages, rightSidebarView]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.log("Playback error:", e));
      setIsPlaying(true);
    }
  };

  const handlePlayMusic = (music: any) => {
    if (currentPlayingMusic?.id === music.id) {
      togglePlay();
    } else {
      setCurrentPlayingMusic(music);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (currentPlayingMusic && isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Playback error:", e));
    }
  }, [currentPlayingMusic, isPlaying]);

  const [authError, setAuthError] = useState("");

  const userStatus = profile?.status_presence || "online";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "ocupado": return "bg-red-500";
      case "ausente": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const updatePresenceStatus = async (status: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "members", user.uid), {
        status_presence: status,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const globalSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    
    const results: any[] = [];
    
    members.forEach(m => {
      if (m.name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query)) {
        results.push({ type: 'membros', item: m, title: m.name, sub: formatRoles(m), icon: Users });
      }
    });
    
    posts.forEach(p => {
      if (p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query)) {
        results.push({ type: 'eventos', item: p, title: p.title, sub: p.date || "Sem data", icon: LayoutDashboard });
      }
    });

    agenda.forEach(a => {
      if (a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query)) {
        results.push({ type: 'agenda', item: a, title: a.title, sub: a.date || "Sem data", icon: Calendar });
      }
    });
    
    return results.slice(0, 8);
  }, [searchQuery, members, posts, agenda]);

  useEffect(() => {
    const seedNotifs = async () => {
      if (user && notifications.length === 0 && !loading) {
        // Check if there are truly no notifications in DB for this user
        const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          const samples = [
            { 
              userId: user.uid, 
              title: "Nova Mensagem", 
              message: "Daniel te enviou uma nova mensagem", 
              createdAt: serverTimestamp(), 
              read: false 
            },
            { 
              userId: user.uid, 
              title: "Aniversário", 
              message: "Hoje é aniversário de Josy Pereira", 
              createdAt: serverTimestamp(), 
              read: false 
            },
            { 
              userId: user.uid, 
              title: "Evento Alterado", 
              message: "O evento Juiz de fora em Gerezim mudou para dia 10 de maio", 
              createdAt: serverTimestamp(), 
              read: false 
            }
          ];
          for (const n of samples) {
            await addDoc(collection(db, "notifications"), n);
          }
        }
      }
    };
    seedNotifs();
  }, [user, notifications.length, loading]);

  const allRoles = useMemo(() => [
    "Administradores", 
    "Direção", 
    "Secretaria", 
    "Desenvolvedor", 
    "Mídia", 
    "Diácuno", 
    "Minis. infantil", 
    "Minis. louvor", 
    "Minis. Jovens",
    "Visitante",
    "Membro"
  ], []);

  const isMasterAdmin = user?.email === "iempministerioprofecia@gmail.com";
  const isAdminOrDev = profile?.role === "Administradores" || profile?.role === "Desenvolvedor" || isMasterAdmin;

  // Notifications Filtering Logic
  const displayNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Administrative notifications (only for Master Admin and Dev)
      if (n.type === "registration" || n.type === "activity") {
        return isAdminOrDev;
      }
      
      // Personal notifications (targeted to current user)
      if (n.userId === user?.uid) {
        return true;
      }

      return false;
    });
  }, [notifications, isAdminOrDev, user?.uid]);

  const handleMarkAllAsRead = async () => {
    try {
      // Mark displayed notifications as read in Firestore
      const unreadNotifications = displayNotifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }));
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  useEffect(() => {
    // Database Migration: Cleanup 'Desenvolvimento' -> 'Desenvolvedor'
    const migrateRoles = async () => {
      if (!isMasterAdmin || members.length === 0) return;
      
      const toUpdate = members.filter(m => {
        const hasOldRoleInRole = m.role === "Desenvolvimento";
        const hasOldRoleInMinistries = (m.ministries || []).some((min: any) => 
          (typeof min === 'string' ? min : min.name) === "Desenvolvimento"
        );
        return hasOldRoleInRole || hasOldRoleInMinistries;
      });

      for (const member of toUpdate) {
        const newMinistries = (member.ministries || []).map((m: any) => {
          if (typeof m === 'string') return m === "Desenvolvimento" ? "Desenvolvedor" : m;
          return { ...m, name: m.name === "Desenvolvimento" ? "Desenvolvedor" : m.name };
        });
        const newRole = member.role === "Desenvolvimento" ? "Desenvolvedor" : member.role;
        
        try {
          await updateDoc(doc(db, "members", member.id), {
            role: newRole,
            ministries: newMinistries
          });
          console.log(`Migrated role for ${member.name}`);
        } catch (err) {
          console.error("Migration error:", err);
        }
      }
    };
    migrateRoles();
  }, [isMasterAdmin, members]);

  const [activeViewRole, setActiveViewRole] = useState<string | null>(null);

  const currentRole = activeViewRole || profile?.role || "Membro";
  
  // Auto-redirect for Direção role
  useEffect(() => {
    if (currentRole === "Direção" && activeTab !== "agenda-direcao") {
      setActiveTab("agenda-direcao");
    }
  }, [currentRole, activeTab, setActiveTab]);
  
  const [availableSkills, setAvailableSkills] = useState<string[]>(["Música", "Instrumentos", "Canto", "Som/Áudio", "Vídeo/Edição", "Design Gráfico", "Mídias Sociais", "Liderança", "Pregação", "Ensino Infantil", "Organização", "Cozinha", "Limpeza", "Recepção"]);
  const [newSkillName, setNewSkillName] = useState("");
  
  useEffect(() => {
    if (profile?.role && !activeViewRole) {
      setActiveViewRole(profile.role);
    }
  }, [profile?.role]);

  useEffect(() => {
    if (user && profile?.status === "pending") {
      setAuthError("Seu cadastro via Google ainda está em análise. Aguarde a aprovação do administrador.");
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile?.role === "Visitante") {
      navigate("/");
    }
  }, [user, profile, navigate]);

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
  
  // Form States
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, collection: string } | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<any>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");

  const [settings, setSettings] = useState<any>({ enableHeaderVideos: true });

  const isEffectivelyAdmin = isMasterAdmin && (!activeViewRole || activeViewRole === "Administradores");
  const canViewSettings = currentRole === "Desenvolvedor" || (isMasterAdmin && (!activeViewRole || activeViewRole === "Administradores" || activeViewRole === "Desenvolvedor"));

  const canViewTab = (tab: string) => {
    if (tab === "config" && !canViewSettings) return false;
    
    // Strict restriction for Direção profile
    if (currentRole === "Direção") {
      return tab === "agenda-direcao";
    }

    if (isEffectivelyAdmin) return true;
    const rolePerms = settings.permissions?.[currentRole];
    
    const defaultVals: any = {
      "visao-geral": true,
      "eventos": !["Membro", "Visitante", "Direção"].includes(currentRole),
      "musica": !["Membro", "Visitante", "Direção"].includes(currentRole),
      "membros": !["Membro", "Visitante", "Direção"].includes(currentRole),
      "agenda": !["Membro", "Visitante", "Direção"].includes(currentRole),
      "agenda-direcao": currentRole === "Administradores" || currentRole === "Desenvolvedor" || currentRole === "Direção"
    };

    if (!rolePerms) {
      return defaultVals[tab] ?? false;
    }
    return rolePerms.tabs?.[tab] ?? (defaultVals[tab] ?? true);
  };

  const defaultEditPerm = !["Membro", "Visitante"].includes(currentRole);
  const defaultEditProfilesPerm = currentRole === "Administradores" || currentRole === "Desenvolvedor";
  const canEdit = isEffectivelyAdmin || (settings.permissions?.[currentRole]?.edit ?? defaultEditPerm);
  const canDelete = isEffectivelyAdmin || (settings.permissions?.[currentRole]?.delete ?? defaultEditPerm);
  const canEditProfiles = isEffectivelyAdmin || (settings.permissions?.[currentRole]?.editProfiles ?? defaultEditProfilesPerm);

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    // Settings can always be fetched
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings"));

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

    const unsubAgendaDirecao = onSnapshot(query(collection(db, "agenda-direcao"), orderBy("date", "asc")), (snap) => {
      setAgendaDirecao(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.log("Agenda direction fetch error: ", err));

    const unsubNotifs = onSnapshot(query(
      collection(db, "notifications"), 
      where("userId", "in", [user?.uid, "all", "admin"]),
      orderBy("createdAt", "desc")
    ), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      // If the above query fails due to missing composite index, fallback to all notifications filtered in memory
      onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snapFallback) => {
        setNotifications(snapFallback.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    const unsubSkills = onSnapshot(doc(db, "settings", "skills"), (snap) => {
      if (snap.exists()) {
        setAvailableSkills(snap.data().list || []);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings/skills"));

    return () => {
      unsubSettings();
      unsubPosts();
      unsubMusics();
      unsubMembers();
      unsubAgenda();
      unsubAgendaDirecao();
      unsubNotifs();
      unsubSkills();
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!profile?.id) return;
    
    const unsubChats = onSnapshot(
      query(collection(db, "chats"), where("participants", "array-contains", profile.id)),
      (snap) => {
        let chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // In-memory sort to avoid requiring composite indexes
        chats.sort((a: any, b: any) => {
           const timeA = a.lastMessageTime?.toMillis?.() || 0;
           const timeB = b.lastMessageTime?.toMillis?.() || 0;
           return timeB - timeA;
        });
        setActiveChats(chats);
      },
      (err) => console.error("Error loading chats", err)
    );
    
    return () => unsubChats();
  }, [profile?.id]);

  // Search Logic
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (activeTab === "eventos") return posts.filter(p => p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query));
    if (activeTab === "musica") return musics.filter(m => m.title?.toLowerCase().includes(query));
    if (activeTab === "membros") return members.filter(m => m.name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query));
    if (activeTab === "agenda") return agenda.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query));
    if (activeTab === "agenda-direcao") return agendaDirecao.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query));
    return [];
  }, [activeTab, searchQuery, posts, musics, members, agenda, agendaDirecao]);

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const collectionName = activeTab === "eventos" ? "posts" : activeTab === "musica" ? "musics" : activeTab === "membros" ? "members" : activeTab === "agenda-direcao" ? "agenda-direcao" : "agenda";
      
      let dataToSave = { ...formData };
      if (activeTab === "membros" && formData.ministries?.length > 0) {
        // Clean up 'Desenvolvimento' to 'Desenvolvedor'
        dataToSave.ministries = formData.ministries.map((m: any) => {
          if (typeof m === 'string') return m === "Desenvolvimento" ? "Desenvolvedor" : m;
          return { ...m, name: m.name === "Desenvolvimento" ? "Desenvolvedor" : m.name };
        });

        const firstMinistry = dataToSave.ministries[0];
        dataToSave.role = typeof firstMinistry === 'string' ? firstMinistry : firstMinistry.name;
        dataToSave.isLeader = dataToSave.ministries.some((m: any) => typeof m === 'object' && m.isLeader);
      }

      if (selectedItem?.id) {
        await updateDoc(doc(db, collectionName, selectedItem.id), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        });
        
        // Log Activity
        await addDoc(collection(db, "notifications"), {
          title: "Atividade",
          message: `Atualizou ${activeTab === 'eventos' ? 'evento' : activeTab === 'agenda' ? 'item na agenda' : activeTab === 'musica' ? 'música' : 'perfil'}: ${dataToSave.title || dataToSave.name}`,
          type: "activity",
          memberId: user?.uid,
          createdAt: serverTimestamp(),
          read: true
        });
      } else {
        await addDoc(collection(db, collectionName), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          authorId: user?.uid,
          authorName: user?.displayName || "Admin"
        });

        // Log Activity
        await addDoc(collection(db, "notifications"), {
          title: "Atividade",
          message: `Criou ${activeTab === 'eventos' ? 'evento' : activeTab === 'agenda' ? 'item na agenda' : activeTab === 'agenda-direcao' ? 'compromisso na direção' : activeTab === 'musica' ? 'música' : 'registro'}: ${dataToSave.title || dataToSave.name}`,
          type: "activity",
          memberId: user?.uid,
          createdAt: serverTimestamp(),
          read: true
        });
      }
      setIsEditing(false);
      setSelectedItem(null);
      setFormData({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, activeTab);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mergedAgenda = useMemo(() => {
    const fromPosts = posts
      .filter(p => p.date)
      .map(p => {
        let isoDate = p.date;
        // Fix the legacy DD/MM/YYYY - HH:mm - HH:mm format to standard ISO to sync with Calendar
        if (typeof p.date === 'string' && p.date.includes('/') && p.date.includes(' - ')) {
          const parts = p.date.split(' - ');
          if (parts.length >= 2) {
            const dateParts = parts[0].split('/');
            if (dateParts.length === 3) {
              // Convert to YYYY-MM-DDTHH:mm
              isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1].trim()}`;
            }
          }
        }
        return {
          id: p.id,
          title: p.title,
          date: isoDate,
          endTime: p.endTime || "",
          originalDate: p.date,
          location: p.location || "Ver evento",
          description: p.content || p.bio || "",
          type: 'post'
        };
      });
    const fromAgenda = agenda.map(a => ({ ...a, type: 'agenda' }));
    return [...fromAgenda, ...fromPosts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [posts, agenda]);

  const handleDelete = (id: string, collectionOverride?: string) => {
    const colName = collectionOverride || (activeTab === "eventos" ? "posts" : activeTab === "musica" ? "musics" : activeTab === "membros" ? "members" : activeTab === "agenda-direcao" ? "agenda-direcao" : "agenda");
    setDeleteConfirm({ id, collection: colName });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      console.log('Excluindo item:', deleteConfirm.id, 'da coleção:', deleteConfirm.collection);
      await deleteDoc(doc(db, deleteConfirm.collection, deleteConfirm.id));
      setSelectedItem(null);
      setIsEditing(false);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      handleFirestoreError(err, OperationType.DELETE, activeTab);
      setDeleteConfirm(null);
    }
  };

  const openWhatsApp = (member: any) => {
    setRightSidebarView("chat-active");
    setActiveChatUser(member);
  };

  const confirmWhatsApp = (member: any, message: string) => {
    // Deprecated for internal chat
    openWhatsApp(member);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#BF76FF]/20 border-t-[#BF76FF] rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-medium animate-pulse">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user || (!isMasterAdmin && !canViewTab("visao-geral") && !canViewTab("eventos") && !canViewTab("musica") && !canViewTab("membros") && !canViewTab("agenda") && !canViewTab("agenda-direcao"))) {
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

          {user && !isAdmin && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm p-4 rounded-xl mb-6">
              <p className="font-bold mb-1">Acesso Restrito</p>
              <p>Você está logado como <span className="underline">{user.email}</span>, mas esta conta não tem permissão de administrador.</p>
              <div className="mt-3 flex gap-4">
                <button onClick={logout} className="text-xs underline hover:text-amber-400">Sair e tentar outra conta</button>
                <button onClick={() => window.location.reload()} className="text-xs underline hover:text-amber-400">Atualizar página</button>
              </div>
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
                className="w-full h-16 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#7300FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                onClick={async () => {
                  setAuthError("");
                  if (!email) {
                    setAuthError("Por favor, insira seu e-mail.");
                    return;
                  }
                  
                  setIsSubmitting(true);
                  
                  if (email === "iempministerioprofecia@gmail.com" && password === "admin") {
                    try {
                      const q = query(collection(db, "members"), where("email", "==", email));
                      const querySnapshot = await getDocs(q);
                      const memberId = !querySnapshot.empty ? querySnapshot.docs[0].id : "admin_master";
                      const memberData = !querySnapshot.empty ? querySnapshot.docs[0].data() : {};
                      
                      setCustomLogin(true, {
                        id: memberId,
                        name: memberData.name || "Administrador Master",
                        email: email,
                        role: "admin",
                        ...memberData
                      });
                      
                      window.alert("Login efetuado com sucesso!");
                      setIsSubmitting(false);
                      return;
                    } catch (e) {
                      console.error("Erro no login especial:", e);
                    }
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
                    
                    window.alert("Login efetuado com sucesso!");
                    
                    if (memberData.role === "Visitante") {
                      navigate("/");
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
                    window.alert("Login efetuado com sucesso!");
                  } catch (error: any) {
                    console.error("Erro no login Google:", error);
                    if (error.code === 'auth/unauthorized-domain') {
                      setAuthError(`Este domínio (${window.location.hostname}) não está autorizado no Firebase. Adicione-o na seção 'Authentication > Settings > Authorized domains' do Console do Firebase.`);
                    } else if (error.code === 'auth/popup-closed-by-user') {
                      setAuthError("A janela de login foi fechada antes de completar. Tente novamente.");
                    } else if (error.code === 'auth/network-request-failed') {
                      setAuthError("Falha na conexão com o Google. Verifique sua internet ou desative extensões como AdBlock que podem estar bloqueando o login.");
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
                className="w-full h-16 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#7300FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                      message: `${newMember.name} solicitou acesso ao painel com cargo de ${newMember.churchRole || 'Membro'}.`,
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
    <div className={cn(
      "flex flex-col md:flex-row h-screen h-[100dvh] overflow-hidden font-sans transition-colors duration-500 relative",
      isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"
    )}>
      {/* Sidebar 1: Navigation (Desktop: Sidebar, Mobile: Fixed Bottom Nav) */}
      <aside 
        className={cn(
          "transition-all duration-300 ease-in-out z-50",
          "md:h-full md:border-r",
          isSidebarCollapsed ? "md:w-20" : "md:w-64",
          // Mobile specifics
          "fixed bottom-0 left-0 right-0 h-20 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:border-t-0",
          isDarkMode ? "bg-[#0a0a0a]/80 md:bg-[#0a0a0a] border-white/5 backdrop-blur-lg" : "bg-white/80 md:bg-gray-50 border-black/5 backdrop-blur-lg"
        )}
      >
        <div className="hidden md:flex flex-col w-full px-4 pt-6 mb-4">
          <div className="flex items-center justify-between mb-8">
            {!isSidebarCollapsed && (
              <div className="flex flex-col items-start leading-none gap-0 pl-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn("font-black text-base tracking-tight uppercase", isDarkMode ? "text-white" : "text-black")}>Ministerio</span>
                  <span className={cn("font-light text-base tracking-tight uppercase", isDarkMode ? "text-white/80" : "text-gray-600")}>Profecia</span>
                </div>
                <span className={cn("text-[8px] font-bold uppercase tracking-[0.1em] opacity-60 mt-0.5", isDarkMode ? "text-white" : "text-black")}>área de membro</span>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-full flex justify-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BF76FF] to-[#8E44AD] flex items-center justify-center text-white shadow-lg shadow-[#BF76FF]/20">
                  <span className="font-black text-xs">MP</span>
                </div>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                isDarkMode ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-black/5 text-gray-400 hover:text-black"
              )}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          {!isSidebarCollapsed && (isMasterAdmin || profile?.role === "Desenvolvedor") && (
            <div className="relative">
              <div 
                onClick={() => isMasterAdmin ? setIsWorkspaceOpen(!isWorkspaceOpen) : setActiveTab("config")}
                className={cn(
                "border rounded-2xl p-3 mb-2 flex items-center justify-between group cursor-pointer transition-all",
                isDarkMode ? "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]" : "bg-black/[0.02] border-black/[0.05] hover:bg-black/[0.04]",
                isWorkspaceOpen && "ring-1 ring-[#BF76FF]"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors",
                    isDarkMode ? "bg-[#1a1a1a] text-gray-400 border-white/5" : "bg-white text-gray-600 border-black/5 shadow-sm"
                  )}>
                    {currentRole[0] || "A"}
                  </div>
                  <div className="flex flex-col font-['Helvetica_Neue',_sans-serif]">
                    <span className={cn("text-[10px] font-light transition-colors", isDarkMode ? "text-gray-400" : "text-gray-500")}>Workspace</span>
                    <span className={cn("text-xs font-bold transition-colors uppercase tracking-wider", isDarkMode ? "text-white" : "text-black")}>
                      {currentRole === "Administradores" ? "Administrador Master" : currentRole}
                    </span>
                  </div>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-transform", isWorkspaceOpen && "rotate-180")} />
              </div>

              <AnimatePresence>
                {isWorkspaceOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={cn(
                      "absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl border z-[60] shadow-2xl",
                      isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"
                    )}
                  >
                    <div className="space-y-1 max-h-[400px] overflow-y-auto overflow-x-hidden p-1 scrollbar-hide">
                      {allRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            setActiveViewRole(role);
                            setIsWorkspaceOpen(false);
                            if (role === "Direção") {
                              setActiveTab("agenda-direcao");
                            } else {
                              setActiveTab("visao-geral");
                            }
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-colors",
                            currentRole === role 
                              ? "bg-[#BF76FF]/10 text-[#BF76FF]" 
                              : isDarkMode ? "hover:bg-white/5 text-gray-400" : "hover:bg-black/5 text-gray-600"
                          )}
                        >
                          {role === "Administradores" ? "Administrador Master" : role}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        <div className="flex-1 w-full px-2 md:px-3 overflow-y-auto scrollbar-hide flex md:block items-center">
          <nav className="flex md:flex-col flex-row justify-around md:justify-start gap-1 md:gap-1.5 w-full md:pb-6">
            <div className="hidden md:flex flex-col gap-1.5 w-full">
              {canViewTab("visao-geral") && <SidebarItem icon={Home} active={activeTab === "visao-geral"} onClick={() => setActiveTab("visao-geral")} label="Início" collapsed={isSidebarCollapsed} isDark={isDarkMode} />}
              {canViewTab("eventos") && <SidebarItem icon={Calendar} active={activeTab === "eventos"} onClick={() => setActiveTab("eventos")} label="Eventos" collapsed={isSidebarCollapsed} isDark={isDarkMode} />}
              {canViewTab("musica") && <SidebarItem icon={Music} active={activeTab === "musica"} onClick={() => setActiveTab("musica")} label="Música" collapsed={isSidebarCollapsed} isDark={isDarkMode} />}
              {canViewTab("membros") && <SidebarItem icon={Users} active={activeTab === "membros"} onClick={() => { setActiveTab("membros"); setShowPending(false); }} label="Membros" collapsed={isSidebarCollapsed} isDark={isDarkMode} notificationCount={(isMasterAdmin || profile?.role === "Desenvolvedor") ? pendingMembers.length : 0} />}
              {canViewTab("agenda") && <SidebarItem icon={Clock} active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} label="Agenda" collapsed={isSidebarCollapsed} isDark={isDarkMode} />}
              {canViewTab("agenda-direcao") && <SidebarItem icon={CalendarDays} active={activeTab === "agenda-direcao"} onClick={() => setActiveTab("agenda-direcao")} label="Agen. Direção" collapsed={isSidebarCollapsed} isDark={isDarkMode} />}
            </div>

            {/* Bottom items (Desktop) */}
            <div className="hidden md:flex flex-col gap-1.5 w-full mt-auto pt-4 border-t border-white/5">
              {canViewSettings && (
                <SidebarItem 
                  icon={Settings} 
                  active={activeTab === "config"} 
                  onClick={() => { setActiveTab("config"); setRightSidebarView("team"); }} 
                  label="Configurações" 
                  collapsed={isSidebarCollapsed} 
                  isDark={isDarkMode} 
                />
              )}
              <SidebarItem 
                icon={LogOut} 
                active={false} 
                onClick={() => auth.signOut()} 
                label="Sair" 
                collapsed={isSidebarCollapsed} 
                isDark={isDarkMode} 
              />
            </div>

            {/* Mobile Bottom Bar Items */}
            <div className="md:hidden flex flex-row justify-around w-full items-center px-2 py-1">
              {canViewTab("visao-geral") && <SidebarItem icon={Home} active={activeTab === "visao-geral"} onClick={() => { setActiveTab("visao-geral"); setRightSidebarView("team"); }} label="Início" collapsed={true} isDark={isDarkMode} mobile />}
              {canViewTab("eventos") && <SidebarItem icon={Calendar} active={activeTab === "eventos" && rightSidebarView === "team"} onClick={() => { setActiveTab("eventos"); setRightSidebarView("team"); }} label="Eventos" collapsed={true} isDark={isDarkMode} mobile />}
              {canViewTab("musica") && <SidebarItem icon={Music} active={activeTab === "musica"} onClick={() => { setActiveTab("musica"); setRightSidebarView("team"); }} label="Música" collapsed={true} isDark={isDarkMode} mobile />}
              {canViewTab("agenda") && <SidebarItem icon={Clock} active={activeTab === "agenda"} onClick={() => { setActiveTab("agenda"); setRightSidebarView("team"); }} label="Agenda" collapsed={true} isDark={isDarkMode} mobile />}
              {canViewTab("agenda-direcao") && <SidebarItem icon={CalendarDays} active={activeTab === "agenda-direcao"} onClick={() => { setActiveTab("agenda-direcao"); setRightSidebarView("team"); }} label="Direção" collapsed={true} isDark={isDarkMode} mobile />}
              <SidebarItem icon={MessageSquare} active={rightSidebarView !== "team"} onClick={() => setRightSidebarView("chat-list")} label="Chat" collapsed={true} isDark={isDarkMode} mobile />
              
              <Sheet>
                <SheetTrigger
                  render={
                    <button className={cn(
                      "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      <Menu className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase">Menu</span>
                    </button>
                  }
                />
                <SheetContent side="bottom" className={cn("rounded-t-[32px] p-6 border-none max-h-[90vh] overflow-y-auto scrollbar-hide flex flex-col gap-6", isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black")}>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aparência do Tema</p>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full">
                      <button 
                        onClick={() => setIsDarkMode(false)}
                        className={cn("p-2 rounded-full transition-all", !isDarkMode ? "bg-white text-[#BF76FF] shadow-sm" : "text-gray-500")}
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setIsDarkMode(true)}
                        className={cn("p-2 rounded-full transition-all", isDarkMode ? "bg-[#1a1a1a] text-[#BF76FF] shadow-inner" : "text-gray-500")}
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Search Field inside Menu (Always Visible) */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Busca Rápida</p>
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="text" 
                          placeholder="Pesquisar no painel..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={cn(
                            "w-full rounded-2xl py-4 pl-12 pr-4 text-sm outline-none border transition-all", 
                            isDarkMode ? "bg-white/5 border-white/10 text-white focus:border-[#BF76FF]/50" : "bg-gray-100 border-black/5 text-black focus:border-[#BF76FF]/50"
                          )}
                        />
                      </div>
                      
                      {/* Search Results / Recommendations inside Menu */}
                      {globalSearchResults.length > 0 && searchQuery && (
                        <div className="space-y-2 mt-2">
                          {globalSearchResults.slice(0, 4).map((res, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (res.type === 'membros') setViewingMember(res.item);
                                setSelectedItem(res.item);
                                setFormData(res.item);
                                setActiveTab(res.type);
                                setIsEditing(true);
                                setIsReadOnly(true);
                                setSearchQuery("");
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left border",
                                isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-black/5 hover:bg-gray-50 shadow-sm"
                              )}
                            >
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                                <res.icon className="w-5 h-5 text-[#BF76FF]" />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className={cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{res.title}</span>
                                <span className="text-[10px] text-gray-500 truncate">{res.sub}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Opções do Sistema</p>
                      <div className="grid grid-cols-2 gap-2">
                        {canViewSettings && (
                          <SheetClose 
                            render={
                              <button className={cn("flex flex-col gap-2 p-4 rounded-2xl transition-all", isDarkMode ? "bg-white/5" : "bg-gray-100")} />
                            }
                            onClick={() => { setActiveTab("config"); setRightSidebarView("team"); }}
                          >
                            <Settings className="w-5 h-5 text-gray-400" />
                            <span className="text-xs font-bold">Configurações</span>
                          </SheetClose>
                        )}
                        <SheetClose 
                          render={
                            <button className={cn("flex flex-col gap-2 p-4 rounded-2xl transition-all", isDarkMode ? "bg-red-500/10" : "bg-red-50")} />
                          }
                          onClick={logout}
                        >
                          <LogOut className="w-5 h-5 text-red-500" />
                          <span className="text-xs font-bold text-red-500">Sair</span>
                        </SheetClose>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className={cn("flex-1 flex flex-col min-h-0 transition-all duration-500 relative", isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50")}>
        {/* Main Header */}
        <header className={cn(
          "h-14 md:h-20 border-b flex items-center transition-all duration-500 z-50 sticky top-0 shadow-sm",
          isDarkMode ? "border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl" : "border-black/5 bg-white/80 backdrop-blur-xl"
        )}>
          <div className="flex items-center gap-2 px-4 md:px-8 shrink-0">
            {isEditing ? (
              <button 
                className={cn("p-1.5 rounded-lg transition-colors cursor-pointer md:hidden", isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black")}
                onClick={() => setIsEditing(false)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="md:hidden flex flex-col items-start leading-none gap-0 ml-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn("font-black text-[13px] tracking-tight uppercase", isDarkMode ? "text-white" : "text-black")}>Ministerio</span>
                  <span className={cn("font-light text-[13px] tracking-tight uppercase", isDarkMode ? "text-white/80" : "text-gray-600")}>Profecia</span>
                </div>
                <span className={cn("text-[8px] font-bold uppercase tracking-[0.1em] opacity-60 mt-0.5", isDarkMode ? "text-white" : "text-black")}>área de membro</span>
              </div>
            )}
          </div>
          
          <div className="hidden md:flex flex-[2] justify-center relative">
            <div className={cn(
              "relative group transition-all duration-300 w-full max-w-[400px]",
              isEditing ? "hidden md:flex" : "hidden md:flex"
            )}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "border-none rounded-full h-10 pl-11 pr-4 text-sm w-full outline-none transition-colors", 
                  isDarkMode ? "bg-[#1a1a1a] text-white focus:ring-1 focus:ring-[#BF76FF]/30" : "bg-gray-100 text-black focus:ring-1 focus:ring-[#BF76FF]/50 shadow-inner"
                )}
              />
              
              {globalSearchResults.length > 0 && searchQuery && (
                <div className={cn(
                  "absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[70]",
                  isDarkMode ? "bg-[#111] border-white/10" : "bg-white border-black/10"
                )}>
                  {globalSearchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (res.type === 'membros') setViewingMember(res.item);
                        setSelectedItem(res.item);
                        setFormData(res.item);
                        setActiveTab(res.type);
                        setIsEditing(true);
                        setIsReadOnly(true);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                        isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                        <res.icon className="w-4 h-4 text-[#BF76FF]" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{res.title}</span>
                        <span className="text-[10px] text-gray-500 truncate">{res.sub}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 pl-0 pr-2 md:px-8 md:flex-1 justify-end relative ml-auto">
            {/* Toggle Sidebar Buttons (Only visible when sidebar is not permanent) */}
            <div className="hidden md:flex xl:hidden items-center gap-1 mr-1">
              <button 
                onClick={() => setRightSidebarView(rightSidebarView === "team" ? "hidden" : "team")}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  rightSidebarView === "team" ? "bg-[#BF76FF]/10 text-[#BF76FF]" : "text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                )}
                title="Membros"
              >
                <Users className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setRightSidebarView(rightSidebarView === "chat-list" ? "hidden" : "chat-list")}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  rightSidebarView === "chat-list" ? "bg-[#BF76FF]/10 text-[#BF76FF]" : "text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                )}
                title="Mensagens"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <button 
                className={cn("p-2 rounded-xl relative transition-all group", isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black")}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className={cn("w-5 h-5", displayNotifications.some(n => !n.read) && "text-[#BF76FF]")} />
                {displayNotifications.some(n => !n.read) && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#BF76FF] rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] text-white font-black shadow-lg px-1 animate-bounce">
                    {displayNotifications.filter(n => !n.read).length}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "fixed top-20 right-4 w-80 max-w-[calc(100vw-32px)] md:absolute md:top-full md:right-0 md:mt-4 md:w-72 max-h-[80vh] overflow-y-auto scrollbar-hide rounded-[28px] border shadow-2xl p-3 z-50",
                        isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"
                      )}
                    >
                      <div className="flex items-center justify-between px-2 mb-3">
                        <h6 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notificações</h6>
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-[#BF76FF] hover:underline font-bold"
                        >
                          Marcar como lida
                        </button>
                      </div>
                      <div className="space-y-1">
                        {displayNotifications.length > 0 ? (
                          displayNotifications.map(n => (
                            <button 
                              key={n.id} 
                              onClick={async () => {
                                if (!n.read) await updateDoc(doc(db, "notifications", n.id), { read: true });
                                if (n.type === "registration" && n.memberId) {
                                  setActiveTab("membros");
                                  const member = members.find(m => m.id === n.memberId);
                                  if (member) {
                                    setSelectedItem(member);
                                    setFormData(member);
                                    setIsEditing(true);
                                    setIsReadOnly(false);
                                  }
                                } else if (n.type === "chat" && n.senderId) {
                                  const sender = members.find(m => m.id === n.senderId);
                                  if (sender) {
                                    setRightSidebarView("chat-active");
                                    setActiveChatUser(sender);
                                  }
                                }
                                setShowNotifications(false);
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-2xl text-[10px] transition-all", 
                                isDarkMode 
                                  ? n.read ? "bg-white/5 text-gray-500" : "bg-white/10 text-gray-300" 
                                  : n.read ? "bg-gray-50 text-gray-500" : "bg-primary/5 text-gray-700"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#BF76FF]" />}
                                <span className={cn("font-bold block", isDarkMode ? "text-white" : "text-black")}>{n.title}</span>
                              </div>
                              <p className="line-clamp-2">{n.message}</p>
                            </button>
                          ))
                        ) : (
                          <p className="text-[10px] text-gray-500 text-center py-4">Nenhuma notificação</p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className={cn("flex items-center gap-3 pl-2 md:pl-4 md:border-l relative", isDarkMode ? "border-white/10" : "border-black/10")}>
              <div className="text-right hidden md:block">
                <p className={cn("text-sm font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>{user?.displayName || "Admin"}</p>
                <p className="text-[10px] text-gray-500 grayscale opacity-70">
                  {formatRoles(profile || { role: currentRole })}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="relative group cursor-pointer"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] p-0.5 shadow-lg shadow-[#BF76FF]/20 group-hover:scale-105 transition-transform">
                  <div className={cn("w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-colors relative", isDarkMode ? "bg-[#0a0a0a]" : "bg-white")}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className={cn("font-bold text-xs uppercase", isDarkMode ? "text-white" : "text-black")}>
                        {(user?.displayName || "A")[0]}
                      </span>
                    )}
                  </div>
                </div>
                {/* Status indicator */}
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse", isDarkMode ? "border-[#0a0a0a]" : "border-white", getStatusColor(userStatus))} />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "fixed top-20 right-4 w-72 max-w-[calc(100vw-32px)] md:absolute md:top-full md:right-0 md:mt-4 md:w-72 rounded-[28px] border shadow-2xl p-3 z-50",
                        isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"
                      )}
                    >
                      <div className="space-y-1 p-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Seu Status</p>
                        {[
                          { id: 'online', label: 'Online', color: 'bg-green-500' },
                          { id: 'ocupado', label: 'Ocupado', color: 'bg-red-500' },
                          { id: 'ausente', label: 'Ausente', color: 'bg-yellow-500' }
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => {
                              updatePresenceStatus(st.id);
                              setShowProfileMenu(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-2.5 rounded-xl transition-all",
                              userStatus === st.id ? "bg-[#BF76FF]/10 text-[#BF76FF]" : isDarkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-600 hover:bg-black/5"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", st.color)} />
                              <span className="text-xs font-bold">{st.label}</span>
                            </div>
                            {userStatus === st.id && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>

                      <div className="p-1 mt-2 pt-2 border-t border-white/5">
                        <button 
                          onClick={logout}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-xl text-red-500 transition-all",
                            isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-50/10"
                          )}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-xs font-bold">Encerrar Sessão</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 p-2 md:p-8 pb-32 md:pb-8 overflow-y-auto scroll-smooth scrollbar-hide overscroll-contain touch-pan-y">
          <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-8">
            {isEditing ? (
              <Card className={cn("border-white/5 rounded-3xl p-4 md:p-10 shadow-2xl transition-all", isDarkMode ? "bg-[#111]" : "bg-white border-black/5")}>
                <div className="space-y-8">
                  {isReadOnly && activeTab === "agenda-direcao" ? (
                    <div className="mb-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsEditing(false)}
                        className="pl-0 text-gray-500 hover:text-[#BF76FF] hover:bg-transparent uppercase tracking-[0.2em] text-[10px] font-bold"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center">
                        <Edit className="w-6 h-6 text-[#BF76FF]" />
                      </div>
                        <h4 className={cn("text-2xl md:text-3xl font-black tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black")}>
                          {isReadOnly ? "Visualizar" : selectedItem ? "Editar" : "Novo"} {activeTab === 'eventos' ? 'Evento' : activeTab === 'musica' ? 'Música' : activeTab === 'membros' ? 'Membro' : activeTab === 'agenda-direcao' ? 'Compromisso' : 'Agenda'}
                        </h4>
                    </div>
                  )}

                  {/* Pending Member Approval UI */}
                  {activeTab === "membros" && selectedItem?.status === "pending" && (
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
                  
                  {activeTab === "agenda-direcao" && (
                    isReadOnly ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10 py-4"
                      >
                        {/* Header Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-[2px] w-8 bg-[#BF76FF]" />
                            <p className="text-[#BF76FF] font-black uppercase tracking-[0.2em] text-[10px]">Agenda da Direção</p>
                          </div>
                          <h3 className={cn("text-4xl md:text-6xl font-black tracking-tighter transition-colors leading-[0.9]", isDarkMode ? "text-white" : "text-black")}>
                            {formData.title}
                          </h3>
                        </div>

                        {/* Info Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                          <div className={cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm")}>
                             <div>
                               <Calendar className="w-5 h-5 text-[#BF76FF] mb-4" />
                               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Data</p>
                             </div>
                             <p className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-black")}>
                               {(() => {
                                 try {
                                   return typeof formData.date === 'string' && formData.date ? format(parseISO(formData.date.split('T')[0]), 'dd/MM/yyyy') : '...';
                                 } catch(e) {
                                   return '...';
                                 }
                               })()}
                             </p>
                          </div>
                          <div className={cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm")}>
                             <div>
                               <Clock className="w-5 h-5 text-[#BF76FF] mb-4" />
                               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Horário</p>
                             </div>
                             <p className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-black")}>
                               {typeof formData.date === 'string' && formData.date.includes('T') && formData.date.split('T')[1] 
                                 ? `${formData.date.split('T')[1].substring(0, 5)} às ${formData.endTime || '...'}` 
                                 : 'Horário não definido'}
                             </p>
                          </div>
                          <div className={cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm")}>
                             <div>
                               <Users className="w-5 h-5 text-[#BF76FF] mb-4" />
                               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Organização</p>
                             </div>
                             <p className={cn("text-xl font-black truncate", isDarkMode ? "text-white" : "text-black")}>
                               {formData.organizer || "Igreja Local"}
                             </p>
                          </div>
                        </div>

                        {/* Location Section */}
                        {formData.location && (
                          <div className={cn("p-8 md:p-10 rounded-[40px] border relative overflow-hidden group transition-all", isDarkMode ? "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/5" : "bg-gradient-to-br from-gray-50 to-white border-black/5 shadow-inner")}>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Localização do Evento</p>
                                </div>
                                <p className={cn("text-xl md:text-3xl font-black max-w-xl leading-tight tracking-tight", isDarkMode ? "text-white" : "text-black")}>
                                  {formData.location}
                                </p>
                              </div>
                              <Button 
                                 onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`, '_blank')}
                                 className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full h-16 md:h-20 px-8 md:px-12 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 shadow-2xl shadow-[#BF76FF]/40 transition-all hover:scale-105 active:scale-95"
                              >
                                 Abrir no GPS <MapPin className="w-5 h-5" />
                              </Button>
                            </div>
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-[#BF76FF]/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#BF76FF]/3 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
                          </div>
                        )}

                        {/* Invited Members Section */}
                        {(formData.invitedMembers?.length > 0) && (
                          <div className="space-y-8 py-6">
                             <div className="flex items-center gap-6">
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] whitespace-nowrap">Quem estará presente</h5>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                             </div>
                             
                             <div className="flex flex-wrap gap-x-8 gap-y-10">
                                {formData.invitedMembers.map((m: any) => (
                                  <div key={m.id} className="flex flex-col items-center gap-4 group">
                                     <div className="relative">
                                       <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] border-2 border-white/5 p-1.5 transition-all duration-500 group-hover:border-[#BF76FF] group-hover:rotate-6 rotate-[-3deg] bg-white/5">
                                          <div className="w-full h-full rounded-[1.6rem] bg-gray-200 overflow-hidden shadow-2xl border border-white/10">
                                            {m.photo ? (
                                              <img src={m.photo} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                 <Users className="w-10 h-10" />
                                              </div>
                                            )}
                                          </div>
                                       </div>
                                       <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-4 border-[#111] z-10 hidden md:block" />
                                     </div>
                                     <div className="text-center space-y-0.5">
                                       <p className={cn("text-[11px] font-black uppercase tracking-[0.15em] transition-colors", isDarkMode ? "text-white group-hover:text-[#BF76FF]" : "text-black")}>
                                         {m.name}
                                       </p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}

                        {/* Notes & Extra Info */}
                        {(formData.additionalInfo || formData.observations) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 pt-12 border-t border-white/5">
                             {formData.additionalInfo && (
                               <div className="space-y-4">
                                 <div className="flex items-center gap-2">
                                   <div className="w-1 h-1 rounded-full bg-[#BF76FF]" />
                                   <h6 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Contatos e Infos</h6>
                                 </div>
                                 <div className={cn("p-8 rounded-[32px] text-sm leading-relaxed font-medium md:min-h-[160px]", isDarkMode ? "bg-white/5 text-gray-400" : "bg-gray-50 text-gray-600 shadow-sm")}>
                                    {formData.additionalInfo}
                                 </div>
                               </div>
                             )}
                             {formData.observations && (
                               <div className="space-y-4">
                                 <div className="flex items-center gap-2">
                                   <div className="w-1 h-1 rounded-full bg-[#BF76FF]" />
                                   <h6 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Observações Importantes</h6>
                                 </div>
                                 <div className={cn("p-8 rounded-[32px] text-sm leading-relaxed italic md:min-h-[160px] border border-dashed border-[#BF76FF]/20", isDarkMode ? "bg-[#BF76FF]/5 text-[#BF76FF]/80" : "bg-purple-50 text-[#BF76FF]")}>
                                    "{formData.observations}"
                                 </div>
                               </div>
                             )}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Qual é o compromisso?</label>
                            <Input 
                              className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                              placeholder="Ex: Visitar igreja no Grama"
                              value={formData.title || ""}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                              readOnly={isReadOnly}
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data e Horário</label>
                              <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 space-y-1">
                                  <p className="text-[10px] text-gray-400 ml-2 uppercase font-bold">Data</p>
                                  <Input 
                                    type="date"
                                    className={cn("border-none h-14 rounded-2xl px-6 transition-colors w-full", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")}
                                    value={typeof formData.date === 'string' ? formData.date.split('T')[0] : ""}
                                    onChange={(e) => {
                                      const time = typeof formData.date === 'string' && formData.date.includes('T') ? formData.date.split('T')[1] : "";
                                      setFormData({...formData, date: time ? `${e.target.value}T${time}` : e.target.value});
                                    }}
                                    readOnly={isReadOnly}
                                  />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-[10px] text-gray-400 ml-2 uppercase font-bold">Início</p>
                                  <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF76FF] z-10" />
                                    <Input 
                                      type="time"
                                      className={cn("border-none h-14 rounded-2xl pl-10 pr-4 transition-colors w-full", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")}
                                      value={typeof formData.date === 'string' && formData.date.includes('T') ? formData.date.split('T')[1]?.substring(0, 5) : ""}
                                      onChange={(e) => {
                                        const date = typeof formData.date === 'string' ? formData.date.split('T')[0] : format(new Date(), "yyyy-MM-dd");
                                        setFormData({...formData, date: `${date}T${e.target.value}`});
                                      }}
                                      readOnly={isReadOnly}
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-[10px] text-gray-400 ml-2 uppercase font-bold">Término</p>
                                  <Input 
                                    type="time"
                                    className={cn("border-none h-14 rounded-2xl px-6 transition-colors w-full", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")}
                                    value={formData.endTime || ""}
                                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                    readOnly={isReadOnly}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quem está organizando?</label>
                              <Input 
                                className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                                placeholder="Ex: Igreja que convidou, nossa igreja"
                                value={formData.organizer || ""}
                                onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                                readOnly={isReadOnly}
                              />
                            </div>
                          </div>

                          <div className="space-y-4 p-6 rounded-2xl border border-[#BF76FF]/20 bg-[#BF76FF]/5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Deve convidar a igreja?</label>
                                <p className="text-[10px] text-gray-400">Marque se os membros devem ser informados/convidados</p>
                              </div>
                              <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                                <button 
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => setFormData({...formData, inviteChurch: false, invitedMembers: []})}
                                  className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", !formData.inviteChurch ? "bg-red-500 text-white shadow-lg" : "text-gray-500")}
                                >
                                  Não, será restrito
                                </button>
                                <button 
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => setFormData({...formData, inviteChurch: true})}
                                  className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", formData.inviteChurch ? "bg-green-500 text-white shadow-lg" : "text-gray-500")}
                                >
                                  Sim, será aberto
                                </button>
                              </div>
                            </div>

                            {(formData.inviteChurch || (formData.invitedMembers?.length > 0)) && (
                              <div className="pt-4 border-t border-[#BF76FF]/10">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsMemberSelectorOpen(true)}
                                  className={cn("w-full border-dashed border-2 py-8 rounded-2xl flex flex-col gap-2 transition-all", isDarkMode ? "border-white/10 hover:border-[#BF76FF] bg-white/5" : "border-black/10 hover:border-[#BF76FF] bg-black/5")}
                                >
                                  <Plus className="w-6 h-6 text-[#BF76FF]" />
                                    <span className={cn("text-xs font-bold", isDarkMode ? "text-white" : "text-black")}>
                                      {formData.invitedMembers?.length > 0 
                                        ? `${formData.invitedMembers.length} membros convidados` 
                                        : "Clique para marcar os membros que deseja que esteja presente"}
                                    </span>
                                  </Button>

                                  {formData.invitedMembers?.length > 0 && (
                                    <div className="mt-4 px-2">
                                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Membros selecionados:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {(formData.invitedMembers || []).map((m: any) => (
                                          <div key={m.id} className="flex items-center gap-2 bg-[#BF76FF]/10 px-3 py-1.5 rounded-full border border-[#BF76FF]/20 group relative">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                              {m.photo ? <img src={m.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users className="w-3 h-3 m-1 text-gray-500" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-[#BF76FF]">{m.name}</span>
                                            {!isReadOnly && (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const filtered = formData.invitedMembers.filter((item: any) => item.id !== m.id);
                                                  setFormData({...formData, invitedMembers: filtered});
                                                }}
                                                className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                              >
                                                <X className="w-2 h-2" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                
                                <Dialog open={isMemberSelectorOpen} onOpenChange={setIsMemberSelectorOpen}>
                                  <DialogContent className={cn("sm:max-w-2xl p-0 overflow-hidden flex flex-col rounded-[32px] border", isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10")}>
                                    <div className="p-8 border-b border-white/5">
                                      <h3 className={cn("text-xl font-black uppercase tracking-tighter mb-4", isDarkMode ? "text-white" : "text-black")}>Convidar Membros</h3>
                                      <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input 
                                          className={cn("pl-10 h-12 rounded-xl border-none", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black")}
                                          placeholder="Buscar membros..."
                                          value={memberSearch}
                                          onChange={(e) => setMemberSearch(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-2 scrollbar-hide">
                                      {(members || [])
                                        .filter(m => m.name?.toLowerCase().includes(memberSearch.toLowerCase()))
                                        .map(member => {
                                          const isChecked = (formData.invitedMembers || []).some((m: any) => m.id === member.id);
                                          return (
                                            <div 
                                              key={member.id}
                                              onClick={() => {
                                                const current = formData.invitedMembers || [];
                                                if (isChecked) {
                                                  setFormData({ ...formData, invitedMembers: current.filter((m: any) => m.id !== member.id) });
                                                } else {
                                                  setFormData({ ...formData, invitedMembers: [...current, { id: member.id, name: member.name, photo: member.photoURL }] });
                                                }
                                              }}
                                              className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border",
                                                isChecked 
                                                  ? "bg-[#BF76FF]/10 border-[#BF76FF]/30" 
                                                  : isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-black/5 hover:bg-gray-100"
                                              )}
                                            >
                                              <div className="flex items-center gap-3">
                                                {member.photoURL ? (
                                                  <img src={member.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    <Users className="w-5 h-5" />
                                                  </div>
                                                )}
                                                <div>
                                                  <p className={cn("text-xs font-bold", isDarkMode ? "text-white" : "text-black")}>{member.name}</p>
                                                  <p className="text-[10px] text-gray-500">{member.role || "Membro"}</p>
                                                </div>
                                              </div>
                                              {isChecked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                            </div>
                                          );
                                        })}
                                    </div>
                                    <div className="p-6 bg-black/5 dark:bg-white/5 flex justify-end">
                                      <Button 
                                        className="bg-[#BF76FF] hover:bg-[#8E44AD] text-white font-bold rounded-xl"
                                        onClick={() => setIsMemberSelectorOpen(false)}
                                      >
                                        Confirmar ({formData.invitedMembers?.length || 0})
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Local</label>
                            <div className="relative group">
                              <Input 
                                className={cn("border-none h-14 rounded-2xl px-6 pr-14 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                                placeholder="R. Cleonice Rainho, 19 - Aeroporto, Juiz de Fora - MG"
                                value={formData.location || ""}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 px-2 italic">O endereço se tornará um link clicável para o Google Maps automaticamente.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informações adicionais (Contatos)</label>
                              <Textarea 
                                className={cn("border-none min-h-[100px] rounded-2xl p-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                                placeholder="Ex: Contato de quem está organizando, contato da mídia da outra igreja..."
                                value={formData.additionalInfo || ""}
                                onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações</label>
                              <Textarea 
                                className={cn("border-none min-h-[100px] rounded-2xl p-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                                placeholder="Ex: Observações de horário, estacionamento e outros detalhes..."
                                value={formData.observations || ""}
                                onChange={(e) => setFormData({...formData, observations: e.target.value})}
                                readOnly={isReadOnly}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )
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
                        <Input 
                          className="bg-[#1a1a1a] border-none h-14 rounded-2xl px-6 text-white" 
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={formData.image || ""}
                          onChange={(e) => setFormData({...formData, image: e.target.value})}
                          readOnly={isReadOnly}
                        />
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
                          className={cn("border-none min-h-[150px] rounded-2xl p-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
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
                                if (formData.date.includes('T')) {
                                  const parts = formData.date.split('T');
                                  setTempDate(parts[0]);
                                  setTempStartTime(parts[1]?.substring(0, 5) || "");
                                  setTempEndTime(formData.endTime || "");
                                } else {
                                  // Fallback for old custom format
                                  const parts = formData.date.split(' - ');
                                  if (parts.length >= 3) {
                                    const dateParts = parts[0].split('/');
                                    if (dateParts.length === 3) {
                                      setTempDate(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                                    }
                                    setTempStartTime(parts[1]);
                                    setTempEndTime(parts[2]);
                                  }
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
                            {formData.date ? (
                              formData.date.includes('T') ? (
                                (() => {
                                  try {
                                    return `${format(parseISO(formData.date), 'dd/MM/yyyy')} - ${formData.date.split('T')[1]?.substring(0, 5)}${formData.endTime ? ` - ${formData.endTime}` : ''}`
                                  } catch (e) { return formData.date; }
                                })()
                              ) : formData.date
                            ) : "Selecionar data e horários"}
                          </Button>

                          <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                                  className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white font-bold"
                                  onClick={() => {
                                    if (tempDate && tempStartTime && tempEndTime) {
                                      const isoDate = `${tempDate}T${tempStartTime}`;
                                      setFormData({ ...formData, date: isoDate, endTime: tempEndTime });
                                      setIsDatePickerOpen(false);
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

                  {activeTab === "membros" && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Foto de Perfil (URL)</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            placeholder="https://exemplo.com/foto.jpg"
                            value={formData.photoURL || ""}
                            onChange={(e) => setFormData({...formData, photoURL: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Foto de Capa (URL)</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            placeholder="https://exemplo.com/capa.jpg"
                            value={formData.coverImage || ""}
                            onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            value={formData.name || ""}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">E-mail</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            value={formData.email || ""}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">WhatsApp (com DDD)</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            placeholder="11999999999"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                          <Input 
                            type="date"
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            value={formData.birthDate || ""}
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data que se tornou membro</label>
                          <Input 
                            type="date"
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            value={formData.joinedDate || ""}
                            onChange={(e) => setFormData({...formData, joinedDate: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Ministérios e Cargos</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allRoles.map(role => {
                            const ministry = (formData.ministries || []).find((m: any) => (typeof m === 'string' ? m : m.name) === role);
                            const isSelected = !!ministry;
                            const isLeader = typeof ministry === 'object' ? ministry.isLeader : false;

                            return (
                              <div key={role} className={cn("p-4 rounded-2xl border flex items-center justify-between transition-all", isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5")}>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isReadOnly}
                                    onChange={(e) => {
                                      const currentMinistries = formData.ministries || [];
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          ministries: [...currentMinistries, { name: role, isLeader: false }]
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          ministries: currentMinistries.filter((m: any) => (typeof m === 'string' ? m : m.name) !== role)
                                        });
                                      }
                                    }}
                                    className="w-5 h-5 rounded border-gray-300 text-[#BF76FF] focus:ring-[#BF76FF] cursor-pointer"
                                  />
                                  <span className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-black")}>{role}</span>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox"
                                      id={`leader-${role}`}
                                      checked={isLeader}
                                      disabled={isReadOnly}
                                      onChange={(e) => {
                                        const currentMinistries = formData.ministries || [];
                                        setFormData({
                                          ...formData,
                                          ministries: currentMinistries.map((m: any) => 
                                            (typeof m === 'string' ? m : m.name) === role ? { name: role, isLeader: e.target.checked } : m
                                          )
                                        });
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-[#BF76FF] focus:ring-[#BF76FF] cursor-pointer"
                                    />
                                    <label htmlFor={`leader-${role}`} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Líder</label>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Habilidades</label>
                        <div className="flex flex-wrap gap-2">
                          {availableSkills.map(skill => {
                            const isSelected = (formData.skills || []).includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => {
                                  const currentSkills = formData.skills || [];
                                  if (isSelected) {
                                    setFormData({ ...formData, skills: currentSkills.filter((s: string) => s !== skill) });
                                  } else {
                                    setFormData({ ...formData, skills: [...currentSkills, skill] });
                                  }
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  isSelected 
                                    ? "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white shadow-lg shadow-[#7300FF]/20" 
                                    : isDarkMode ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                              >
                                {skill}
                              </button>
                            );
                          })}
                        </div>
                        {isMasterAdmin && !isReadOnly && (
                          <div className="flex gap-2 mt-4 max-w-xs">
                            <Input 
                              placeholder="Nova habilidade..."
                              className={cn("border-none h-10 rounded-xl px-4 text-xs transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black")}
                              value={newSkillName}
                              onChange={(e) => setNewSkillName(e.target.value)}
                            />
                            <Button 
                              size="sm"
                              onClick={async () => {
                                if (!newSkillName.trim()) return;
                                if (availableSkills.includes(newSkillName.trim())) {
                                  return;
                                }
                                const newList = [...availableSkills, newSkillName.trim()];
                                try {
                                  await setDoc(doc(db, "settings", "skills"), { list: newList });
                                  setNewSkillName("");
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.WRITE, "settings/skills");
                                }
                              }}
                              className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white rounded-xl font-bold h-10"
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sobre o Membro (Bio)</label>
                        <Textarea 
                          className={cn("border-none min-h-[120px] rounded-2xl p-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                          placeholder="Fale um pouco sobre a jornada, dons e ministérios do membro..."
                          value={formData.bio || ""}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                          readOnly={isReadOnly}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "musica" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Música</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            value={formData.title || ""}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Artista/Ministério</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            placeholder="Ex: Diante do Trono, Fernandinho..."
                            value={formData.artist || ""}
                            onChange={(e) => setFormData({...formData, artist: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Link Direto do Áudio (.mp3)</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
                            placeholder="https://exemplo.com/audio.mp3"
                            value={formData.audioUrl || ""}
                            onChange={(e) => setFormData({...formData, audioUrl: e.target.value})}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Link do YouTube (Opcional)</label>
                          <Input 
                            className={cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black")} 
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
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5 items-stretch sm:items-center">
                            {isReadOnly && activeTab === "agenda-direcao" ? (
                              currentRole !== "Direção" && (
                                <Button 
                                  variant="outline"
                                  className={cn("w-full sm:w-auto rounded-2xl h-12 px-8 font-bold border-none transition-all", isDarkMode ? "bg-white/5 text-white hover:bg-[#BF76FF] hover:text-white" : "bg-gray-100 text-black hover:bg-[#BF76FF] hover:text-white")}
                                  onClick={() => setIsReadOnly(false)}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Editar Compromisso
                                </Button>
                              )
                            ) : !isReadOnly && (
                              <Button 
                                className="w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer disabled:opacity-50 order-1 sm:order-2 sm:ml-auto" 
                                onClick={handleSave}
                                disabled={isSubmitting}
                              >
                                <Save className="w-4 h-4 mr-2" /> {isSubmitting ? "Salvando..." : activeTab === 'agenda-direcao' ? "Salvar Compromisso" : "Salvar"}
                              </Button>
                            )}
                    {!(isReadOnly && activeTab === "agenda-direcao") && (
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "w-full sm:w-auto rounded-2xl h-12 px-8 text-gray-400 cursor-pointer order-2 sm:order-3",
                          isReadOnly && "sm:ml-auto"
                        )} 
                        onClick={() => setIsEditing(false)}
                      >
                        {isReadOnly ? "Voltar" : "Cancelar"}
                      </Button>
                    )}
                    {selectedItem && !isReadOnly && (canDelete || selectedItem.authorId === user?.uid) && (
                      <Button 
                        variant="ghost" 
                        className="w-full sm:w-auto text-red-500 hover:bg-red-500/10 rounded-2xl h-12 px-6 cursor-pointer order-3 sm:order-1"
                        onClick={() => {
                          const col = selectedItem.type === 'post' ? 'posts' : 
                                      selectedItem.type === 'agenda' ? 'agenda' :
                                      activeTab === "eventos" ? "posts" : 
                                      activeTab === "musica" ? "musics" : 
                                      activeTab === "membros" ? "members" : "agenda";
                          handleDelete(selectedItem.id, col);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ) : activeTab === "membros" && !isEditing ? (
              <div className="space-y-6">
                {viewingMember ? (
                  <MemberProfile 
                    member={viewingMember} 
                    isDark={isDarkMode}
                    notifications={notifications}
                    onBack={() => setViewingMember(null)}
                    onEdit={(canEditProfiles || viewingMember.email === user?.email) ? () => {
                      setSelectedItem(viewingMember);
                      setFormData(viewingMember);
                      setIsReadOnly(false);
                      setIsEditing(true);
                      setViewingMember(null);
                    } : undefined}
                    onChat={() => {
                      setViewingMember(null);
                      setRightSidebarView("chat-active");
                      setActiveChatUser(viewingMember);
                    }}
                  />
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <h2 className={cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>
                          {showPending ? "Solicitações de Cadastro" : "Membros da Equipe"}
                        </h2>
                        {(isMasterAdmin || profile?.role === "Desenvolvedor") && pendingMembers.length > 0 && (
                          <button 
                            onClick={() => setShowPending(!showPending)}
                            className={cn(
                              "text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer",
                              showPending 
                                ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" 
                                : isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                            )}>
                            {showPending ? "Ver Membros Ativos" : "Solicitações"}
                            {!showPending && (
                              <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                                {pendingMembers.length}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {!showPending && canEditProfiles && (
                        <Button 
                          className="w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-11 px-6 font-bold truncate"
                          onClick={() => {
                            setSelectedItem(null);
                            setFormData({});
                            setIsReadOnly(false);
                            setIsEditing(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2 shrink-0" /> Novo Membro
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeMembersForDisplay.map(member => (
                        <div key={member.id} className={cn("p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5 shadow-sm")}>
                          <TeamMember 
                            key={member.id}
                            member={member}
                            active={member.email === user?.email}
                            onWhatsApp={() => openWhatsApp(member)}
                            onViewProfile={() => {
                              setViewingMember(member);
                            }}
                            onEditProfile={(canEditProfiles || member.email === user?.email) ? () => {
                              setSelectedItem(member);
                              setFormData(member);
                              setIsReadOnly(false);
                              setIsEditing(true);
                              setViewingMember(null);
                            } : undefined}
                            onDelete={(canDelete || member.email === user?.email) ? () => handleDelete(member.id, "members") : undefined}
                            isDark={isDarkMode}
                            isAdmin={isMasterAdmin || profile?.role === "Desenvolvedor"}
                          />
                        </div>
                      ))}
                      {activeMembersForDisplay.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          {showPending ? "Nenhuma solicitação de cadastro pendente." : "Nenhum membro ativo encontrado."}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === "musica" && !isEditing ? (
              <div className="space-y-6 pb-32">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h2 className={cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>Repertório Musical</h2>
                  {canEdit && (
                    <Button 
                      className="w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-12 px-6 font-bold truncate"
                      onClick={() => {
                        setSelectedItem(null);
                        setFormData({});
                        setIsReadOnly(false);
                        setIsEditing(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2 shrink-0" /> Adicionar música
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map(music => (
                    <div key={music.id} className={cn("p-4 rounded-2xl border transition-colors cursor-pointer relative group", isDarkMode ? "bg-[#1a1a1a] border-white/5 hover:bg-[#222]" : "bg-white border-black/5 hover:bg-gray-50")} onClick={() => handlePlayMusic(music)}>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors", currentPlayingMusic?.id === music.id ? "bg-[#BF76FF] text-white" : "bg-purple-500/10 text-purple-500")}>
                          {currentPlayingMusic?.id === music.id && isPlaying ? <Pause className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{music.title}</h4>
                          <p className="text-xs text-gray-500">{music.artist || "Artista desconhecido"}</p>
                        </div>
                        <button 
                          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(music);
                            setFormData(music);
                            setIsReadOnly(!canEdit);
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      Nenhuma música encontrada.
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "eventos" && !isEditing ? (
              <EventosView 
                events={posts} 
                isDark={isDarkMode}
                canEdit={canEdit}
                canDelete={canDelete}
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
                  handleDelete(item.id, "posts");
                }}
              />
            ) : activeTab === "agenda" ? (
              <CalendarView 
                agenda={mergedAgenda} 
                isDark={isDarkMode}
                canEdit={canEdit}
                canDelete={canDelete}
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
                  const col = item.type === 'post' ? 'posts' : 'agenda';
                  handleDelete(item.id, col);
                }}
              />
            ) : activeTab === "visao-geral" ? (
              <div className="space-y-8 md:space-y-12 flex flex-col">
                {/* Section: Próximos Eventos (Moved Up on Mobile) */}
                <div className="order-1 md:order-2 space-y-6 md:space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className={cn("text-xl md:text-2xl font-black tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black")}>Próximos Eventos</h4>
                  </div>
                  
                  <div className={cn("border rounded-[32px] p-6 md:p-12 transition-colors", isDarkMode ? "bg-[#111]/50 border-white/5" : "bg-white border-black/5 shadow-xl")}>
                    <UpcomingEvents agenda={mergedAgenda} isDark={isDarkMode} />
                    <div className="mt-8 flex justify-center md:hidden">
                      <Button 
                        variant="ghost" 
                        className="w-full h-12 rounded-2xl bg-[#BF76FF]/10 text-[#BF76FF] font-bold text-xs uppercase tracking-widest hover:bg-[#BF76FF]/20 cursor-pointer" 
                        onClick={() => setActiveTab("agenda")}
                      >
                        Ver agenda completa
                      </Button>
                    </div>
                  </div>
                  <div className="hidden md:flex justify-end">
                    <Button variant="ghost" className="text-xs text-[#BF76FF] hover:underline" onClick={() => setActiveTab("agenda")}>
                      Ver agenda completa
                    </Button>
                  </div>
                </div>

                {/* Section: Summary Cards (Moved Down on Mobile) */}
                <div className="order-2 md:order-1 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mt-4">
                  <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-colors flex items-center gap-4", isDarkMode ? "bg-[#111]" : "bg-white shadow-lg border-black/5")}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Membros</p>
                      <h4 className={cn("text-xl md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>{members.length}</h4>
                    </div>
                  </Card>
                  <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-colors flex items-center gap-4", isDarkMode ? "bg-[#111]" : "bg-white shadow-lg border-black/5")}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Agendados</p>
                      <h4 className={cn("text-xl md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>{agenda.length}</h4>
                    </div>
                  </Card>
                  <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-colors flex items-center gap-4", isDarkMode ? "bg-[#111]" : "bg-white shadow-lg border-black/5")}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-[#BF76FF]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mensagens</p>
                      <h4 className={cn("text-xl md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>{displayNotifications.filter(n => !n.read).length}</h4>
                    </div>
                  </Card>
                </div>
              </div>
            ) : activeTab === "agenda-direcao" ? (
              <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h2 className={cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>Agenda da Direção</h2>
                </div>
                <CalendarView 
                  agenda={agendaDirecao.map(a => ({ ...a, type: 'agenda' }))} 
                  isDark={isDarkMode}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  modalTitle="Novo Compromisso"
                  emptyMessage="Não tem compromisso agendados para hoje."
                  newEventButtonLabel="Novo Compromisso"
                  onNewEvent={(date) => {
                    setSelectedItem(null);
                    setFormData({ date: format(date, "yyyy-MM-dd"), inviteChurch: false, invitedMembers: [] });
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
                    handleDelete(item.id, "agenda-direcao");
                  }}
                />
              </div>
            ) : activeTab === "conversas" ? (
              <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h2 className={cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>Conversas</h2>
                </div>
                <Card className={cn("border rounded-[32px] p-8 md:p-12 transition-colors min-h-[500px] flex flex-col items-center justify-center text-center", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl")}>
                   <div className="w-20 h-20 rounded-[28px] bg-[#BF76FF]/10 flex items-center justify-center mb-6 transition-transform hover:rotate-12">
                     <MessageSquare className="w-10 h-10 text-[#BF76FF]" />
                   </div>
                   <h3 className={cn("text-2xl font-black mb-3", isDarkMode ? "text-white" : "text-black")}>O Chat está chegando!</h3>
                   <p className="text-gray-500 text-sm max-w-sm leading-relaxed">Estamos preparando um sistema de mensagens robusto para que toda a liderança e membros possam se comunicar diretamente aqui no dashboard.</p>
                   <div className="mt-8 flex gap-3">
                     <div className="px-4 py-2 rounded-full bg-[#BF76FF]/10 text-[#BF76FF] text-[10px] font-bold uppercase tracking-widest">Tempo Real</div>
                     <div className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest">Privacidade</div>
                   </div>
                </Card>
              </div>
            ) : activeTab === "config" ? (
              <div className="p-4 md:p-8">
                <Card className={cn("border rounded-3xl p-4 md:p-8 transition-colors", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl")}>
                  <div className="space-y-6">
                    <h4 className={cn("text-2xl font-bold mb-4 transition-colors", isDarkMode ? "text-white" : "text-black")}>Configurações do Site</h4>
                    
                    <div className="space-y-4">
                      <div className={cn("flex items-center justify-between p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5")}>
                        <div>
                          <h5 className={cn("font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>Vídeos no Header (Início)</h5>
                          <p className="text-sm text-gray-400">Ativa ou desativa a reprodução automática de vídeos no topo da página inicial.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.enableHeaderVideos ?? true}
                            onChange={async (e) => {
                              const newValue = e.target.checked;
                              try {
                                await setDoc(doc(db, "settings", "general"), { enableHeaderVideos: newValue }, { merge: true });
                              } catch (error) {
                                handleFirestoreError(error, OperationType.WRITE, "settings/general");
                              }
                            }}
                          />
                          <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#BF76FF]"></div>
                        </label>
                      </div>
                    </div>

                    <div className={cn("pt-8 border-t transition-colors", isDarkMode ? "border-white/5" : "border-black/5")}>
                      <h4 className={cn("text-xl font-bold mb-6 transition-colors", isDarkMode ? "text-white" : "text-black")}>Permissões por Cargo</h4>
                      <div className="space-y-4">
                        {allRoles.map(role => (
                          <div key={role} className={cn("p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5")}>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-bold text-[#BF76FF]">{role === "Administradores" ? "Administrador Master" : role}</h5>
                            </div>
                            <div className="space-y-6">
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Ações Disponíveis</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                  { label: "Criar/Editar", key: "edit" },
                                  { label: "Excluir", key: "delete" },
                                  { label: "Gerenciar Perfis", key: "editProfiles" }
                                ].map(perm => {
                                  let defaultPerm = true;
                                  if (perm.key === "editProfiles") {
                                    defaultPerm = role === "Administradores" || role === "Desenvolvedor";
                                  } else {
                                    defaultPerm = !["Membro", "Visitante"].includes(role);
                                  }
                                  const isChecked = settings.permissions?.[role]?.[perm.key] ?? defaultPerm;
                                  return (
                                    <div key={perm.key} className={cn("flex items-center justify-between p-3 rounded-xl transition-colors", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                                      <span className="text-xs text-gray-400">{perm.label}</span>
                                      <label className="relative inline-flex items-center cursor-pointer scale-75">
                                        <input 
                                          type="checkbox" 
                                          className="sr-only peer" 
                                          checked={isChecked}
                                          onChange={async (e) => {
                                            const newValue = e.target.checked;
                                            const newPermissions = {
                                              ...settings.permissions,
                                              [role]: {
                                                ...(settings.permissions?.[role] || { 
                                                  edit: !["Membro", "Visitante"].includes(role), 
                                                  delete: !["Membro", "Visitante"].includes(role), 
                                                  editProfiles: role === "Administradores" || role === "Desenvolvedor", 
                                                  tabs: {} 
                                                }),
                                                [perm.key]: newValue
                                              }
                                            };
                                            try {
                                              await setDoc(doc(db, "settings", "general"), { permissions: newPermissions }, { merge: true });
                                            } catch (error) {
                                              handleFirestoreError(error, OperationType.WRITE, "settings/general");
                                            }
                                          }}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BF76FF]"></div>
                                      </label>
                                    </div>
                                  );
                                })}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Páginas Visíveis</span>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  {[
                                    { label: "Início", key: "visao-geral" },
                                    { label: "Eventos", key: "eventos" },
                                    { label: "Música", key: "musica" },
                                    { label: "Membros", key: "membros" },
                                    { label: "Agenda", key: "agenda" },
                                    { label: "Agen. Direção", key: "agenda-direcao" }
                                  ].map(tab => {
                                    
                                    const defaultVals: any = {
                                      "visao-geral": true,
                                      "eventos": !["Membro", "Visitante"].includes(role),
                                      "musica": !["Membro", "Visitante"].includes(role),
                                      "membros": !["Membro", "Visitante"].includes(role),
                                      "agenda": !["Membro", "Visitante"].includes(role),
                                      "agenda-direcao": role === "Administradores" || role === "Desenvolvedor"
                                    };
                                    
                                    const isChecked = settings.permissions?.[role]?.tabs?.[tab.key] ?? defaultVals[tab.key];
                                    return (
                                      <button
                                        key={tab.key}
                                        onClick={async () => {
                                          const newPermissions = {
                                            ...settings.permissions,
                                            [role]: {
                                              ...(settings.permissions?.[role] || { edit: true, delete: true, tabs: {} }),
                                              tabs: {
                                                ...(settings.permissions?.[role]?.tabs || {}),
                                                [tab.key]: !isChecked
                                              }
                                            }
                                          };
                                          try {
                                            await setDoc(doc(db, "settings", "general"), { permissions: newPermissions }, { merge: true });
                                          } catch (error) {
                                            handleFirestoreError(error, OperationType.WRITE, "settings/general");
                                          }
                                        }}
                                        className={cn(
                                          "px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                                          isChecked 
                                            ? "bg-[#BF76FF]/10 text-[#BF76FF] border-[#BF76FF]/30 shadow-lg shadow-[#BF76FF]/10" 
                                            : "bg-transparent text-gray-500 border-gray-700 hover:border-gray-500"
                                        )}
                                      >
                                        {tab.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-10 h-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-white">Selecione um item para editar</h4>
                <p className="text-gray-400">Ou clique no botão "Novo Item" para criar um novo registro.</p>
                {canEdit && (
                  <Button 
                    className="mt-6 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-12 px-8 font-bold cursor-pointer"
                    onClick={() => {
                      setSelectedItem(null);
                      setFormData({});
                      setIsReadOnly(false);
                      setIsEditing(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Novo Item
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Linear Design Music Player (Global) */}
        <AnimatePresence>
          {currentPlayingMusic && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className={cn(
                "fixed bottom-20 left-4 right-4 lg:left-[calc(260px+2rem)] lg:right-[calc(320px+2rem)] z-50 p-4 rounded-[28px] border shadow-2xl flex items-center gap-4 transition-all duration-500",
                isDarkMode ? "bg-[#111] border-white/10" : "bg-white border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-[#BF76FF] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#BF76FF]/20">
                <Music className={cn("w-6 h-6", isPlaying && "animate-spin-slow")} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-black truncate uppercase tracking-widest mb-0.5", isDarkMode ? "text-white" : "text-black")}>{currentPlayingMusic.title}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{currentPlayingMusic.artist || 'Artista Desconhecido'}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-[#BF76FF]/10 hover:text-[#BF76FF]"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-red-500 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlaying(false);
                    setCurrentPlayingMusic(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sidebar 3: Stats & Files (Hidden on mobile/tablets, only permanent on XL) */}
      <aside className={cn(
        "fixed top-14 bottom-20 right-0 z-[40] w-full xl:top-0 xl:bottom-0 xl:z-auto xl:w-80 border-l flex-col overflow-hidden transition-all duration-300 xl:relative xl:flex",
        rightSidebarView !== "hidden" ? "translate-x-0 flex" : "translate-x-full xl:translate-x-0 hidden xl:flex",
        isDarkMode ? "bg-[#0f0f0f] border-white/5" : "bg-white lg:bg-gray-50 border-black/5"
      )}>

        <div className="flex justify-between xl:justify-end items-center p-6 pb-4 shrink-0 border-b border-black/5 dark:border-white/5">
           <div className="xl:hidden">
            <button onClick={() => setRightSidebarView("hidden")} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-gray-500">
              <X className="w-5 h-5" />
            </button>
           </div>
           <div className="flex gap-2">
            <ActionIcon 
              icon={isDarkMode ? Sun : Moon} 
              onClick={() => setIsDarkMode(!isDarkMode)}
              active={false}
              isDark={isDarkMode}
            />
            <ActionIcon 
              icon={MessageSquare} 
              active={rightSidebarView !== "team"}
              onClick={() => setRightSidebarView("chat-list")}
              isDark={isDarkMode} 
            />
            {currentRole !== "Direção" && (
              <ActionIcon 
                icon={Users} 
                active={rightSidebarView === "team"}
                onClick={() => setRightSidebarView("team")}
                isDark={isDarkMode} 
              />
            )}
          </div>
        </div>

        {rightSidebarView === "team" && (
          <div className="flex-1 px-6 pt-4 overflow-y-auto scrollbar-hide flex flex-col">
            <div className="space-y-8 flex-1">
              {/* Members/Team Section */}
              <div>
                <div className="mb-6 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar membro..." 
                    value={rightSidebarSearch}
                    onChange={(e) => setRightSidebarSearch(e.target.value)}
                    className={cn("w-full border-none rounded-2xl py-3 pl-10 pr-4 text-sm outline-none transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white focus:ring-1 focus:ring-[#BF76FF]/30" : "bg-gray-100 text-black focus:ring-1 focus:ring-[#BF76FF]/50")}
                  />
                </div>
                
                <div className="space-y-8">
                  {allRoles.filter(r => r !== "Membro" && r !== "Administradores" && r !== "Visitante").map(role => {
                    const roleMembers = members.filter(m => {
                      const ministry = (m.ministries || []).find((min: any) => (typeof min === 'string' ? min : min.name) === role);
                      const isLeaderOfThisRole = typeof ministry === 'object' ? ministry.isLeader : (m.role === role && m.isLeader);
                      return isLeaderOfThisRole && (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
                    });
                    if (roleMembers.length === 0 && rightSidebarSearch) return null;
                    return (
                      <div key={role} className="space-y-3">
                        <h5 className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                          <div className="w-1 h-2 bg-[#BF76FF] rounded-full" />
                          {role === "Administradores" ? "Administrador Master" : role}
                        </h5>
                        <div className="space-y-4">
                          {roleMembers.length > 0 ? (
                            roleMembers.slice(0, rightSidebarSearch ? undefined : 3).map(member => (
                              <TeamMember 
                                key={member.id} 
                                member={member}
                                active={member.email === user?.email}
                                onWhatsApp={() => openWhatsApp(member)}
                                onViewProfile={() => {
                                  setActiveTab("membros");
                                  setViewingMember(member);
                                }}
                                onDelete={() => handleDelete(member.id, "members")}
                                isDark={isDarkMode}
                              />
                            ))
                          ) : (
                            <p className={cn("text-[10px] italic pl-3", isDarkMode ? "text-gray-600" : "text-gray-400")}>Nenhum líder cadastrado</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Others in Sidebar 3 */}
                  {(() => {
                    const standardMembers = members.filter(m => {
                      const isAnyLeader = (m.ministries || []).some((min: any) => typeof min === 'object' && min.isLeader) || m.isLeader;
                      const isVisitor = (m.role === "Visitante" || (m.ministries || []).some((min: any) => (typeof min === 'string' ? min : min.name) === "Visitante"));
                      return !isAnyLeader && !isVisitor && (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
                    });
                    if (standardMembers.length === 0) return null;
                    return (
                      <div className="space-y-3">
                        <h5 className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                          <div className="w-1 h-2 bg-gray-600 rounded-full" />
                          Membros
                        </h5>
                        <div className="space-y-4">
                          {standardMembers.slice(0, rightSidebarSearch ? undefined : 5).map(member => (
                            <TeamMember 
                              key={member.id} 
                              member={member}
                              active={member.email === user?.email}
                              onWhatsApp={() => openWhatsApp(member)}
                              onViewProfile={() => {
                                setActiveTab("membros");
                                setViewingMember(member);
                              }}
                              onDelete={() => handleDelete(member.id, "members")}
                              isDark={isDarkMode}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Visitors in Sidebar 4 */}
                  {(() => {
                    const visitors = members.filter(m => {
                      const isVisitor = (m.role === "Visitante" || (m.ministries || []).some((min: any) => (typeof min === 'string' ? min : min.name) === "Visitante"));
                      return isVisitor && (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
                    });
                    if (visitors.length === 0) return null;
                    return (
                      <div className={cn("space-y-3 mt-6 pt-6 border-t", isDarkMode ? "border-white/5" : "border-black/5")}>
                        <h5 className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-blue-400")}>
                          <div className="w-1 h-2 bg-blue-400 rounded-full" />
                          Visitantes
                        </h5>
                        <div className="space-y-4">
                          {visitors.map(member => (
                            <TeamMember 
                              key={member.id} 
                              member={member}
                              active={member.email === user?.email}
                              onWhatsApp={() => openWhatsApp(member)}
                              onViewProfile={() => {
                                setActiveTab("membros");
                                setViewingMember(member);
                              }}
                              onDelete={() => handleDelete(member.id, "members")}
                              isDark={isDarkMode}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {rightSidebarView === "chat-list" && (
          <div className={cn("flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-[#0f0f0f]" : "bg-white lg:bg-gray-50")}>
            <div className="p-6 pt-4 pb-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className={cn("text-2xl font-black", isDarkMode ? "text-white" : "text-black")}>Mensagens</h2>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 scrollbar-hide">
              {activeChats.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 mt-10">
                    <MessageSquare className="w-12 h-12 mb-4 mx-auto" />
                    <p className="text-sm font-medium">Você não tem mensagens</p>
                 </div>
              ) : (
                activeChats.map((chat, i) => {
                  const otherUserId = chat.participants?.find((p: string) => p !== profile?.id) || "";
                  const m = members.find(member => member.id === otherUserId);
                  if (!m) return null;
                  return (
                    <div key={chat.id} onClick={() => openWhatsApp(m)} className="flex items-center gap-4 p-3 mb-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                      <div className="relative shrink-0">
                        {m.photoURL ? (
                          <img src={m.photoURL} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-xl font-bold flex items-center justify-center text-[#BF76FF]">
                            {m.name?.[0] || 'M'}
                          </div>
                        )}
                        {(m.status_presence === "online" || m.status_presence === "ocupado") && (
                          <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-white dark:border-[#0f0f0f] rounded-full", getStatusColor(m.status_presence))} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className={cn("font-bold text-sm truncate", isDarkMode ? "text-white" : "text-black")}>{m.name || 'Membro'}</h4>
                          {chat.unreadCount?.[profile?.id || ''] > 0 && (
                            <div className="bg-[#BF76FF] text-white text-[10px] font-black h-5 px-2 rounded-full flex items-center justify-center gap-1 animate-pulse shadow-sm shadow-[#BF76FF]/40">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{chat.unreadCount[profile?.id || '']}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate font-medium flex items-center gap-1">
                          {chat.lastMessage || "Toque para abrir a conversa"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {rightSidebarView === "chat-active" && activeChatUser && (
          <div className={cn("flex-1 flex flex-col relative overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-[#0f0f0f]" : "bg-white lg:bg-gray-50")}>
            {/* Header */}
            <div className={cn("px-5 py-4 border-b flex items-center justify-between shadow-sm z-10 shrink-0", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5")}>
              <div className="flex items-center gap-3">
                <button onClick={() => setRightSidebarView("chat-list")} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors mr-1">
                  <ArrowLeft className={cn("w-5 h-5", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                </button>
                <div className="relative shrink-0">
                  {activeChatUser.photoURL ? (
                    <img src={activeChatUser.photoURL} className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5 text-lg font-bold flex items-center justify-center text-[#BF76FF]">
                      {activeChatUser.name?.[0] || 'M'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#111] rounded-full" />
                </div>
                <div className="flex flex-col relative top-0.5">
                  <h3 className={cn("font-extrabold text-[15px] leading-tight", isDarkMode ? "text-white" : "text-gray-900")}>{activeChatUser.name || 'Membro'}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 flex flex-col scrollbar-hide min-h-0">
               {chatMessages.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <MessageSquare className="w-12 h-12 mb-4" />
                    <p className="text-sm">Envie uma mensagem para iniciar a conversa.</p>
                 </div>
               ) : (
                 chatMessages.map(msg => {
                   const isMe = msg.senderId === profile?.id;
                   return (
                     <div 
                       key={msg.id}
                       className={cn(
                         "p-3 px-4 rounded-2xl w-max max-w-[85%] shadow-sm",
                         isMe 
                           ? "bg-gradient-to-r from-[#BF76FF] to-[#A05ADB] text-white rounded-tr-sm self-end ml-auto" 
                           : isDarkMode 
                              ? "bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-sm self-start mr-auto" 
                              : "bg-white border border-black/5 text-gray-800 rounded-tl-sm self-start mr-auto"
                       )}
                     >
                       {renderMessageWithMentions(msg.text)}
                     </div>
                   );
                 })
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn("p-4 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] relative", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-t border-black/5")}>
              {/* Mention Suggestions */}
              {showMentionSuggestions && (
                <div className={cn(
                  "absolute bottom-full left-4 mb-2 min-w-[200px] max-h-48 overflow-y-auto rounded-2xl shadow-xl z-[100] border p-1",
                  isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
                )}>
                  {members
                    .filter(m => m.name?.toLowerCase().includes(mentionSearch.toLowerCase()))
                    .slice(0, 5)
                    .map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          const lastAtIndex = chatInput.lastIndexOf('@');
                          const beforeAt = chatInput.substring(0, lastAtIndex);
                          setChatInput(`${beforeAt}@{${m.name}} `);
                          setShowMentionSuggestions(false);
                          setMentionSearch("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors",
                          isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                          {m.photoURL ? (
                            <img src={m.photoURL} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[#BF76FF]">{m.name?.[0]}</span>
                          )}
                        </div>
                        <span className={cn("text-xs font-bold truncate", isDarkMode ? "text-gray-200" : "text-gray-900")}>
                          {m.name}
                        </span>
                      </button>
                    ))
                  }
                  {members.filter(m => m.name?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                    <div className="p-3 text-[10px] text-center opacity-50 italic">Nenhum membro encontrado</div>
                  )}
                </div>
              )}

              <div className={cn("flex items-end gap-2 p-1.5 pl-3 rounded-3xl transition-transform focus-within:-translate-y-1", isDarkMode ? "bg-white/5 focus-within:bg-white/10" : "bg-gray-100 focus-within:bg-gray-200")}>
                <textarea 
                  rows={1}
                  placeholder="Mensagem..." 
                  value={chatInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChatInput(val);
                    
                    const lastAtIndex = val.lastIndexOf('@');
                    if (lastAtIndex !== -1) {
                      const textAfterAt = val.substring(lastAtIndex + 1);
                      // Only show suggestions if '@' is in the last word or if typing a potential name
                      if (!textAfterAt.includes('\n')) {
                        setMentionSearch(textAfterAt);
                        setShowMentionSuggestions(true);
                      } else {
                        setShowMentionSuggestions(false);
                      }
                    } else {
                      setShowMentionSuggestions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  className={cn("flex-1 bg-transparent border-none outline-none text-sm py-3 px-1 resize-none max-h-32 scrollbar-hide", isDarkMode ? "text-white" : "text-black")} 
                  onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = (e.currentTarget.scrollHeight) + 'px';
                  }}
                />
                <button 
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 shrink-0 bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center justify-center mb-0.5 cursor-pointer"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className={cn("border rounded-[32px] p-8 max-w-sm transition-colors", isDarkMode ? "bg-[#111] border-white/10 text-white" : "bg-white border-black/10 text-black")}>
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-6 pt-4">
            <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Você tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-2xl h-12 px-6 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 px-6 font-bold cursor-pointer"
                onClick={executeDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <audio 
        ref={audioRef}
        key={currentPlayingMusic?.id}
        src={currentPlayingMusic?.audioUrl || undefined}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}

function SidebarItem({ icon: Icon, active, onClick, label, collapsed, isDark, mobile, notificationCount }: { icon: any, active?: boolean, onClick: () => void, label: string, collapsed?: boolean, isDark?: boolean, mobile?: boolean, notificationCount?: number }) {
  if (mobile) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all relative shrink-0",
          active 
            ? isDark ? "text-white" : "text-[#BF76FF]" 
            : isDark ? "text-gray-500" : "text-gray-400"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative",
          active 
            ? isDark ? "bg-white/10 text-white" : "bg-[#BF76FF]/10 text-[#BF76FF]" 
            : "bg-transparent"
        )}>
          <Icon className="w-6 h-6" />
          {notificationCount ? (
             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-md border border-white dark:border-[#0a0a0a]">
               {notificationCount}
             </span>
          ) : null}
        </div>
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-tighter transition-all",
          active ? isDark ? "text-white" : "text-black" : "text-gray-500"
        )}>
          {label}
        </span>
        {active && (
          <motion.div 
            layoutId="mobile-active-dot"
            className="absolute -top-1 w-1 h-1 rounded-full bg-[#BF76FF]"
          />
        )}
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-all relative group overflow-hidden",
        active 
          ? isDark 
            ? "bg-gradient-to-r from-white/[0.08] to-[#BF76FF]/10 text-white font-semibold shadow-[0_0_20px_rgba(191,118,255,0.1)]" 
            : "bg-[#BF76FF]/10 text-[#BF76FF] font-semibold"
          : isDark
            ? "bg-transparent text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 font-medium"
            : "bg-transparent text-gray-500 hover:bg-black/[0.05] hover:text-black font-medium"
      )}
      title={collapsed ? label : ""}
    >
      <div className={cn(
        "flex items-center justify-center transition-colors relative",
        collapsed ? "w-full" : "w-5",
        active ? "text-[#BF76FF]" : isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"
      )}>
        <Icon className="w-5 h-5" />
        {notificationCount ? (
           <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] shadow-md font-black">
             {notificationCount > 9 ? '9+' : notificationCount}
           </span>
        ) : null}
      </div>
      
      {!collapsed && (
        <span className="text-sm flex-1 text-left whitespace-nowrap transition-opacity duration-300 flex justify-between items-center">
          {label}
          {notificationCount ? (
             <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
               {notificationCount}
             </span>
          ) : null}
        </span>
      )}
      
      {active && (
        <motion.div 
          layoutId="active-indicator" 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#BF76FF] rounded-l-full shadow-[0_0_10px_#BF76FF]" 
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
        />
      )}
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

function UpcomingEvents({ agenda, isDark }: { agenda: any[], isDark: boolean }) {
  const upcoming = agenda
    .filter(item => {
      try {
        return isAfter(new Date(item.date), new Date());
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isDark ? "bg-white/5" : "bg-gray-100")}>
          <CalendarDays className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-500 font-bold">Nenhum evento próximo agendado.</p>
        <p className="text-xs text-gray-600 mt-1">Fique atento às novidades da nossa congregação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      {upcoming.map((event, index) => {
        const date = new Date(event.date);
        const day = format(date, "dd");
        const weekDay = format(date, "EEE", { locale: ptBR });
        const monthYear = format(date, "MMMM", { locale: ptBR });
        const time = format(date, "HH:mm");
        
        const colors = ["bg-green-500", "bg-[#BF76FF]", "bg-orange-500", "bg-pink-500", "bg-blue-500"];
        const colorClass = colors[index % colors.length];

        return (
          <div key={event.id} className="flex gap-4 md:gap-8 group">
            {/* Date Section */}
            <div className="flex flex-col items-center shrink-0 w-12 md:w-20">
              <span className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
                {weekDay}
              </span>
              <span className={cn("text-2xl md:text-5xl font-black tracking-tighter leading-none transition-colors", isDark ? "text-white" : "text-black")}>
                {day}
              </span>
            </div>

            {/* Content Section */}
            <div className={cn(
              "flex-1 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-2xl",
              isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/5" : "bg-white border-black/5 shadow-sm hover:shadow-lg"
            )}>
              <div className={cn("absolute top-0 left-0 bottom-0 w-1.5 md:w-2", colorClass)} />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className={cn("text-sm md:text-xl font-bold transition-colors line-clamp-1", isDark ? "text-white" : "text-black")}>
                    {event.title}
                  </h5>
                  <p className="text-[10px] md:text-sm text-gray-500 flex items-center gap-2">
                    <MapPin className="w-3 h-3 md:w-4 h-4" />
                    <span className="truncate">{event.location || "Local em breve"}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600")}>
                    <Clock className="w-3 h-3 md:w-4 h-4 text-[#BF76FF]" />
                    {time}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityItem({ user, action, time, isDark }: { user: string, action: string, time: string, isDark?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-2 border-b last:border-0", isDark ? "border-white/5" : "border-black/5")}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#BF76FF]/20 flex items-center justify-center text-[#BF76FF] text-[10px] font-bold">
          {user ? user[0] : "A"}
        </div>
        <p className={cn("text-sm transition-colors", isDark ? "text-white" : "text-black")}>
          <span className="font-bold">{user || "Sistema"}</span> <span className="text-gray-500">{action}</span>
        </p>
      </div>
      <span className="text-[10px] text-gray-600 font-medium">{time}</span>
    </div>
  );
}

interface TeamMemberProps {
  key?: any;
  member: any;
  active?: boolean;
  onWhatsApp: () => void;
  onViewProfile?: () => void;
  onEditProfile?: () => void;
  onDelete?: () => void;
  isDark?: boolean;
  isAdmin?: boolean;
}

function TeamMember({ member, active, onWhatsApp, onViewProfile, onEditProfile, onDelete, isDark, isAdmin }: TeamMemberProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const name = member.name || "Membro";
  const status = member.status_presence || "offline";

  const getStatusColor = (s: string) => {
    switch (s) {
      case "online": return "bg-green-500";
      case "ocupado": return "bg-red-500";
      case "ausente": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors overflow-hidden", isDark ? "bg-gradient-to-tr from-gray-700 to-gray-800 text-white" : "bg-gray-200 text-black")}>
            {member.photoURL ? (
              <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              name[0]
            )}
          </div>
          <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse", isDark ? "border-[#0a0a0a]" : "border-white", getStatusColor(status))} />
        </div>
        <div className="cursor-pointer group" onClick={onViewProfile}>
          <p className={cn("text-sm font-bold transition-colors group-hover:text-[#BF76FF]", isDark ? "text-white" : "text-black")}>{name}</p>
          <p className="text-[10px] text-gray-500">{formatRoles(member)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onWhatsApp}
          title="Chat Interno"
          className="p-2 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        {onEditProfile && (
          <button 
            onClick={onEditProfile}
            className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        <div className="relative">
          <button 
            onClick={() => setShowTooltip(!showTooltip)}
            onBlur={() => setTimeout(() => setShowTooltip(false), 300)}
            className={cn("hover:text-[#BF76FF] p-2 transition-colors cursor-pointer", isDark ? "text-gray-600" : "text-gray-400")}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: 10, scale: 0.9, x: 20 }}
                className={cn(
                  "absolute right-0 top-full mt-2 w-64 md:w-72 rounded-[32px] shadow-2xl border overflow-hidden z-[100] p-1",
                  isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10"
                )}
              >
                <div className="relative h-24 rounded-[28px] overflow-hidden">
                  <img 
                    src={member.coverImage || "https://picsum.photos/seed/church/400/200"} 
                    className="w-full h-full object-cover opacity-60"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <Bookmark className="w-4 h-4 text-white/70" />
                    </div>
                  </div>
                </div>

                <div className="px-6 -mt-8 relative z-10">
                  <div className="flex items-end justify-between mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-[#0a0a0a] bg-[#1a1a1a] overflow-hidden shadow-xl">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#BF76FF]">
                          {name[0]}
                        </div>
                      )}
                    </div>
                  </div>

                    <div className="mb-6">
                      <h5 className="text-lg font-bold text-white leading-tight">{name}</h5>
                      <p className="text-xs text-gray-500 font-medium">{formatRoles(member)}</p>
                    </div>

                  <div className="grid grid-cols-3 gap-2 mb-6 py-4 border-y border-white/5">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-white font-bold text-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>4.8</span>
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Rating</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                      <p className="text-white font-bold text-sm">2 Anos</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Membro</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">Ativo</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Status</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowTooltip(false);
                      if (onViewProfile) onViewProfile();
                    }}
                    className="w-full bg-white text-black h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all mb-2 cursor-pointer"
                  >
                    Ver perfil
                  </button>
                  {isAdmin && (member.status === "pending" || member.status === "pending_approval") ? (
                    <div className="flex gap-2">
                       <button
                         onClick={async () => {
                            setShowTooltip(false);
                            try {
                              await updateDoc(doc(db, "members", member.id), { status: "active", updatedAt: serverTimestamp() });
                            } catch(err) {
                              console.error(err);
                            }
                         }}
                         className="flex-1 bg-green-500/10 text-green-500 h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all cursor-pointer"
                       >
                         Aprovar
                       </button>
                       <button
                         onClick={() => {
                            setShowTooltip(false);
                            if (onDelete) onDelete();
                         }}
                         className="flex-1 bg-red-500/10 text-red-500 h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                       >
                         Recusar
                       </button>
                    </div>
                  ) : onDelete && (
                    <button
                      onClick={() => {
                        setShowTooltip(false);
                        onDelete();
                      }}
                      className="w-full bg-red-500/10 text-red-500 h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    >
                      Excluir Membro
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FileCategory({ icon: Icon, label, count, active, isDark }: { icon: any, label: string, count: number, active?: boolean, isDark?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all",
      active 
        ? isDark ? "bg-[#1a1a1a] border border-white/5" : "bg-gray-100 border border-black/5" 
        : isDark ? "hover:bg-white/5" : "hover:bg-black/5"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", active ? "bg-[#BF76FF]/20 text-[#BF76FF]" : isDark ? "bg-white/5 text-gray-500" : "bg-black/5 text-gray-400")}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={cn("text-xs font-medium transition-colors", isDark ? "text-white" : "text-black")}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 font-bold">{count}</span>
        <ChevronRight className="w-3 h-3 text-gray-700" />
      </div>
    </div>
  );
}

function ActionIcon({ icon: Icon, onClick, active, isDark }: { icon: any, onClick?: () => void, active?: boolean, isDark?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
        active 
          ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" 
          : isDark ? "bg-transparent text-[#BF76FF] hover:bg-[#BF76FF]/10" : "bg-transparent text-[#BF76FF] hover:bg-[#BF76FF]/5"
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
