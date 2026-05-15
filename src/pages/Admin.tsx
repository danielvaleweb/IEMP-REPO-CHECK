import { lazy, Suspense, useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  Image as ImageIcon,
  FileText,
  Settings,
  LogOut,
  Plus,
  Trash2,
  RefreshCcw,
  User,
  FolderOpen,
  Loader2,
  Edit,
  Save,
  Youtube,
  LogIn,
  ChevronLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Bell,
  CheckCheck,
  UserPlus,
  Zap,
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
  XCircle,
  Camera,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Facebook,
  Instagram,
  Share2,
  Briefcase,
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
  PartyPopper,
  ExternalLink,
  ClipboardList,
  Newspaper,
  Megaphone,
  UserSearch,
  UserCheck,
  Radio,
  Music,
  HardDrive,
  Key,
  MessageCircle,
  GraduationCap,
  Wrench,
  Bug,
  Database,
  Bold,
  Italic,
  Smile,
  Info
} from "lucide-react";
import confetti from 'canvas-confetti';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

// Lazy sub-views
import { UploadImages } from "@/components/UploadImages";
const TonsView = lazy(() => import("@/components/admin/TonsView").then(m => ({ default: m.TonsView })));
const AvisosView = lazy(() => import("@/components/admin/AvisosView").then(m => ({ default: m.AvisosView })));
const EBDAdminView = lazy(() => import("@/components/admin/EBDAdminView").then(m => ({ default: m.EBDAdminView })));
const VideosView = lazy(() => import("@/components/admin/VideosView").then(m => ({ default: m.VideosView })));
const EventosView = lazy(() => import("@/components/admin/EventosView").then(m => ({ default: m.EventosView })));
const EventFeedbacksAdmin = lazy(() => import("@/components/admin/EventFeedbacksAdmin").then(m => ({ default: m.EventFeedbacksAdmin })));
const SavedLoginsAdmin = lazy(() => import("@/components/admin/SavedLoginsAdmin").then(m => ({ default: m.SavedLoginsAdmin })));

const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center p-12 gap-4">
    <Loader2 className="w-8 h-8 text-[#BF76FF] animate-spin" />
    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Carregando visualização...</p>
  </div>
);

const ROLE_COLORS: Record<string, string> = {
  "Direção": "#7f009b",
  "Secretaria": "#3b52d3",
  "Desenvolvedor": "#ffffff",
  "Mídia": "#383838",
  "Diácono": "#824bb4",
  "Diaconisa": "#824bb4",
  "Diaconia": "#824bb4",
  "Obreiro": "#6210ac",
  "Minis. infantil": "#6cc3ec",
  "Minis. louvor": "#fe8419",
  "Minis. Jovens": "#7aff4c",
  "Coord. Mulheres": "#ff0000",
  "Coord. Coreografia": "#00ffb2",
  "Coord. Vist. Hospitalar": "#b9ffea",
  "Recepcionista": "#7a80ff",
  "Membro": "#9e9e9e",
  "Membros": "#9e9e9e",
  "Visitante": "#b9ffa9",
  "Visitantes": "#b9ffa9",
  "Administradores": "#BF76FF",
  "ED. TON": "#00FFCC"
};

import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { firestoreService } from "@/services/firestoreService";
import { cn, getImageUrl, getRelativeTime } from "@/lib/utils";
import { updateProfile } from "firebase/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
  increment,
  getCountFromServer,
  limit,
  deleteField
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
  isAfter,
  subDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CandleIcon = ({ isDark = true }: { isDark?: boolean }) => (
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
    let d: Date;

    // Se for um Timestamp do Firestore (objeto com toDate)
    if (dateStr && typeof dateStr.toDate === 'function') {
      d = dateStr.toDate();
    }
    // Se for um objeto com seconds/nanoseconds mas sem toDate (ex: cache ou serializado)
    else if (dateStr && typeof dateStr === 'object' && 'seconds' in dateStr) {
      d = new Date(dateStr.seconds * 1000);
    }
    else if (typeof dateStr === 'string' && dateStr.includes(' - ')) {
      return dateStr.split(' - ')[0];
    } else if (dateStr instanceof Date) {
      d = dateStr;
    } else {
      d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yyyy");
  } catch (e) {
    return "";
  }
};

const safeFormatTime = (dateStr: any) => {
  if (!dateStr) return "";
  try {
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const timePart = parts[1].trim();
        if (/^\d{2}:\d{2}$/.test(timePart)) return timePart;
      }
    }

    let d: Date;
    if (dateStr && typeof dateStr.toDate === 'function') {
      d = dateStr.toDate();
    } else if (dateStr && typeof dateStr === 'object' && 'seconds' in dateStr) {
      d = new Date(dateStr.seconds * 1000);
    } else if (dateStr instanceof Date) {
      d = dateStr;
    } else {
      d = new Date(dateStr);
    }

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
  onNotifyOrganizer,
  isDark,
  canEdit = false,
  canDelete = false,
  canCreateDirectly = true,
  canRequestDate = true,
  onRequestDate,
  canNotify = false,
  modalTitle = "Compromissos do Dia",
  emptyMessage = "Nenhum evento cadastrado para este dia.",
  newEventButtonLabel = "Cadastrar novo evento",
  deleteButtonLabel = "Excluir",
  canImportExisting = false,
  onImportExisting
}: {
  agenda: any[],
  onNewEvent: (date: Date) => void,
  onViewEvent: (item: any) => void,
  onEditEvent: (item: any) => void,
  onDeleteEvent: (item: any) => void,
  onNotifyOrganizer?: (item: any) => void,
  isDark?: boolean,
  canEdit?: boolean,
  canDelete?: boolean,
  canCreateDirectly?: boolean,
  canRequestDate?: boolean,
  onRequestDate?: (date: Date) => void,
  canNotify?: boolean,
  modalTitle?: string,
  emptyMessage?: string,
  newEventButtonLabel?: string,
  deleteButtonLabel?: string,
  canImportExisting?: boolean,
  onImportExisting?: () => void
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

  const parseDate = (date: any) => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date.toDate) return date.toDate(); // Handle Firestore Timestamp
    try {
      // Try ISO first
      const d = parseISO(date);
      if (!isNaN(d.getTime())) return d;
      // Fallback to simple date parsing
      const d2 = new Date(date);
      if (!isNaN(d2.getTime())) return d2;
    } catch (e) {
      console.error("Error parsing date:", date, e);
    }
    return null;
  };

  const selectedDayEvents = selectedDay ? agenda.filter(event => {
    const d = parseDate(event.date);
    return d && isSameDay(d, selectedDay);
  }) : [];

  return (
    <>
      <div className={cn(
        "border rounded-[32px] p-4 md:p-8 transition-colors duration-500",
        isDark ? "bg-[#1A1A1A] border-white/5 shadow-2xl" : "bg-white border-black/5 shadow-xl"
      )}>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className={cn("text-lg md:text-2xl font-black transition-colors uppercase tracking-tight", isDark ? "text-white" : "text-black")}>
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className={cn("w-8 h-8 md:w-10 md:h-10 rounded-xl cursor-pointer transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-black/5")} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className={cn("w-4 h-4 md:w-5 h-5", isDark ? "text-white" : "text-black")} />
            </Button>
            <Button variant="ghost" size="icon" className={cn("w-8 h-8 md:w-10 md:h-10 rounded-xl cursor-pointer transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-black/5")} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className={cn("w-4 h-4 md:w-5 h-5", isDark ? "text-white" : "text-black")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
          {weekDays.map(day => (
            <div key={day} className={cn("text-center text-[10px] md:text-xs font-black uppercase tracking-widest py-1 md:py-2", isDark ? "text-white/40" : "text-gray-500")}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day, i) => {
            const dayEvents = agenda.filter(event => {
              const d = parseDate(event.date);
              return d && isSameDay(d, day);
            });
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div
                key={`calendar-day-${day.toISOString()}`}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[50px] md:min-h-[100px] p-1 md:p-2 rounded-xl md:rounded-2xl border transition-all cursor-pointer relative group",
                  isCurrentMonth
                    ? isDark ? "bg-[#222] border-white/5" : "bg-gray-50 border-black/5"
                    : isDark ? "bg-roxo-bg/30 border-white/5 opacity-30" : "bg-gray-50/30 border-black/5 opacity-50",
                  "hover:border-[#BF76FF]/50",
                  isSameDay(day, new Date()) && "ring-2 ring-[#BF76FF]",
                )}
              >
                <div className={cn(
                  "text-right text-[8px] md:text-xs font-black mb-1 md:mb-2 transition-colors",
                  day.getDay() === 6 ? "text-green-500" : isDark ? "text-white/20" : "text-gray-400"
                )}>{format(day, dateFormat)}</div>
                <div className="space-y-0.5 md:space-y-1">
                  {dayEvents.slice(0, 3).map((event, j) => (
                    <div
                      key={`calendar-event-${day.toISOString()}-${j}-${event.id || 'no-id'}`}
                      className={cn(
                        "text-[7px] md:text-[10px] p-0.5 md:p-1.5 rounded-lg truncate transition-colors relative group/event font-bold",
                        event.status === 'pending'
                          ? "bg-yellow-500/20 text-yellow-500"
                          : day.getDay() === 6
                            ? "bg-green-500/10 text-green-500"
                            : "bg-[#BF76FF]/10 text-[#BF76FF]"
                      )}
                    >
                      <span className="md:inline hidden tracking-tight leading-none">{event.title}</span>
                      <span className="md:hidden">●</span>

                      <div className={cn(
                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden md:group-hover/event:block w-56 border p-4 rounded-3xl shadow-2xl z-50 transition-all duration-300 backdrop-blur-md",
                        isDark ? "bg-roxo-bg/95 border-white/10 text-white" : "bg-white/95 border-black/10 text-black"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", day.getDay() === 6 ? "bg-green-500" : "bg-[#BF76FF]")} />
                          <p className={cn("font-black text-sm whitespace-normal tracking-tight leading-tight", isDark ? "text-white" : "text-black")}>{event.title}</p>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                            <Clock className="w-3 h-3 text-[#BF76FF]" />
                            <span>{safeFormatTime(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                            <MapPin className="w-3 h-3 text-[#BF76FF]" />
                            <span className="line-clamp-1">{event.location || "Sem local definido"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className={cn("text-[8px] text-center font-black uppercase tracking-tighter mt-1", isDark ? "text-white/20" : "text-gray-400")}>
                      +{dayEvents.length - 3} itens
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className={cn("border sm:max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col transition-colors rounded-[32px] border-none shadow-2xl", isDark ? "bg-[#1A1A1A] text-white" : "bg-white text-black")}>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {modalTitle}
                <span className="block text-sm text-[#BF76FF] mt-1">
                  {selectedDay ? format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ""}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-8">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, idx) => {
                  return (
                    <div key={`day-event-detail-${selectedDay?.toISOString()}-${idx}-${event.id || 'no-id'}`} className={cn("p-5 rounded-[24px] border space-y-4 transition-all hover:scale-[1.02]", isDark ? "bg-[#222] border-white/5" : "bg-gray-50 border-black/5")}>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-xl leading-tight uppercase tracking-tight">{event.title}</h4>
                          <div className="flex items-center gap-1">
                            {event.status === 'pending' && (
                              <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shrink-0">Em Análise</span>
                            )}
                            {canNotify && onNotifyOrganizer && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNotifyOrganizer(event);
                                }}
                                title="Notificar Organizador"
                              >
                                <WhatsAppIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-2">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                              <Clock className="w-3.5 h-3.5 text-[#BF76FF]" />
                              {safeFormatTime(event.date)}
                              {event.endTime ? ` às ${event.endTime}` : ''}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                              <MapPin className="w-3.5 h-3.5 text-[#BF76FF]" /> {event.location || "Sem local"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]/60 flex items-center gap-1">
                              Organizador: <span className="text-gray-500 font-bold normal-case truncate">{event.authorName || "Equipe"}</span>
                            </span>
                            {event.phone && canEdit && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]/60 flex items-center gap-1 mt-1">
                                Telefone: <span className="text-gray-500 font-bold normal-case">{event.phone}</span>
                                <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-sm normal-case whitespace-nowrap ml-1 font-bold">Só admins</span>
                              </span>
                            )}
                            {event.inviteChurch && event.invitedMembers && event.invitedMembers.length > 0 && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#BF76FF]/60 flex items-center gap-1 mt-1">
                                Membros: <span className="text-gray-500 font-bold normal-case">{event.invitedMembers.length} presentes</span>
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                      <div className={cn("flex gap-2 pt-4 border-t", isDark ? "border-white/5" : "border-black/5")}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("flex-1 h-10 rounded-xl font-bold transition-all", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
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
                            className="flex-1 h-10 rounded-xl bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF]/20 font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDay(null);
                              onEditEvent(event);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 opacity-20">
                  <Calendar className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-bold">{emptyMessage}</p>
                </div>
              )}

              {(canEdit || (canRequestDate && !canCreateDirectly)) && (
                <div className="space-y-3 mt-6">
                  <Button
                    className={cn("w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl", canCreateDirectly ? "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF]" : "bg-gradient-to-r from-amber-500 to-orange-500")}
                    onClick={() => {
                      if (selectedDay) {
                        if (canCreateDirectly) {
                          onNewEvent(selectedDay);
                        } else if (onRequestDate) {
                          onRequestDate(selectedDay);
                        }
                        setSelectedDay(null);
                      }
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" /> {canCreateDirectly ? newEventButtonLabel : "Solicitar Data"}
                  </Button>

                  {canImportExisting && onImportExisting && (
                    <Button
                      onClick={() => {
                        setSelectedDay(null);
                        onImportExisting();
                      }}
                      className={cn("w-full h-14 rounded-2xl bg-black text-white hover:bg-black/80 font-black uppercase tracking-widest transition-all")}
                    >
                      <LinkIcon className="w-5 h-5 mr-2" /> Adicionar Existente
                    </Button>
                  )}
                </div>
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

    // Normalize diacono variants
    if (typeof r === 'string') {
      const low = r.toLowerCase();
      // Check exact forms to be sure
      if (low === 'diácono (homem)' || low === 'diacono' || low === 'diácono' || low === 'diacono/diaconisa') {
        return 'Diácono';
      }
      if (low === 'diaconisa (mulher)' || low === 'diaconisa') {
        return 'Diaconisa';
      }

      // Catch-all just in case
      if (low.includes('diác') || low.includes('diac')) {
        return 'Diácono';
      }
    }

    return r;
  });

  // Remove duplicates again after mapping (so multiple old variants become just Diácono)
  let finalRoles = Array.from(new Set(mappedRoles));

  if (finalRoles.includes('Diaconisa') && finalRoles.includes('Diácono')) {
    finalRoles = finalRoles.filter(r => r !== 'Diácono');
  }

  // Remove "Membro" if they have other roles
  if (finalRoles.length > 1 && finalRoles.includes('Membro')) {
    finalRoles = finalRoles.filter(r => r !== 'Membro');
  }

  if (finalRoles.length > 1) {
    const last = finalRoles.pop();
    return `${finalRoles.join(", ")} e ${last}`;
  }
  return finalRoles[0] || "Membro";
};

function MemberProfile({ member, onBack, onEdit, isDark, notifications, logs, agenda, onChat }: { member: any, onBack: () => void, onEdit?: () => void, isDark: boolean, notifications: any[], logs?: any[], agenda?: any[], onChat?: () => void }) {
  const isBirthdayToday = useMemo(() => {
    if (!member.birthDate) return false;
    try {
      const birth = parseISO(member.birthDate + "T12:00:00");
      const now = new Date();
      return birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth();
    } catch (e) { return false; }
  }, [member.birthDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isBirthdayToday) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
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

      <div className={cn("rounded-[40px] overflow-hidden border transition-all", isDark ? "bg-roxo-bg border-white/5" : "bg-white border-black/5 shadow-2xl")}>
        <div className="relative min-h-[500px] md:h-80">
          <img
            src={getImageUrl(member.coverImage || "https://picsum.photos/seed/church/1200/400")}
            className="w-full h-full object-cover opacity-60"
            alt=""
          />
          <div className={cn("absolute inset-0 bg-gradient-to-t", isDark ? "from-roxo-bg to-transparent" : "from-white/80 to-transparent")} />

          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto">
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-[#111] bg-[#1a1a1a] overflow-hidden shadow-2xl relative z-10">
                  {member.photoURL ? (
                    <img src={getImageUrl(member.photoURL)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#BF76FF]">
                      {member.name?.[0] || "M"}
                    </div>
                  )}
                </div>
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
                onClick={onChat}
                className={cn("rounded-2xl h-14 px-6 border-white/10 transition-colors", isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10")}
              >
                <MessageSquare className="w-4 h-4" />
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
                      const start = parseISO(member.joinedDate + "T12:00:00");
                      const now = new Date();
                      return differenceInMonths(now, start) < 1 ? "Membro" : "Membro à";
                    } catch (e) { return "Membro"; }
                  })(),
                  value: (() => {
                    try {
                      if (!member.joinedDate) return "Novo";
                      const start = parseISO(member.joinedDate + "T12:00:00");
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
                  label: "Profissão",
                  value: member.profession || "Não informada",
                  icon: Briefcase,
                  color: "text-amber-500"
                },
                {
                  label: "Instagram",
                  value: member.instagram || "Não informado",
                  icon: Instagram,
                  color: "text-pink-600"
                },
                {
                  label: "Aniversário",
                  value: member.birthDate ? (() => {
                    if (isBirthdayToday) return "Hoje!";
                    try {
                      const d = parseISO(member.birthDate + "T12:00:00");
                      return format(d, "dd/MMMM", { locale: ptBR });
                    } catch (e) { return "Não informado"; }
                  })() : "Não informado",
                  icon: isBirthdayToday ? CandleIcon : Cake,
                  color: isBirthdayToday ? "text-orange-500 animate-pulse" : "text-pink-500"
                }
              ].map((stat) => (
                <div key={`stat-${stat.label}`} className={cn("p-6 rounded-3xl border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5")}>
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 relative", isDark ? "bg-white/5" : "bg-white shadow-sm")}>
                    {stat.label === "Aniversário" && isBirthdayToday ? (
                      <CandleIcon isDark={isDark} />
                    ) : (
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={cn("text-xl font-black transition-colors uppercase", isDark ? "text-white" : "text-black")}>{stat.value}</p>
                </div>
              ))}
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
                      <span key={`ministry-${mName}`} className={cn("px-4 py-2 rounded-full text-xs font-bold", isLeader ? "bg-[#BF76FF] text-white" : "bg-[#BF76FF]/10 text-[#BF76FF]")}>
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
              <h3 className={cn("text-xl font-bold mb-6 transition-colors", isDark ? "text-white" : "text-black")}>Atividades Recentes</h3>
              <div className="space-y-6">
                {(() => {
                  const items: any[] = [];

                  // 1. Cadastro
                  if (member.createdAt) {
                    items.push({
                      id: 'signup',
                      message: "Se cadastrou no ministério",
                      date: member.createdAt,
                      icon: <UserPlus className="w-4 h-4 text-green-500" />
                    });
                  }

                  // 2. Notificações do tipo activity
                  if (notifications) {
                    notifications
                      .filter(n => n.memberId === member.id && n.type === "activity")
                      .forEach(n => items.push({
                        id: n.id,
                        message: n.message,
                        date: n.createdAt || n.timestamp,
                        icon: <Bell className="w-4 h-4 text-blue-500" />
                      }));
                  }

                  // 3. Agenda (participações)
                  if (agenda) {
                    agenda.forEach(ev => {
                      const isParticipant = ev.participants?.some((p: any) => p.id === member.id);
                      if (isParticipant) {
                        items.push({
                          id: `event-${ev.id}`,
                          message: `Confirmou participação no evento: ${ev.title}`,
                          date: ev.date,
                          icon: <CalendarDays className="w-4 h-4 text-[#BF76FF]" />
                        });
                      }
                    });
                  }

                  // 4. Logs de Auditoria
                  if (logs) {
                    logs
                      .filter(l => l.userId === member.id)
                      .filter(l => {
                        const action = l.action?.toLowerCase() || "";
                        const details = l.details?.toLowerCase() || "";
                        // Filtrar acessos e logins para não ficar repetitivo
                        return !action.includes("login") &&
                          !action.includes("access") &&
                          !details.includes("entrou no") &&
                          !details.includes("acessou");
                      })
                      .forEach(l => {
                        let icon = <Clock className="w-4 h-4 text-gray-500" />;
                        if (l.action?.includes("like")) icon = <Heart className="w-4 h-4 text-pink-500" />;
                        if (l.action?.includes("bio")) icon = <FileText className="w-4 h-4 text-[#BF76FF]" />;
                        if (l.action?.includes("nascimento") || l.action?.includes("entrada")) icon = <Calendar className="w-4 h-4 text-blue-500" />;

                        items.push({
                          id: l.id,
                          message: l.details || l.action,
                          date: l.timestamp || l.createdAt,
                          icon
                        });
                      });
                  }

                  // Ordenar e processar
                  const sortedActivities = items
                    .sort((a, b) => {
                      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .slice(0, 8);

                  if (sortedActivities.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-500 mb-4">
                          <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Nenhuma atividade registrada ainda.</p>
                      </div>
                    );
                  }

                  return sortedActivities.map((act, i) => (
                    <div key={`act-item-${act.id}-${i}`} className="flex gap-4 group">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0", isDark ? "bg-white/5" : "bg-white shadow-sm border border-black/5")}>
                        {act.icon}
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold transition-colors group-hover:text-[#BF76FF]", isDark ? "text-white" : "text-black")}>
                          {act.message}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                          {act.date ? (() => {
                            try {
                              const date = typeof act.date === 'string' ? parseISO(act.date) : (act.date.toDate ? act.date.toDate() : new Date(act.date));
                              const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                              if (diff < 60) return "Agora mesmo";
                              if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
                              if (diff < 86400) return `${Math.floor(diff / 3600)} horas atrás`;
                              if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`;
                              return format(date, "dd MMM yyyy", { locale: ptBR });
                            } catch (e) { return "Recentemente"; }
                          })() : "Recentemente"}
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
                {(() => {
                  const skills = member.churchSkills
                    ? member.churchSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (member.skills || []);

                  if (skills.length === 0) {
                    return <p className="text-xs text-gray-500 italic">Nenhuma habilidade informada</p>;
                  }

                  return skills.map((skill: string, i: number) => (
                    <span key={`skill-${skill}-${i}`} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isDark ? "bg-white/10 text-[#BF76FF] border border-[#BF76FF]/20" : "bg-[#BF76FF]/5 text-[#BF76FF] border border-[#BF76FF]/10 shadow-sm")}>
                      {skill}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogFilterSelect({ label, value, onChange, options, isDarkMode }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
          isDarkMode
            ? "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            : "bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200"
        )}
      >
        <span>{label}: {selectedOption?.label || value}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform opacity-50", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "absolute top-full left-0 z-[100] w-full mt-1 p-2 rounded-2xl border shadow-2xl overflow-hidden",
              isDarkMode ? "bg-roxo-bg border-white/10" : "bg-white border-black/5"
            )}
          >
            {options.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  value === opt.value
                    ? "bg-primary text-white"
                    : isDarkMode
                      ? "text-gray-500 hover:text-white hover:bg-white/5"
                      : "text-gray-400 hover:text-black hover:bg-black/5"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Admin = () => {
  const { user, profile, setProfile, login, loginAsGuest, logout, isAdmin, isGuest, setCustomLogin, loading, loginWithEmail, signupWithEmail, error: contextAuthError, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messageParam = searchParams.get('message');
  const reasonParam = searchParams.get('reason');
  const chatUserParam = searchParams.get('chatUser');

  // Guest Login State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestData, setGuestData] = useState({ name: "", phone: "" });
  const [guestError, setGuestError] = useState("");
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return `(${phoneNumber}`;
    if (phoneNumberLength < 4) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    if (phoneNumberLength < 8) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3)}`;
    if (phoneNumberLength < 12) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleGuestLogin = async () => {
    if (!guestData.name.trim()) {
      setGuestError("Por favor, insira seu nome.");
      return;
    }
    const phoneDigits = guestData.phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 10) {
      setGuestError("Por favor, informe seu WhatsApp incluindo o DDD.");
      return;
    }

    setIsGuestModalOpen(false);
    setIsSubmitting(true);
    setGuestError("");
    try {
      await loginAsGuest(guestData.name, guestData.phone);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setIsGuestModalOpen(true); // Re-open if error to show message
      setGuestError(err.message || "Erro ao entrar como visitante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInsertMarkdown = (type: 'bold' | 'italic' | 'emoji', emoji?: string) => {
    const textarea = bioRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    let newText = "";
    let newCursorPos = 0;

    if (type === 'bold') {
      newText = `${before}**${selected}**${after}`;
      newCursorPos = selected.length > 0 ? start + selected.length + 4 : start + 2;
    } else if (type === 'italic') {
      newText = `${before}*${selected}*${after}`;
      newCursorPos = selected.length > 0 ? start + selected.length + 2 : start + 1;
    } else if (type === 'emoji') {
      newText = `${before}${emoji}${after}`;
      newCursorPos = start + (emoji?.length || 0);
    }

    setFormData((prev: any) => ({ ...prev, bio: newText }));

    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 4. Ponte para receber o Token do Expo via WebView
  useEffect(() => {
    const handleMessage = async (event: any) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'REGISTER_TOKEN' && data.token && user) {
          console.log("DEBUG: Recebido token do app (Registro desativado):", data.token);
          /* 
          await fetch("/backend/push/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.uid, token: data.token })
          });
          */
        }
      } catch (e) {
        // Ignora mensagens que não são JSON ou não são para nós
      }
    };

    window.addEventListener('message', handleMessage);
    // Para alguns sistemas Android
    document.addEventListener('message', handleMessage as any);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as any);
    };
  }, [user]);

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1280);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [collapsedTeamCategories, setCollapsedTeamCategories] = useState<Record<string, boolean>>({});
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [settings, setSettings] = useState<any>({ enableHeaderVideos: true, videoCardsEnabled: true });
  const [rightSidebarView, setRightSidebarView] = useState<"team" | "chat-list" | "chat-active" | "hidden" | "profile">("hidden");
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatListSubTab, setChatListSubTab] = useState<"chats" | "contacts">("chats");
  const [chatSearch, setChatSearch] = useState("");
  const [showClearGalleryDialog, setShowClearGalleryDialog] = useState(false);
  const [selectedPermissionRole, setSelectedPermissionRole] = useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

  const [menuItems, setMenuItems] = useState([
    { id: 'visao-geral', label: 'Início', icon: Home },
    { id: 'eventos', label: 'Eventos', icon: PartyPopper },
    { id: 'noticias', label: 'Notícias', icon: Newspaper },
    { id: 'videos', label: 'Vídeos', icon: Youtube },
    { id: 'tons', label: 'Tons', icon: Music },
    { id: 'membros', label: 'Membros', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Clock },
    { id: 'agenda-direcao', label: 'Agen. Direção', icon: CalendarDays },
    { id: 'radio', label: 'Rádio & Música', icon: Radio },
    { id: 'ebd', label: 'EBD', icon: GraduationCap },
  ]);

  const [visibleTabs, setVisibleTabs] = useState<string[]>(() => {
    const savedVisible = localStorage.getItem('admin_visible_tabs');
    let tabs = ['visao-geral', 'perfil', 'eventos', 'noticias', 'videos', 'tons', 'membros', 'visitantes', 'agenda', 'agenda-direcao', 'radio', 'ebd', 'financas', 'logs', 'discipulado', 'configuracoes'];

    if (savedVisible) {
      const parsed = JSON.parse(savedVisible);
      return parsed.filter((t: string) => t !== 'gerador-arte');
    }

    return tabs;
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMenuItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('admin_menu_order', JSON.stringify(newOrder.map(i => i.id)));
        return newOrder;
      });
    }
  };

  useEffect(() => {
    const savedOrder = localStorage.getItem('admin_menu_order');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        setMenuItems((currentItems) => {
          const sorted = [...currentItems].sort((a, b) => {
            const indexA = orderIds.indexOf(a.id);
            const indexB = orderIds.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          return sorted;
        });
      } catch (e) {
        console.error("Error loading menu order", e);
      }
    }
  }, []);

  const stripMentions = (text: string) => {
    if (!text) return "";
    return text.replace(/@\{([^}]+)\}/g, '@$1');
  };

  useEffect(() => {
    if (viewingMember) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [viewingMember]);

  // Reset unread count when chat becomes active
  useEffect(() => {
    if (rightSidebarView === "chat-active" && activeChatUser?.id && profile?.id) {
      const chatId = [profile.id, activeChatUser.id].sort().join('_');
      // Only attempt to reset if the chat actually exists in the local list
      const chat = activeChats.find(c => c.id === chatId);

      if (chat && chat.unreadCount?.[profile.id] > 0) {
        updateDoc(doc(db, "chats", chatId), {
          [`unreadCount.${profile.id}`]: 0
        }).catch(err => {
          // Silent for not-found errors as they are expected for brand new chats
          if (err.code !== 'not-found') {
            console.error("Error resetting unread count", err);
          }
        });
      }
    }
  }, [rightSidebarView, activeChatUser?.id, profile?.id, chatMessages.length, activeChats]);

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
                  key={`content-part-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("membros");
                    setViewingMember(member);
                    if (window.innerWidth < 1280) setRightSidebarView("hidden");
                  }}
                  className="font-black text-[#BF76FF] hover:text-[#A05ADB] underline underline-offset-2 cursor-pointer transition-colors"
                >
                  {'@'}{fullName}
                </span>
              );
            }
            return `@${fullName}`;
          }

          if (part.startsWith("http")) {
            return (
              <a
                key={`social-link-${i}`}
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
        lastSenderId: profile.id,
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

      // Gatilho: Push Notification para o chat
      /*
      fetch("/backend/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "💬 Nova Mensagem",
          message: `${profile.name || user?.displayName || 'Alguém'}: ${msgText}`,
          target: "specific",
          userIds: [activeChatUser.id]
        })
      }).catch(e => console.error("Erro ao enviar push:", e));
      */

    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
    }
  };

  // Data States
  const [posts, setPosts] = useState<any[]>([]);
  const [blog, setBlog] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [agendaDirecao, setAgendaDirecao] = useState<any[]>([]);
  const [vignettes, setVignettes] = useState<any[]>([]);
  const [radioTracks, setRadioTracks] = useState<any[]>([]);
  const [radioArtists, setRadioArtists] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [expandedNotifs, setExpandedNotifs] = useState<string[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [eventsLimit, setEventsLimit] = useState(4);
  const [newsLimit, setNewsLimit] = useState(4);
  const [videosLimit, setVideosLimit] = useState(4);

  useEffect(() => {
    if (chatUserParam && members.length > 0) {
      const userToChat = members.find(m => m.id === chatUserParam);
      if (userToChat) {
        setActiveChatUser(userToChat);
        setRightSidebarView("chat-active");
      }
    }
  }, [chatUserParam, members]);

  // Stats state to avoid full-collection reads
  const [counts, setCounts] = useState({
    members: 0,
    agenda: 0,
    posts: 0,
    blog: 0,
    vignettes: 0,
    videos: 0,
    unreadNotifications: 0
  });

  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [pendingAgendaCount, setPendingAgendaCount] = useState(0);
  const [pendingBugsCount, setPendingBugsCount] = useState(0);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isReportingBug, setIsReportingBug] = useState(false);
  const [bugDescription, setBugDescription] = useState("");
  const [isSavingBug, setIsSavingBug] = useState(false);
  const [showBugSuccess, setShowBugSuccess] = useState(false);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [auditSubTab, setAuditSubTab] = useState<"logs" | "bugs">("logs");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState("visao-geral");
  const [radioSubTab, setRadioSubTab] = useState<"vignettes" | "tracks" | "artists">("tracks");

  const isMasterAdmin = user?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com";
  const isAdminOrDev = profile?.role === "Administradores" || profile?.role === "Desenvolvedor" || isMasterAdmin;

  const [activeViewRole, setActiveViewRole] = useState<string | null>(null);

  const userRolesArray = useMemo(() => {
    if (activeViewRole) {
      if (isMasterAdmin || profile?.role === "Administradores" || profile?.role === "Desenvolvedor") {
        return [{ name: activeViewRole, isLeader: true }];
      }
    }
    if (isMasterAdmin) return [{ name: "Administradores", isLeader: true }];

    const rolesMap = new Map<string, boolean>();

    if (profile?.role) {
      rolesMap.set(profile.role, profile.isLeader || false);
    }

    if (profile?.ministries && Array.isArray(profile.ministries)) {
      profile.ministries.forEach((m: any) => {
        const name = typeof m === 'object' ? m.name : m;
        const isLeader = typeof m === 'object' ? m.isLeader : false;
        if (name) {
          rolesMap.set(name, rolesMap.get(name) || isLeader);
          if (name === profile?.role && isLeader) {
            rolesMap.set(profile.role, true);
          }
        }
      });
    }
    return Array.from(rolesMap.entries()).map(([name, isLeader]) => ({ name, isLeader }));
  }, [profile, activeViewRole, isMasterAdmin]);

  const canRoleViewTab = (rName: string, rIsLeader: boolean, tab: string) => {
    if (rName === "Administradores" || rName === "Desenvolvedor" || isMasterAdmin) return true;
    if (tab === "logins") return false;

    const rolePerms = settings.permissions?.[rName];

    if (rolePerms?.tabs && tab in rolePerms.tabs) {
      const tabPerm = rolePerms.tabs[tab];
      if (typeof tabPerm === 'object') {
        if (tabPerm.view !== undefined) return tabPerm.view;
      } else {
        return tabPerm;
      }
    }

    if (rName === "Direção") {
      if (tab !== "agenda-direcao" && tab !== "chat" && tab !== "visao-geral") return false;
      return true;
    }

    const getDefVal = () => {
      if (tab === "visao-geral") return true;
      if (tab === "avisos") return ["Administradores", "Desenvolvedor"].includes(rName);
      if (tab === "tons") {
        if (settings.tonsMenuRoles && Array.isArray(settings.tonsMenuRoles)) {
          return settings.tonsMenuRoles.includes(rName);
        }
        return !["Membro", "Visitante", "Direção"].includes(rName);
      }
      if (tab === "agenda-direcao") {
        const isSpecLeader = (rName === "Mídia" || rName === "Secretaria" || rName === "Secretário") && rIsLeader;
        return ["Administradores", "Desenvolvedor", "Direção"].includes(rName) || isSpecLeader;
      }
      return !["Membro", "Visitante", "Direção"].includes(rName);
    };

    return getDefVal();
  };

  const isEffectivelyAdmin = (isMasterAdmin || profile?.role === "Administradores") && (!activeViewRole || activeViewRole === "Administradores");

  const canViewSettings = userRolesArray.some(r => r.name === "Desenvolvedor" || r.name === "Administradores");
  const canViewLogs = canViewSettings;

  const canViewTab = (tab: string) => {
    if ((tab === "config" || tab === "logs") && !canViewSettings) return false;
    return userRolesArray.some(r => canRoleViewTab(r.name, r.isLeader, tab));
  };

  const hasPermission = (action: 'view' | 'create' | 'edit' | 'delete', tab?: string) => {
    if (isEffectivelyAdmin) return true;
    const targetTab = tab || activeTab;

    return userRolesArray.some(r => {
      const rolePerms = settings.permissions?.[r.name];
      if (!rolePerms) {
        if (action === 'view') return canRoleViewTab(r.name, r.isLeader, targetTab);
        return !["Membro", "Visitante"].includes(r.name);
      }

      // Check granular tab-specific permissions
      if (rolePerms.tabs?.[targetTab] && typeof rolePerms.tabs[targetTab] === 'object') {
        if (action in rolePerms.tabs[targetTab]) {
          return rolePerms.tabs[targetTab][action];
        }
      }

      // Fallback for 'view' (tabs boolean check)
      if (action === 'view') {
        if (rolePerms.tabs?.[targetTab] !== undefined) {
          const tabVal = rolePerms.tabs[targetTab];
          return typeof tabVal === 'object' ? tabVal.view : tabVal;
        }
        return canRoleViewTab(r.name, r.isLeader, targetTab);
      }

      // Fallback to global role-based permissions
      if (rolePerms[action] !== undefined) return rolePerms[action];

      // Final fallback
      return !["Membro", "Visitante"].includes(r.name);
    });
  };

  const canCreate = hasPermission('create');
  const canEdit = hasPermission('edit');
  const canDelete = hasPermission('delete');

  const canCreateEventDirectly = isEffectivelyAdmin || userRolesArray.some(r => {
    // Mantendo lógica legada se não houver permissão explícita
    const rolePerms = settings.permissions?.[r.name];
    if (rolePerms?.tabs?.agenda && typeof rolePerms.tabs.agenda === 'object' && rolePerms.tabs.agenda.create !== undefined) {
      return rolePerms.tabs.agenda.create;
    }
    
    return r.name === "Desenvolvedor" ||
      r.name === "Administradores" ||
      r.name === "Secretaria" ||
      r.name === "Secretário" ||
      (r.name === "Mídia" && r.isLeader);
  });

  const canNotifyOrganizer = isMasterAdmin || userRolesArray.some(r =>
    r.name === "Desenvolvedor" ||
    r.name === "Administradores" ||
    r.name === "Secretaria" ||
    r.name === "Secretário"
  );

  const canEditProfiles = isEffectivelyAdmin || userRolesArray.some(r => {
    const rolePerms = settings.permissions?.[r.name];
    if (rolePerms?.editProfiles !== undefined) return rolePerms.editProfiles;
    return r.name === "Administradores" || r.name === "Desenvolvedor";
  });

  const canDeletePhotos = isEffectivelyAdmin || userRolesArray.some(r => {
    const rolePerms = settings.permissions?.[r.name];
    if (rolePerms?.deletePhotos !== undefined) return rolePerms.deletePhotos;
    return !["Membro", "Visitante"].includes(r.name);
  });


  const [hasLoggedLogin, setHasLoggedLogin] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    setAuthError(contextAuthError || "");
  }, [contextAuthError]);

  useEffect(() => {
    if (user && !hasLoggedLogin && logAction) {
      logAction("login", "auth", `Usuário ${user.displayName || user.email} entrou no sistema`);
      setHasLoggedLogin(true);
    }
  }, [user]);

  const handleReportBug = async () => {
    if (!bugDescription.trim()) return;
    setIsSavingBug(true);
    try {
      await addDoc(collection(db, "bug-reports"), {
        description: bugDescription,
        userId: user?.uid,
        userName: profile?.name || user?.displayName || user?.email || "Anônimo",
        userEmail: user?.email,
        status: "pending",
        createdAt: serverTimestamp()
      });

      // Notificar administradores
      await addDoc(collection(db, "notifications"), {
        userId: "admin",
        title: "Novo Bug Reportado",
        message: `${profile?.name || user?.displayName || user?.email || "Um usuário"} reportou um problema: ${bugDescription.substring(0, 50)}...`,
        read: false,
        type: "bug",
        createdAt: serverTimestamp()
      });

      logAction("criar", "bug-reports", `Reportou um bug: ${bugDescription.substring(0, 50)}...`);
      setBugDescription("");
      setShowBugSuccess(true);

      setTimeout(() => {
        setIsReportingBug(false);
        setShowBugSuccess(false);
        // Redireciona para aba de bugs se tiver permissão
        if (canViewLogs) {
          setActiveTab("logs");
          setAuditSubTab("bugs");
        }
      }, 3000);

      // Success toast or alert? I'll use confetti if enabled or just close
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#BF76FF', '#7F009B', '#FFFFFF']
      });
    } catch (err) {
      console.error("Error reporting bug:", err);
    } finally {
      setIsSavingBug(false);
    }
  };

  useEffect(() => {
    if (!user || activeTab !== "logs" || auditSubTab !== "bugs") return;

    // Load bug reports only if user is admin and in the bugs tab
    if (!isMasterAdmin && !canViewSettings) return;

    const unsubBugs = onSnapshot(collection(db, "bug-reports"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      setBugReports(data);
    });

    return () => unsubBugs();
  }, [user, activeTab, auditSubTab, isMasterAdmin, canViewSettings]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    // Simple count of pending bugs for the notification badge
    const unsubBugCount = onSnapshot(
      query(collection(db, "bug-reports"), where("status", "==", "pending")),
      (snapshot) => setPendingBugsCount(snapshot.size)
    );
    return () => unsubBugCount();
  }, [user, isAdmin]);

  const handleLogoutAction = async () => {
    if (user) {
      await logAction("logout", "auth", `Usuário ${user.displayName || user.email} encerrou a sessão`);
    }
    await auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user && profile && isGuest) {
      navigate("/");
    }
  }, [user, profile, isGuest, navigate]);

  // Load synthetic (local) read/cleared states initially from localStorage
  const [syntheticReadIds, setSyntheticReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('localReadNotifs') || '[]'); } catch { return []; }
  });
  const [syntheticClearedIds, setSyntheticClearedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('localClearedNotifs') || '[]'); } catch { return []; }
  });

  // Save to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem('localReadNotifs', JSON.stringify(syntheticReadIds));
      localStorage.setItem('localClearedNotifs', JSON.stringify(syntheticClearedIds));
    }
  }, [syntheticReadIds, syntheticClearedIds, user]);

  // Notifications Filtering Logic
  const displayNotifications = useMemo(() => {
    let dsNotifs = notifications.filter(n => {
      // Clear if locally cleared
      if (syntheticClearedIds.includes(n.id)) return false;

      // Administrative notifications (only for Master Admin and Dev)
      if (n.type === "registration" || n.type === "activity" || n.type === "system" || n.type === "gallery_removal") {
        return isAdminOrDev;
      }

      // Personal notifications (targeted to current user)
      if (n.userId === user?.uid || n.userId === "all" || (n.userId === "admin" && isAdminOrDev)) {
        // Exclude chat notifications from bell dropdown
        if (n.type === "chat") return false;
        return true;
      }

      return false;
    }).map(n => {
      // Treat global or admin notifications as synthetic to avoid updating for everyone
      if (n.userId !== user?.uid) {
        return {
          ...n,
          isSynthetic: true,
          read: n.read || syntheticReadIds.includes(n.id)
        };
      }
      return n;
    });

    const now = new Date();
    members.forEach(m => {
      if (!m.birthDate || m.status === 'pending' || m.status === 'visitor_session') return;
      try {
        const birth = parseISO(m.birthDate + "T12:00:00");
        if (birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth()) {
          const synthId = `birthday-${m.id}`;
          if (!syntheticClearedIds.includes(synthId)) {
            dsNotifs.unshift({
              id: synthId,
              type: 'birthday',
              title: `Aniversário de ${m.name}`,
              message: `Hoje é aniversário de ${m.name} dê os parabéns!`,
              timestamp: { toDate: () => now },
              read: syntheticReadIds.includes(synthId),
              isSynthetic: true, // Don't try to update DB
              memberPhone: m.phone,
              memberName: m.name
            });
          }
        }
      } catch (e) { }
    });

    return dsNotifs;
  }, [notifications, isAdminOrDev, user?.uid, members, syntheticReadIds, syntheticClearedIds]);

  const handleNotificationClick = async (notif: any) => {
    try {
      setExpandedNotifs(prev => prev.includes(notif.id) ? prev.filter(id => id !== notif.id) : [...prev, notif.id]);

      if (notif.isSynthetic) {
        if (!notif.read && !syntheticReadIds.includes(notif.id)) {
          setSyntheticReadIds(prev => [...prev, notif.id]);
        }
      } else {
        if (!notif.read) {
          await updateDoc(doc(db, "notifications", notif.id), { read: true });
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        }
      }
    } catch (err) {
      console.error("Erro ao processar clique na notificação:", err);
    }
  };

  const handleNotificationAction = (notif: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (notif.type === "request" || notif.type === "agenda" || notif.type === "agenda_rejected") {
        setActiveTab("agenda");
      } else if (notif.type === "registration") {
        firestoreService.clearCache("members");
        setActiveTab("membros");
        setShowPending(true);
      } else if (notif.type === "chat") {
        setActiveTab("chats");
      } else if (notif.type === "gallery_removal") {
        navigate(`/galeria?album=${notif.albumId}&photo=${encodeURIComponent(notif.photoUrl)}`);
      } else if (notif.type === "event_feedback") {
        setActiveTab("eventos");
      } else if (notif.type === "bug") {
        if (isAdminOrDev) {
          setActiveTab("logs");
          setAuditSubTab("bugs");
        }
      }
    } catch (err) {
      console.error("Erro ao processar ação da notificação:", err);
    }
  };

  // Close right sidebar when changing tabs
  useEffect(() => {
    setRightSidebarView("hidden");
  }, [activeTab]);

  const [showPending, setShowPending] = useState(false);
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);
  const [isMemberRejectModalOpen, setIsMemberRejectModalOpen] = useState(false);
  const [noWhatsAppUser, setNoWhatsAppUser] = useState<any>(null);
  const [memberToProcess, setMemberToProcess] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showVisitors, setShowVisitors] = useState(false);
  const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  // Computed
  const pendingMembers = members.filter(m => {
    const rolesStr = formatRoles(m).toLowerCase();
    const isVisitor = rolesStr.includes("visitante") || m.status === "visitor";
    return (m.status === "pending" || m.status === "pending_approval") && !isVisitor && m.status !== "visitor_session";
  });

  const visitors = useMemo(() => {
    // Include regular visitors and those with the "Visitante" role
    return members.filter(m => {
      const rolesStr = formatRoles(m).toLowerCase();
      const isVisitor = rolesStr.includes("visitante") || m.status === "visitor";
      return isVisitor && m.status !== "visitor_session";
    });
  }, [members]);

  const activeMembersForDisplay = showPending
    ? pendingMembers
    : activeTab === "visitantes"
      ? visitors
      : members.filter(m => {
        const rolesStr = formatRoles(m).toLowerCase();
        const isVisitor = rolesStr.includes("visitante") || m.status === "visitor";
        return (
          m.status !== "pending" &&
          m.status !== "pending_approval" &&
          !isVisitor &&
          m.status !== "visitor_session"
        );
      });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Refs for click outside
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (rightSidebarView === "chat-active") {
      scrollToBottom();
    }
  }, [chatMessages, rightSidebarView]);

  const userStatus = profile?.status_online || "online";

  useEffect(() => {
    if (user && profile && !profile.status_online) {
      updatePresenceStatus('online');
    }
  }, [user, profile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-red-500";
      case "away": return "bg-amber-500";
      default: return "bg-gray-500";
    }
  };

  const updatePresenceStatus = async (status: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "members", user.uid), {
        status_online: status,
        lastUpdated: serverTimestamp()
      });
      firestoreService.clearCache("members");
      if (setProfile && profile) {
        setProfile({ ...profile, status_online: status });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState("");

  useEffect(() => {
    if (memberToProcess && isRoleEditModalOpen) {
      setSelectedRoleForEdit(memberToProcess.role || "Membro");
    }
  }, [memberToProcess, isRoleEditModalOpen]);

  const handleUpdateMemberRole = async () => {
    if (!memberToProcess || !selectedRoleForEdit) return;
    try {
      await updateDoc(doc(db, "members", memberToProcess.id), {
        role: selectedRoleForEdit,
        ministries: [selectedRoleForEdit],
        updatedAt: serverTimestamp()
      });
      firestoreService.clearCache("members");
      setIsRoleEditModalOpen(false);
      setMemberToProcess(null);
      if (logAction) {
        logAction("update_member_role", "members", `Alterado cargo de ${memberToProcess.name} para ${selectedRoleForEdit}`, memberToProcess, { ...memberToProcess, role: selectedRoleForEdit, ministries: [selectedRoleForEdit] });
      }
    } catch (err) {
      console.error("Error updating member role", err);
    }
  };

  const handleRejectMember = async () => {
    if (!memberToProcess) return;
    try {
      const reason = rejectionReason || "Sem motivo especificado.";

      // WhatsApp Logic
      const msg = `Paz do Senhor *${memberToProcess.name}*, Seu cadastro no site foi Reprovado⛔\nMotivo: ${reason}\nFicou algum dúvida? Só responder aqui!`;
      const phone = memberToProcess.phone?.replace(/\D/g, "");
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");

      // Delete the pending member
      await deleteDoc(doc(db, "members", memberToProcess.id));
      firestoreService.clearCache("members");

      setIsMemberRejectModalOpen(false);
      setRejectionReason("");
      setMemberToProcess(null);

      if (logAction) {
        logAction("member_rejection", "members", `Recusado cadastro de ${memberToProcess.name}. Motivo: ${reason}`, memberToProcess);
      }
    } catch (err) {
      console.error("Error rejecting member", err);
    }
  };

  const allRoles = useMemo(() => [
    "Direção",
    "Secretaria",
    "Desenvolvedor",
    "Mídia",
    "Coord. Mulheres",
    "Coord. Coreografia",
    "Coord. Vist. Hospitalar",
    "Minis. louvor",
    "Minis. Jovens",
    "Minis. infantil",
    "Diácono",
    "Diaconisa",
    "Obreiro",
    "Recepcionista",
    "Administradores",
    "ED. TON",
    "Visitante",
    "Membro"
  ], []);

  const globalSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();

    const results: any[] = [];

    if (canViewTab('radio')) {
      vignettes.forEach(v => {
        if (v.title?.toLowerCase().includes(query)) {
          results.push({ type: 'radio', item: v, title: v.title, sub: "Vinheta de Rádio", icon: Mic });
        }
      });
    }

    if (canViewTab('membros')) {
      members.filter(m => {
        const rolesStr = formatRoles(m).toLowerCase();
        const isVisitor = rolesStr.includes("visitante") || m.status === "visitor";
        return (
          m.status !== "pending" &&
          m.status !== "pending_approval" &&
          !isVisitor &&
          m.status !== "visitor_session"
        );
      }).forEach(m => {
        if (m.name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query)) {
          results.push({ type: 'membros', item: m, title: m.name, sub: formatRoles(m), icon: Users });
        }
      });
    }

    if (canViewTab('visitantes')) {
      visitors.forEach(v => {
        if (v.name?.toLowerCase().includes(query) || v.phone?.includes(query)) {
          results.push({ type: 'visitantes', item: v, title: v.name, sub: "Visitante", icon: UserSearch });
        }
      });
    }

    if (canViewTab('eventos')) {
      posts.forEach(p => {
        const isMatch = p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query);
        if (isMatch) {
          results.push({ type: 'eventos', item: p, title: p.title, sub: `Evento • ${p.date || "Sem data"}`, icon: PartyPopper });
        }
      });
    }

    if (canViewTab('noticias')) {
      blog.forEach(b => {
        const isMatch = b.title?.toLowerCase().includes(query) || b.content?.toLowerCase().includes(query);
        if (isMatch) {
          results.push({ type: 'noticias', item: b, title: b.title, sub: `Notícia • ${b.date || "Sem data"}`, icon: Newspaper });
        }
      });
    }

    if (canViewTab('agenda')) {
      agenda.forEach(a => {
        if (a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query)) {
          results.push({ type: 'agenda', item: a, title: a.title, sub: a.date || "Sem data", icon: Calendar });
        }
      });
    }

    if (canViewTab('videos')) {
      videos.forEach(v => {
        if (v.title?.toLowerCase().includes(query) || v.description?.toLowerCase().includes(query)) {
          results.push({ type: 'videos', item: v, title: v.title, sub: "Vídeo", icon: Youtube });
        }
      });
    }

    return results.slice(0, 8);
  }, [searchQuery, members, visitors, posts, blog, agenda, videos, vignettes, canViewTab]);

  // Removed seedNotifs logic as it causes permission errors for normal users

  const handleMarkAllAsRead = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const unreadReal = displayNotifications.filter(n => !n.read && !n.isSynthetic);
      const unreadSynthetic = displayNotifications.filter(n => !n.read && n.isSynthetic);

      if (unreadSynthetic.length > 0) {
        setSyntheticReadIds(prev => [...prev, ...unreadSynthetic.map(n => n.id)]);
      }

      if (unreadReal.length === 0) {
        if (unreadSynthetic.length === 0) alert("Nenhuma notificação não lida!");
        return;
      }

      // Optimistic update
      setNotifications(prev => prev.map(n =>
        unreadReal.some(un => un.id === n.id) ? { ...n, read: true } : n
      ));

      const updatePromises = unreadReal.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }));
      await Promise.all(updatePromises);
    } catch (err: any) {
      alert("Erro ao marcar como lido: " + err.message);
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleClearNotifications = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      if (displayNotifications.length === 0) return;

      const syntheticIds = displayNotifications.filter(n => n.isSynthetic).map(n => n.id);
      if (syntheticIds.length > 0) {
        setSyntheticClearedIds(prev => [...prev, ...syntheticIds]);
      }

      // Optimistic update
      const idsToDelete = displayNotifications.filter(n => !n.isSynthetic).map(n => n.id);
      if (idsToDelete.length > 0) {
        setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
        const deletePromises = idsToDelete.map(id => deleteDoc(doc(db, "notifications", id)));
        await Promise.all(deletePromises);
      }
    } catch (err: any) {
      alert("Erro ao limpar notificações: " + err.message);
      console.error("Error clearing notifications:", err);
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

  const currentRole = activeViewRole || profile?.role || "Membro";

  // Auto-redirect for Direção role if they ONLY have Direção role
  useEffect(() => {
    const isStrictlyDirecao = userRolesArray.length === 1 && userRolesArray[0].name === "Direção";
    if (isStrictlyDirecao && activeTab !== "agenda-direcao" && activeTab !== "chat") {
      setActiveTab("agenda-direcao");
    }
  }, [userRolesArray, activeTab, setActiveTab]);

  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [showSkillsDropdownAdmin, setShowSkillsDropdownAdmin] = useState(false);


  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      const updatedSkills = [...availableSkills, newSkillName.trim()];
      await setDoc(doc(db, "settings", "skills"), { list: updatedSkills });
      setAvailableSkills(updatedSkills);
      setNewSkillName("");

      if (logAction) {
        logAction("criar", "settings/skills", `Adicionou nova habilidade: ${newSkillName.trim()}`);
      }
    } catch (err) {
      console.error("Error adding skill:", err);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    try {
      const updatedSkills = availableSkills.filter(s => s !== skillToRemove);
      await setDoc(doc(db, "settings", "skills"), { list: updatedSkills });
      setAvailableSkills(updatedSkills);

      if (logAction) {
        logAction("deletar", "settings/skills", `Removeu habilidade: ${skillToRemove}`);
      }
    } catch (err) {
      console.error("Error removing skill:", err);
    }
  };

  useEffect(() => {
    if (user && profile?.status === "pending") {
      setAuthError("Seu cadastro ainda está em análise. Aguarde a aprovação do administrador.");
    } else if (user && profile?.status === "rejected") {
      setAuthError("Seu cadastro foi reprovado.");
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
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState("");
  const [needsLogoutOnModalClose, setNeedsLogoutOnModalClose] = useState(false);

  useEffect(() => {
    if (showSignUpSuccessModal) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 100, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showSignUpSuccessModal]);

  // Redirecionamento automático para página de solicitação se pendente
  useEffect(() => {
    if (user && profile && (profile.status === "pending" || profile.status === "pending_approval") && !isMasterAdmin) {
      navigate("/solicitacao");
    }
  }, [user, profile, isMasterAdmin, navigate]);
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    instagram: "",
    memberType: "Membro",
    churchRole: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profession: ""
  });

  // Form States
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, collection: string, item?: any } | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showOrganizerDropdown, setShowOrganizerDropdown] = useState(false);
  const [organizerSearch, setOrganizerSearch] = useState("");

  const [isRequestingDate, setIsRequestingDate] = useState(false);
  const [requestFormData, setRequestFormData] = useState<any>({});
  const [isConfirmRequestOpen, setIsConfirmRequestOpen] = useState(false);
  const [requestStatusMessage, setRequestStatusMessage] = useState<{ type: 'success' | 'error' | 'warning', title: string, message: string } | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [itemToReject, setItemToReject] = useState<any>(null);

  // Split location into fields for editing
  useEffect(() => {
    if (isEditing && formData?.location && !formData?.street && !formData?.city) {
      const loc = formData.location;
      // Regex for format: "Rua, Numero - Bairro, Cidade - UF"
      const regex = /^(.*?),\s*(\d+.*?|S\/N)\s*-\s*(.*?),\s*(.*?)\s*-\s*([A-Za-z]{2})$/i;
      const match = loc.match(regex);
      if (match) {
        setFormData(prev => ({
          ...prev,
          street: match[1],
          streetNumber: match[2],
          neighborhood: match[3],
          city: match[4],
          state: match[5].toUpperCase()
        }));
      } else {
        // Simple fallback splits for less structured strings
        const commaParts = loc.split(',').map(s => s.trim());
        if (commaParts.length >= 2) {
          setFormData(prev => ({ ...prev, street: commaParts[0], streetNumber: commaParts[1] }));
        }
      }
    }
  }, [isEditing, formData?.location]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<any>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isImportEventDialogOpen, setIsImportEventDialogOpen] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");

  const [localSettings, setLocalSettings] = useState<any>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("todos");
  const [logFilterCategory, setLogFilterCategory] = useState("todos");
  const [logFilterUser, setLogFilterUser] = useState("todos");
  const [logFilterDate, setLogFilterDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const logAction = async (action: string, target: string, details: string, oldData?: any, newData?: any) => {
    if (!user) return;
    if (isGuest) return;

    let extendedDetails = details;

    if (oldData && newData) {
      const changes: string[] = [];
      const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

      keys.forEach(key => {
        if (['id', 'updatedAt', 'createdAt', 'authorId', 'authorName', 'lastLogin', 'invitedMembersIds'].includes(key)) return;

        const oldVal = oldData[key];
        const newVal = newData[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            if (key === 'gallery' || key === 'images') {
              const lenDiff = newVal.length - oldVal.length;
              if (lenDiff > 0) changes.push(`Adicionou ${lenDiff} fotos em ${key}`);
              else if (lenDiff < 0) changes.push(`Removeu ${Math.abs(lenDiff)} fotos de ${key}`);
              else changes.push(`Substituiu fotos na galeria`);
            } else if (key === 'invitedMembers' || key === 'guests') {
              const added = newVal.filter((n: any) => !oldVal.some((o: any) => o.id === n.id || o.name === n.name)).length;
              const removed = oldVal.filter((o: any) => !newVal.some((n: any) => o.id === n.id || o.name === n.name)).length;
              if (added > 0) changes.push(`Adicionou ${added} participantes/convidados`);
              if (removed > 0) changes.push(`Removeu ${removed} participantes/convidados`);
            } else {
              changes.push(`Alterou lista ${key}`);
            }
          } else if (typeof newVal === 'boolean') {
            changes.push(`${key}: ${oldVal ? 'Sim' : 'Não'} → ${newVal ? 'Sim' : 'Não'}`);
          } else if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url')) {
            changes.push(`Alterou link/imagem de ${key}`);
          } else {
            changes.push(`${key}: "${oldVal || 'vazio'}" para "${newVal || 'vazio'}"`);
          }
        }
      });

      if (changes.length > 0) {
        extendedDetails += ` | Detalhes: ${changes.join('; ')}`;
      }
    }

    try {
      await addDoc(collection(db, "audit-logs"), {
        action,
        target,
        details: extendedDetails,
        fullDetails: oldData || newData ? { old: oldData || null, new: newData || null } : null,
        userId: user.uid,
        userName: profile?.name || user.displayName || "Visitante",
        userEmail: user.email,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao registrar log:", error);
    }
  };

  // Real-time listeners & On-demand fetching
  useEffect(() => {
    if (!user) return;

    // Fetch total counts only on dashboard or once
    const fetchCounts = async () => {
      if (!isAdmin && !profile?.role) return;

      const safeGetCount = async (coll: any, label: string) => {
        try {
          const snap = await getCountFromServer(coll);
          return snap.data().count;
        } catch (err: any) {
          console.error(`Error fetching count for ${label}:`, err);
          return 0;
        }
      };

      try {
        const [membersCount, agendaCount, vignettesCount, postsCount, blogCount, videosCount, unreadCount] = await Promise.all([
          activeTab === "visao-geral" ? safeGetCount(collection(db, "members"), "members") : Promise.resolve(counts.members),
          activeTab === "visao-geral" ? safeGetCount(collection(db, "agenda"), "agenda") : Promise.resolve(counts.agenda),
          activeTab === "visao-geral" ? safeGetCount(collection(db, "vignettes"), "vignettes") : Promise.resolve(counts.vignettes),
          activeTab === "visao-geral" ? safeGetCount(collection(db, "posts"), "posts") : Promise.resolve(counts.posts),
          activeTab === "visao-geral" ? safeGetCount(collection(db, "blog"), "blog") : Promise.resolve(counts.blog),
          activeTab === "visao-geral" ? safeGetCount(collection(db, "videos"), "videos") : Promise.resolve(counts.videos),
          safeGetCount(query(
            collection(db, "notifications"),
            where("userId", "in", isAdmin ? [user?.uid, "all", "admin"] : [user?.uid, "all"]),
            where("read", "==", false)
          ), "notifications")
        ]);

        setCounts({
          members: membersCount,
          agenda: agendaCount,
          vignettes: vignettesCount,
          posts: postsCount,
          blog: blogCount,
          videos: videosCount,
          unreadNotifications: unreadCount
        });
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    };

    if (activeTab === "visao-geral" || counts.unreadNotifications === 0) {
      fetchCounts();
    }

    // Load Settings and Skills (Real-time for settings, Cached for skills)
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });

    const loadSkills = async () => {
      try {
        const skillsData = await firestoreService.getDoc<any>("settings", "skills", 1000 * 60 * 60 * 24); // 24 hours TTL
        if (skillsData) setAvailableSkills(skillsData.list || []);
      } catch (err) {
        console.error("Error loading skills", err);
      }
    };

    loadSkills();

    // Load Notifications (Always keep this real-time but limited)
    let unsubNotifs = () => { };
    if (!isGuest) {
      unsubNotifs = onSnapshot(query(
        collection(db, "notifications"),
        where("userId", "in", isAdmin ? [user?.uid, "all", "admin"] : [user?.uid, "all"]),
        orderBy("createdAt", "desc"),
        limit(50)
      ), (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => {
      unsubNotifs();
      unsubSettings();
    };
  }, [user, isAdmin, activeTab]);

  // Tab-specific data loading (On-demand)
  useEffect(() => {
    if (!user || (!isAdmin && !profile?.role)) return;

    // Load critical data on mount (Agenda for Home and Posts for Feed)
    const loadInitialData = async () => {
      try {
        const [agendaData, postsData, membersData] = await Promise.all([
          firestoreService.getCollection<any>("agenda", [orderBy("date", "asc"), limit(150)], 1000 * 60 * 60), // 1 hour TTL
          firestoreService.getCollection<any>("posts", [orderBy("createdAt", "desc"), limit(4)], 1000 * 60 * 60), // 1 hour TTL
          firestoreService.getCollection<any>("members", [], 1000 * 60 * 5) // 5 min TTL
        ]);

        setAgenda(agendaData);
        setPosts(postsData);
        setMembers(membersData);

        // Calculate counts from membersData
        const newRoleCounts: Record<string, number> = {};
        allRoles.forEach(role => {
          if (role === "Diácono") {
            newRoleCounts[role] = membersData.filter(m =>
              m.role === "Diácono" || m.role === "diacono" || m.role === "Diácono (Homem)" || m.role === "Diacono"
            ).length;
          } else if (role === "Diaconisa") {
            newRoleCounts[role] = membersData.filter(m =>
              m.role === "Diaconisa" || m.role === "diaconisa" || m.role === "Diaconisa (Mulher)"
            ).length;
          } else {
            newRoleCounts[role] = membersData.filter(m => m.role === role).length;
          }
        });

        newRoleCounts["Diaconia"] = (newRoleCounts["Diácono"] || 0) + (newRoleCounts["Diaconisa"] || 0);
        newRoleCounts["Visitantes"] = membersData.filter(m => m.status === "visitor_session").length;

        setRoleCounts(newRoleCounts);
        setPendingMembersCount(membersData.filter(m => ["pending", "pending_approval"].includes(m.status)).length);

        // Only one specific count for pending agenda
        const pendingAgendaCount = await firestoreService.getCount(collection(db, "agenda"), [where("status", "==", "pending")], 1000 * 60 * 60);
        setPendingAgendaCount(pendingAgendaCount);

      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };

    loadInitialData();

    const loadTabData = async () => {
      try {
        if (activeTab === "eventos") {
          const data = await firestoreService.getCollection<any>("posts", [orderBy("createdAt", "desc"), limit(eventsLimit)], 1000 * 60 * 15);
          setPosts(data);
        } else if (activeTab === "noticias") {
          const data = await firestoreService.getCollection<any>("blog", [orderBy("createdAt", "desc"), limit(newsLimit)], 1000 * 60 * 15);
          setBlog(data);
        } else if (activeTab === "membros" || activeTab === "visitantes") {
          const data = await firestoreService.getCollection<any>("members", [], 1000 * 60 * 1); // 1 min TTL when opening tab
          data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setMembers(data);
        } else if (activeTab === "agenda-direcao") {
          const data = await firestoreService.getCollection<any>("agenda-direcao", [orderBy("date", "asc"), limit(150)], 1000 * 60 * 60); // 1 hour TTL
          setAgendaDirecao(data);
        } else if (activeTab === "radio") {
          const [vigs, tracks, artists] = await Promise.all([
            firestoreService.getCollection<any>("vignettes", [orderBy("createdAt", "desc")], 1000 * 60 * 60 * 24),
            firestoreService.getCollection<any>("radio-playlist", [orderBy("order", "asc")], 1000 * 60 * 60 * 24),
            firestoreService.getCollection<any>("radio-artists", [orderBy("name", "asc")], 1000 * 60 * 60 * 24)
          ]);
          setVignettes(vigs);
          setRadioTracks(tracks);
          setRadioArtists(artists);
        } else if (activeTab === "logs" && canViewLogs && !isGuest) {
          const data = await firestoreService.getCollection<any>("audit-logs", [orderBy("timestamp", "desc"), limit(100)], 1000 * 60 * 30);
          setLogs(data);
        } else if (activeTab === "videos") {
          const data = await firestoreService.getCollection<any>("videos", [orderBy("createdAt", "desc"), limit(videosLimit)], 1000 * 60 * 60 * 24);
          setVideos(data);
        }
      } catch (err) {
        console.error(`Error loading data for tab ${activeTab}:`, err);
      }
    };

    if (activeTab !== "visao-geral" && activeTab !== "agenda" && activeTab !== "eventos") {
      loadTabData();
    }
  }, [activeTab, user, isAdmin, eventsLimit, newsLimit, videosLimit]);

  // Radio Specific Listeners (Reverted to standard load in loadTabData)


  useEffect(() => {
    if (!profile?.id) return;

    const unsubChats = onSnapshot(
      query(collection(db, "chats"), where("participants", "array-contains", profile.id)),
      (snap) => {
        let chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // In-memory sort to avoid requiring composite indexes
        chats.sort((a: any, b: any) => {
          const hasUnreadA = a.unreadCount?.[profile.id] > 0 ? 1 : 0;
          const hasUnreadB = b.unreadCount?.[profile.id] > 0 ? 1 : 0;
          if (hasUnreadA !== hasUnreadB) return hasUnreadB - hasUnreadA;

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
    if (activeTab === "noticias") return blog.filter(p => p.title?.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query));
    if (activeTab === "radio") {
      if (radioSubTab === "vignettes") return vignettes.filter(v => v.title?.toLowerCase().includes(query));
      if (radioSubTab === "artists") return radioArtists.filter(a => a.name?.toLowerCase().includes(query));
      return radioTracks.filter(t => t.title?.toLowerCase().includes(query));
    }
    if (activeTab === "membros" || activeTab === "visitantes") {
      const source = activeTab === "visitantes" ? visitors : members;
      return source.filter(m =>
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.phone?.includes(query)
      );
    }
    if (activeTab === "agenda") return agenda.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query));
    if (activeTab === "agenda-direcao") return agendaDirecao.filter(a => a.title?.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query));
    return [];
  }, [activeTab, searchQuery, posts, members, agenda, agendaDirecao, vignettes, radioTracks, radioSubTab]);

  const syncDriveFolder = async () => {
    if (!formData.driveFolderId) {
      alert("Por favor, cole os links das pastas do Google Drive primeiro.");
      return;
    }

    setIsSyncing(true);
    try {
      const folderLinks = formData.driveFolderId.split(/[\n,]+/).map((l: string) => l.trim()).filter(Boolean);
      let allIds: string[] = [];

      for (const link of folderLinks) {
        let folderId = link;

        // Se for um link completo, extrai o ID
        if (folderId.includes("drive.google.com")) {
          // Tenta vários padrões de link do Drive
          const folderPatterns = [
            /\/folders\/([a-zA-Z0-9-_]+)/,
            /[?&]id=([a-zA-Z0-9-_]+)/,
            /\/open\?id=([a-zA-Z0-9-_]+)/,
            /\/drive\/mobile\/folders\/([a-zA-Z0-9-_]+)/
          ];

          for (const pattern of folderPatterns) {
            const match = folderId.match(pattern);
            if (match) {
              folderId = match[1];
              break;
            }
          }
        }

        // Tenta usar o proxy local para evitar NetworkError (CORS) e falhas de serviços externos
        const response = await fetch(`/api/drive-proxy?id=${folderId}`);

        if (!response.ok) {
          console.warn(`Erro ao acessar a pasta ${folderId}`);
          continue;
        }

        const content = await response.text();

        if (content.includes("Google Drive - Vírus") || content.includes("Login de Contas do Google")) {
          console.warn(`A pasta ${folderId} parece não estar pública.`);
          continue;
        }

        const ids: string[] = [];

        // Lógica 1: Padrão JSON interno [ "ID", "Name", ..., "image/jpeg" ]
        // Este é o mais confiável para pastas públicas
        const jsonPattern = /"([a-zA-Z0-9-_]{25,})","[^"]+",\d+[^\]]+?"image\/[a-z]+"/g;
        const jsonMatches = content.match(jsonPattern);
        if (jsonMatches) {
          jsonMatches.forEach((m: string) => {
            const idMatch = m.match(/"([a-zA-Z0-9-_]{25,})"/);
            if (idMatch && !idMatch[1].includes('-header') && !idMatch[1].includes('flip-list')) {
              ids.push(idMatch[1]);
            }
          });
        }

        // Lógica 2: Fallback se a Lógica 1 não encontrar nada
        if (ids.length === 0) {
          // Procure por strings que pareçam IDs (28-35 chars) mas que NÃO sejam classes CSS conhecidas do Drive
          const genericIdRegex = /"([a-zA-Z0-9-_]{28,35})"/g;
          let m;
          const blacklist = [
            'flip-list', 'last-modified', 'header', 'view-header', 'folder-view',
            'accessibility', 'selection', 'grid-view', 'list-view', 'caption'
          ];

          while ((m = genericIdRegex.exec(content)) !== null) {
            const id = m[1];
            const isBlacklisted = blacklist.some(term => id.includes(term));

            if (id !== folderId && !isBlacklisted && id.length >= 28) {
              ids.push(id);
            }
          }
        }

        // Lógica 3: Buscar IDs em URLs de miniatura ou preview (comum em listagens públicas)
        if (ids.length === 0) {
          // Padrão do Drive para thumbnails: /d/ID=... ou ?id=ID
          const thumbRegex = /\/d\/([a-zA-Z0-9-_]{25,})/g;
          let m;
          while ((m = thumbRegex.exec(content)) !== null) {
            if (m[1] !== folderId) ids.push(m[1]);
          }
        }

        const uniqueIds = Array.from(new Set(ids)).filter((id: string) =>
          id !== folderId &&
          !["drive-sdk", "docs-python", "googledrive"].includes(id) &&
          (!id.includes('-') || id.length > 30)
        );

        allIds = [...allIds, ...uniqueIds];
      }

      if (allIds.length > 0) {
        const currentGallery = Array.isArray(formData.gallery) ? formData.gallery : typeof formData.gallery === 'string' ? formData.gallery.split('\n').filter((l: string) => l.trim()) : [];
        const combinedUnique = Array.from(new Set([...currentGallery, ...allIds]));

        setFormData({
          ...formData,
          gallery: combinedUnique,
          driveFolderId: ""
        });
        alert(`${allIds.length} fotos detectadas com sucesso nas pastas fornecidas! Foram adicionadas à galeria.`);
      } else {
        alert("Nenhuma foto encontrada. Certifique-se de que:\n1. Os links são de PASTAS (não fotos individuais).\n2. As pastas estão como 'Qualquer pessoa com o link pode ver'.\n3. Existem fotos (JPG/PNG) dentro das pastas.");
      }
    } catch (err) {
      console.error("Erro ao sincronizar pasta:", err);
      alert("Erro ao conectar com o Google Drive. Verifique se o link está correto e se a pasta é pública.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let collectionName = activeTab === "eventos" ? "posts" :
      activeTab === "noticias" ? "blog" :
        activeTab === "membros" || activeTab === "visitantes" ? "members" :
          activeTab === "agenda-direcao" ? "agenda-direcao" :
            activeTab === "radio" ? (radioSubTab === "vignettes" ? "vignettes" : radioSubTab === "artists" ? "radio-artists" : "radio-playlist") :
              "agenda";
    try {

      // Basic validations before saving
      if (activeTab === "radio") {
        if (radioSubTab === "tracks" && (!formData.title || !formData.youtubeId)) {
          alert("Por favor, preencha o título e cole um link válido do YouTube.");
          setIsSubmitting(false);
          return;
        }
        if (radioSubTab === "vignettes" && (!formData.title || !formData.youtubeUrl)) {
          alert("Por favor, preencha o título e passe um link para a vinheta.");
          setIsSubmitting(false);
          return;
        }
        if (radioSubTab === "artists" && !formData.name) {
          alert("Por favor, insira o nome do artista.");
          setIsSubmitting(false);
          return;
        }
      }

      // Override collection if editing an item that has a specific type (e.g. from merged agenda)
      if (selectedItem?.type) {
        if (selectedItem.type === 'post' || selectedItem.type === 'eventos') collectionName = 'posts';
        else if (selectedItem.type === 'agenda-direcao') collectionName = 'agenda-direcao';
        else if (selectedItem.type === 'noticias') collectionName = 'blog';
        else if (selectedItem.type === 'membros' || selectedItem.type === 'visitantes') collectionName = 'members';
        else if (selectedItem.type === 'radio') collectionName = radioSubTab === "vignettes" ? "vignettes" : radioSubTab === "artists" ? "radio-artists" : "radio-playlist";
        else if (selectedItem.type === 'videos') collectionName = 'videos';
        else if (selectedItem.type === 'agenda') collectionName = 'agenda';
      }

      // Sanitize all values in dataToSave recursively to remove any 'undefined'
      const sanitizeData = (obj: any): any => {
        if (obj === undefined) return null;
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(v => sanitizeData(v)).filter(v => v !== undefined);
        }
        // Preserve Firebase Timestamps and other special objects
        if (obj.seconds !== undefined || obj._seconds !== undefined) return obj;

        return Object.entries(obj).reduce((acc, [key, value]) => {
          const sanitized = sanitizeData(value);
          if (sanitized !== undefined) {
            acc[key] = sanitized;
          }
          return acc;
        }, {} as any);
      };

      let dataToSave = sanitizeData(formData);

      // Mark origin menu - Priority: Existing source > Item Type > Active Tab
      const effectiveSource = selectedItem?.menuSource ||
        (selectedItem?.type === 'post' ? 'eventos' :
          selectedItem?.type === 'agenda' ? 'agenda' :
            (activeTab === "eventos" ? "eventos" : activeTab === "agenda" ? "agenda" : undefined));

      if (effectiveSource !== undefined) {
        dataToSave.menuSource = effectiveSource;
      }
      dataToSave.updatedAt = serverTimestamp();
      dataToSave.authorId = user?.uid;
      dataToSave.organization = formData.organization || (profile?.ministerio ? profile.ministerio : null);

      // Identify newly added members to notify via chat
      const currentInvited = formData.invitedMembers || [];
      const previousInvitedIds = new Set((selectedItem?.invitedMembers || []).map((m: any) => m.id));
      const newInvitedMembers = currentInvited.filter((m: any) => !previousInvitedIds.has(m.id));

      // Merge address fields into location string if they exist
      if (formData.street || formData.city) {
        const streetNum = formData.street ? (formData.streetNumber ? `${formData.street}, ${formData.streetNumber}` : formData.street) : "";

        // Custom format: "Street, Num - Neighborhood, City - UF"
        let formattedLocation = streetNum;
        if (formData.neighborhood) formattedLocation += ` - ${formData.neighborhood}`;
        if (formData.city) formattedLocation += `, ${formData.city}`;
        if (formData.state) formattedLocation += ` - ${formData.state.toUpperCase()}`;

        dataToSave.location = formattedLocation || formData.location;
      }

      if (activeTab === "membros") {
        if (formData.isCompanyWhatsappSame) {
          dataToSave.companyWhatsapp = formData.phone || formData.companyWhatsapp;
        }

        if (formData.ministries?.length > 0) {
          // Clean up 'Desenvolvimento' to 'Desenvolvedor'
          dataToSave.ministries = formData.ministries.map((m: any) => {
            if (typeof m === 'string') return m === "Desenvolvimento" ? "Desenvolvedor" : m;
            return { ...m, name: m.name === "Desenvolvimento" ? "Desenvolvedor" : m.name };
          });

          const firstMinistry = dataToSave.ministries[0];
          dataToSave.role = typeof firstMinistry === 'string' ? firstMinistry : firstMinistry.name;
          dataToSave.isLeader = dataToSave.ministries.some((m: any) => typeof m === 'object' && m.isLeader);
        }
      }

      let itemDocId = selectedItem?.id;
      if (selectedItem?.id) {
        await setDoc(doc(db, collectionName, selectedItem.id), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (activeTab === "membros" && (selectedItem?.id === user?.uid || selectedItem?.email === user?.email) && auth.currentUser) {
          try {
            await updateProfile(auth.currentUser, {
              displayName: dataToSave.name || auth.currentUser.displayName,
              photoURL: dataToSave.photoURL || auth.currentUser.photoURL
            });
            // Update local profile state to reflect changes immediately
            if (setProfile) setProfile({ ...profile, ...dataToSave });
          } catch (profileErr) {
            console.error("Erro ao sincronizar perfil Auth:", profileErr);
          }
        }

        logAction("atualizar", collectionName, `Atualizou ${activeTab === 'eventos' ? 'evento' : activeTab === 'agenda' ? 'item na agenda' : activeTab === 'radio' ? 'vinheta' : 'registro'}: ${dataToSave.title || dataToSave.name}`, selectedItem, dataToSave);

        // Log Activity
        await addDoc(collection(db, "notifications"), {
          title: "Atividade",
          message: `Atualizou ${activeTab === 'eventos' ? 'evento' : activeTab === 'agenda' ? 'item na agenda' : activeTab === 'radio' ? 'vinheta' : 'perfil'}: ${dataToSave.title || dataToSave.name}`,
          type: "activity",
          memberId: user?.uid || profile?.id || "admin",
          createdAt: serverTimestamp(),
          read: true
        });
      } else {
        const newDoc = await addDoc(collection(db, collectionName), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          authorId: user?.uid || profile?.id || "admin",
          authorName: user?.displayName || profile?.name || "Admin"
        });
        itemDocId = newDoc.id;

        logAction("criar", collectionName, `Criou ${activeTab === 'eventos' ? 'evento' : activeTab === 'agenda' ? 'item na agenda' : activeTab === 'agenda-direcao' ? 'compromisso na direção' : activeTab === 'radio' ? 'vinheta' : 'registro'}: ${dataToSave.title || dataToSave.name} (ID: ${newDoc.id})`, null, dataToSave);

        // Log Activity
        await addDoc(collection(db, "notifications"), {
          title: "Atividade",
          message: `Criou ${activeTab === 'eventos' ? 'evento' : activeTab === 'agenda' ? 'item na agenda' : activeTab === 'agenda-direcao' ? 'compromisso na direção' : activeTab === 'radio' ? 'vinheta' : 'registro'}: ${dataToSave.title || dataToSave.name}`,
          type: "activity",
          memberId: user?.uid || profile?.id || "admin",
          createdAt: serverTimestamp(),
          read: true
        });
      }

      // Clear events cache if we're working with posts
      if (collectionName === "posts") {
        localStorage.removeItem("cachedEvents_v3");
        localStorage.removeItem("cachedEventsTime_v3");
      }

      // Clear firestoreService cache
      firestoreService.clearCache(collectionName);

      // Send auto chat messages to newly invited members
      try {
        if (newInvitedMembers.length > 0 && profile?.id && dataToSave.title) {
          let dateStr = "";
          try {
            if (dataToSave.date) {
              dateStr = ` para ${format(new Date(dataToSave.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
            }
          } catch (e) { }

          for (const member of newInvitedMembers) {
            const chatId = [profile.id, member.id].sort().join('_');
            const isAgendaDirecao = activeTab === "agenda-direcao";
            const verbStr = isAgendaDirecao ? "o compromisso da Direção" : "o evento";
            const autoMsg = `Você foi convocado para ${verbStr} "${dataToSave.title}"${dateStr}.`;

            try {
              await setDoc(doc(db, "chats", chatId), {
                participants: [profile.id, member.id],
                lastMessage: autoMsg,
                lastMessageTime: serverTimestamp(),
                lastSenderId: profile.id,
                [`unreadCount.${member.id}`]: increment(1)
              }, { merge: true });

              await addDoc(collection(db, "chats", chatId, "messages"), {
                text: autoMsg,
                senderId: profile.id,
                timestamp: serverTimestamp()
              });

              await addDoc(collection(db, "notifications"), {
                userId: member.id,
                title: "Escala de Compromisso",
                message: `${profile.name || user?.displayName || 'Admin'} escalou você: ${dataToSave.title}`,
                read: false,
                type: "chat",
                senderId: profile.id,
                createdAt: serverTimestamp()
              });
            } catch (e) {
              console.error("Error sending auto chat message:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error processing invited members:", err);
      }

      // Send auto chat message to the new organizer if set
      try {
        if (dataToSave.organizerId && dataToSave.organizerId !== selectedItem?.organizerId && profile?.id && dataToSave.title) {
          const chatId = [profile.id, dataToSave.organizerId].sort().join('_');
          let dateStr = "";
          try {
            if (dataToSave.date) {
              dateStr = ` para ${format(new Date(dataToSave.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
            }
          } catch (e) { }
          const autoMsg = `Você foi escalado como organizador de "${dataToSave.title}"${dateStr}.`;

          try {
            await setDoc(doc(db, "chats", chatId), {
              participants: [profile.id, dataToSave.organizerId],
              lastMessage: autoMsg,
              lastMessageTime: serverTimestamp(),
              lastSenderId: profile.id,
              [`unreadCount.${dataToSave.organizerId}`]: increment(1)
            }, { merge: true });

            await addDoc(collection(db, "chats", chatId, "messages"), {
              text: autoMsg,
              senderId: profile.id,
              timestamp: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
              userId: dataToSave.organizerId,
              title: "Organizador de Compromisso",
              message: `${profile.name || user?.displayName || 'Admin'} colocou você como organizador: ${dataToSave.title}`,
              read: false,
              type: "chat",
              senderId: profile.id,
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Erro ao notificar organizador", e);
          }
        }
      } catch (err) {
        console.error("Error processing new organizer:", err);
      }

      // Gatilho: Notificação de Novo Evento/Notícia se solicitado
      /*
      if (formData.notifyAll) {
        fetch("/backend/push/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: activeTab === "eventos" ? "📅 Novo Evento!" : "📰 Nova Notícia!",
            message: formData.title,
            target: "all"
          })
        }).catch(e => console.error("Erro ao notificar geral:", e));
      }

      // Gatilho: Notificação para membros convidados/mencionados
      if (activeTab === "eventos" && formData.invitedMembers?.length > 0) {
        const invitedIds = formData.invitedMembers.map((m: any) => m.id);
        fetch("/backend/push/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Você foi mencionado!",
            message: `Você foi convidado para o evento: ${formData.title}`,
            target: "specific",
            userIds: invitedIds
          })
        }).catch(e => console.error("Erro ao notificar convidados:", e));
      }
      */

      if (activeTab === "membros" || activeTab === "visitantes") {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#BF76FF', '#7300FF', '#CC7EFF', '#ffffff']
        });
        alert("Alterações salvas com sucesso!");
      }

      setIsEditing(false);
      setSelectedItem(null);
      setFormData({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
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
          type: 'post',
          status: p.status || 'approved'
        };
      });
    const fromAgenda = agenda.map(a => ({ ...a, type: 'agenda' }));
    return [...fromAgenda, ...fromPosts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [posts, agenda]);

  const eventsToImport = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let source = [];
    if (activeTab === "agenda") {
      source = agendaDirecao.map(a => ({ ...a, type: 'agenda-direcao' }));
    } else if (activeTab === "agenda-direcao") {
      source = agenda.map(a => ({ ...a, type: 'agenda' }));
    }

    return source.filter(item => {
      // Helper to parse date from string or Firestore Timestamp
      const parseItemDate = (d: any) => {
        if (!d) return null;
        if (d.toDate) return d.toDate();
        return new Date(d);
      };

      const itemDate = parseItemDate(item.date);
      if (!itemDate || isNaN(itemDate.getTime())) return false;

      const isFutureOrToday = itemDate >= today;
      const matchesSearch = item.title?.toLowerCase().includes(importSearch.toLowerCase()) ||
                            item.location?.toLowerCase().includes(importSearch.toLowerCase());
      
      return isFutureOrToday && matchesSearch;
    });
  }, [activeTab, agenda, agendaDirecao, importSearch]);

  const handleImportEvent = async (event: any) => {
    const targetCollection = activeTab === "agenda-direcao" ? "agenda-direcao" : "agenda";
    const tabLabel = activeTab === "agenda-direcao" ? "agenda da direção" : "agenda geral";

    try {
      // Replicar EXATAMENTE igual todos os campos do evento original
      const { id: originalId, createdAt: originalCreatedAt, type: sourceType, ...originalData } = event;
      
      const dataToSave = {
        ...originalData,
        createdAt: serverTimestamp(),
        authorId: user?.uid || profile?.id || "admin",
        authorName: user?.displayName || profile?.name || "Admin",
        status: 'approved'
      };

      await addDoc(collection(db, targetCollection), dataToSave);

      // Log Activity
      await addDoc(collection(db, "notifications"), {
        title: "Atividade",
        message: `Importou evento para ${tabLabel}: ${dataToSave.title}`,
        type: "activity",
        memberId: user?.uid || profile?.id || "admin",
        createdAt: serverTimestamp(),
        read: true
      });

      setIsImportEventDialogOpen(false);
      // Clear firestoreService cache
      firestoreService.clearCache(targetCollection);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, targetCollection);
    }
  };

  const handleDelete = (item: any, collectionOverride?: string) => {
    if (!item) return;
    const id = typeof item === 'string' ? item : (item.id || item.uid);
    const itemData = typeof item === 'object' ? item : null;
    const colName = collectionOverride || (activeTab === "eventos" ? "posts" : activeTab === "radio" ? (radioSubTab === "vignettes" ? "vignettes" : radioSubTab === "artists" ? "radio-artists" : "radio-playlist") : (activeTab === "membros" || activeTab === "visitantes") ? "members" : activeTab === "agenda-direcao" ? "agenda-direcao" : "agenda");

    if (!id) {
      console.error('Tentativa de excluir item sem ID:', item);
      return;
    }

    setDeleteConfirm({ id, collection: colName, item: itemData });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { id, collection: col, item: itemToDelete } = deleteConfirm;

    try {
      setIsSubmitting(true);
      await deleteDoc(doc(db, col, id));
      logAction("excluir", col, `Excluiu item: ${itemToDelete?.title || itemToDelete?.name || id}`, itemToDelete, null);

      // Clear firestoreService cache
      firestoreService.clearCache(col);

      if (col === "posts") {
        localStorage.removeItem("cachedEvents_v3");
        localStorage.removeItem("cachedEventsTime_v3");
      }

      setSelectedItem(null);
      setIsEditing(false);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      handleFirestoreError(err, OperationType.DELETE, col);
      setDeleteConfirm(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = (member: any) => {
    // Centralizando conversa no menu lateral direito
    setActiveChatUser(member);
    setRightSidebarView("chat-active");
  };

  const handleNotifyOrganizer = (event: any) => {
    // Prioritize organizerId over authorId
    const targetUserId = event.organizerId || event.authorId;
    let organizer = null;

    if (targetUserId) {
      organizer = members.find(m => m.id === targetUserId || m.uid === targetUserId);
    }

    // Fallback search by name if not found by ID
    if (!organizer && event.organizer) {
      organizer = members.find(m => (m.name || "").toLowerCase() === event.organizer.toLowerCase());
    }

    if (!organizer) {
      alert("Organizador não encontrado na lista de membros.");
      return;
    }

    const phone = organizer.phone || organizer.whatsapp;
    if (!phone) {
      alert("Organizador não possui telefone ou WhatsApp cadastrado.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let dateStr = "agendada";

    try {
      const eventDate = typeof event.date === 'string' && event.date.includes('/') && event.date.includes(' - ')
        ? parseISO(event.date.split(' - ')[0].split('/').reverse().join('-'))
        : (event.date?.toDate ? event.date.toDate() : new Date(event.date));

      if (eventDate && !isNaN(eventDate.getTime())) {
        dateStr = isSameDay(eventDate, new Date()) ? "hoje" : format(eventDate, "dd/MM/yyyy");
      }
    } catch (e) {
      console.error("Erro ao formatar data para notificação:", e);
    }

    const message = `Paz do Senhor *${organizer.name}*, Passando para lembrar que seu compromisso *${event.title}* do dia ${dateStr}, está marcado em nossa agenda!\n\nCaso não consiga realizar ou será cancelado, responder aqui..`;
    const encodedText = encodeURIComponent(message);
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${finalPhone}?text=${encodedText}`, '_blank');
  };

  const confirmWhatsApp = (member: any, message: string) => {
    // Deprecated for internal chat
    openWhatsApp(member);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#BF76FF]/10 rounded-full" />
            <div className="w-16 h-16 border-4 border-[#BF76FF] border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase animate-pulse">Iniciando...</p>
        </div>
      </div>
    );
  }

  // Redirecionamento instantâneo se profile for pending
  if (user && profile && (profile.status === "pending" || profile.status === "pending_approval") && !isMasterAdmin) {
    return null; // O useEffect fará o navigate
  }

  // Dashboard access logic: must have user, approved profile and some dashboard permissions
  const hasDashboardAccess = user &&
    profile &&
    (profile.status === "approved" || profile.status === "active" || user.email === "iempministerioprofecia@gmail.com") &&
    (isMasterAdmin || canViewTab("visao-geral") || canViewTab("eventos") || canViewTab("membros") || canViewTab("agenda") || canViewTab("agenda-direcao"));

  if (!hasDashboardAccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6">
        {/* Header / Back Button */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center pb-20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold">
              {isSignUpMode ? (
                <>Solicitar <span className="text-[#BF76FF]">Acesso</span></>
              ) : (
                <>Área de <span className="text-[#BF76FF]">Membros</span></>
              )}
            </h1>
            {/* Support button always visible in header */}
            <button
              onClick={() => window.open('https://wa.me/5532998288650?text=Ol%C3%A1%20estou%20tendo%20dificuldades%20para%20acessar%20ou%20cadastrar%20no%20site%2C%20poderia%20me%20ajudar%3F', '_blank')}
              className="flex items-center justify-center h-10 px-4 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all cursor-pointer font-bold text-[10px] gap-2 uppercase tracking-widest"
              title="Ajuda via WhatsApp"
            >
              <MessageCircle className="w-5 h-5 text-current" />
              Suporte
            </button>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl mb-6 flex items-center justify-between">
              <span>{authError}</span>
              <button onClick={() => setAuthError("")} className="hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {messageParam && !authError && !user && (
            <div className="bg-[#BF76FF]/10 border border-[#BF76FF]/20 text-[#BF76FF] text-sm p-4 rounded-xl mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="font-medium">{messageParam}</span>
              </div>
            </div>
          )}

          {reasonParam === 'gallery' && !authError && !user && (
            <div className="bg-primary/10 border border-primary/20 text-primary text-sm p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="font-black uppercase tracking-widest text-[10px]">Acesso à Galeria</p>
                <p className="text-white/60 text-xs font-bold">Faça login para ver as fotos dos eventos.</p>
              </div>
            </div>
          )}

          {user && !isMasterAdmin && profile && (profile.status === "approved" || profile.status === "active") && !hasDashboardAccess && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm p-4 rounded-xl mb-6">
              <p className="font-bold mb-1">Acesso Restrito</p>
              <p>Você está logado como <span className="underline">{user.email}</span>, mas esta conta não tem permissão para acessar este painel.</p>
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
                    className={cn("h-16 border rounded-2xl px-6 text-lg transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
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
                    className={cn(
                      "h-16 border rounded-2xl px-6 text-lg transition-all outline-none",
                      isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black",
                      authError ? "border-[#BF76FF] shadow-[0_0_15px_-3px_rgba(191,118,255,0.6)] focus:border-[#BF76FF]" : ""
                    )}
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

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => window.open('https://wa.me/5532998288650?text=Esqueci%20minha%20senha,%20preciso%20de%20ajuda!', '_blank')}
                    className="text-[#BF76FF] hover:underline transition-colors cursor-pointer text-sm font-bold uppercase"
                  >
                    LEMBRAR SENHA
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-16 bg-gradient-to-r from-[#BF76FF] to-[#7300FF] hover:opacity-90 text-white rounded-2xl text-xl font-bold shadow-lg shadow-[#7300FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                onClick={async () => {
                  setAuthError("");
                  if (!email) {
                    setAuthError("Por favor, insira seu e-mail.");
                    return;
                  }

                  setIsSubmitting(true);

                  try {
                    await loginWithEmail(email, password);
                    navigate("/");
                  } catch (error: any) {
                    // Fallback para login legado (só no Firestore)
                    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                      try {
                        const q = query(collection(db, "members"), where("email", "==", email));
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                          const memberDoc = querySnapshot.docs[0];
                          const memberData = memberDoc.data();

                          if (memberData.password && memberData.password === password) {
                            if (memberData.status === "pending") {
                              setAuthError("Seu cadastro ainda está em análise.");
                            } else if (memberData.status === "rejected") {
                              setAuthError("Seu cadastro foi reprovado.");
                            } else {
                              setCustomLogin(true, { id: memberDoc.id, ...memberData });
                              navigate("/");
                            }
                          } else {
                            setAuthError("E-mail ou senha incorretos.");
                          }
                        } else {
                          setAuthError("E-mail ou senha incorretos.");
                        }
                      } catch (fallbackError) {
                        console.error("Erro no login legado:", fallbackError);
                        setAuthError("Erro ao verificar conta antiga. Tente novamente.");
                      }
                    } else if (error.code === 'auth/invalid-email') {
                      setAuthError("E-mail inválido.");
                    } else {
                      setAuthError(error.message || "Erro ao fazer login. Tente novamente.");
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? "Entrando..." : "Logar"}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm font-medium text-white">
                  Não tem uma conta? <button onClick={() => { setIsSignUpMode(true); setAuthError(""); }} className="text-[#BF76FF] hover:underline transition-colors cursor-pointer uppercase font-bold">CADASTRE-SE</button>
                </p>
              </div>

              <div className="text-center mt-10">
                <p className="text-sm text-[#666666]">
                  Ao clicar, você concorda com termos da igreja Evangelica ministério Profecia.<br />
                  <Link to="/terms" className="underline hover:text-white">Termos de uso</Link> & <Link to="/privacy" className="underline hover:text-white">Política de privacidade</Link>
                </p>
              </div>

              <div className="mt-8 border-t border-white/5 pt-8">
                <Button
                  className="w-full h-16 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl text-lg font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border-none"
                  onClick={() => setIsGuestModalOpen(true)}
                >
                  <Users className="w-5 h-5 text-white" />
                  <span className="text-white">Logar como Visitante</span>
                </Button>
              </div>

              <Dialog open={isGuestModalOpen} onOpenChange={setIsGuestModalOpen}>
                <DialogContent className={cn("rounded-[32px] border shadow-2xl p-0 overflow-hidden max-w-md w-[95%] sm:w-full", isDarkMode ? "bg-roxo-bg border-white/10 text-white" : "bg-roxo-bg border-white/10 text-white")}>
                  <div className="p-8">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                          <Users className="w-5 h-5" />
                        </div>
                        Acesso de Visitante
                      </DialogTitle>
                      <DialogDescription className="text-gray-400 mt-2">
                        Preencha seus dados para acessar as áreas abertas aos visitantes.
                      </DialogDescription>
                    </DialogHeader>

                    {guestError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mt-4 animate-in fade-in slide-in-from-top-1">
                        {guestError}
                      </div>
                    )}

                    <div className="space-y-6 mt-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Seu Nome</label>
                        <Input
                          placeholder="Ex: João Silva"
                          className="h-14 border rounded-2xl px-5 transition-all text-sm bg-black border-white/5 text-white placeholder-gray-600"
                          value={guestData.name}
                          onChange={(e) => {
                            setGuestData({ ...guestData, name: e.target.value });
                            setGuestError("");
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Telefone / WhatsApp</label>
                        <Input
                          placeholder="(00) 0 0000-0000"
                          className="h-14 border rounded-2xl px-5 transition-all text-sm bg-black border-white/5 text-white placeholder-gray-600"
                          value={guestData.phone}
                          onChange={(e) => {
                            setGuestData({ ...guestData, phone: formatPhone(e.target.value) });
                            setGuestError("");
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-10">
                      <Button
                        variant="ghost"
                        onClick={() => setIsGuestModalOpen(false)}
                        className="h-14 rounded-2xl font-bold transition-all text-white hover:bg-white/5 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleGuestLogin}
                        className="h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98]"
                      >
                        Entrar agora
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</label>
                    <Input
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      value={signUpData.firstName}
                      onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sobrenome</label>
                    <Input
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      value={signUpData.lastName}
                      onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">E-mail</label>
                  <Input
                    type="email"
                    className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                    <Input
                      type="date"
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white [color-scheme:dark]" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      value={signUpData.birthDate}
                      onChange={(e) => setSignUpData({ ...signUpData, birthDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><MessageSquare className="w-3 h-3 fill-current" /> Telefone/WhatsApp</label>
                    <Input
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      placeholder="(ddd) 0 0000-0000"
                      value={signUpData.phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2 && val.length <= 6) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                        else if (val.length > 6 && val.length <= 10) val = `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
                        else if (val.length > 10) val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7, 11)}`;
                        else if (val.length <= 2 && val.length > 0) val = `(${val}`;
                        setSignUpData({ ...signUpData, phone: val });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Você é?</label>
                  <select
                    className="w-full bg-[#1a1a1a] border border-white/5 h-14 rounded-2xl px-4 text-white focus:ring-0 appearance-none cursor-pointer font-bold"
                    value={signUpData.churchRole}
                    onChange={(e) => {
                      const role = e.target.value;
                      setSignUpData({
                        ...signUpData,
                        churchRole: role,
                        memberType: "Membro"
                      });
                    }}
                  >
                    <option value="">Selecione seu cargo/função...</option>
                    <option value="Membro">Membro</option>
                    {allRoles.filter(r => !["Visitante", "Administradores", "Membro"].includes(r)).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sua Profissão / Serviço</label>
                    <Input
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      placeholder="Pedreiro, Design Gráfico, Contador..."
                      value={signUpData.profession}
                      onChange={(e) => setSignUpData({ ...signUpData, profession: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" /> Instagram (opcional)</label>
                    <Input
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      placeholder="@seu_instagram"
                      value={signUpData.instagram}
                      onChange={(e) => setSignUpData({ ...signUpData, instagram: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Senha</label>
                    <Input
                      type="password"
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirmar Senha</label>
                    <Input
                      type="password"
                      className={cn("border h-14 rounded-2xl px-4 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-16 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#7300FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                onClick={async () => {
                  setAuthError("");
                  if (!signUpData.firstName || !signUpData.lastName || !signUpData.email || !signUpData.password || !signUpData.birthDate || !signUpData.phone || !signUpData.churchRole) {
                    setAuthError("Por favor, preencha todos os campos corretamente, incluindo seu WhatsApp, Nome completo, Cargo, E-mail e Data de Nascimento.");
                    return;
                  }

                  const phoneDigits = signUpData.phone.replace(/[^\d]/g, '');
                  if (phoneDigits.length < 10) {
                    setAuthError("Por favor, informe seu WhatsApp incluindo o DDD.");
                    return;
                  }

                  if (signUpData.password !== signUpData.confirmPassword) {
                    setAuthError("As senhas não coincidem.");
                    return;
                  }

                  setIsSubmitting(true);

                  try {
                    setIsSubmitting(true);
                    setAuthError(""); // Limpa erros antes de começar

                    const signupPayload = {
                      name: `${signUpData.firstName} ${signUpData.lastName}`,
                      phone: signUpData.phone,
                      birthDate: signUpData.birthDate,
                      instagram: signUpData.instagram,
                      churchRole: signUpData.churchRole,
                      profession: signUpData.profession,
                      role: "Membro", // Forcing Member role for all signups that require approval
                      status: "pending" // All signups now require approval as per request
                    };

                    console.log("DEBUG: Iniciando cadastro...");
                    await signupWithEmail(signUpData.email, signUpData.password, signupPayload);

                    const isVisitor = signUpData.memberType === "Visitante";
                    const firstNameToUse = signUpData.firstName;

                    console.log("DEBUG: Cadastro realizado, redirecionando para aprovação...");
                    navigate("/solicitacao");

                    setIsSignUpMode(false);
                    setSignUpData({ firstName: "", lastName: "", email: "", birthDate: "", instagram: "", memberType: "Membro", churchRole: "", phone: "", profession: "", password: "", confirmPassword: "" });

                  } catch (error: any) {
                    setIsSubmitting(false);
                    console.error("DEBUG: Erro no cadastro:", error);
                    let errorMessage = "Erro ao cadastrar. ";
                    if (error.code === 'auth/network-request-failed') {
                      errorMessage = "Falha de conexão. Tente novamente em alguns segundos.";
                    } else if (error.code === 'auth/email-already-in-use') {
                      errorMessage = "Este e-mail já está em uso.";
                    } else if (error.code === 'auth/invalid-email') {
                      errorMessage = "E-mail inválido.";
                    } else {
                      errorMessage = error.message || "Tente novamente.";
                    }
                    setAuthError(errorMessage);
                  } finally {
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

        <Dialog open={showSignUpSuccessModal} onOpenChange={setShowSignUpSuccessModal}>
          <DialogContent className="bg-roxo-bg border-white/10 text-white sm:max-w-[425px] text-center p-8 rounded-[32px]">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-black text-center uppercase tracking-tighter">
                {signUpSuccessMessage.includes("galeria") ? "Bem Vindo!" : "Cadastro Solicitado!"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-400 text-lg whitespace-pre-wrap leading-relaxed">
              {signUpSuccessMessage || "Seu cadastro foi solicitado com sucesso. Retornaremos em breve com a confirmação de acesso ao painel."}
            </p>
            <Button
              className="w-full bg-white/10 border border-white/5 hover:bg-white/20 text-white font-bold cursor-pointer mt-8 h-14 rounded-2xl text-lg transition-all active:scale-[0.98]"
              onClick={async () => {
                setShowSignUpSuccessModal(false);
                if (needsLogoutOnModalClose) {
                  await logout();
                  navigate("/");
                }
              }}
            >
              OK
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-screen h-[100dvh] overflow-hidden font-sans transition-colors duration-500 relative",
      isDarkMode ? "bg-roxo-bg text-white" : "bg-white text-black"
    )}>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar 1: Navigation (Desktop: Sidebar, Mobile: Fixed Bottom Nav) */}
        <aside
          className={cn(
            "transition-all duration-300 ease-in-out z-50",
            "md:h-full md:border-r",
            isSidebarCollapsed ? "md:w-20" : "md:w-64",
            // Mobile specifics
            "fixed bottom-0 left-0 right-0 h-20 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:border-t-0",
            isDarkMode ? "bg-roxo-bg/80 md:bg-roxo-bg border-white/5 backdrop-blur-lg" : "bg-white/80 md:bg-gray-50 border-black/5 backdrop-blur-lg"
          )}
        >
          <div className="hidden md:flex flex-col w-full px-4 pt-6 mb-4">
            <div className="flex items-center justify-between mb-8">
              {!isSidebarCollapsed && (
                <div className="flex flex-col items-start leading-none gap-0 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("font-light text-base tracking-tight", isDarkMode ? "text-white/80" : "text-gray-600")}>Ministério</span>
                    <span className={cn("font-black text-base tracking-tight uppercase", isDarkMode ? "text-white" : "text-black")}>Profecia</span>
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

            {!isSidebarCollapsed && canViewSettings && (isMasterAdmin || profile?.role === "Desenvolvedor") && (
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
                        isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-black/5"
                      )}
                    >
                      <div className="space-y-1 max-h-[400px] overflow-y-auto overflow-x-hidden p-1 scrollbar-hide">
                        {allRoles.map(role => (
                          <button
                            key={`role-option-${role}`}
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={menuItems.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {menuItems.map((item) => (
                      canViewTab(item.id) && visibleTabs.includes(item.id) && (
                        <SortableSidebarItem
                          key={item.id}
                          id={item.id}
                          icon={item.icon}
                          active={activeTab === item.id || (item.id === "membros" && activeTab === "visitantes")}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsEditing(false);
                            setSelectedItem(null);
                            setViewingMember(null);
                            if (item.id === "membros") setShowPending(false);
                          }}
                          label={item.label}
                          collapsed={isSidebarCollapsed}
                          isDark={isDarkMode}
                          notificationCount={
                            item.id === "membros" && (isMasterAdmin || profile?.role === "Desenvolvedor")
                              ? pendingMembersCount
                              : item.id === "agenda" && canCreateEventDirectly
                                ? pendingAgendaCount
                                : 0
                          }
                        />
                      )
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Bottom items (Desktop) */}
              <div className="hidden md:flex flex-col gap-1.5 w-full mt-auto pt-4 border-t border-white/5">
                {/* Manage Visibility Dialog - Moved here */}
                <Dialog>
                  <DialogTrigger
                    render={
                      <button className={cn(
                        "flex items-center gap-3 w-full px-4 h-10 rounded-xl transition-all duration-300",
                        isDarkMode ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-gray-400 hover:text-black"
                      )} />
                    }
                  >
                    <PanelLeftOpen className="w-5 h-5 shrink-0" />
                    {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Personalizar Menu</span>}
                  </DialogTrigger>
                  <DialogContent className={cn("rounded-[32px] border-none shadow-2xl", isDarkMode ? "bg-roxo-bg text-white" : "bg-white text-black")}>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">Gerenciar Itens do Menu</DialogTitle>
                      <DialogDescription className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Selecione quais atalhos você deseja manter visíveis na barra lateral.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-6">
                      {menuItems.map(item => (
                        <button
                          key={`toggle-vis-${item.id}`}
                          onClick={() => {
                            let newVisible;
                            if (visibleTabs.includes(item.id)) {
                              newVisible = visibleTabs.filter(t => t !== item.id);
                            } else {
                              newVisible = [...visibleTabs, item.id];
                            }
                            setVisibleTabs(newVisible);
                            localStorage.setItem('admin_visible_tabs', JSON.stringify(newVisible));
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            visibleTabs.includes(item.id)
                              ? "bg-[#BF76FF]/10 border-[#BF76FF]/30 text-[#BF76FF]"
                              : "bg-transparent border-white/5 text-gray-500 hover:border-white/10"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                {canViewLogs && (
                  <SidebarItem icon={ClipboardList} active={activeTab === "logs"} onClick={() => { setActiveTab("logs"); setRightSidebarView("hidden"); }} label="Auditoria" collapsed={isSidebarCollapsed} isDark={isDarkMode} />
                )}
                {canViewTab("logins") && (
                  <SidebarItem icon={Key} active={activeTab === "logins"} onClick={() => { setActiveTab("logins"); setRightSidebarView("hidden"); }} label="Logins Salvos" collapsed={isSidebarCollapsed} isDark={isDarkMode} />
                )}
              </div>

              {/* Mobile Bottom Bar Items */}
              <div className="md:hidden flex flex-row justify-around w-full items-center px-1 py-1 overflow-x-auto scrollbar-hide relative">
                <div className="absolute top-0 right-4 -translate-y-full mb-1">
                  <span className="text-[8px] font-black text-[#BF76FF]/40 uppercase tracking-widest bg-[#BF76FF]/5 px-2 py-0.5 rounded-full border border-[#BF76FF]/10">V1.0</span>
                </div>
                {canViewTab("visao-geral") && <SidebarItem icon={Home} active={activeTab === "visao-geral" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("visao-geral"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Início" collapsed={true} isDark={isDarkMode} mobile />}
                {canViewTab("avisos") && <SidebarItem icon={Megaphone} active={activeTab === "avisos" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("avisos"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Avisos" collapsed={true} isDark={isDarkMode} mobile />}
                {canViewTab("noticias") && <SidebarItem icon={Newspaper} active={activeTab === "noticias" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("noticias"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Notícias" collapsed={true} isDark={isDarkMode} mobile />}
                {canViewTab("videos") && <SidebarItem icon={Youtube} active={activeTab === "videos" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("videos"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Vídeos" collapsed={true} isDark={isDarkMode} mobile />}
                {canViewTab("agenda") && <SidebarItem icon={Clock} active={activeTab === "agenda" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("agenda"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Agenda" collapsed={true} isDark={isDarkMode} mobile notificationCount={canCreateEventDirectly ? pendingAgendaCount : 0} />}
                {canViewTab("agenda-direcao") && <SidebarItem icon={CalendarDays} active={activeTab === "agenda-direcao" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("agenda-direcao"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Ag. Direção" collapsed={true} isDark={isDarkMode} mobile />}
                {canViewTab("ebd") && <SidebarItem icon={GraduationCap} active={activeTab === "ebd" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("ebd"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="EBD" collapsed={true} isDark={isDarkMode} mobile />}
                {canViewTab("membros") && <SidebarItem icon={Users} active={(activeTab === "membros" || activeTab === "visitantes") && rightSidebarView === "hidden"} onClick={() => { setActiveTab("membros"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); setShowPending(false); setShowVisitors(false); }} label="Membros" collapsed={true} isDark={isDarkMode} mobile notificationCount={(isMasterAdmin || profile?.role === "Desenvolvedor") ? pendingMembersCount : 0} />}
                {canViewTab("tons") && <SidebarItem icon={Music} active={activeTab === "tons" && rightSidebarView === "hidden"} onClick={() => { setActiveTab("tons"); setRightSidebarView("hidden"); setIsEditing(false); setSelectedItem(null); setViewingMember(null); }} label="Tons" collapsed={true} isDark={isDarkMode} mobile />}
                <SidebarItem
                  icon={MessageSquare}
                  active={rightSidebarView === "chat-list" || rightSidebarView === "chat-active"}
                  onClick={() => { setRightSidebarView(rightSidebarView === "chat-list" ? "hidden" : "chat-list"); }}
                  label="Chat"
                  collapsed={true}
                  isDark={isDarkMode}
                  mobile
                  notificationCount={activeChats.reduce((acc, chat) => acc + (chat.unreadCount?.[profile?.id || ''] || 0), 0)}
                />

                <Sheet>
                  <SheetTrigger
                    className={cn(
                      "flex items-center justify-center p-2 rounded-xl transition-all outline-none group shrink-0",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9, rotate: -5 }}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "w-10 h-10 rounded-full overflow-hidden border-2 transition-all shrink-0 p-0.5 bg-white/5",
                        profile?.status_online === 'busy' ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" :
                        profile?.status_online === 'away' ? "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                        "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                      )}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#BF76FF]/10 text-[#BF76FF] font-black text-xs">
                            {profile?.name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </SheetTrigger>
                  <SheetContent side="bottom" className={cn("rounded-t-[32px] p-6 border-none max-h-[90vh] overflow-visible flex flex-col gap-6 transition-all duration-150 [&>button:last-child]:hidden", isDarkMode ? "bg-[#0b0016] text-white" : "bg-white text-black")}>
                    {/* Floating Header Actions (Outside Modal) */}
                    <div className="absolute -top-6 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none">
                      <div className="w-12 h-1.5 bg-white/30 rounded-full mb-2" />
                    </div>
                    {/* Profile Section inside Mobile Menu */}
                    <div className={cn("flex items-center gap-4 p-4 border rounded-2xl transition-colors mt-2", isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5 shadow-sm")}>
                      <div className="relative group">
                        <div className="w-[52px] h-[52px] rounded-full overflow-hidden border-[3px] border-[#BF76FF]/30 object-cover flex items-center justify-center shrink-0">
                          {profile?.photoURL ? (
                            <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className={cn(
                          "absolute bottom-0 right-1 w-4 h-4 rounded-full border-[3px] z-10 transition-colors duration-300 shadow-sm",
                          isDarkMode ? "border-[#0f0f0f]" : "border-white",
                          profile?.status_online === 'busy' ? "bg-red-500" :
                            profile?.status_online === 'away' ? "bg-amber-500" :
                              "bg-green-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-black tracking-tighter text-lg leading-tight truncate", isDarkMode ? "text-white" : "text-black")}>
                          {profile?.name || "Usuário"}
                        </p>
                        <p className="text-xs text-gray-500 font-medium truncate">
                          {profile?.role || "Membro"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Seu Status</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={async () => {
                              if (!user) return;
                              const newProfile = { ...profile, status_online: 'online' };
                              setProfile(newProfile);
                              await updateDoc(doc(db, "members", user.uid), { status_online: 'online' });
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-left",
                              (!profile?.status_online || profile?.status_online === 'online')
                                ? "bg-green-500/10 border-green-500/30 text-green-500"
                                : isDarkMode ? "bg-white/5 border-white/5 text-gray-400" : "bg-black/5 border-black/5 text-gray-600"
                            )}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></div>
                            <span className="text-[10px] font-bold">Online</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (!user) return;
                              const newProfile = { ...profile, status_online: 'busy' };
                              setProfile(newProfile);
                              await updateDoc(doc(db, "members", user.uid), { status_online: 'busy' });
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-left",
                              profile?.status_online === 'busy'
                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                : isDarkMode ? "bg-white/5 border-white/5 text-gray-400" : "bg-black/5 border-black/5 text-gray-600"
                            )}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                            <span className="text-[10px] font-bold">Ocupado</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (!user) return;
                              const newProfile = { ...profile, status_online: 'away' };
                              setProfile(newProfile);
                              await updateDoc(doc(db, "members", user.uid), { status_online: 'away' });
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-left",
                              profile?.status_online === 'away'
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                : isDarkMode ? "bg-white/5 border-white/5 text-gray-400" : "bg-black/5 border-black/5 text-gray-600"
                            )}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                            <span className="text-[10px] font-bold">Ausente</span>
                          </button>
                        </div>
                      </div>

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
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <SheetClose
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-3 rounded-[20px] transition-all border outline-none",
                          isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-black/5 text-black shadow-sm"
                        )}
                        onClick={() => { setActiveViewRole(null); setActiveTab("membros"); setViewingMember(profile || members.find(m => m.email === user?.email)); }}
                      >
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-[10px] uppercase">Meu Perfil</span>
                      </SheetClose>
                      <button
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-[20px] transition-all border outline-none bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                        onClick={handleLogoutAction}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold text-[10px] uppercase">Encerrar Sessão</span>
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </nav>
          </div>

        </aside>

        {/* Main Content Area */}
        <main className={cn("flex-1 flex flex-col min-h-0 transition-all duration-500 relative", isDarkMode ? "bg-roxo-bg" : "bg-gray-50")}>
          {/* Mobile Header */}
          <header className={cn("md:hidden flex h-16 px-6 items-center justify-between border-b transition-colors shrink-0 z-10", isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-black/5")}>
            {/* Logo */}
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-1.5 leading-none">
                <span className={cn("text-lg tracking-tighter", isDarkMode ? "text-gray-400 font-medium" : "text-gray-500 font-medium")}>Ministério</span>
                <span className={cn("text-lg tracking-tighter font-black uppercase", isDarkMode ? "text-white" : "text-black")}>Profecia</span>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Search Icon */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-500 hover:text-[#BF76FF]"
                title="Buscar"
              >
                <Search className="w-[24px] h-[24px]" />
              </button>

              <button
                onClick={() => setIsReportingBug(true)}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-500 hover:text-[#BF76FF]"
                title="Reportar Bug"
              >
                <Bug className="w-[24px] h-[24px]" />
              </button>

              {canViewTab("config") && (
                <button
                  onClick={() => { setActiveTab("config"); setRightSidebarView("hidden"); }}
                  className={cn("p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all", activeTab === "config" ? "text-[#BF76FF]" : "text-gray-500 hover:text-[#BF76FF]")}
                  title="Configurações"
                >
                  <Settings className="w-[24px] h-[24px]" />
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="relative group p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer">
                    <Bell className={cn("w-[24px] h-[24px] transition-colors", isDarkMode ? "text-gray-500" : "text-gray-400")} />
                    {displayNotifications.some(n => !n.read) && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
                    )}
                  </div>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-[320px] rounded-[24px] p-0 border shadow-2xl mt-4 overflow-hidden", isDarkMode ? "bg-roxo-bg border-white/5 text-white" : "bg-white border-black/5 text-black")}>
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-base">Notificações</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="p-2 rounded-lg text-gray-500 hover:text-[#BF76FF] transition-all"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleClearNotifications}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-500 transition-all font-bold text-[10px] uppercase tracking-widest"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="p-2">
                    {displayNotifications.length > 0 ? (
                      displayNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "p-3 rounded-xl mb-1 last:mb-0 transition-all border border-transparent flex flex-col group cursor-pointer",
                            !n.read ? (isDarkMode ? "bg-[#BF76FF]/5 border-[#BF76FF]/10 text-white" : "bg-[#BF76FF]/5 border-[#BF76FF]/10") : (isDarkMode ? "hover:bg-white/5 text-gray-400" : "hover:bg-black/5 text-gray-600")
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              n.type === 'registration' ? 'bg-blue-500/20 text-blue-500' :
                                n.type === 'activity' ? 'bg-[#BF76FF]/20 text-[#BF76FF]' :
                                  n.type === 'bug' ? 'bg-orange-600/20 text-orange-600' :
                                    n.type === 'gallery_removal' || n.type === 'agenda_rejected' ? 'bg-red-500/20 text-red-500' :
                                      n.type === 'birthday' ? 'bg-orange-500/20 text-orange-500 animate-pulse' :
                                        n.type === 'event_feedback' ? 'bg-yellow-500/20 text-yellow-500' :
                                          'bg-green-500/20 text-green-500'
                            )}>
                              {n.type === 'registration' ? <UserPlus className="w-4 h-4" /> :
                                n.type === 'activity' ? <Zap className="w-4 h-4" /> :
                                  n.type === 'bug' ? <Bug className="w-4 h-4" /> :
                                    n.type === 'gallery_removal' ? <Trash2 className="w-4 h-4" /> :
                                      n.type === 'agenda_rejected' ? <XCircle className="w-4 h-4" /> :
                                        n.type === 'birthday' ? <Cake className="w-4 h-4" /> :
                                          n.type === 'event_feedback' ? <Star className="w-4 h-4" /> :
                                            <Bell className="w-4 h-4" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold leading-tight line-clamp-2">{n.title}</p>
                              <p className="text-xs opacity-70 mt-1 line-clamp-3">{n.message}</p>
                              <p className="text-[10px] font-medium opacity-40 mt-1">
                                {getRelativeTime(n.createdAt || n.timestamp)}
                              </p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 rounded-full bg-[#BF76FF] shrink-0 mt-1.5" />
                            )}
                          </div>
                          {n.type === 'birthday' && n.memberPhone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/55${n.memberPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Parabéns ${n.memberName}! Que Deus te abençoe grandemente no seu aniversário!`)}`, '_blank');
                              }}
                              className="mt-3 w-full flex justify-center items-center gap-2 bg-[#25D366]/20 text-[#25D366] py-2 rounded-xl text-xs font-bold hover:bg-[#25D366]/30 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              Dar os Parabéns!
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                        <Bell className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Sem notificações</p>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Desktop Header */}
          <header className={cn("hidden md:flex h-[90px] px-8 items-center justify-between border-b transition-colors shrink-0", isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-black/5")}>
            <div className="flex items-center gap-4">
              {/* Left spacer if needed */}
            </div>

            {/* Global Search Bar (Desktop) */}
            <div className="flex-1 max-w-2xl mx-12 relative group" ref={searchBarRef}>
              <div className="relative">
                <Search className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isDarkMode ? "text-gray-500 group-focus-within:text-[#BF76FF]" : "text-gray-400 group-focus-within:text-[#BF76FF]")} />
                <input
                  type="text"
                  placeholder="Pesquisar evento, membro, visitante, notícia, vídeo ou agenda..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) setIsSearchOpen(true);
                    else setIsSearchOpen(false);
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) setIsSearchOpen(true);
                  }}
                  className={cn(
                    "w-full h-14 rounded-3xl pl-14 pr-6 text-sm font-medium transition-all outline-none border shadow-sm",
                    isDarkMode
                      ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-[#BF76FF]/30 text-white placeholder:text-gray-600"
                      : "bg-gray-100 border-transparent focus:bg-white focus:border-[#BF76FF]/30 focus:shadow-xl text-black placeholder:text-gray-400"
                  )}
                />
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchOpen && searchQuery.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className={cn(
                      "absolute top-full left-0 right-0 mt-4 rounded-3xl p-3 border shadow-2xl z-[100] max-h-[480px] overflow-y-auto scrollbar-hide",
                      isDarkMode ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5"
                    )}
                  >
                    {globalSearchResults.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1">
                        {globalSearchResults.map((res, i) => (
                          <button
                            key={`search-global-${res.type}-${res.item?.id || i}`}
                            onClick={() => {
                              if (res.type === 'membros') setViewingMember(res.item);
                              setSelectedItem(res.item);
                              setFormData({ ...res.item });
                              setActiveTab(res.type);
                              setIsEditing(!(res.type === 'membros' || res.type === 'agenda' || res.type === 'visitantes'));
                              setIsReadOnly(true);
                              setSearchQuery("");
                              setIsSearchOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left",
                              isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                            )}
                          >
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                              <res.icon className="w-6 h-6 text-[#BF76FF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-black tracking-tight text-sm truncate", isDarkMode ? "text-white" : "text-black")}>{res.title}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{res.sub}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-[#BF76FF]/10 text-[#BF76FF]">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                        <Search className="w-12 h-12 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum resultado encontrado</p>
                        <p className="text-[10px] mt-1">Tente pesquisar por termos diferentes</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-4">

              {/* Notifications Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="relative group p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                    <Bell className={cn("w-[26px] h-[26px] transition-colors", isDarkMode ? "text-gray-500 group-hover:text-white" : "text-gray-400 group-hover:text-black")} />
                    {displayNotifications.some(n => !n.read) && (
                      <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0a] shadow-lg" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("w-[340px] rounded-[24px] p-0 border shadow-2xl mt-4 overflow-hidden", isDarkMode ? "bg-roxo-bg border-white/5 text-white" : "bg-white border-black/5 text-black")}>
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="font-black uppercase tracking-tighter text-lg">Notificações</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Central de alertas e avisos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMarkAllAsRead}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-[#BF76FF] transition-all"
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleClearNotifications}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-500 transition-all font-bold text-[10px] uppercase tracking-widest"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="p-2">
                      {displayNotifications.length > 0 ? (
                        displayNotifications.map((n) => {
                          const isExpanded = expandedNotifs.includes(n.id);
                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={cn(
                                "p-4 rounded-xl mb-1 last:mb-0 transition-all border border-transparent cursor-pointer flex flex-col group",
                                !n.read ? (isDarkMode ? "bg-[#BF76FF]/5 border-[#BF76FF]/10 text-white" : "bg-[#BF76FF]/5 border-[#BF76FF]/10") : (isDarkMode ? "hover:bg-white/5 text-gray-400" : "hover:bg-black/5 text-gray-600"),
                                "group"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                  n.type === 'registration' ? 'bg-blue-500/20 text-blue-500' :
                                    n.type === 'activity' ? 'bg-[#BF76FF]/20 text-[#BF76FF]' :
                                      n.type === 'bug' ? 'bg-orange-600/20 text-orange-600' :
                                        n.type === 'gallery_removal' || n.type === 'agenda_rejected' ? 'bg-red-500/20 text-red-500' :
                                          n.type === 'birthday' ? 'bg-orange-500/20 text-orange-500 animate-pulse' :
                                            n.type === 'event_feedback' ? 'bg-yellow-500/20 text-yellow-500' :
                                              'bg-green-500/20 text-green-500'
                                )}>
                                  {n.type === 'registration' ? <UserPlus className="w-4 h-4" /> :
                                    n.type === 'activity' ? <Zap className="w-4 h-4" /> :
                                      n.type === 'bug' ? <Bug className="w-4 h-4" /> :
                                        n.type === 'gallery_removal' ? <Trash2 className="w-4 h-4" /> :
                                          n.type === 'agenda_rejected' ? <XCircle className="w-4 h-4" /> :
                                            n.type === 'birthday' ? <Cake className="w-4 h-4" /> :
                                              n.type === 'event_feedback' ? <Star className="w-4 h-4" /> :
                                                <Bell className="w-4 h-4" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold leading-tight line-clamp-1">{n.title}</p>
                                    <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform opacity-50 group-hover:opacity-100", isExpanded ? "rotate-180" : "")} />
                                  </div>
                                  <p className={cn("text-xs opacity-70 mt-1 transition-all", isExpanded ? "whitespace-pre-wrap" : "line-clamp-1")}>{n.message}</p>
                                  <p className="text-[10px] font-medium opacity-40 mt-2">
                                    {getRelativeTime(n.createdAt || n.timestamp)}
                                  </p>
                                </div>
                                {!n.read && (
                                  <div className="w-2 h-2 rounded-full bg-[#BF76FF] shrink-0 mt-1.5" />
                                )}
                              </div>
                              {isExpanded && (n.type === "request" || n.type === "agenda" || n.type === "registration" || n.type === "chat" || n.type === "gallery_removal" || n.type === "event_feedback" || n.type === "agenda_rejected" || n.type === "bug") && (
                                <button
                                  onClick={(e) => handleNotificationAction(n, e)}
                                  className="mt-3 w-full flex justify-center items-center gap-2 bg-[#BF76FF]/10 text-[#BF76FF] py-2 rounded-xl text-xs font-bold hover:bg-[#BF76FF]/20 transition-colors"
                                >
                                  Acessar Detalhes
                                </button>
                              )}
                              {n.type === 'birthday' && n.memberPhone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/55${n.memberPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Parabéns ${n.memberName}! Que Deus te abençoe grandemente no seu aniversário!`)}`, '_blank');
                                  }}
                                  className="mt-3 w-full flex justify-center items-center gap-2 bg-[#25D366]/20 text-[#25D366] py-2 rounded-xl text-xs font-bold hover:bg-[#25D366]/30 transition-colors"
                                >
                                  <Phone className="w-3 h-3" />
                                  Dar os Parabéns!
                                </button>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                          <Bell className="w-12 h-12 mb-4" />
                          <p className="text-xs font-bold uppercase tracking-widest">Sem notificações</p>
                          <p className="text-[10px] mt-1">Tudo limpo por aqui!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {canViewSettings && (
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Settings
                    className="w-[27px] h-[27px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                    onClick={() => setActiveTab("config")}
                  />
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Bug
                  className={cn(
                    "w-[27px] h-[27px] transition-colors cursor-pointer",
                    isDarkMode ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"
                  )}
                  onClick={() => setIsReportingBug(true)}
                />
              </motion.div>

              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-4 pl-6 border-l border-white/10 cursor-pointer group">
                    <div className="text-right hidden lg:block group-hover:opacity-80 transition-opacity">
                      <p className={cn("font-black tracking-tighter text-lg leading-tight", isDarkMode ? "text-white" : "text-black")}>
                        {profile?.name || "Visitante"}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        {profile?.role || "Membro"}
                      </p>
                    </div>
                    <div className="relative group-hover:scale-105 transition-transform">
                      <div className="w-[52px] h-[52px] rounded-full overflow-hidden border-[3px] border-[#BF76FF]/30 object-cover flex items-center justify-center shrink-0">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className={cn(
                        "absolute bottom-0 right-1 w-4 h-4 rounded-full border-[3px] z-10 transition-colors duration-300 shadow-sm",
                        isDarkMode ? "border-[#0f0f0f]" : "border-white",
                        profile?.status_online === 'busy' ? "bg-red-500" :
                          profile?.status_online === 'away' ? "bg-amber-500" :
                            "bg-green-500"
                      )} />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("w-[260px] rounded-[32px] p-2 border shadow-2xl mt-4 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95", isDarkMode ? "bg-[#0b0016] border-white/5 text-white" : "bg-white border-gray-100 text-black")}>
                  <div className={cn("px-4 py-3 mb-2 border-b", isDarkMode ? "border-white/5" : "border-black/5")}>
                    <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Logado como</p>
                    <p className="font-bold truncate">{profile?.name || user?.email}</p>
                  </div>
                  <DropdownMenuLabel className="text-[11px] font-black tracking-widest text-gray-500 uppercase mb-3 px-3">Seu Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center justify-between rounded-xl p-3 cursor-pointer mb-2 transition-colors",
                      (!profile?.status_online || profile?.status_online === 'online') ? (isDarkMode ? "bg-[#BF76FF]/10 text-[#BF76FF]" : "bg-[#BF76FF]/10 text-[#BF76FF]") : (isDarkMode ? "focus:bg-white/5 text-gray-300" : "focus:bg-black/5 text-gray-600")
                    )}
                    onClick={async () => {
                      if (!user) return;
                      const newProfile = { ...profile, status_online: 'online' };
                      setProfile(newProfile);
                      await updateDoc(doc(db, "members", user.uid), { status_online: 'online' });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></div>
                      <span className="font-bold">Online</span>
                    </div>
                    {(!profile?.status_online || profile?.status_online === 'online') && <CheckCircle2 className="w-4 h-4 text-[#BF76FF]" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={cn(
                      "flex items-center justify-between rounded-xl p-3 cursor-pointer mb-2 transition-colors",
                      profile?.status_online === 'busy' ? "bg-red-500/10 text-red-500" : (isDarkMode ? "focus:bg-white/5 text-gray-300" : "focus:bg-black/5 text-gray-600")
                    )}
                    onClick={async () => {
                      if (!user) return;
                      const newProfile = { ...profile, status_online: 'busy' };
                      setProfile(newProfile);
                      await updateDoc(doc(db, "members", user.uid), { status_online: 'busy' });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                      <span className="font-bold">Ocupado</span>
                    </div>
                    {profile?.status_online === 'busy' && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={cn(
                      "flex items-center justify-between rounded-xl p-3 cursor-pointer mb-2 transition-colors",
                      profile?.status_online === 'away' ? "bg-amber-500/10 text-amber-500" : (isDarkMode ? "focus:bg-white/5 text-gray-300" : "focus:bg-black/5 text-gray-600")
                    )}
                    onClick={async () => {
                      if (!user) return;
                      const newProfile = { ...profile, status_online: 'away' };
                      setProfile(newProfile);
                      await updateDoc(doc(db, "members", user.uid), { status_online: 'away' });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                      <span className="font-bold">Ausente</span>
                    </div>
                    {profile?.status_online === 'away' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                  </DropdownMenuItem>

                  <DropdownMenuLabel className="text-[11px] font-black tracking-widest text-gray-500 uppercase mb-3">Aparência</DropdownMenuLabel>
                  <div className={cn("flex items-center gap-1 p-1 rounded-xl mb-4", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                    <button
                      onClick={() => setIsDarkMode(false)}
                      className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all", !isDarkMode ? "bg-white text-[#BF76FF] shadow-sm" : "text-gray-500 hover:text-gray-300")}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">Claro</span>
                    </button>
                    <button
                      onClick={() => setIsDarkMode(true)}
                      className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all", isDarkMode ? (isDarkMode ? "bg-white/10 text-[#BF76FF]" : "bg-black/10 text-[#BF76FF]") : "text-gray-500 hover:text-gray-300")}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">Escuro</span>
                    </button>
                  </div>

                  <div className={cn("h-[1px] w-full my-4", isDarkMode ? "bg-white/5" : "bg-black/5")}></div>

                  <DropdownMenuLabel className="text-[11px] font-black tracking-widest text-gray-500 uppercase mb-3">Conta</DropdownMenuLabel>
                  <DropdownMenuItem className={cn("flex items-center gap-3 rounded-xl p-3 cursor-pointer mb-2", isDarkMode ? "focus:bg-white/5" : "focus:bg-black/5")} onClick={() => { setActiveViewRole(null); setActiveTab("membros"); setViewingMember(profile || members.find(m => m.email === user?.email)); }}>
                    <User className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className={cn("font-bold", isDarkMode ? "text-gray-300" : "text-gray-700")}>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 rounded-xl p-3 focus:bg-red-500/10 cursor-pointer text-red-500 hover:text-red-400 transition-colors" onClick={handleLogoutAction}>
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="font-bold">Encerrar Sessão</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content View */}
          <div className="flex-1 p-2 md:p-8 pb-32 md:pb-8 overflow-y-auto scroll-smooth scrollbar-hide overscroll-contain touch-pan-y">
            <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-8">
              {isEditing ? (
                <Card className={cn(
                  "border-white/5 rounded-3xl p-4 md:p-10 shadow-2xl transition-all",
                  isDarkMode ? "bg-roxo-bg" : "bg-white border-black/5"
                )}>
                  <div className="space-y-8">
                    {isReadOnly && (activeTab === "agenda" || activeTab === "agenda-direcao" || activeTab === "eventos" || activeTab === "noticias") ? (
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
                          {activeTab === 'noticias' ? (
                            <Newspaper className="w-6 h-6 text-[#BF76FF]" />
                          ) : (
                            <Edit className="w-6 h-6 text-[#BF76FF]" />
                          )}
                        </div>
                        <h4 className={cn("text-2xl md:text-3xl font-black tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black")}>
                          {isReadOnly ? "Visualizar" : selectedItem ? "Editar" : "Nova"} {activeTab === 'eventos' ? 'Evento' : activeTab === 'noticias' ? 'Matéria' : activeTab === 'membros' ? 'Perfil' : activeTab === 'agenda-direcao' ? 'Compromisso' : 'Agenda'}
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
                              try {
                                const updateData: any = { status: "approved" };

                                if (selectedItem.signupPassword) {
                                  updateData.signupPassword = deleteField();
                                  try {
                                    await addDoc(collection(db, "saved-logins"), {
                                      title: `Cadastro - ${selectedItem.name}`,
                                      username: selectedItem.email,
                                      password: selectedItem.signupPassword,
                                      createdAt: serverTimestamp(),
                                      updatedAt: serverTimestamp()
                                    });
                                  } catch (e) {
                                    console.error("Failed to save login password", e);
                                  }
                                }

                                await updateDoc(doc(db, "members", selectedItem.id), updateData);
                                firestoreService.clearCache("members");
                                // Gatilho: Notificação de aprovação
                                /*
                                fetch("/backend/push/broadcast", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    title: "🎉 Acesso Liberado!",
                                    message: "Seu cadastro foi aprovado. Seja bem-vindo ao Ministério Profecia!",
                                    target: "specific",
                                    userIds: [selectedItem.id]
                                  })
                                }).catch(e => console.error("Erro ao notificar aprovação:", e));
                                */
                                const msg = `Olá ${selectedItem.name}, seu cadastro no painel do Ministério Profecia foi APROVADO! Você já pode acessar usando seu e-mail e a senha padrão (admin).`;
                                if (selectedItem.phone) {
                                  window.open(`https://wa.me/55${selectedItem.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                }
                                setIsEditing(false);
                                setSelectedItem(null);
                              } catch (e) {
                                handleFirestoreError(e, OperationType.UPDATE, `members/${selectedItem.id}`);
                              }
                            }}
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" /> Aprovar
                          </Button>
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-lg"
                            onClick={async () => {
                              let reason = "Não atende aos requisitos no momento.";
                              try {
                                try {
                                  const userReason = window.prompt("Motivo da reprovação:");
                                  if (userReason === null) return; // Cancelled
                                  if (userReason) reason = userReason;
                                } catch (e) {
                                  // Prompt blocked, use default reason
                                }
                                await updateDoc(doc(db, "members", selectedItem.id), { status: "rejected", rejectReason: reason });
                                firestoreService.clearCache("members");
                                const msg = `Olá ${selectedItem.name}, seu cadastro no painel do Ministério Profecia foi REPROVADO. Motivo: ${reason}`;
                                if (selectedItem.phone) {
                                  window.open(`https://wa.me/55${selectedItem.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                }
                                setIsEditing(false);
                                setSelectedItem(null);
                              } catch (e) {
                                handleFirestoreError(e, OperationType.UPDATE, `members/${selectedItem.id}`);
                              }
                            }}
                          >
                            <X className="w-5 h-5 mr-2" /> Reprovar
                          </Button>
                        </div>
                      </div>
                    )}

                    {(activeTab === "agenda" || activeTab === "agenda-direcao" || activeTab === "eventos" || activeTab === "noticias") && (
                      isReadOnly ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-10 py-4"
                        >
                          {/* Header Section */}
                          {activeTab === "eventos" && formData.image && (
                            <div className="relative aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl mb-12">
                              <img src={getImageUrl(formData.image)} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute top-8 left-8">
                                <span className="bg-primary px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                                  {formData.organization || "Evento"}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-[2px] w-8 bg-[#BF76FF]" />
                              <p className="text-[#BF76FF] font-black uppercase tracking-[0.2em] text-[10px]">{activeTab === 'eventos' ? 'Detalhes do Evento' : activeTab === 'noticias' ? 'Detalhes da Notícia' : 'Agenda da Direção'}</p>
                            </div>
                            <h3 className={cn("text-4xl md:text-6xl font-black tracking-tighter transition-colors leading-[0.9]", isDarkMode ? "text-white" : "text-black")}>
                              {formData.title}
                            </h3>
                          </div>

                          {(activeTab === "eventos" || activeTab === "noticias") && formData.content && (
                            <div className={cn("p-8 md:p-12 rounded-[40px] border transition-all text-lg md:text-xl font-medium leading-relaxed", isDarkMode ? "bg-white/5 border-white/5 text-gray-300" : "bg-white border-black/5 text-gray-700 shadow-sm")}>
                              <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-6 bg-primary rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{activeTab === "eventos" ? "Sobre o Evento" : "Matéria jornalística"}</h4>
                              </div>
                              <p className="whitespace-pre-wrap">{formData.content}</p>
                            </div>
                          )}

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
                                    if (!formData.date) return '...';
                                    if (formData.date.includes('T')) {
                                      return format(parseISO(formData.date.split('T')[0]), 'dd/MM/yyyy');
                                    }
                                    return formData.date;
                                  } catch (e) {
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
                                {formData.date && formData.date.includes('T') && formData.date.split('T')[1]
                                  ? `${formData.date.split('T')[1].substring(0, 5)}${formData.endTime ? ` às ${formData.endTime}` : ''}`
                                  : 'Horário não definido'}
                              </p>
                            </div>
                            <div className={cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm")}>
                              <div>
                                <Users className="w-5 h-5 text-[#BF76FF] mb-4" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Organização</p>
                              </div>
                              <p className={cn("text-xl font-black truncate", isDarkMode ? "text-white" : "text-black")}>
                                {formData.organization || formData.organizer || "Igreja Local"}
                              </p>
                            </div>
                          </div>
                          
                          {/* Info & Observations Cards */}
                          {(formData.additionalInfo || formData.observations) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              {formData.additionalInfo && (
                                <div className={cn("p-8 rounded-[32px] border flex flex-col gap-4 relative overflow-hidden group transition-all", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm")}>
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#BF76FF]/5 blur-3xl -mr-16 -mt-16 group-hover:bg-[#BF76FF]/10 transition-colors" />
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF]">
                                      <Info className="w-5 h-5" />
                                    </div>
                                    <h3 className={cn("text-lg font-black uppercase tracking-tight", isDarkMode ? "text-white/90" : "text-black/80")}>Contato e Informações</h3>
                                  </div>
                                  <p className={cn("leading-relaxed text-sm md:text-base whitespace-pre-wrap", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                                    {formData.additionalInfo}
                                  </p>
                                </div>
                              )}
                              
                              {formData.observations && (
                                <div className={cn("p-8 rounded-[32px] border flex flex-col gap-4 relative overflow-hidden group transition-all", isDarkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-500/10 shadow-sm")}>
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                      <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <h3 className={cn("text-lg font-black uppercase tracking-tight", isDarkMode ? "text-white/90" : "text-black/80")}>Observações Importantes</h3>
                                  </div>
                                  <p className={cn("leading-relaxed text-sm md:text-base italic whitespace-pre-wrap", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                                    {formData.observations}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Photo Gallery Preview (for Events) */}
                          {activeTab === "eventos" && formData.gallery && Array.isArray(formData.gallery) && formData.gallery.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] w-6 bg-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Galeria de Fotos</h4>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {formData.gallery.map((url: string, i: number) => (
                                  <div key={`gallery-preview-${url}-${i}`} className="aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                    <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
                              <div className="absolute top-0 right-0 w-80 h-80 bg-[#BF76FF]/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#BF76FF]/3 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
                            </div>
                          )}

                          {/* Invited Members Section */}
                          {(formData.invitedMembers?.length > 0) && (
                            <div className="space-y-8 py-6">
                              <div className="flex items-center gap-6">
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] whitespace-nowrap">Membros da igreja presente</h5>
                                <div className={cn("h-[1px] flex-1", isDarkMode ? "bg-white/5" : "bg-black/5")} />
                              </div>

                              <div className="flex flex-wrap gap-x-8 gap-y-10">
                                {formData.invitedMembers.map((m: any) => (
                                  <div key={m.id} className="flex flex-col items-center gap-4 group">
                                    <div className="relative">
                                      <div className={cn("w-24 h-24 md:w-28 md:h-28 rounded-[2rem] border-2 border-white/5 p-1.5 transition-all duration-500 group-hover:border-[#BF76FF] group-hover:rotate-6 rotate-[-3deg]", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                                        <div className="w-full h-full rounded-[1.6rem] bg-gray-200 overflow-hidden shadow-2xl border border-white/10">
                                          {m.photo ? (
                                            <img src={getImageUrl(m.photo)} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                              <Users className="w-10 h-10" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-4 z-10 hidden md:block", isDarkMode ? "border-[#111]" : "border-white")} />
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

                          {/* Guests Section */}
                          {formData.guests && Array.isArray(formData.guests) && formData.guests.filter((g: any) => g.name).length > 0 && (
                            <div className="space-y-8 py-6">
                              <div className="flex items-center gap-6">
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] whitespace-nowrap">Convidados presente</h5>
                                <div className={cn("h-[1px] flex-1", isDarkMode ? "bg-white/5" : "bg-black/5")} />
                              </div>

                              <div className="flex flex-wrap gap-x-8 gap-y-10">
                                {formData.guests.filter((g: any) => g.name).map((guest: any, idx: number) => (
                                  <div key={`guest-display-${idx}`} className="flex flex-col items-center gap-4 group">
                                    <div className="relative">
                                      <div className={cn("w-24 h-24 md:w-28 md:h-28 rounded-[2rem] border-2 border-white/5 p-1.5 transition-all duration-500 group-hover:border-[#BF76FF] group-hover:rotate-6 rotate-[-3deg]", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                                        <div className="w-full h-full rounded-[1.6rem] bg-gray-200 overflow-hidden shadow-2xl border border-white/10">
                                          {guest.image ? (
                                            <img src={getImageUrl(guest.image)} alt={guest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                              <Users className="w-10 h-10" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg border-4 z-10 hidden md:block", isDarkMode ? "border-[#111]" : "border-white")} />
                                    </div>
                                    <div className="text-center space-y-0.5">
                                      <p className={cn("text-[11px] font-black uppercase tracking-[0.15em] transition-colors", isDarkMode ? "text-white group-hover:text-[#BF76FF]" : "text-black")}>
                                        {guest.name}
                                      </p>
                                      {guest.role && (
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{guest.role}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </motion.div>
                      ) : (
                        <>
                          <div className="space-y-6">
                            {activeTab === "eventos" && (
                              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 1. Tipo de Evento no Topo */}
                                <div className="space-y-4">
                                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-500" : "text-gray-400")}>Selecione o Tipo de Registro</label>
                                  <div className={cn("p-1.5 rounded-[24px] flex gap-2 w-full", isDarkMode ? "bg-cinza-input" : "bg-gray-100/50 border border-black/5")}>
                                    <button
                                      type="button"
                                      disabled={isReadOnly}
                                      className={cn(
                                        "flex-1 h-12 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                        formData.typeEvent === 'culto'
                                          ? "bg-white text-black shadow-lg opacity-100"
                                          : "bg-cinza-input text-white opacity-30"
                                      )}
                                      onClick={() => setFormData({ ...formData, typeEvent: 'culto' })}
                                    >
                                      Culto
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isReadOnly}
                                      className={cn(
                                        "flex-1 h-12 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                        formData.typeEvent !== 'culto'
                                          ? "bg-white text-black shadow-lg opacity-100"
                                          : "bg-cinza-input text-white opacity-30"
                                      )}
                                      onClick={() => setFormData({ ...formData, typeEvent: 'evento' })}
                                    >
                                      Evento
                                    </button>
                                  </div>
                                </div>

                                {/* Campos Condicionais */}
                                {formData.typeEvent === 'culto' ? (
                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Título do Culto: Ex: Culto da família</label>
                                      <Input
                                        className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        placeholder="Título do Culto..."
                                        value={formData.title || ""}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Bio do Evento</label>
                                      <Textarea
                                        className={cn("min-h-[120px] rounded-[32px] p-8 border transition-all leading-relaxed", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        placeholder="Conte mais sobre o culto..."
                                        value={formData.content || ""}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Data</label>
                                      <Input
                                        type="date"
                                        className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        value={typeof formData.date === 'string' ? formData.date.split('T')[0] : ""}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Link da pasta do Drive (Galeria)</label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF76FF]" />
                                          <Input
                                            className={cn("h-14 rounded-2xl pl-12 pr-6 border transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                            placeholder="https://drive.google.com/..."
                                            value={formData.driveFolderId || ""}
                                            onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
                                            readOnly={isReadOnly}
                                          />
                                        </div>
                                        {!isReadOnly && (
                                          <Button
                                            type="button"
                                            onClick={syncDriveFolder}
                                            disabled={!formData.driveFolderId || isSyncing}
                                            className="h-14 px-6 rounded-2xl bg-[#00A859] hover:bg-[#008A49] text-white border-none transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(0,168,89,0.3)] hover:shadow-[0_0_30px_rgba(0,168,89,0.5)] active:scale-95"
                                          >
                                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />} Sincronizar
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Imagem de Capa</label>
                                      {!isReadOnly ? (
                                        <UploadImages
                                          maxFiles={1}
                                          multiple={false}
                                          value={formData.image}
                                          onUploadComplete={(images) => setFormData({ ...formData, image: images[0]?.secure_url || "" })}
                                        />
                                      ) : (
                                        formData.image && (
                                          <div className="mt-2 relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                                            <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Título do Evento</label>
                                      <Input
                                        className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        placeholder="Ex: Conferência de Jovens 2024"
                                        value={formData.title || ""}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Data</label>
                                        <Input
                                          type="date"
                                          className={cn("h-14 rounded-2xl px-6 border transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                          value={typeof formData.date === 'string' ? formData.date.split('T')[0] : ""}
                                          onChange={(e) => {
                                            const time = typeof formData.date === 'string' && formData.date.includes('T') ? formData.date.split('T')[1] : "00:00:00";
                                            setFormData({ ...formData, date: `${e.target.value}T${time}` });
                                          }}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 ml-2 uppercase tracking-widest">Início:</label>
                                        <div className="relative">
                                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF76FF] z-10" />
                                          <Input
                                            type="time"
                                            className={cn("h-14 rounded-2xl pl-10 pr-4 border transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                            value={typeof formData.date === 'string' && formData.date.includes('T') ? formData.date.split('T')[1]?.substring(0, 5) : ""}
                                            onChange={(e) => {
                                              const date = typeof formData.date === 'string' ? formData.date.split('T')[0] : format(new Date(), "yyyy-MM-dd");
                                              setFormData({ ...formData, date: `${date}T${e.target.value}` });
                                            }}
                                            readOnly={isReadOnly}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 ml-2 uppercase tracking-widest">Término:</label>
                                        <Input
                                          type="time"
                                          className={cn("h-14 rounded-2xl px-6 border transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                          value={formData.endTime || ""}
                                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Local</label>
                                      <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF76FF]" />
                                        <Input
                                          className={cn("h-14 rounded-2xl pl-12 pr-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                          placeholder="Ex: Igreja IEMP - Sede"
                                          value={formData.location || ""}
                                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Nome do Organizador</label>
                                        <Input
                                          className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                          placeholder="Ex: Pr. João Silva"
                                          value={formData.organizer || ""}
                                          onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Foto do Organizador</label>
                                        {!isReadOnly ? (
                                          <UploadImages
                                            maxFiles={1}
                                            multiple={false}
                                            value={formData.organizerImage}
                                            onUploadComplete={(images) => setFormData({ ...formData, organizerImage: images[0]?.secure_url || "" })}
                                          />
                                        ) : (
                                          formData.organizerImage && (
                                            <div className="mt-2 w-20 h-20 rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                                              <img src={getImageUrl(formData.organizerImage)} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-6 rounded-[24px] bg-white/5 border border-white/5">
                                      <div className="flex-1">
                                        <h4 className="text-xs font-black uppercase text-white tracking-widest mb-1">Deve Convidar Igreja?</h4>
                                        <p className="text-[10px] text-gray-400">Mostrar convite automático para membros</p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="w-6 h-6 accent-[#BF76FF] rounded-lg cursor-pointer"
                                        checked={formData.inviteChurch || false}
                                        onChange={(e) => setFormData({ ...formData, inviteChurch: e.target.checked })}
                                        disabled={isReadOnly}
                                      />
                                    </div>

                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Adicionar convidado/palestrante</label>
                                        {!isReadOnly && (
                                          <Button
                                            type="button"
                                            onClick={() => {
                                              const current = Array.isArray(formData.guests) ? formData.guests : [];
                                              setFormData({ ...formData, guests: [...current, { name: "", image: "", role: "" }] });
                                            }}
                                            className="h-8 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white px-4 font-black uppercase text-[10px]"
                                          >
                                            <Plus className="w-3 h-3 mr-2" /> Adicionar
                                          </Button>
                                        )}
                                      </div>
                                      <div className="space-y-3">
                                        {(formData.guests || []).map((guest: any, i: number) => (
                                          <div key={`guest-${i}`} className={cn("p-4 rounded-2xl border relative group grid grid-cols-1 md:grid-cols-3 gap-3", isDarkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5")}>
                                            <Input placeholder="Nome" value={guest.name} onChange={(e) => {
                                              const g = [...formData.guests]; g[i].name = e.target.value; setFormData({ ...formData, guests: g });
                                            }} className={cn("h-10 text-[11px] rounded-xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")} />
                                            <Input placeholder="Cargo" value={guest.role} onChange={(e) => {
                                              const g = [...formData.guests]; g[i].role = e.target.value; setFormData({ ...formData, guests: g });
                                            }} className={cn("h-10 text-[11px] rounded-xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")} />
                                            <Input placeholder="Foto URL" value={guest.image} onChange={(e) => {
                                              const g = [...formData.guests]; g[i].image = e.target.value; setFormData({ ...formData, guests: g });
                                            }} className={cn("h-10 text-[11px] rounded-xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")} />
                                            <Button type="button" variant="ghost" onClick={() => setFormData({ ...formData, guests: formData.guests.filter((_: any, idx: number) => idx !== i) })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xl">
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Link do vídeo</label>
                                      <Input
                                        className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        placeholder="https://youtube.com/..."
                                        value={formData.videoUrl || ""}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Música de Fundo (Biblioteca da Rádio)</label>
                                      <Select
                                        value={formData.bgMusicId || "none"}
                                        onValueChange={(val) => setFormData({ ...formData, bgMusicId: val === "none" ? "" : val })}
                                        disabled={isReadOnly}
                                      >
                                        <SelectTrigger className={cn("w-full h-14 rounded-2xl border transition-all px-6 text-[11px] font-bold uppercase tracking-widest", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")}>
                                          <SelectValue placeholder="Selecione uma música..." />
                                        </SelectTrigger>
                                        <SelectContent className={cn("rounded-2xl border border-white/5 shadow-2xl p-2 max-h-[300px]", isDarkMode ? "bg-[#1f1f1f] text-white" : "bg-white text-black")}>
                                          <SelectItem value="none" className="rounded-xl focus:bg-[#BF76FF] focus:text-white uppercase font-bold text-[10px] tracking-widest py-3.5 px-4 cursor-pointer transition-colors">
                                            Nenhuma música
                                          </SelectItem>
                                          {radioTracks.map((track: any) => (
                                            <SelectItem key={track.id} value={track.id} className="rounded-xl focus:bg-[#BF76FF] focus:text-white uppercase font-bold text-[10px] tracking-widest py-3.5 px-4 cursor-pointer transition-colors">
                                              {track.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">url da moldura (criar foto)</label>
                                      <Input
                                        className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        placeholder="https://..."
                                        value={formData.frameUrl || ""}
                                        onChange={(e) => setFormData({ ...formData, frameUrl: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Links das pastas do drive</label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <LinkIcon className="absolute left-4 top-4 w-4 h-4 text-[#BF76FF]" />
                                          <textarea
                                            className={cn("min-h-[56px] py-4 rounded-2xl pl-12 pr-6 border transition-all w-full resize-y", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                            placeholder="https://drive.google.com/...\n(Um link por linha para adicionar várias pastas)"
                                            value={formData.driveFolderId || ""}
                                            onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
                                            readOnly={isReadOnly}
                                            rows={2}
                                          />
                                        </div>
                                        {!isReadOnly && (
                                          <Button
                                            type="button"
                                            onClick={syncDriveFolder}
                                            disabled={!formData.driveFolderId || isSyncing}
                                            className="h-14 px-6 rounded-2xl bg-[#00A859] hover:bg-[#008A49] text-white border-none transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(0,168,89,0.3)] hover:shadow-[0_0_30px_rgba(0,168,89,0.5)] active:scale-95"
                                          >
                                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />} Sincronizar
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {activeTab === "noticias" && (
                              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10">
                                  <h3 className="text-sm font-black uppercase tracking-widest text-[#BF76FF] mb-6 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#BF76FF] animate-pulse" />
                                    Estrutura Jornalística
                                  </h3>

                                  <div className="space-y-6">
                                    {formData.content && (
                                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#BF76FF]/5 border border-[#BF76FF]/10 mt-4" id="push-notification-noticias-toggle">
                                        <input
                                          type="checkbox"
                                          id="notifyAllNoticia"
                                          className="w-5 h-5 accent-[#BF76FF] rounded-lg"
                                          checked={formData.notifyAll || false}
                                          onChange={(e) => setFormData({ ...formData, notifyAll: e.target.checked })}
                                        />
                                        <label htmlFor="notifyAllNoticia" className="text-xs font-bold text-[#BF76FF] uppercase tracking-widest cursor-pointer select-none">
                                          Disparar Notificação Push para este post
                                        </label>
                                      </div>
                                    )}

                                    {/* 1. Título */}
                                    <div className="space-y-2">
                                      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Título da Matéria</label>
                                      <Input
                                        className={cn("border h-16 rounded-2xl px-6 text-xl font-black transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                        placeholder="Título impactante da notícia..."
                                        value={formData.title || ""}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                      />
                                    </div>

                                    {/* 2. Subtítulo */}
                                    <div className="space-y-2">
                                      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Subtítulo / Gravata</label>
                                      <Textarea
                                        className={cn("border min-h-[80px] rounded-2xl p-6 transition-all font-medium", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                        placeholder="Um resumo breve que aparece logo abaixo do título"
                                        value={formData.subtitle || ""}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                      />
                                    </div>

                                    {/* 3. Fonte */}
                                    <div className="space-y-2">
                                      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Fonte da Matéria</label>
                                      <Input
                                        className={cn("border h-12 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                        placeholder="Ex: Redação Ministério Profecia, G1, Gospel Prime..."
                                        value={formData.source || ""}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                      />
                                    </div>

                                    {/* 4. Social Sharing Preview */}
                                    <div className="py-4 border-y border-white/5 space-y-4">
                                      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Previsão de Compartilhamento</label>
                                      <div className="flex gap-3">
                                        <div className="p-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                                            <MessageSquare className="w-4 h-4 fill-current" />
                                          </div>
                                          WhatsApp
                                        </div>
                                        <div className="p-3 rounded-2xl bg-[#E1306C]/10 text-[#E1306C] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white">
                                            <Instagram className="w-4 h-4" />
                                          </div>
                                          Instagram
                                        </div>
                                        <div className="p-3 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                          <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
                                            <Facebook className="w-4 h-4 fill-current" />
                                          </div>
                                          Facebook
                                        </div>
                                        <div className="p-3 rounded-2xl bg-white/5 text-gray-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                                            <Share2 className="w-4 h-4" />
                                          </div>
                                          Geral
                                        </div>
                                      </div>
                                    </div>

                                    {/* 5. Video Script / URL */}
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between ml-2">
                                        <label className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500")}>Vídeo de Destaque</label>
                                        <div className="flex gap-2">
                                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20">YouTube</span>
                                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-[8px] font-black uppercase tracking-widest border border-purple-500/20">Instagram</span>
                                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Shorts</span>
                                        </div>
                                      </div>
                                      <Input
                                        className={cn("border h-12 rounded-2xl px-6 transition-all italic", isDarkMode ? "bg-cinza-input border-white/5 text-gray-300 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                        placeholder="Cole o link (YouTube, Instagram ou Shorts)..."
                                        value={formData.videoUrl || ""}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                      />
                                    </div>

                                    {/* 6. Imagem Principal e Legenda */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                          <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Imagem de Capa</label>
                                          {!isReadOnly ? (
                                            <UploadImages
                                              maxFiles={1}
                                              multiple={false}
                                              value={formData.image}
                                              onUploadComplete={(images) => setFormData({ ...formData, image: images[0]?.secure_url || "" })}
                                            />
                                          ) : (
                                            formData.image && (
                                              <div className="relative aspect-video rounded-[32px] overflow-hidden border border-white/10 group">
                                                <img src={getImageUrl(formData.image)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                                              </div>
                                            )
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>Legenda da Imagem</label>
                                          <Input
                                            className={cn("border h-12 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                            placeholder="Fiel orando no monte"
                                            value={formData.imageCaption || ""}
                                            onChange={(e) => setFormData({ ...formData, imageCaption: e.target.value })}
                                            readOnly={isReadOnly}
                                          />
                                        </div>
                                      </div>
                                      {/* Removido preview redundante pois o componente já mostra */}
                                    </div>

                                    {/* 7. Conteúdo da Matéria */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 mb-2 ml-2">
                                        <div className="w-1 h-3 bg-[#BF76FF] rounded-full" />
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Corpo da Matéria (Texto Principal)</label>
                                      </div>
                                      <Textarea
                                        className={cn("border min-h-[300px] rounded-[32px] p-8 transition-all text-lg leading-relaxed scrollbar-thin", isDarkMode ? "bg-cinza-input border-white/5 text-white/90 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                        placeholder="Escreva aqui a reportagem completa. Use parágrafos para melhor leitura."
                                        value={formData.content || ""}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                      />
                                    </div>

                                    {/* 8. Galeria de Fotos */}
                                    <div className="space-y-6 pt-6 border-t border-white/5">
                                      <div className="flex items-center justify-between ml-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Galeria / Fotos Enviadas</label>
                                        {!isReadOnly && (
                                          <UploadImages
                                            maxFiles={10}
                                            value={typeof formData.gallery === 'string'
                                              ? formData.gallery.split('\n').filter((l: string) => l.trim())
                                              : (Array.isArray(formData.gallery) ? formData.gallery : [])}
                                            onUploadComplete={(images) => {
                                              const newUrls = images.map(img => img.secure_url);
                                              const currentGallery = typeof formData.gallery === 'string'
                                                ? formData.gallery.split('\n').filter((l: string) => l.trim())
                                                : (Array.isArray(formData.gallery) ? formData.gallery : []);
                                              
                                              setFormData({ 
                                                ...formData, 
                                                gallery: [...currentGallery, ...newUrls].join('\n') 
                                              });
                                            }}
                                          />
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(() => {
                                          const urls = typeof formData.gallery === 'string'
                                            ? formData.gallery.split('\n')
                                            : (Array.isArray(formData.gallery) ? formData.gallery : []);

                                          // Always show an empty array if empty but we want to map correctly
                                          // Wait, the filter removes empty strings, but we need to keep empty inputs while editing
                                          const displayUrls = typeof formData.gallery === 'string' ? formData.gallery.split('\n') : (Array.isArray(formData.gallery) ? formData.gallery : []);

                                          return displayUrls.map((url: string, i: number) => (
                                            <div key={`form-gallery-noticia-${i}`} className={cn("p-4 rounded-3xl border transition-all space-y-3 relative group", isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-black/5 shadow-sm")}>
                                              <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                                  <Input
                                                    className={cn("border h-10 rounded-xl pl-10 pr-4 text-[10px] transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                                    placeholder="URL da imagem..."
                                                    value={url.trim()}
                                                    onChange={(e) => {
                                                      const newGallery = [...displayUrls];
                                                      newGallery[i] = e.target.value;
                                                      setFormData({ ...formData, gallery: newGallery.join('\n') });
                                                    }}
                                                    readOnly={isReadOnly}
                                                  />
                                                </div>
                                                {!isReadOnly && (
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0"
                                                    onClick={() => {
                                                      const newGallery = displayUrls.filter((_, idx) => idx !== i);
                                                      setFormData({ ...formData, gallery: newGallery.join('\n') });
                                                    }}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                )}
                                              </div>
                                              {url.trim() && (
                                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/20 group-hover:scale-[1.02] transition-transform duration-300">
                                                  <img src={getImageUrl(url.trim())} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                  {!isReadOnly && url.trim() && (
                                                    <button
                                                      type="button"
                                                      onClick={() => setFormData({ ...formData, image: url.trim() })}
                                                      className={cn(
                                                        "absolute bottom-2 left-2 right-2 py-1.5 rounded-xl flex items-center justify-center gap-1 opacity-100 transition-all z-20 text-[8px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md",
                                                        formData.image === url.trim() ? "bg-[#BF76FF] text-white shadow-[0_0_15px_rgba(191,118,255,0.4)]" : "bg-black/60 text-white hover:bg-black/80"
                                                      )}
                                                    >
                                                      {formData.image === url.trim() ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                                      {formData.image === url.trim() ? "Capa da Notícia" : "Definir como Capa"}
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ));
                                        })()}

                                        {(!formData.gallery || (typeof formData.gallery === 'string' && formData.gallery.trim() === '') || (Array.isArray(formData.gallery) && formData.gallery.length === 0)) && (
                                          <div className={cn("col-span-full py-12 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center text-gray-500 gap-3 opacity-50", isDarkMode ? "border-white/10" : "border-black/10")}>
                                            <ImageIcon className="w-10 h-10 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Nenhuma foto enviada</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* 9. Tópicos e Configurações de exibição (Previews das seções finais) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                      <div className="p-6 rounded-[24px] bg-white/5 border border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Seção: Últimas Notícias</h4>
                                        <div className="flex gap-3 opacity-40 grayscale">
                                          <div className="w-12 h-12 rounded-lg bg-gray-500 shrink-0" />
                                          <div className="space-y-1 flex-1">
                                            <div className="h-2 w-full bg-gray-500 rounded" />
                                            <div className="h-2 w-2/3 bg-gray-500 rounded" />
                                          </div>
                                        </div>
                                        <p className="mt-4 text-[9px] text-gray-500 italic text-center">Ativado automaticamente para novos posts</p>
                                      </div>
                                      <div className="p-6 rounded-[24px] bg-white/5 border border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Seção: Matérias Relacionadas</h4>
                                        <div className="grid grid-cols-3 gap-2 opacity-40 grayscale">
                                          <div className="aspect-square bg-gray-500 rounded-lg" />
                                          <div className="aspect-square bg-gray-500 rounded-lg" />
                                          <div className="aspect-square bg-gray-500 rounded-lg" />
                                        </div>
                                        <p className="mt-4 text-[9px] text-gray-500 italic text-center">Calculado por similaridade de conteúdo</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {(activeTab === "agenda" || activeTab === "agenda-direcao") && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500")}>Título do Compromisso</label>
                                  <Input
                                    className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                    placeholder="Ex: Visitar igreja no Grama"
                                    value={formData.title || ""}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    readOnly={isReadOnly}
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-2">
                                    <label className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500")}>Data e Horário</label>
                                    <div className="flex flex-col md:flex-row gap-3">
                                      <div className="flex-1 space-y-1">
                                        <p className="text-[10px] text-gray-400 ml-2 uppercase font-bold">Data</p>
                                        <Input
                                          type="date"
                                          className={cn("border h-14 rounded-2xl px-6 transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                          value={typeof formData.date === 'string' ? formData.date.split('T')[0] : ""}
                                          onChange={(e) => {
                                            const time = typeof formData.date === 'string' && formData.date.includes('T') ? formData.date.split('T')[1] : "";
                                            setFormData({ ...formData, date: time ? `${e.target.value}T${time}` : e.target.value });
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
                                            className={cn("border h-14 rounded-2xl pl-10 pr-4 transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-white/80 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                            value={typeof formData.date === 'string' && formData.date.includes('T') ? formData.date.split('T')[1]?.substring(0, 5) : ""}
                                            onChange={(e) => {
                                              const date = typeof formData.date === 'string' ? formData.date.split('T')[0] : format(new Date(), "yyyy-MM-dd");
                                              setFormData({ ...formData, date: `${date}T${e.target.value}` });
                                            }}
                                            readOnly={isReadOnly}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <p className="text-[10px] text-gray-400 ml-2 uppercase font-bold">Término</p>
                                        <Input
                                          type="time"
                                          className={cn("border h-14 rounded-2xl px-6 transition-all w-full", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                          value={formData.endTime || ""}
                                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500")}>Local</label>
                                    <Input
                                      className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                      placeholder="Ex: Igreja Local..."
                                      value={formData.location || ""}
                                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                      readOnly={isReadOnly}
                                    />
                                  </div>
                                  <div className="space-y-2 relative">
                                    <label className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500")}>Organizador</label>
                                    <div className="relative">
                                      <Input
                                        className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                        placeholder="Selecionar membro ou digitar nome..."
                                        value={formData.organization || ""}
                                        onChange={(e) => {
                                          setFormData({ ...formData, organization: e.target.value, organizerId: null });
                                          setOrganizerSearch(e.target.value);
                                        }}
                                        onFocus={() => setShowOrganizerDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowOrganizerDropdown(false), 200)}
                                        readOnly={isReadOnly}
                                      />
                                      {showOrganizerDropdown && !isReadOnly && (
                                        <div className={cn("absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl z-50 max-h-48 overflow-y-auto", isDarkMode ? "bg-[#1C1C1C] border-white/5" : "bg-white border-black/5")}>
                                          {members.filter(m => !!m.name && m.name.trim() !== '' && m.status !== 'pending' && m.status !== 'visitor_session' && m.name.toLowerCase().includes((organizerSearch || '').toLowerCase())).map(member => (
                                            <div
                                              key={member.id}
                                              className={cn("px-4 py-3 cursor-pointer text-sm font-bold flex items-center gap-3 transition-colors", isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-gray-50 text-black")}
                                              onClick={() => {
                                                setFormData({
                                                  ...formData,
                                                  organization: member.name,
                                                  organizerId: member.id,
                                                  organizerImage: member.photoURL || ""
                                                });
                                                setOrganizerSearch("");
                                                setShowOrganizerDropdown(false);
                                              }}
                                            >
                                              {member.photoURL ? (
                                                <img src={member.photoURL} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                                              ) : (
                                                <div className="w-6 h-6 rounded-full bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF]">
                                                  <User className="w-3 h-3" />
                                                </div>
                                              )}
                                              {member.name}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {(activeTab === "agenda" || activeTab === "agenda-direcao") && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <label className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                                        A igreja foi convidada?
                                        {!isReadOnly && (
                                          <div className="flex gap-2 ml-4">
                                            <button
                                              type="button"
                                              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", formData.inviteChurch ? "bg-[#BF76FF] text-white" : "bg-white/5 text-gray-500")}
                                              onClick={() => {
                                                setFormData({ ...formData, inviteChurch: true });
                                                setIsMemberSelectorOpen(true);
                                              }}
                                            >
                                              Sim
                                            </button>
                                            <button
                                              type="button"
                                              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", !formData.inviteChurch ? "bg-[#BF76FF] text-white" : "bg-white/5 text-gray-500")}
                                              onClick={() => setFormData({ ...formData, inviteChurch: false, invitedMembers: [] })}
                                            >
                                              Não
                                            </button>
                                          </div>
                                        )}
                                      </label>
                                      {isReadOnly && (
                                        <p className="text-sm font-medium mt-1">{formData.inviteChurch ? "Sim" : "Não"}</p>
                                      )}
                                      {formData.inviteChurch && formData.invitedMembers?.length > 0 && (
                                        <p className="text-xs text-[#BF76FF] mt-2 italic font-medium">{formData.invitedMembers.length} membro(s) convidado(s). {(!isReadOnly) && (<span className="cursor-pointer underline" onClick={() => setIsMemberSelectorOpen(true)}>Editar Lista</span>)}</p>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Convidados Externos / Palestrantes</label>
                                        {!isReadOnly && (
                                          <Button
                                            type="button"
                                            onClick={() => {
                                              const current = Array.isArray(formData.guests) ? formData.guests : [];
                                              setFormData({ ...formData, guests: [...current, { name: "", image: "", role: "" }] });
                                            }}
                                            className="h-8 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white px-4 font-black uppercase text-[10px]"
                                          >
                                            <Plus className="w-3 h-3 mr-2" /> Adicionar
                                          </Button>
                                        )}
                                      </div>
                                      <div className="space-y-3">
                                        {(formData.guests || []).map((guest: any, i: number) => (
                                          <div key={`guest-agenda-${i}`} className={cn("p-4 rounded-2xl border relative group grid grid-cols-1 md:grid-cols-3 gap-3", isDarkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5")}>
                                            <Input placeholder="Nome" value={guest.name} onChange={(e) => {
                                              const g = [...formData.guests]; g[i].name = e.target.value; setFormData({ ...formData, guests: g });
                                            }} className={cn("h-10 text-[11px] rounded-xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")} />
                                            <Input placeholder="Cargo" value={guest.role} onChange={(e) => {
                                              const g = [...formData.guests]; g[i].role = e.target.value; setFormData({ ...formData, guests: g });
                                            }} className={cn("h-10 text-[11px] rounded-xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")} />
                                            <Input placeholder="Foto URL" value={guest.image} onChange={(e) => {
                                              const g = [...formData.guests]; g[i].image = e.target.value; setFormData({ ...formData, guests: g });
                                            }} className={cn("h-10 text-[11px] rounded-xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")} />
                                            {!isReadOnly && (
                                              <Button type="button" variant="ghost" onClick={() => setFormData({ ...formData, guests: formData.guests.filter((_: any, idx: number) => idx !== i) })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xl">
                                                <X className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Link do vídeo / Youtube</label>
                                      <Input
                                        className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                        placeholder="https://youtube.com/..."
                                        value={formData.youtubeLink || formData.videoUrl || ""}
                                        onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value, videoUrl: e.target.value })}
                                        readOnly={isReadOnly}
                                      />
                                    </div>
                                  </div>
                                )}

                            {(activeTab === "eventos" || activeTab === "agenda" || activeTab === "agenda-direcao") && (
                              <>
                                {/* Rodapé Comum do Formulário */}
                                <div className="space-y-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  {!isReadOnly && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">contatos e informações</label>
                                        <Textarea
                                          className={cn("min-h-[100px] rounded-2xl p-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5")}
                                          placeholder="Detalhes de contato e informações adicionais..."
                                          value={formData.additionalInfo || ""}
                                          onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Observações importantes</label>
                                        <Textarea
                                          className={cn("min-h-[100px] rounded-2xl p-6 border transition-all border-dashed border-[#BF76FF]/20", isDarkMode ? "bg-[#BF76FF]/5 text-[#BF76FF]/80" : "bg-purple-50 text-[#BF76FF]")}
                                          placeholder="Obs importantes..."
                                          value={formData.observations || ""}
                                          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                          readOnly={isReadOnly}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Galeria de Imagens */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Galeria de Fotos</label>
                                      {!isReadOnly && (
                                        <div className="flex gap-2">
                                          <UploadImages
                                            maxFiles={10}
                                            value={Array.isArray(formData.gallery) ? formData.gallery : []}
                                            onUploadComplete={(images) => {
                                              const newUrls = images.map(img => img.secure_url);
                                              setFormData({
                                                ...formData,
                                                gallery: [...(Array.isArray(formData.gallery) ? formData.gallery : []), ...newUrls]
                                              });
                                            }}
                                          />
                                          <Button
                                            type="button"
                                            className="h-8 rounded-xl bg-red-600 text-white hover:bg-[#450a0a] hover:text-red-500 font-bold text-[9px] uppercase tracking-widest transition-colors shadow-lg"
                                            onClick={() => setShowClearGalleryDialog(true)}
                                          >
                                            <Trash2 className="w-3 h-3 mr-1" /> Limpar Galeria
                                          </Button>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                      {(Array.isArray(formData.gallery) ? formData.gallery : []).map((url: string, i: number) => (
                                        <div key={`gallery-form-shared-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5">
                                          <img src={url.startsWith('http') ? url : `https://lh3.googleusercontent.com/d/${url}=s300`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          {!isReadOnly && (
                                            <>
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                              <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gallery: formData.gallery.filter((_: any, idx: number) => idx !== i) })}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image: url })}
                                                className={cn(
                                                  "absolute bottom-1 left-1 right-1 py-1 rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20 text-[8px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md",
                                                  formData.image === url ? "bg-[#BF76FF] text-white shadow-[0_0_15px_rgba(191,118,255,0.5)]" : "bg-black/60 text-white hover:bg-black/80"
                                                )}
                                              >
                                                {formData.image === url ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                                {formData.image === url ? "Capa Selecionada" : "Definir como Capa"}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                      {!isReadOnly && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const url = prompt("URL da nova foto:");
                                            if (url) setFormData({ ...formData, gallery: [...(Array.isArray(formData.gallery) ? formData.gallery : []), url] });
                                          }}
                                          className="aspect-square rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-[#BF76FF]/50 hover:bg-[#BF76FF]/5 transition-all"
                                        >
                                          <ImageIcon className="w-6 h-6 opacity-20" />
                                          <span className="text-[8px] font-black uppercase text-center px-2">Nova Foto</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                              </div>
                            )}
                          </div>
                        </>
                      )
                    )}

                    {activeTab === "membros" && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Foto de Perfil</label>
                            {!isReadOnly ? (
                              <UploadImages
                                maxFiles={1}
                                multiple={false}
                                value={formData.photoURL}
                                onUploadComplete={(images) => setFormData({ ...formData, photoURL: images[0]?.secure_url || "" })}
                              />
                            ) : (
                              formData.photoURL && (
                                <div className="mt-2 w-20 h-20 rounded-full overflow-hidden border border-white/5 bg-black/20">
                                  <img src={getImageUrl(formData.photoURL)} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Foto de Capa</label>
                            {!isReadOnly ? (
                              <UploadImages
                                maxFiles={1}
                                multiple={false}
                                value={formData.coverImage}
                                onUploadComplete={(images) => setFormData({ ...formData, coverImage: images[0]?.secure_url || "" })}
                              />
                            ) : (
                              formData.coverImage && (
                                <div className="mt-2 aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                                  <img src={getImageUrl(formData.coverImage)} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</label>
                            <Input
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              value={formData.name || ""}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">E-mail</label>
                            <Input
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              value={formData.email || ""}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">WhatsApp (com DDD)</label>
                            <Input
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              placeholder="11999999999"
                              value={formData.phone || ""}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                            <Input
                              type="date"
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              value={formData.birthDate || ""}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data que se tornou membro</label>
                            <Input
                              type="date"
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              value={formData.joinedDate || ""}
                              onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Instagram className="w-3.5 h-3.5" /> Instagram
                            </label>
                            <Input
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              placeholder="@seu_instagram"
                              value={formData.instagram || ""}
                              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5" /> O que faz de melhor na igreja
                            </label>

                            <div className="relative">
                              <div
                                className={cn(
                                  "min-h-[3.5rem] w-full border rounded-2xl p-3 flex flex-wrap gap-2 cursor-pointer transition-all",
                                  isDarkMode ? "bg-cinza-input border-white/5" : "bg-white border-black/5"
                                )}
                                onClick={() => !isReadOnly && setShowSkillsDropdownAdmin(!showSkillsDropdownAdmin)}
                              >
                                {formData.churchSkills ? formData.churchSkills.split(",").map(skill => skill.trim()).filter(Boolean).map((skill, idx) => (
                                  <span key={idx} className="bg-[#BF76FF]/20 text-[#BF76FF] text-[10px] font-bold uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                                    {skill}
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const skills = formData.churchSkills.split(",").map(s => s.trim()).filter(s => s !== skill);
                                          setFormData({ ...formData, churchSkills: skills.join(", ") });
                                        }}
                                        className="hover:text-white"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </span>
                                )) : (
                                  <span className="text-gray-500 text-sm py-1.5 px-3 italic">Selecione habilidades ministeriais...</span>
                                )}
                              </div>

                              <AnimatePresence>
                                {showSkillsDropdownAdmin && !isReadOnly && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={cn(
                                      "absolute top-full mt-2 left-0 right-0 border rounded-2xl overflow-hidden z-50 shadow-2xl p-4",
                                      isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
                                    )}
                                  >
                                    <div className="flex gap-2 mb-4">
                                      <Input
                                        placeholder="Nova habilidade..."
                                        value={newSkillName}
                                        onChange={(e) => setNewSkillName(e.target.value)}
                                        className={cn("h-10 text-xs", isDarkMode ? "bg-black border-white/10 text-white placeholder:text-gray-600" : "bg-gray-50 border-black/5 text-black")}
                                      />
                                      <Button onClick={handleAddSkill} size="sm" className="bg-[#BF76FF] text-white">Adicionar</Button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                                      {availableSkills.map(skill => {
                                        const isSelected = formData.churchSkills?.split(",").map(s => s.trim()).includes(skill);
                                        return (
                                          <div key={skill} className="flex items-center group">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const currentSkills = formData.churchSkills?.split(",").map(s => s.trim()).filter(Boolean) || [];
                                                if (isSelected) {
                                                  setFormData({ ...formData, churchSkills: currentSkills.filter(s => s !== skill).join(", ") });
                                                } else {
                                                  setFormData({ ...formData, churchSkills: [...currentSkills, skill].join(", ") });
                                                }
                                              }}
                                              className={cn(
                                                "flex-1 text-[10px] font-bold uppercase p-2 rounded-lg text-left transition-colors",
                                                isSelected ? "bg-[#BF76FF] text-white" : "bg-white/5 text-gray-500 hover:bg-white/10"
                                              )}
                                            >
                                              {skill}
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleRemoveSkill(skill); }}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-400 transition-all ml-1"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                                      <Button
                                        type="button"
                                        onClick={() => setShowSkillsDropdownAdmin(false)}
                                        className="bg-[#BF76FF] hover:bg-[#A05ADB] text-white rounded-xl px-6 font-black uppercase text-[10px] tracking-widest h-10 transition-all shadow-lg shadow-[#BF76FF]/20"
                                      >
                                        Confirmar Seleção
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Biografia
                            </label>
                            {!isReadOnly && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-[#BF76FF]/10 text-gray-500 hover:text-[#BF76FF]"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInsertMarkdown('bold');
                                  }}
                                  title="Negrito"
                                >
                                  <Bold className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-[#BF76FF]/10 text-gray-500 hover:text-[#BF76FF]"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInsertMarkdown('italic');
                                  }}
                                  title="Itálico"
                                >
                                  <Italic className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-[#BF76FF]/10 text-gray-500 hover:text-[#BF76FF]"
                                      title="Emojis"
                                    >
                                      <Smile className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className={cn("p-2 grid grid-cols-5 gap-1 min-w-[160px] z-[100]", isDarkMode ? "bg-[#1A1A1A] border-white/10" : "bg-white border-black/10")}>
                                    {["😀", "😍", "🙏", "✨", "🔥", "❤️", "🙌", "😊", "😎", "✝️", "📖", "⛪", "🎶", "🕊️", "💎"].map(emoji => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        className="w-8 h-8 flex items-center justify-center hover:bg-[#BF76FF]/20 rounded-lg transition-colors text-lg"
                                        onClick={() => handleInsertMarkdown('emoji', emoji)}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                          <Textarea
                            ref={bioRef}
                            className={cn("border min-h-[120px] rounded-2xl p-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black shadow-inner")}
                            placeholder="Fale um pouco sobre você (quem é você, há quanto tempo está na igreja, etc)..."
                            value={formData.bio !== undefined ? formData.bio : (formData.additionalInfo || "")}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            readOnly={isReadOnly}
                          />
                        </div>

                        <div className="space-y-4">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Ministérios e Cargos</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allRoles.map(role => {
                              const ministry = (formData.ministries || []).find((m: any) => (typeof m === 'string' ? m : m.name) === role);
                              const isSelected = !!ministry;
                              const isLeader = typeof ministry === 'object' ? ministry.isLeader : false;

                              return (
                                <div key={`role-selection-${role}`} className={cn("p-4 rounded-2xl border flex items-center justify-between transition-all", isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5")}>
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



                        <div className="pt-6 border-t border-white/10 mt-8 space-y-6">
                          <h4 className={cn("text-lg font-black uppercase tracking-widest", isDarkMode ? "text-white" : "text-black")}>Área Profissional / Serviços</h4>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Estas informações aparecerão na página de /servicos</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Área Profissional</label>
                              <Input
                                className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                placeholder="Tecnologia, Saúde, Educação..."
                                value={formData.professionalArea || ""}
                                onChange={(e) => setFormData({ ...formData, professionalArea: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profissão / Serviço Oferecido</label>
                              <Input
                                className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                placeholder="Ex: Pedreiro, Contador, Design Gráfico..."
                                value={formData.profession || ""}
                                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Empresa</label>
                              <Input
                                className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                placeholder="Ex: Construtora Silva"
                                value={formData.companyName || ""}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">WhatsApp Profissional</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="samePhoneAdmin"
                                    checked={formData.isCompanyWhatsappSame || false}
                                    onChange={(e) => setFormData({ ...formData, isCompanyWhatsappSame: e.target.checked })}
                                    disabled={isReadOnly}
                                    className="rounded border-[#BF76FF]/30 bg-white/5 text-[#BF76FF] focus:ring-[#BF76FF]/20"
                                  />
                                  <label htmlFor="samePhoneAdmin" className="text-[9px] uppercase font-bold text-gray-500 cursor-pointer">Mesmo do pessoal</label>
                                </div>
                              </div>
                              <Input
                                className={cn("border h-14 rounded-2xl px-6 transition-all",
                                  isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black",
                                  formData.isCompanyWhatsappSame && "opacity-50"
                                )}
                                placeholder="Ex: 11999999999"
                                value={formData.isCompanyWhatsappSame ? (formData.phone || "Não cadastrado") : (formData.companyWhatsapp || formData.servicePhone || "")}
                                onChange={(e) => setFormData({ ...formData, companyWhatsapp: e.target.value })}
                                readOnly={isReadOnly || formData.isCompanyWhatsappSame}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logo da Empresa (URL)</label>
                              <Input
                                className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                                placeholder="https://exemplo.com/logo.jpg"
                                value={formData.companyLogo || ""}
                                onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Endereço da Empresa</label>
                            <Input
                              className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              placeholder="Rua, Número, Bairro, Cidade - UF"
                              value={formData.companyAddress || formData.serviceAddress || ""}
                              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Serviço / Descrição</label>
                            <Textarea
                              className={cn("border min-h-[120px] rounded-2xl p-6 transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                              placeholder="Descreva detalhadamente o que a empresa faz..."
                              value={formData.companyServiceType || formData.serviceDescription || ""}
                              onChange={(e) => setFormData({ ...formData, companyServiceType: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "radio" && (
                      <div className="space-y-4">
                        {radioSubTab === "tracks" && (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Nome da Música</label>
                              <Input
                                className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="Ex: Louvor de Adoração - Casa do Pai"
                                value={formData.title || ""}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>

                            <div className="flex flex-col gap-2 relative">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Artista</label>
                              <Input
                                list="artists-list"
                                className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="Ex: Aline Barros, Fernandinho..."
                                value={formData.artist || ""}
                                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                readOnly={isReadOnly}
                              />
                              <datalist id="artists-list">
                                {radioArtists.map((a: any) => (
                                  <option key={a.id} value={a.name} />
                                ))}
                              </datalist>
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Fonte</label>
                              <Input
                                className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="Ex: Youtube, Spotify, Gravadora XYZ"
                                value={formData.source || ""}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                          </>
                        )}

                        {radioSubTab === "vignettes" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Título da Vinheta</label>
                            <Input
                              className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                              placeholder="Ex: Identidade Profecia, Chamada de Culto..."
                              value={formData.title || ""}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              readOnly={isReadOnly}
                            />
                          </div>
                        )}

                        {radioSubTab === "artists" && (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Nome do Artista</label>
                              <Input
                                className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="Ex: Gabriel Guedes"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Biografia Curta</label>
                              <Textarea
                                className={cn("rounded-2xl p-6 border transition-all min-h-[100px]", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="Fale um pouco sobre o artista..."
                                value={formData.bio || ""}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Link da Foto (URL)</label>
                              <Input
                                className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="Cole o endereço da imagem..."
                                value={formData.thumbnail || ""}
                                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                readOnly={isReadOnly}
                              />
                              {formData.thumbnail && (
                                <div className="mt-2 w-24 h-24 rounded-full overflow-hidden border border-white/10">
                                  <img src={formData.thumbnail} className="w-full h-full object-cover" alt="Preview Photo" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Instagram (Username ou Link)</label>
                              <Input
                                className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                                placeholder="@usuario"
                                value={formData.instagram || ""}
                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                readOnly={isReadOnly}
                              />
                            </div>
                          </>
                        )}

                        {(radioSubTab === "tracks" || radioSubTab === "vignettes") && (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Link do YouTube</label>
                            <Input
                              className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                              placeholder="Cole o link do YouTube aqui..."
                              value={radioSubTab === "tracks" ? (formData.youtubeId ? `https://youtube.com/watch?v=${formData.youtubeId}` : formData.rawUrl || "") : (formData.youtubeUrl || "")}
                              onChange={(e) => {
                                const url = e.target.value;
                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                const match = url.match(regExp);
                                const videoId = (match && match[2].length === 11) ? match[2] : null;

                                if (radioSubTab === "tracks") {
                                  setFormData({
                                    ...formData,
                                    rawUrl: url,
                                    youtubeId: videoId || ""
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    youtubeUrl: url,
                                    videoId: videoId || "",
                                    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ""
                                  });
                                }
                              }}
                              readOnly={isReadOnly}
                            />
                            {radioSubTab === 'tracks' && formData.youtubeId && (
                              <div className="mt-2 rounded-xl overflow-hidden aspect-video border border-white/10 max-w-[200px]">
                                <img src={`https://img.youtube.com/vi/${formData.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="Preview YouTube" />
                              </div>
                            )}
                          </div>
                        )}

                        {radioSubTab === "tracks" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Ordem na Playlist</label>
                            <Input
                              type="number"
                              className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                              value={formData.order || 1}
                              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                              readOnly={isReadOnly}
                            />
                          </div>
                        )}

                        {radioSubTab === "tracks" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Número de Plays (Desempate pro Top 10)</label>
                            <Input
                              type="number"
                              className={cn("h-14 rounded-2xl px-6 border transition-all", isDarkMode ? "bg-cinza-input border-white/10 text-white focus:bg-white/5" : "bg-white border-black/5 text-black focus:bg-gray-50")}
                              value={formData.playCount || 0}
                              onChange={(e) => setFormData({ ...formData, playCount: parseInt(e.target.value) || 0 })}
                              readOnly={isReadOnly}
                            />
                          </div>
                        )}

                        {radioSubTab === "tracks" && (
                          <div className="flex flex-col gap-2 mt-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-2">Destacar no Top Mais Escutadas?</label>
                            <button
                              type="button"
                              onClick={() => !isReadOnly && setFormData({ ...formData, isTop: !formData.isTop })}
                              disabled={isReadOnly}
                              className={cn("h-14 rounded-2xl px-6 font-bold flex items-center justify-between border transition-all w-full focus:outline-none", isDarkMode ? "bg-cinza-input border-white/10 text-white" : "bg-white border-black/5 text-black", formData.isTop ? (isDarkMode ? "border-[#BF76FF]/50 bg-[#BF76FF]/10 text-[#BF76FF]" : "border-[#BF76FF]/50 bg-[#BF76FF]/5 text-[##8E44AD]") : "")}
                            >
                              <span className="text-sm">{formData.isTop ? "Sim, Destaque" : "Normal"}</span>
                              <div className={cn("w-10 h-6 rounded-full p-1 transition-colors flex items-center border", formData.isTop ? "bg-[#BF76FF] border-[#BF76FF]" : "bg-gray-500/20 border-transparent")}>
                                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", formData.isTop ? "translate-x-4" : "")} />
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "eventos" && selectedItem?.id && (
                      <EventFeedbacksAdmin eventId={selectedItem.id} isDark={isDarkMode} />
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5 items-stretch sm:items-center">
                      {isReadOnly && (activeTab === "agenda" || activeTab === "agenda-direcao" || activeTab === "eventos") ? (
                        <>
                          {(!userRolesArray.every(r => r.name === "Direção")) && activeTab === "agenda-direcao" && (
                            <Button
                              variant="outline"
                              className={cn("w-full sm:w-auto rounded-2xl h-12 px-8 font-bold border-none transition-all", isDarkMode ? "bg-white/5 text-white hover:bg-[#BF76FF] hover:text-white" : "bg-gray-100 text-black hover:bg-[#BF76FF] hover:text-white")}
                              onClick={() => setIsReadOnly(false)}
                            >
                              <Edit className="w-4 h-4 mr-2" /> Editar Compromisso
                            </Button>
                          )}

                          {activeTab === "agenda-direcao" && (canDelete || selectedItem?.authorId === user?.uid) && (
                            <Button
                              variant="ghost"
                              className="w-full sm:w-auto text-red-500 hover:bg-red-500/10 rounded-2xl h-12 px-8 font-bold cursor-pointer transition-all"
                              onClick={() => {
                                if (selectedItem) {
                                  handleDelete(selectedItem, "agenda-direcao");
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Remover da Agenda
                            </Button>
                          )}

                          {activeTab === "agenda" && selectedItem?.status === "pending" && canCreateEventDirectly && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <Button
                                className="bg-green-500 hover:bg-green-600 text-white rounded-2xl h-12 px-8 font-bold cursor-pointer transition-all"
                                onClick={async () => {
                                  try {
                                    await setDoc(doc(db, "agenda", selectedItem.id), { status: "approved", updatedAt: serverTimestamp() }, { merge: true });

                                    // Notificar criador
                                    if (selectedItem.authorId) {
                                      await addDoc(collection(db, "notifications"), {
                                        userId: selectedItem.authorId,
                                        title: "Solicitação Aprovada",
                                        message: `Seu compromisso ${selectedItem.title} foi aprovado por ${profile?.name}.`,
                                        type: "agenda",
                                        read: false,
                                        createdAt: serverTimestamp()
                                      });

                                      // Send chat message
                                      await addDoc(collection(db, "chats"), {
                                        participants: ["system", selectedItem.authorId],
                                        lastMessage: `Seu compromisso ${selectedItem.title} foi aprovado por ${profile?.name}.`,
                                        lastMessageTime: serverTimestamp(),
                                        systemChat: true,
                                        updatedAt: serverTimestamp()
                                      });
                                      const chatQuery = query(collection(db, "chats"), where("systemChat", "==", true), where("participants", "array-contains", selectedItem.authorId));
                                      const chatSnapshot = await getDocs(chatQuery);
                                      let chatId = null;
                                      if (!chatSnapshot.empty) chatId = chatSnapshot.docs[0].id;
                                      if (chatId) {
                                        await addDoc(collection(db, "chats", chatId, "messages"), {
                                          text: `Seu compromisso ${selectedItem.title} foi aprovado por ${profile?.name}.`,
                                          senderId: "system",
                                          timestamp: serverTimestamp()
                                        });
                                      }
                                    }
                                    setIsEditing(false);
                                  } catch (error) {
                                    console.error("Error approving request: ", error);
                                  }
                                }}
                              >
                                <CheckCheck className="w-4 h-4 mr-2" /> Aprovar
                              </Button>
                              <Button
                                variant="ghost"
                                className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 px-8 font-bold cursor-pointer transition-all"
                                onClick={() => {
                                  setItemToReject(selectedItem);
                                  setRejectReason("");
                                  setIsRejectModalOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Reprovar
                              </Button>
                            </div>
                          )}
                          {activeTab === "eventos" && canEdit && (
                            <Button
                              className="w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer"
                              onClick={() => setIsReadOnly(false)}
                            >
                              <Edit className="w-4 h-4 mr-2" /> Editar Evento
                            </Button>
                          )}
                        </>
                      ) : !isReadOnly && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto order-1 sm:order-2 sm:ml-auto">
                          {activeTab === "eventos" && (
                            <>
                              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#BF76FF]/10 border border-[#BF76FF]/20">
                                <input
                                  type="checkbox"
                                  id="notifyAllGlobal"
                                  className="w-5 h-5 accent-[#BF76FF] rounded-lg cursor-pointer"
                                  checked={formData.notifyAll || false}
                                  onChange={(e) => setFormData({ ...formData, notifyAll: e.target.checked })}
                                />
                                <label htmlFor="notifyAllGlobal" className="text-[10px] font-black text-[#BF76FF] uppercase tracking-[0.2em] cursor-pointer select-none">
                                  Notificar push
                                </label>
                              </div>
                              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <input
                                  type="checkbox"
                                  id="hideFromClicks"
                                  className="w-5 h-5 accent-red-500 rounded-lg cursor-pointer"
                                  checked={formData.hideFromClicks || false}
                                  onChange={(e) => setFormData({ ...formData, hideFromClicks: e.target.checked })}
                                />
                                <label htmlFor="hideFromClicks" className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] cursor-pointer select-none">
                                  Ocultar de Clicks Recentes
                                </label>
                              </div>
                            </>
                          )}
                          <Button
                            className="w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer disabled:opacity-50"
                            onClick={handleSave}
                            disabled={isSubmitting}
                          >
                            <Save className="w-4 h-4 mr-2" /> {isSubmitting ? "Salvando..." : (activeTab === 'membros' || activeTab === 'visitantes') ? "Salvar Alterações" : activeTab === 'agenda-direcao' ? "Salvar Compromisso" : "Salvar"}
                          </Button>
                        </div>
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
                                selectedItem.type === 'agenda-direcao' ? 'agenda-direcao' :
                                  activeTab === "eventos" ? "posts" :
                                    activeTab === "membros" || activeTab === "visitantes" ? "members" :
                                      activeTab === "agenda-direcao" ? "agenda-direcao" :
                                        "agenda";
                            handleDelete(selectedItem, col);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : activeTab === "tons" ? (
                <div className="space-y-6 pb-32">
                  <Suspense fallback={<ViewLoader />}>
                    <TonsView isDark={isDarkMode} members={members} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
                  </Suspense>
                </div>

              ) : (activeTab === "membros" || activeTab === "visitantes") && !isEditing ? (
                <div className="space-y-6">
                  {viewingMember ? (
                    <MemberProfile
                      member={viewingMember}
                      isDark={isDarkMode}
                      notifications={notifications}
                      logs={logs}
                      agenda={agenda}
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
                            {showPending ? "Solicitações de Cadastro" : activeTab === "visitantes" ? "Visitantes Cadastrados" : "Membros da Equipe"}
                          </h2>
                          <div className="flex items-center gap-2">
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          {isAdminOrDev && (
                            <>
                              {!showPending && activeTab === "membros" ? (
                                <>
                                  <Button
                                    className={cn(
                                      "w-full sm:w-auto rounded-xl h-11 px-4 font-bold truncate transition-all shadow-lg text-xs flex items-center gap-2",
                                      isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                                    )}
                                    onClick={() => {
                                      setActiveTab("visitantes");
                                      setShowPending(false);
                                    }}
                                  >
                                    <UserSearch className="w-4 h-4" />
                                    Visitantes
                                  </Button>
                                  {pendingMembers.length > 0 && (
                                    <Button
                                      className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl h-11 px-4 font-bold truncate transition-all text-xs flex items-center gap-2"
                                      onClick={() => setShowPending(true)}
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      Solicitações
                                      <span className="bg-white text-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black ml-1">
                                        {pendingMembers.length}
                                      </span>
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  className={cn(
                                    "w-full sm:w-auto rounded-xl h-11 px-4 font-bold truncate transition-all shadow-lg text-xs flex items-center gap-2",
                                    isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                                  )}
                                  onClick={() => {
                                    setActiveTab("membros");
                                    setShowPending(false);
                                  }}
                                >
                                  <Users className="w-4 h-4" />
                                  Ver Membros Ativos
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-12">
                        {(() => {
                          // Agrupar membros por cargo para exibição hierárquica
                          const groups = allRoles.reduce((acc, role) => {
                            if (role === "Diaconisa") return acc; // Agrupado com Diácono

                            const roleName = role === "Diácono" ? "Diácono/Diaconisa" : role;
                            const membersInRole = activeMembersForDisplay.filter(m => {
                              // Extrair todos os cargos possíveis (do campo role, roles e ministries)
                              const mRoles = new Set<string>();
                              if (m.role) mRoles.add(m.role);
                              if (m.roles && Array.isArray(m.roles)) {
                                m.roles.forEach((r: any) => mRoles.add(typeof r === 'string' ? r : r.name));
                              }
                              if (m.ministries && Array.isArray(m.ministries)) {
                                m.ministries.forEach((min: any) => mRoles.add(typeof min === 'string' ? min : min.name));
                              }

                              const rolesArray = Array.from(mRoles).map(r => r.toLowerCase().trim());
                              const targetRole = role.toLowerCase().trim();

                              if (targetRole === "diácono" || targetRole === "diaconisa") {
                                return rolesArray.some(r => r.includes("diácono") || r.includes("diacono") || r.includes("diaconisa"));
                              }
                              return rolesArray.some(r => r === targetRole || r.includes(targetRole));
                            });

                            if (membersInRole.length > 0) {
                              acc.push({ name: roleName, members: membersInRole, color: ROLE_COLORS[role] || "#BF76FF" });
                            }
                            return acc;
                          }, [] as { name: string, members: any[], color: string }[]);

                          // Outros que não se encaixam nos cargos principais
                          const otherMembers = activeMembersForDisplay.filter(m => {
                            const mRoles = new Set<string>();
                            if (m.role) mRoles.add(m.role);
                            if (m.roles && Array.isArray(m.roles)) {
                              m.roles.forEach((r: any) => mRoles.add(typeof r === 'string' ? r : r.name));
                            }
                            if (m.ministries && Array.isArray(m.ministries)) {
                              m.ministries.forEach((min: any) => mRoles.add(typeof min === 'string' ? min : min.name));
                            }
                            const rolesArray = Array.from(mRoles).map(r => r.toLowerCase().trim());
                            return !allRoles.some(role => {
                              const targetRole = role.toLowerCase().trim();
                              if (targetRole === "diácono" || targetRole === "diaconisa") {
                                return rolesArray.some(r => r.includes("diácono") || r.includes("diacono") || r.includes("diaconisa"));
                              }
                              return rolesArray.some(r => r === targetRole || r.includes(targetRole));
                            });
                          });

                          if (otherMembers.length > 0) {
                            groups.push({ name: "Outros", members: otherMembers, color: "#8E8E93" });
                          }

                          if (groups.length === 0) {
                            return (
                              <div className="text-center py-12 text-gray-500">
                                {showPending ? "Nenhuma solicitação de cadastro pendente." : "Nenhum membro ativo encontrado."}
                              </div>
                            );
                          }

                          return groups.map((group) => (
                            <div key={`group-${group.name}`} className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="w-2 h-6 rounded-full" style={{ backgroundColor: group.color }} />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: isDarkMode ? "white" : "black" }}>
                                  {group.name}
                                </h3>
                                <div className="h-px flex-1" style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{group.members.length} {group.members.length === 1 ? "membro" : "membros"}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.members.map((member, i) => (
                                  <div key={member.id || i} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 30}ms` }}>
                                    <div className={cn("p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5 shadow-sm")}>
                                      <TeamMember
                                        member={member}
                                        active={member.email === user?.email}
                                        onWhatsApp={() => openWhatsApp(member)}
                                        onNoWhatsApp={() => setNoWhatsAppUser(member)}
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
                                        onUpdateRole={(m) => {
                                          setMemberToProcess(m);
                                          setIsRoleEditModalOpen(true);
                                        }}
                                        onReject={(m) => {
                                          setMemberToProcess(m);
                                          setIsMemberRejectModalOpen(true);
                                        }}
                                        onDelete={(canDelete || member.email === user?.email) ? () => handleDelete(member, "members") : undefined}
                                        isDark={isDarkMode}
                                        isAdmin={isAdminOrDev}
                                        logAction={logAction}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>
              ) : activeTab === "radio" ? (
                <div className="space-y-6 pb-32">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className={cn("text-2xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>Gestão da Rádio</h2>
                    <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setRadioSubTab("tracks")}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", radioSubTab === "tracks" ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" : "text-gray-500 hover:text-gray-300")}
                      >
                        Músicas (YouTube)
                      </button>
                      <button
                        onClick={() => setRadioSubTab("vignettes")}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", radioSubTab === "vignettes" ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" : "text-gray-500 hover:text-gray-300")}
                      >
                        Vinhetas
                      </button>
                      <button
                        onClick={() => setRadioSubTab("artists")}
                        className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", radioSubTab === "artists" ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" : "text-gray-500 hover:text-gray-300")}
                      >
                        Artistas
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-8">
                    <p className="text-sm text-gray-500">
                      {radioSubTab === "tracks" ? "Gerencie a playlist de louvores do YouTube." : radioSubTab === "vignettes" ? "Gerencie as vinhetas e chamadas rápidas." : "Cadastre perfis de artistas tocados na rádio."}
                    </p>
                    {canCreate && (
                      <Button
                        className="bg-gradient-to-r from-[#BF76FF] to-[#8E44AD] hover:opacity-90 text-white rounded-xl h-12 px-6 font-bold"
                        onClick={() => {
                          setSelectedItem(null);
                          setFormData(radioSubTab === "tracks" ? { order: radioTracks.length + 1 } : {});
                          setIsReadOnly(false);
                          setIsEditing(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" /> {radioSubTab === "tracks" ? "Adicionar Música" : radioSubTab === "vignettes" ? "Adicionar Vinheta" : "Adicionar Artista"}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        className={cn("p-4 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden", isDarkMode ? "bg-[#1a1a1a] border-white/5 hover:bg-[#222] hover:border-[#BF76FF]/30" : "bg-white border-black/5 hover:bg-gray-50 hover:border-[#BF76FF]/30")}
                        onClick={() => {
                          setSelectedItem(item);
                          setFormData(item);
                          setIsReadOnly(!canEdit);
                          setIsEditing(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative", isDarkMode ? "bg-black" : "bg-gray-100")}>
                            {radioSubTab === "tracks" ? (
                              <img src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <img src={item.thumbnail || "https://picsum.photos/seed/mic/100/100"} className="w-full h-full object-cover" alt="" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {radioSubTab === "artists" ? <User className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-current" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("font-bold truncate text-sm uppercase tracking-tight", isDarkMode ? "text-white" : "text-black")}>{item.title || item.name}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              {radioSubTab === "tracks" ? <><Youtube className="w-3 h-3" /> Música</> : radioSubTab === "vignettes" ? <><Radio className="w-3 h-3" /> Vinheta</> : <><User className="w-3 h-3" /> Artista</>}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredItems.length === 0 && (
                      <div className="col-span-full bg-white/5 border border-dashed border-white/10 rounded-2xl py-20 flex flex-col items-center justify-center text-gray-500">
                        <Music className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">Nenhum item encontrado.</p>
                        <p className="text-[10px] mt-1 opacity-60">Comece adicionando {radioSubTab === "tracks" ? "suas músicas favoritas" : radioSubTab === "vignettes" ? "suas vinhetas" : "artistas"}.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "videos" ? (
                <Suspense fallback={<ViewLoader />}>
                  <VideosView isDark={isDarkMode} />
                </Suspense>
              ) : activeTab === "avisos" ? (
                <Suspense fallback={<ViewLoader />}>
                  <AvisosView isDark={isDarkMode} />
                </Suspense>
              ) : activeTab === "ebd" ? (
                <Suspense fallback={<ViewLoader />}>
                  <EBDAdminView isDark={isDarkMode} />
                </Suspense>
              ) : (activeTab === "eventos" || activeTab === "noticias") && !isEditing ? (
                <Suspense fallback={<ViewLoader />}>
                  <EventosView
                    events={filteredItems}
                    isDark={isDarkMode}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    onLoadMore={() => {
                      if (activeTab === "eventos") setEventsLimit(prev => prev + 4);
                      else setNewsLimit(prev => prev + 4);
                    }}
                    title={activeTab === "eventos" ? "Eventos do Mês" : "Notícias"}
                    buttonLabel={activeTab === "eventos" ? "Cadastrar novo evento" : "Nova matéria"}
                    buttonIcon={activeTab === "eventos" ? Plus : Newspaper}
                    emptyLabel={activeTab === "eventos" ? "Nenhum evento cadastrado." : "Nenhuma notícia publicada."}
                    onNewEvent={() => {
                      setSelectedItem(null);
                      setFormData({
                        organization: profile?.role || "Membro"
                      });
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
                      handleDelete(item, activeTab === "noticias" ? "blog" : "posts");
                    }}
                  />
                </Suspense>
              ) : activeTab === "logins" ? (
                <div className="space-y-6 pb-32">
                  <Suspense fallback={<ViewLoader />}>
                    <SavedLoginsAdmin isDark={isDarkMode} />
                  </Suspense>
                </div>
              ) : activeTab === "agenda" ? (
                <div className="space-y-6 pb-32">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className={cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>Agenda Geral</h2>
                  </div>
                  <CalendarView
                    agenda={mergedAgenda}
                    isDark={isDarkMode}
                    canEdit={hasPermission('edit', 'agenda')}
                    canDelete={hasPermission('delete', 'agenda')}
                    canCreateDirectly={canCreateEventDirectly}
                    canRequestDate={true}
                    canNotify={canNotifyOrganizer}
                    onNotifyOrganizer={handleNotifyOrganizer}
                    canImportExisting={canViewTab('agenda-direcao')}
                    onImportExisting={() => setIsImportEventDialogOpen(true)}
                    onRequestDate={(date) => {
                      setRequestFormData({ date: format(date, "yyyy-MM-dd") });
                      setIsRequestingDate(true);
                    }}
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
                      handleDelete(item, col);
                    }}
                  />
                </div>
              ) : activeTab === "visao-geral" ? (
                <div className="space-y-8 md:space-y-12 flex flex-col">
                  {/* Section: Summary Cards */}
                  {isAdminOrDev && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-4">
                      <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-all flex flex-col items-center justify-center text-center gap-3 hover:scale-105", isDarkMode ? "bg-[#222] shadow-2xl border-white/5" : "bg-white shadow-lg border-black/5")}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1", isDarkMode ? "text-white/30" : "text-gray-500")}>Membros</p>
                          <h4 className={cn("text-lg md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>
                            {members.filter(m => {
                              const rolesStr = formatRoles(m).toLowerCase();
                              const isVisitor = rolesStr.includes("visitante") || m.status === "visitor";
                              return !isVisitor && m.status !== "visitor_session" && m.status !== "pending";
                            }).length}
                          </h4>
                        </div>
                      </Card>
                      <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-all flex flex-col items-center justify-center text-center gap-3 hover:scale-105", isDarkMode ? "bg-[#222] shadow-2xl border-white/5" : "bg-white shadow-lg border-black/5")}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center shrink-0">
                          <UserSearch className="w-5 h-5 md:w-6 md:h-6 text-[#BF76FF]" />
                        </div>
                        <div>
                          <p className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1", isDarkMode ? "text-white/30" : "text-gray-500")}>Visitantes</p>
                          <h4 className={cn("text-lg md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>{visitors.length}</h4>
                        </div>
                      </Card>
                      <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-all flex flex-col items-center justify-center text-center gap-3 hover:scale-105", isDarkMode ? "bg-[#222] shadow-2xl border-white/5" : "bg-white shadow-lg border-black/5")}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1", isDarkMode ? "text-white/30" : "text-gray-500")}>Agenda</p>
                          <h4 className={cn("text-lg md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>{counts.agenda}</h4>
                        </div>
                      </Card>
                      <Card className={cn("border-white/5 p-4 md:p-6 rounded-3xl transition-all flex flex-col items-center justify-center text-center gap-3 hover:scale-105", isDarkMode ? "bg-[#222] shadow-2xl border-white/5" : "bg-white shadow-lg border-black/5")}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div>
                          <p className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1", isDarkMode ? "text-white/30" : "text-gray-500")}>Avisos</p>
                          <h4 className={cn("text-lg md:text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black")}>{counts.unreadNotifications}</h4>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Section: Próximos Eventos */}
                  <div className="space-y-6 md:space-y-8 mt-8">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-xl md:text-2xl font-black tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black")}>Agenda Geral</h4>
                    </div>

                    <div className={cn("border rounded-[32px] p-6 md:p-12 transition-colors", isDarkMode ? "bg-[#1C1C1C] border-white/5" : "bg-white border-black/5 shadow-xl")}>
                      <UpcomingEvents 
                        agenda={mergedAgenda} 
                        isDark={isDarkMode} 
                        isAdmin={isAdminOrDev} 
                        onView={(item) => {
                          setSelectedItem(item);
                          setFormData(item);
                          setActiveTab(item.type === 'post' ? 'eventos' : 'agenda');
                          setIsReadOnly(true);
                          setIsEditing(true);
                        }}
                      />
                    </div>
                  </div>

                  {/* Section: Aniversariantes da Semana */}
                  <div className="space-y-6 md:space-y-8 mt-8">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-xl md:text-2xl font-black tracking-tighter transition-colors flex items-center gap-2", isDarkMode ? "text-white" : "text-black")}>
                        <PartyPopper className="w-6 h-6 text-[#BF76FF]" />
                        Aniversariantes
                      </h4>
                    </div>

                    <div className={cn("border rounded-[32px] p-6 transition-colors", isDarkMode ? "bg-[#1C1C1C] border-white/5" : "bg-white border-black/5 shadow-xl")}>
                      {(() => {
                        const now = new Date();
                        const start = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
                        start.setHours(0, 0, 0, 0);
                        const end = endOfWeek(now, { weekStartsOn: 0 }); // Saturday
                        end.setHours(23, 59, 59, 999);

                        const weekBirthdays = members.filter(m => {
                          if (!m.birthDate || m.status === 'pending' || m.status === 'visitor_session') return false;
                          try {
                            const birth = parseISO(m.birthDate + "T12:00:00");
                            const currentBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
                            return currentBirthday >= start && currentBirthday <= end;
                          } catch (e) { return false; }
                        }).sort((a, b) => {
                          const dateA = new Date(now.getFullYear(), parseISO(a.birthDate + "T12:00:00").getMonth(), parseISO(a.birthDate + "T12:00:00").getDate());
                          const dateB = new Date(now.getFullYear(), parseISO(b.birthDate + "T12:00:00").getMonth(), parseISO(b.birthDate + "T12:00:00").getDate());
                          return dateA.getTime() - dateB.getTime();
                        });

                        if (weekBirthdays.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              Nenhum aniversariante nesta semana.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {weekBirthdays.map(m => {
                              const isToday = (() => {
                                if (!m.birthDate) return false;
                                const birth = parseISO(m.birthDate + "T12:00:00");
                                return birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth();
                              })();
                              return (
                                <div key={m.id} className={cn("flex items-center gap-4 p-3 rounded-2xl transition-colors cursor-pointer", isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")} onClick={() => { setActiveTab("membros"); setViewingMember(m); if (window.innerWidth < 1280) setRightSidebarView("hidden"); }}>
                                  <div className="relative">
                                    {isToday && (
                                      <div className="absolute -top-3 -right-2 z-10 drop-shadow-md transform rotate-[15deg]">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-4 ml-1">
                                          <path d="M12 2L4 18H20L12 2Z" fill="#FFC107" />
                                          <path d="M12 2L4 18H20L12 2Z" stroke="#FF9800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                          <circle cx="12" cy="2" r="2" fill="#F44336" />
                                          <circle cx="6" cy="18" r="1.5" fill="#2196F3" />
                                          <circle cx="10" cy="18" r="1.5" fill="#4CAF50" />
                                          <circle cx="14" cy="18" r="1.5" fill="#E91E63" />
                                          <circle cx="18" cy="18" r="1.5" fill="#9C27B0" />
                                        </svg>
                                      </div>
                                    )}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF76FF] to-[#7300FF] p-[2px]">
                                      <div className={cn("w-full h-full rounded-full overflow-hidden flex items-center justify-center", isDarkMode ? "bg-black" : "bg-white")}>
                                        {m.photoURL ? (
                                          <img src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <User className={cn("w-6 h-6", isDarkMode ? "text-gray-400" : "text-gray-300")} />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("font-bold text-sm truncate", isDarkMode ? "text-white" : "text-black")}>{m.name}</p>
                                    <p className="text-xs text-[#BF76FF] font-medium">
                                      {isToday ? "É hoje! 🎉" : format(parseISO(m.birthDate + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Event Feedbacks Section */}
                  <Suspense fallback={<ViewLoader />}>
                    <EventFeedbacksAdmin isDark={isDarkMode} />
                  </Suspense>
                </div>
              ) : activeTab === "agenda-direcao" ? (
                <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className={cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>Agenda da Direção</h2>
                  </div>
                  <CalendarView
                    agenda={agendaDirecao.map(a => ({ ...a, type: 'agenda-direcao' }))}
                    isDark={isDarkMode}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canNotify={canNotifyOrganizer}
                    onNotifyOrganizer={handleNotifyOrganizer}
                    canImportExisting={canViewTab('agenda-direcao')}
                    onImportExisting={() => setIsImportEventDialogOpen(true)}
                    modalTitle="Novo Compromisso"
                    emptyMessage="Não tem compromisso agendados para hoje."
                    newEventButtonLabel="Novo Compromisso"
                    deleteButtonLabel="Remover da Agenda"
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
                      handleDelete(item, "agenda-direcao");
                    }}
                  />
                </div>
              ) : activeTab === "conversas" ? (
                <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className={cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>Conversas</h2>
                  </div>
                  <Card className={cn("border rounded-[32px] p-8 md:p-12 transition-colors min-h-[500px] flex flex-col items-center justify-center text-center", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5 shadow-xl")}>
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
                  <Card className={cn("border rounded-3xl p-4 md:p-8 transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5 shadow-xl")}>
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h4 className={cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>Configurações do Site</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => window.location.href = '/admin/migration'}
                            className={cn("rounded-2xl h-10 px-6 font-bold border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10", isDarkMode && "text-yellow-400")}
                          >
                            <Database className="w-4 h-4 mr-2" />
                            Migrar Banco de Dados
                          </Button>
                          <Button
                            disabled={isSavingSettings || Object.keys(localSettings).length === 0}
                            onClick={async () => {
                              setIsSavingSettings(true);
                              try {
                                await setDoc(doc(db, "settings", "general"), { ...localSettings }, { merge: true });
                                logAction("atualizar", "settings", `Atualizou configurações gerais: ${Object.keys(localSettings).join(", ")}`, settings, { ...settings, ...localSettings });
                                setLocalSettings({}); // Clear local settings so it falls back to DB settings
                              } catch (error) {
                                handleFirestoreError(error, OperationType.UPDATE, "settings/general");
                              } finally {
                                setIsSavingSettings(false);
                              }
                            }}
                            className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-10 px-6 font-bold"
                          >
                            {isSavingSettings ? (
                              <>Salvando...</>
                            ) : (
                              <><Save className="w-4 h-4 mr-2" /> Salvar</>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
                        {/* YouTube Channel Config */}
                        <div className={cn("p-8 rounded-[40px] border transition-all hover:shadow-2xl hover:shadow-red-500/5 group", isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl")}>
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 transition-transform group-hover:scale-110">
                              <Youtube className="w-8 h-8" />
                            </div>
                            <div>
                              <h5 className={cn("text-xl font-black uppercase tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black")}>YouTube Profecia</h5>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sincronização de Vídeos & Lives</p>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">ID ou @ do Canal</label>
                              <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                <Input
                                  className={cn("border-none h-16 rounded-[24px] pl-10 pr-6 text-lg font-bold transition-all", isDarkMode ? "bg-cinza-input text-white focus:bg-white/5" : "bg-gray-100 text-black focus:bg-white")}
                                  placeholder="ministerio_profecia"
                                  value={localSettings.youtubeHandle ?? settings.youtubeHandle ?? "ministerio_profecia"}
                                  onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, youtubeHandle: e.target.value }))}
                                />
                              </div>
                              <p className="text-[9px] text-gray-500 italic pl-2 opacity-60">Utilizado para carregar automaticamente os últimos vídeos no site.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className={cn("p-4 rounded-[28px] border flex items-center justify-between transition-colors", isDarkMode ? "bg-black/20 border-white/5" : "bg-gray-50 border-black/5")}>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Auto-Play Header</p>
                                  <p className="text-[9px] text-gray-500">Vídeos no topo</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={localSettings.enableHeaderVideos ?? settings.enableHeaderVideos ?? true}
                                    onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, enableHeaderVideos: e.target.checked }))}
                                  />
                                  <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                </label>
                              </div>
                              <div className={cn("p-4 rounded-[28px] border flex items-center justify-between transition-colors", isDarkMode ? "bg-black/20 border-white/5" : "bg-gray-50 border-black/5")}>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Efeito Hover</p>
                                  <p className="text-[9px] text-gray-500">Zoom nos cards</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={localSettings.videoCardsEnabled ?? settings.videoCardsEnabled ?? true}
                                    onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, videoCardsEnabled: e.target.checked }))}
                                  />
                                  <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BF76FF]"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Banners Config */}
                        <div className={cn("p-8 rounded-[40px] border transition-all hover:shadow-2xl hover:shadow-[#BF76FF]/5 group", isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl")}>
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF] transition-transform group-hover:scale-110">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                            <div>
                              <h5 className={cn("text-xl font-black uppercase tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black")}>Banners Rotativos</h5>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Grade de 3 Banners (Home)</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                              <div key={`banner-config-${i}`} className={cn("p-5 rounded-[28px] border space-y-4", isDarkMode ? "bg-black/20 border-white/5" : "bg-gray-50 border-black/5")}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase text-[#BF76FF]">Banner 0{i}</span>
                                  {localSettings[`homeBannerImage${i === 1 ? '' : i}`] && (
                                    <div className="w-8 h-5 rounded-md overflow-hidden border border-white/10">
                                      <img src={localSettings[`homeBannerImage${i === 1 ? '' : i}`]} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-1">URL da Imagem</label>
                                    <Input
                                      className={cn("h-11 rounded-xl border-none text-xs transition-all", isDarkMode ? "bg-cinza-input text-white" : "bg-white text-black")}
                                      placeholder="https://..."
                                      value={localSettings[`homeBannerImage${i === 1 ? '' : i}`] ?? settings[`homeBannerImage${i === 1 ? '' : i}`] ?? ""}
                                      onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, [`homeBannerImage${i === 1 ? '' : i}`]: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-1">Link de Destino</label>
                                    <Input
                                      className={cn("h-11 rounded-xl border-none text-xs transition-all", isDarkMode ? "bg-cinza-input text-white" : "bg-white text-black")}
                                      placeholder="https://..."
                                      value={localSettings[`homeBannerLink${i === 1 ? '' : i}`] ?? settings[`homeBannerLink${i === 1 ? '' : i}`] ?? ""}
                                      onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, [`homeBannerLink${i === 1 ? '' : i}`]: e.target.value }))}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Maintenance Mode Card (Footer of Section) */}
                      <div className={cn("p-8 rounded-[40px] border mt-8 transition-all relative overflow-hidden", isDarkMode ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-500/10")}>
                        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 blur-[80px] rounded-full -mr-16 -mt-16" />
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                          <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                              <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                              <h5 className="text-xl font-black text-red-500 uppercase tracking-tighter">Modo de Manutenção</h5>
                              <p className="text-xs text-gray-500 max-w-md">Ao ativar, apenas administradores poderão acessar o site. Usuários comuns verão uma tela de manutenção.</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={localSettings.maintenanceMode ?? settings.maintenanceMode ?? false}
                              onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, maintenanceMode: e.target.checked }))}
                            />
                            <div className="w-16 h-8 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-lg shadow-red-500/20"></div>
                          </label>
                        </div>
                      </div>
                    </div>


                      <div className={cn("pt-8 border-t transition-colors", isDarkMode ? "border-white/5" : "border-black/5")}>
                        <h4 className={cn("text-xl font-bold mb-6 transition-colors", isDarkMode ? "text-white" : "text-black")}>Configuração de Permissões</h4>

                        {/* Role Selector */}
                        <div className="flex flex-wrap gap-2 mb-8 p-2 rounded-[24px] bg-black/5 dark:bg-white/5">
                          {allRoles.map(role => {
                            const isSelected = selectedPermissionRole === role;
                            return (
                              <button
                                key={`role-selector-${role}`}
                                onClick={() => setSelectedPermissionRole(role)}
                                className={cn(
                                  "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  isSelected
                                    ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20"
                                    : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                                )}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>

                        {selectedPermissionRole ? (
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={cn("p-6 md:p-10 rounded-[40px] border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5 shadow-2xl")}>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                  <h5 className="text-3xl font-black text-[#BF76FF] uppercase tracking-tighter mb-2">
                                    {selectedPermissionRole === "Administradores" ? "Administrador Master" : selectedPermissionRole}
                                  </h5>
                                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Defina o que este cargo pode acessar e realizar em cada menu.</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#BF76FF]/5 border border-[#BF76FF]/10">
                                  <ShieldCheck className="w-5 h-5 text-[#BF76FF]" />
                                  <span className="text-[10px] font-black uppercase text-[#BF76FF] tracking-widest">Gestão de Acesso</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {menuItems.map(tab => {
                                  // Determinar valores atuais
                                  const rolePerms = settings.permissions?.[selectedPermissionRole] || {};
                                  const tabData = rolePerms.tabs?.[tab.id];
                                  
                                  const getVal = (action: string) => {
                                    if (tabData && typeof tabData === 'object') return tabData[action] ?? true;
                                    if (action === 'view') {
                                      if (tabData === true || tabData === false) return tabData;
                                      return canRoleViewTab(selectedPermissionRole, false, tab.id);
                                    }
                                    return rolePerms[action] ?? !["Membro", "Visitante"].includes(selectedPermissionRole);
                                  };

                                  const actions = [
                                    { id: 'view', label: 'Ver', color: 'blue' },
                                    { id: 'create', label: 'Criar', color: 'green' },
                                    { id: 'edit', label: 'Editar', color: 'amber' },
                                    { id: 'delete', label: 'Excluir', color: 'red' }
                                  ];

                                  return (
                                    <div 
                                      key={`tab-perm-card-${tab.id}`} 
                                      className={cn(
                                        "relative group p-8 rounded-[40px] border transition-all duration-500",
                                        isDarkMode 
                                          ? "bg-[#1a1a1a] border-white/[0.03] hover:border-[#BF76FF]/30 hover:shadow-[0_0_40px_-15px_rgba(191,118,255,0.2)]" 
                                          : "bg-white border-black/[0.03] shadow-xl hover:shadow-[#BF76FF]/10"
                                      )}
                                    >
                                      {/* Background Glow Effect */}
                                      <div className="absolute inset-0 bg-gradient-to-br from-[#BF76FF]/0 to-[#BF76FF]/0 group-hover:from-[#BF76FF]/5 group-hover:to-transparent rounded-[40px] transition-all duration-700" />
                                      
                                      <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                          <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BF76FF]/20 to-[#BF76FF]/5 flex items-center justify-center text-[#BF76FF] shadow-inner">
                                              <tab.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                              <span className={cn("font-black uppercase tracking-tighter text-base transition-colors", isDarkMode ? "text-white" : "text-black")}>
                                                {tab.label}
                                              </span>
                                              <div className="h-0.5 w-0 group-hover:w-full bg-[#BF76FF] transition-all duration-500 rounded-full" />
                                            </div>
                                          </div>
                                          <div className="w-2 h-2 rounded-full bg-[#BF76FF] animate-pulse shadow-[0_0_10px_#BF76FF]" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          {actions.map(action => {
                                            const isChecked = getVal(action.id);
                                            return (
                                              <div 
                                                key={`${tab.id}-${action.id}`}
                                                onClick={async () => {
                                                  const newValue = !isChecked;
                                                  const currentTabs = rolePerms.tabs || {};
                                                  const currentTabData = typeof currentTabs[tab.id] === 'object' ? currentTabs[tab.id] : { 
                                                    view: typeof currentTabs[tab.id] === 'boolean' ? currentTabs[tab.id] : canRoleViewTab(selectedPermissionRole, false, tab.id),
                                                    create: rolePerms.create ?? !["Membro", "Visitante"].includes(selectedPermissionRole),
                                                    edit: rolePerms.edit ?? !["Membro", "Visitante"].includes(selectedPermissionRole),
                                                    delete: rolePerms.delete ?? !["Membro", "Visitante"].includes(selectedPermissionRole)
                                                  };

                                                  const newPermissions = {
                                                    ...settings.permissions,
                                                    [selectedPermissionRole]: {
                                                      ...rolePerms,
                                                      tabs: {
                                                        ...currentTabs,
                                                        [tab.id]: {
                                                          ...currentTabData,
                                                          [action.id]: newValue
                                                        }
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
                                                  "group/btn relative flex flex-col items-center justify-center p-4 rounded-[24px] border transition-all duration-300 cursor-pointer overflow-hidden",
                                                  isChecked 
                                                    ? isDarkMode 
                                                      ? "bg-[#BF76FF]/10 border-[#BF76FF]/40 shadow-[inset_0_0_20px_rgba(191,118,255,0.1)]" 
                                                      : "bg-[#BF76FF]/5 border-[#BF76FF]/30" 
                                                    : isDarkMode
                                                      ? "bg-white/[0.02] border-white/[0.05] grayscale opacity-40 hover:opacity-70"
                                                      : "bg-gray-50 border-black/[0.05] grayscale opacity-40 hover:opacity-70"
                                                )}
                                              >
                                                {/* Inner Glow when active */}
                                                {isChecked && (
                                                  <div className="absolute inset-0 bg-gradient-to-t from-[#BF76FF]/10 to-transparent" />
                                                )}
                                                
                                                <span className={cn(
                                                  "text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors",
                                                  isChecked ? "text-[#BF76FF]" : "text-gray-500"
                                                )}>
                                                  {action.label}
                                                </span>

                                                <div className={cn(
                                                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                                                  isChecked 
                                                    ? "bg-[#BF76FF] text-white shadow-[0_0_15px_rgba(191,118,255,0.6)] scale-110" 
                                                    : "bg-black/20 text-gray-600 scale-100"
                                                )}>
                                                  {isChecked ? (
                                                    <Check className="w-4 h-4 stroke-[4]" />
                                                  ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );

                                })}
                              </div>

                              {/* Footer: Admin Options */}
                              <div className={cn("mt-12 pt-10 border-t flex flex-wrap gap-6", isDarkMode ? "border-white/5" : "border-black/5")}>
                                <div className="space-y-4 flex-1 min-w-[300px]">
                                  <h6 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Permissões Globais / Administrativas</h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                      { label: "Gerenciar Perfis", key: "editProfiles" },
                                      { label: "Apagar fotos da Galeria", key: "deletePhotos" }
                                    ].map(perm => {
                                      const isChecked = settings.permissions?.[selectedPermissionRole]?.[perm.key] ?? (
                                        perm.key === "editProfiles" 
                                          ? (selectedPermissionRole === "Administradores" || selectedPermissionRole === "Desenvolvedor")
                                          : !["Membro", "Visitante"].includes(selectedPermissionRole)
                                      );

                                      return (
                                        <div key={`global-perm-${perm.key}`} className={cn("flex items-center justify-between p-4 rounded-[24px] border", isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-sm")}>
                                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{perm.label}</span>
                                          <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              className="sr-only peer"
                                              checked={isChecked}
                                              onChange={async (e) => {
                                                const newValue = e.target.checked;
                                                const newPermissions = {
                                                  ...settings.permissions,
                                                  [selectedPermissionRole]: {
                                                    ...(settings.permissions?.[selectedPermissionRole] || {}),
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
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={cn("p-12 rounded-[32px] border border-dashed flex flex-col items-center justify-center text-center", isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5")}>
                            <ShieldCheck className="w-12 h-12 text-gray-500 mb-4 opacity-20" />
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Selecione um cargo para gerenciar permissões</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                ) : activeTab === "logs" ? (


                <div className="p-4 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h2 className={cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>Auditoria</h2>
                  </div>

                  {/* Sub-tabs for Auditoria */}
                  <div className="flex gap-2 mb-8 p-1 rounded-2xl bg-black/5 dark:bg-white/5 w-fit">
                    <button
                      onClick={() => setAuditSubTab("logs")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        auditSubTab === "logs"
                          ? "bg-white dark:bg-roxo-bg shadow-sm text-primary"
                          : "text-gray-500 hover:text-gray-400"
                      )}
                    >
                      Logs de Ações
                    </button>
                    <button
                      onClick={() => setAuditSubTab("bugs")}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        auditSubTab === "bugs"
                          ? "bg-white dark:bg-roxo-bg shadow-sm text-primary"
                          : "text-gray-500 hover:text-gray-400"
                      )}
                    >
                      Bugs Reportados
                      {pendingBugsCount > 0 && (
                        <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                          {pendingBugsCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {auditSubTab === "logs" ? (
                    <>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <h2 className={cn("text-3xl font-black transition-colors uppercase tracking-tighter hidden", isDarkMode ? "text-white" : "text-black")}>Logs</h2>

                        <div className="flex flex-wrap gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                              value={logSearch}
                              onChange={(e) => setLogSearch(e.target.value)}
                              placeholder="Buscar log..."
                              className={cn("pl-10 h-10 w-64 rounded-xl border-none transition-colors", isDarkMode ? "bg-white/5 text-gray-400 focus:text-white" : "bg-gray-100 text-gray-600 focus:text-black")}
                            />
                          </div>

                          <LogFilterSelect
                            label="Ações"
                            value={logFilterAction}
                            onChange={setLogFilterAction}
                            isDarkMode={isDarkMode}
                            options={[
                              { label: "Todas", value: "todos" },
                              { label: "Criar", value: "criar" },
                              { label: "Atualizar", value: "atualizar" },
                              { label: "Excluir", value: "excluir" },
                              { label: "Aprovação", value: "member_approval" },
                              { label: "Login", value: "login" },
                              { label: "Logout", value: "logout" },
                            ]}
                          />

                          <LogFilterSelect
                            label="Menu"
                            value={logFilterCategory}
                            onChange={setLogFilterCategory}
                            isDarkMode={isDarkMode}
                            options={[
                              { label: "Todos", value: "todos" },
                              { label: "Notícias/Eventos", value: "posts" },
                              { label: "Blog", value: "blog" },
                              { label: "Membros", value: "members" },
                              { label: "Agenda", value: "agenda" },
                              { label: "Configurações", value: "settings" },
                            ]}
                          />

                          <div className="relative">
                            <input
                              type="date"
                              value={logFilterDate}
                              onChange={(e) => setLogFilterDate(e.target.value)}
                              className={cn("h-10 px-4 rounded-xl text-xs font-bold border-none cursor-pointer", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black")}
                            />
                          </div>

                          {(logSearch || logFilterAction !== 'todos' || logFilterCategory !== 'todos' || logFilterDate) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLogSearch("");
                                setLogFilterAction("todos");
                                setLogFilterCategory("todos");
                                setLogFilterDate("");
                              }}
                              className="h-10 text-gray-500 hover:text-red-500"
                            >
                              <XCircle className="w-4 h-4 mr-2" /> Limpar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-none">
                        {[
                          { label: "Todo o tempo", value: "" },
                          { label: "Hoje", value: format(new Date(), 'yyyy-MM-dd') },
                          { label: "Ontem", value: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') }
                        ].map((period) => (
                          <button
                            key={period.label}
                            onClick={() => setLogFilterDate(period.value)}
                            className={cn(
                              "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                              logFilterDate === period.value
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : "bg-white/5 text-gray-500 hover:bg-white/10"
                            )}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>

                      <Card className={cn("border rounded-[32px] transition-colors overflow-hidden mx-auto w-full", isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-black/5 shadow-xl")}>
                        <div className="w-full overflow-x-hidden overflow-y-auto max-h-[700px] custom-scrollbar">
                          <table className="w-full text-left border-collapse table-auto">
                            <thead>
                              <tr className={cn("border-b transition-colors sticky top-0 z-10", isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-black/5")}>
                                <th className="p-4 md:p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Data/Hora / Menu</th>
                                <th className="p-4 md:p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Responsável</th>
                                <th className="p-4 md:p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center w-[80px] md:w-[100px]">Ação</th>
                                <th className="p-4 md:p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Resumo</th>
                                <th className="p-4 md:p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right w-[100px] md:w-[140px]">Ações</th>
                              </tr>
                            </thead>
                            <tbody className={cn("divide-y text-[13px]", isDarkMode ? "divide-white/5" : "divide-black/5")}>
                              {logs
                                .filter(log => {
                                  const matchesSearch = !logSearch ||
                                    log.details?.toLowerCase().includes(logSearch.toLowerCase()) ||
                                    log.target?.toLowerCase().includes(logSearch.toLowerCase()) ||
                                    log.userName?.toLowerCase().includes(logSearch.toLowerCase());

                                  const matchesAction = logFilterAction === 'todos' || log.action === logFilterAction;
                                  const matchesCategory = logFilterCategory === 'todos' || log.target === logFilterCategory;
                                  const matchesDate = !logFilterDate || (log.timestamp?.toDate && format(log.timestamp.toDate(), 'yyyy-MM-dd') === logFilterDate);

                                  return matchesSearch && matchesAction && matchesCategory && matchesDate;
                                })
                                .map((log, i) => (
                                  <tr key={log.id || i} className={cn("hover:bg-white/5 transition-colors group")}>
                                    <td className="p-4 md:p-6 hidden md:table-cell">
                                      <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-primary uppercase tracking-tighter mb-1 truncate">
                                          {log.target || "Sistema"}
                                        </span>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), "dd/MM HH:mm") : "..."}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-4 md:p-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 hidden md:flex">
                                          {log.userName?.substring(0, 1).toUpperCase() || "A"}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className={cn("font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{log.userName || "Admin"}</span>
                                          <span className="text-[10px] text-gray-500 truncate">{log.userEmail}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 md:p-6 text-center">
                                      <span className={cn(
                                        "px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest inline-block whitespace-nowrap",
                                        log.action === 'criar' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                          log.action === 'atualizar' ? "bg-primary/10 text-primary border border-primary/20" :
                                            log.action === 'excluir' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                              "bg-gray-500/10 text-gray-400 border border-gray-500/10"
                                      )}>
                                        {log.action}
                                      </span>
                                    </td>
                                    <td className="p-4 md:p-6 hidden sm:table-cell">
                                      <p className="text-gray-400 line-clamp-1 italic text-[11px] leading-relaxed">
                                        {log.details || "Sem detalhes adicionais."}
                                      </p>
                                    </td>
                                    <td className="p-4 md:p-6 text-right">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedLog(log)}
                                        className={cn(
                                          "h-8 px-2 md:px-4 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border-none transition-all scale-95 hover:scale-100",
                                          isDarkMode ? "bg-white/5 text-white hover:bg-white/10" : "bg-gray-100 text-black hover:bg-gray-200"
                                        )}
                                      >
                                        <Eye className="w-3 h-3 md:mr-2" /> <span className="hidden md:inline">Detalhes</span>
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              {logs.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-20 text-center text-gray-500 text-sm">
                                    Nenhum log encontrado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </Card>

                      <AnimatePresence>
                        {selectedLog && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setSelectedLog(null)}
                              className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 20 }}
                              className={cn(
                                "relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[40px] shadow-2xl flex flex-col",
                                isDarkMode ? "bg-roxo-bg border border-white/10" : "bg-white"
                              )}
                            >
                              <div className="p-8 border-b border-white/5 flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-black uppercase tracking-widest">EXTRATO DETALHADO</span>
                                    <span className="text-gray-500 text-[10px]">#LOG-{selectedLog.id?.substring(0, 8)}</span>
                                  </div>
                                  <h3 className={cn("text-2xl font-black uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black")}>
                                    {selectedLog.action} em {selectedLog.target}
                                  </h3>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                  <X className="w-5 h-5 text-gray-500" />
                                </button>
                              </div>

                              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Executado por</p>
                                    <p className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-black")}>{selectedLog.userName}</p>
                                    <p className="text-xs text-gray-500">{selectedLog.userEmail}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Horário exato</p>
                                    <p className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-black")}>
                                      {selectedLog.timestamp?.toDate ? format(selectedLog.timestamp.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss") : "Indisponível"}
                                    </p>
                                  </div>
                                </div>

                                <div className="p-6 rounded-[24px] bg-white/5 border border-white/5 mb-8">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Descrição Geral</p>
                                  <p className="text-sm text-gray-300 leading-relaxed italic">
                                    "{selectedLog.details}"
                                  </p>
                                </div>

                                {selectedLog.fullDetails && (
                                  <div className="space-y-6">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                      {selectedLog.action === 'excluir' ? 'Dados Excluídos' : 'Alterações por Campo'}
                                    </p>
                                    <div className="space-y-3">
                                      {selectedLog.action === 'excluir'
                                        ? Object.keys(selectedLog.fullDetails.old || {})
                                          .filter(key => !['updatedAt', 'id', 'createdAt', 'authorId', 'authorName'].includes(key))
                                          .map(key => (
                                            <div key={key} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                                              <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                <span className="text-[10px] font-black uppercase text-red-400">{key}</span>
                                              </div>
                                              <p className="text-xs text-gray-400 break-all">
                                                {typeof selectedLog.fullDetails.old[key] === 'object'
                                                  ? JSON.stringify(selectedLog.fullDetails.old[key])
                                                  : String(selectedLog.fullDetails.old[key] || "vazio")}
                                              </p>
                                            </div>
                                          ))
                                        : Object.keys({ ...selectedLog.fullDetails.old, ...selectedLog.fullDetails.new })
                                          .filter(key => {
                                            const oldV = selectedLog.fullDetails.old?.[key];
                                            const newV = selectedLog.fullDetails.new?.[key];
                                            return JSON.stringify(oldV) !== JSON.stringify(newV) &&
                                              !['updatedAt', 'id', 'createdAt', 'authorId', 'authorName'].includes(key);
                                          })
                                          .map(key => {
                                            const oldVal = selectedLog.fullDetails.old?.[key];
                                            const newVal = selectedLog.fullDetails.new?.[key];

                                            return (
                                              <div key={key} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                                  <span className="text-[11px] font-black uppercase text-gray-400">{key}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                  <div className="space-y-1 opacity-60">
                                                    <span className="text-[9px] uppercase font-bold text-red-500/80">Anterior</span>
                                                    <p className="line-clamp-2 break-all">{typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal || "vazio")}</p>
                                                  </div>
                                                  <div className="space-y-1">
                                                    <span className="text-[9px] uppercase font-bold text-green-500/80">Novo</span>
                                                    <p className="line-clamp-2 break-all">{typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal || "vazio")}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })
                                      }
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="p-8 border-t border-white/5 bg-black/20">
                                <Button
                                  onClick={() => setSelectedLog(null)}
                                  className="w-full h-12 rounded-[20px] bg-primary text-white font-bold tracking-widest uppercase text-xs"
                                >
                                  Fechar Detalhes
                                </Button>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bugReports.length === 0 ? (
                          <div className="col-span-full py-20 text-center opacity-40">
                            <Bug className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">Nenhum bug reportado</p>
                          </div>
                        ) : (
                          bugReports.map((bug) => (
                            <Card
                              key={bug.id}
                              className={cn(
                                "border rounded-[32px] overflow-hidden transition-all group",
                                isDarkMode ? "bg-roxo-bg border-white/5 hover:border-red-500/30" : "bg-white border-black/5 hover:shadow-xl hover:border-red-500/20"
                              )}
                            >
                              <CardHeader className="p-6 pb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    bug.status === "pending" ? "bg-red-500/10 text-red-500" :
                                      bug.status === "resolved" ? "bg-green-500/10 text-green-500" :
                                        "bg-gray-500/10 text-gray-500"
                                  )}>
                                    {bug.status === "pending" ? "Pendente" : bug.status === "resolved" ? "Resolvido" : "Arquivado"}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tabular-nums">
                                    {safeFormatDate(bug.createdAt)}
                                  </span>
                                </div>
                              </CardHeader>
                              <CardContent className="px-6 pb-6 pt-0 space-y-4">
                                <p className={cn("text-xs leading-relaxed overflow-hidden break-words", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                                  {bug.description}
                                </p>

                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                  <div className="w-8 h-8 rounded-lg bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF] font-black text-xs shrink-0">
                                    {bug.userName?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{bug.userName}</span>
                                    <span className="text-[9px] text-gray-500 truncate">{bug.userEmail}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  {bug.status === "pending" && (
                                    <Button
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "bug-reports", bug.id), { status: "resolved" });

                                          // Notificar quem reportou
                                          if (bug.userId) {
                                            await addDoc(collection(db, "notifications"), {
                                              userId: bug.userId,
                                              title: "Bug Resolvido",
                                              message: "O erro que você reportou foi resolvido, obrigado por ajudar!",
                                              read: false,
                                              type: "bug",
                                              createdAt: serverTimestamp()
                                            });
                                          }

                                          logAction("atualizar", "bug-reports", `Marcou bug como resolvido: ${bug.id}`);
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.UPDATE, `bug-reports/${bug.id}`);
                                        }
                                      }}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-9 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3 h-3 mr-2" /> Resolvido
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    onClick={async () => {
                                      if (window.confirm("Deseja realmente excluir este relato?")) {
                                        try {
                                          await deleteDoc(doc(db, "bug-reports", bug.id));
                                          logAction("excluir", "bug-reports", `Excluiu relato de bug: ${bug.id}`);
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.DELETE, `bug-reports/${bug.id}`);
                                        }
                                      }
                                    }}
                                    className="px-3 rounded-xl h-9 text-gray-500 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-10 h-10 text-gray-500" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-white">Selecione um item para editar</h4>
                  <p className="text-gray-400">Ou clique no botão "Novo Item" para criar um novo registro.</p>
                  {canCreate && (
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

          {/* Modal de Solicitação de Data */}
          <Dialog open={isRequestingDate} onOpenChange={setIsRequestingDate}>
            <DialogContent className={cn("border rounded-[32px] sm:max-w-md p-6 transition-colors shadow-2xl", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-white" : "bg-white border-black/5 text-black")}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Solicitar Agendamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assunto do evento</label>
                  <Input
                    className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5")}
                    placeholder="Ex: Ensaio do Ministério..."
                    value={requestFormData.title || ""}
                    onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data do evento</label>
                  <Input
                    type="date"
                    className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-white/5 border-white/10 [color-scheme:dark]" : "bg-gray-50 border-black/5")}
                    value={requestFormData.date || ""}
                    onChange={(e) => setRequestFormData({ ...requestFormData, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Início</label>
                    <Input
                      type="time"
                      className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-white/5 border-white/10 [color-scheme:dark]" : "bg-gray-50 border-black/5")}
                      value={requestFormData.startTime || ""}
                      onChange={(e) => setRequestFormData({ ...requestFormData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Término</label>
                    <Input
                      type="time"
                      className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-white/5 border-white/10 [color-scheme:dark]" : "bg-gray-50 border-black/5")}
                      value={requestFormData.endTime || ""}
                      onChange={(e) => setRequestFormData({ ...requestFormData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Local</label>
                  <Input
                    className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5")}
                    placeholder="Ex: Igreja"
                    value={requestFormData.location || ""}
                    onChange={(e) => setRequestFormData({ ...requestFormData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    Telefone pra contato <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full normal-case">Visível apenas para admins</span>
                  </label>
                  <Input
                    className={cn("border h-14 rounded-2xl px-6 transition-all", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5")}
                    placeholder="Ex: (00) 00000-0000"
                    value={requestFormData.phone || ""}
                    onChange={(e) => setRequestFormData({ ...requestFormData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações</label>
                  <Textarea
                    className={cn("border min-h-[100px] rounded-2xl p-6 transition-all resize-none", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5")}
                    placeholder="Qualquer detalhe extra..."
                    value={requestFormData.observations || ""}
                    onChange={(e) => setRequestFormData({ ...requestFormData, observations: e.target.value })}
                  />
                </div>

                <Button
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-black uppercase tracking-widest shadow-xl mt-6"
                  onClick={() => {
                    if (!requestFormData.title || !requestFormData.date || !requestFormData.startTime || !requestFormData.endTime || !requestFormData.phone) {
                      setRequestStatusMessage({
                        type: 'warning',
                        title: 'Campos Incompletos',
                        message: 'Por favor, preencha o assunto, data, horários de início e término, e o telefone de contato para continuar.'
                      });
                      return;
                    }
                    setIsConfirmRequestOpen(true);
                  }}
                >
                  Solicitar Agendamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Motivo da Recusa */}
          <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
            <DialogContent className={cn("border rounded-[32px] sm:max-w-md p-6 transition-colors shadow-2xl", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-white" : "bg-white border-black/5 text-black")}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Motivo da Recusa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-red-500">Atenção</label>
                  <div className={cn("p-4 rounded-2xl text-sm", isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600")}>
                    Você está recusando o compromisso: <span className="font-bold">{itemToReject?.title}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informe o motivo (opcional)</label>
                  <Textarea
                    className={cn("border min-h-[120px] rounded-2xl p-6 transition-all resize-none", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5")}
                    placeholder="Ex: Data já ocupada por outro evento prioritário..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    className="w-full h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest shadow-xl"
                    onClick={async () => {
                      if (!itemToReject) return;
                      setIsRejectModalOpen(false);
                      try {
                        // Delete the document instead of just marking as rejected
                        await deleteDoc(doc(db, "agenda", itemToReject.id));

                        // Notificar criador
                        if (itemToReject.authorId) {
                          try {
                            await addDoc(collection(db, "notifications"), {
                              userId: itemToReject.authorId,
                              title: "Solicitação Recusada",
                              message: `Seu compromisso "${itemToReject.title}" foi recusado e removido da agenda. Motivo: ${rejectReason || "Sem motivo informado"}.`,
                              type: "agenda_rejected",
                              read: false,
                              createdAt: serverTimestamp()
                            });

                            // Mensagem no chat do sistema
                            const chatId = ["system", itemToReject.authorId].sort().join('_');
                            // Garantir que o chat existe
                            await setDoc(doc(db, "chats", chatId), {
                              participants: ["system", itemToReject.authorId],
                              lastMessage: `Seu compromisso "${itemToReject.title}" foi recusado. Motivo: ${rejectReason || "Sem motivo informado"}.`,
                              lastMessageTime: serverTimestamp(),
                              systemChat: true,
                              updatedAt: serverTimestamp()
                            }, { merge: true });

                            await addDoc(collection(db, "chats", chatId, "messages"), {
                              text: `Seu compromisso "${itemToReject.title}" foi recusado e removido da agenda. Motivo: ${rejectReason || "Sem motivo informado"}.`,
                              senderId: "system",
                              timestamp: serverTimestamp()
                            });
                          } catch (err) {
                            console.error("Error sending rejection notifications:", err);
                          }
                        }

                        setIsEditing(false);
                        setItemToReject(null);
                      } catch (error) {
                        console.error("Error rejecting request: ", error);
                        alert("Erro ao reprovar solicitação.");
                      }
                    }}
                  >
                    Confirmar Reprovação
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest"
                    onClick={() => setIsRejectModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Confirmação de Solicitação */}
          <Dialog open={isConfirmRequestOpen} onOpenChange={setIsConfirmRequestOpen}>
            <DialogContent className={cn("border rounded-[32px] sm:max-w-md p-6 transition-colors shadow-2xl", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-white" : "bg-white border-black/5 text-black")}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Confirmar Solicitação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">Atenção!</h3>
                  <p className="text-sm opacity-70">
                    Ao solicitar este agendamento ele passará por uma análise. Uma vez enviado, o pedido não poderá ser cancelado diretamente.
                  </p>
                  <div className="mt-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-left space-y-1">
                    <div className="text-[10px] uppercase font-bold opacity-40">Compromisso</div>
                    <div className="font-bold">{requestFormData.title}</div>
                    <div className="text-[10px] uppercase font-bold opacity-40 mt-2">Data e Hora</div>
                    <div className="font-bold">
                      {requestFormData.date && format(new Date(requestFormData.date + "T00:00:00"), "dd/MM/yyyy")}
                      {" "}das {requestFormData.startTime} às {requestFormData.endTime}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-black uppercase tracking-widest shadow-xl"
                    onClick={async () => {
                      const eventDate = `${requestFormData.date}T${requestFormData.startTime}`;
                      const dataToSave = {
                        title: requestFormData.title,
                        date: eventDate,
                        endTime: requestFormData.endTime, // New endTime field
                        location: requestFormData.location || "Igreja Local",
                        phone: requestFormData.phone || "",
                        observations: requestFormData.observations || "",
                        status: "pending",
                        menuSource: "agenda",
                        authorId: profile?.id || user?.uid || "",
                        authorName: profile?.name || "Membro", // Keep authorName
                        createdAt: serverTimestamp(),
                      };

                      try {
                        // Fechar o modal de confirmação antes de começar o processo
                        setIsConfirmRequestOpen(false);

                        await addDoc(collection(db, "agenda"), dataToSave);

                        // Marcar como sucesso logue após salvar na agenda
                        setIsRequestingDate(false);
                        setRequestFormData({});
                        setRequestStatusMessage({
                          type: 'success',
                          title: 'Enviado com Sucesso!',
                          message: 'Sua solicitação foi enviada e agora aguarda análise da administração.'
                        });

                        // Processar notificações em background para não travar o feedback
                        (async () => {
                          try {
                            const rolesCanApprove = ["Administradores", "Desenvolvedor", "Secretaria", "Secretário", "Mídia"];
                            const usersToNotify = (members || []).filter(m =>
                              (rolesCanApprove.includes(m.role) || (m.role === 'Mídia' && m.isLeader)) &&
                              m.id !== (profile?.id || user?.uid)
                            );

                            for (const u of usersToNotify) {
                              try {
                                await addDoc(collection(db, "notifications"), {
                                  userId: u.id,
                                  title: "Nova Solicitação de Agendamento",
                                  message: `Nova solicitação de compromisso por ${profile?.name || "Membro"}`,
                                  type: "request",
                                  read: false,
                                  createdAt: serverTimestamp()
                                });
                              } catch (err) {
                                console.error("Erro ao notificar admin:", u.id, err);
                              }
                            }

                            if (profile?.id || user?.uid) {
                              await addDoc(collection(db, "notifications"), {
                                userId: profile?.id || user?.uid,
                                title: "Solicitação em Análise",
                                message: "Sua solicitação foi enviada para administração, Agora é só aguardar...",
                                type: "agenda",
                                read: false,
                                createdAt: serverTimestamp()
                              });
                            }
                          } catch (notifErr) {
                            console.error("Erro no processamento secundário de notificações:", notifErr);
                          }
                        })();

                      } catch (e) {
                        console.error("Erro ao solicitar agendamento:", e);
                        // Reabrir o modal ou mostrar erro se falhar o salvamento principal
                        setRequestStatusMessage({
                          type: 'error',
                          title: 'Erro no Envio',
                          message: 'Não foi possível enviar sua solicitação. Por favor, verifique sua conexão e tente novamente.'
                        });
                      }
                    }}
                  >
                    Confirmar Envio
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest"
                    onClick={() => setIsConfirmRequestOpen(false)}
                  >
                    Voltar e Editar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Feedback de Status */}
          <Dialog open={!!requestStatusMessage} onOpenChange={(open) => !open && setRequestStatusMessage(null)}>
            <DialogContent className={cn("border rounded-[40px] sm:max-w-md p-10 transition-colors shadow-2xl text-center", isDarkMode ? "bg-[#1A1A1A] border-white/5 text-white" : "bg-white border-black/5 text-black")}>
              <div className="flex flex-col items-center gap-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center shadow-inner",
                    requestStatusMessage?.type === 'success' ? "bg-green-500/10 text-green-500" :
                      requestStatusMessage?.type === 'error' ? "bg-red-500/10 text-red-500" :
                        "bg-amber-500/10 text-amber-500"
                  )}
                >
                  {requestStatusMessage?.type === 'success' ? <CheckCheck className="w-12 h-12" /> :
                    requestStatusMessage?.type === 'error' ? <XCircle className="w-12 h-12" /> :
                      <AlertCircle className="w-12 h-12" />}
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">{requestStatusMessage?.title}</h2>
                  <p className={cn("font-medium leading-relaxed px-4", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    {requestStatusMessage?.message}
                  </p>
                </div>

                <Button
                  className={cn(
                    "w-full h-16 rounded-[24px] text-white font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all",
                    requestStatusMessage?.type === 'error' ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-[#BF76FF] to-[#7300FF] hover:opacity-90"
                  )}
                  onClick={() => setRequestStatusMessage(null)}
                >
                  Continuar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </main>

        {/* Sidebar 3: Stats & Files (Hidden on mobile/tablets, only permanent on XL) */}
        <aside className={cn(
          "fixed top-0 bottom-0 right-0 z-[40] w-full xl:w-80 border-l flex-col overflow-hidden transition-all duration-300 xl:relative xl:flex pb-20 md:pb-0",
          rightSidebarView !== "hidden" ? "translate-x-0 flex" : "translate-x-full xl:translate-x-0 hidden xl:flex",
          isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white lg:bg-gray-50 border-black/5"
        )}>

          <div className="flex justify-between xl:justify-end items-center p-6 pb-4 shrink-0 border-b border-black/5 dark:border-white/5">
            <div className="hidden md:block xl:hidden">
              <button onClick={() => setRightSidebarView("hidden")} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              {canViewTab("avisos") && (
                <ActionIcon
                  icon={Megaphone}
                  active={activeTab === "avisos"}
                  onClick={() => { setActiveTab("avisos"); setRightSidebarView("hidden"); }}
                  isDark={isDarkMode}
                />
              )}
              <ActionIcon
                icon={MessageSquare}
                active={rightSidebarView === "chat-list" || rightSidebarView === "chat-active"}
                onClick={() => setRightSidebarView(rightSidebarView === "chat-list" ? "hidden" : "chat-list")}
                isDark={isDarkMode}
                hasNotification={activeChats.some(chat => chat.unreadCount?.[profile?.id || ''] > 0)}
                notificationCount={activeChats.reduce((acc, chat) => acc + (chat.unreadCount?.[profile?.id || ''] || 0), 0)}
              />
              <ActionIcon
                icon={Users}
                active={rightSidebarView === "team" || (rightSidebarView === "hidden" && window.innerWidth >= 1280)}
                onClick={() => setRightSidebarView(rightSidebarView === "team" ? "hidden" : "team")}
                isDark={isDarkMode}
              />
            </div>
          </div>

          {(rightSidebarView === "team" || (rightSidebarView === "hidden" && window.innerWidth >= 1280)) && (
            <div className="flex-1 min-h-0 px-6 pt-4 overflow-y-auto scrollbar-hide flex flex-col">
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
                      className={cn("w-full border rounded-2xl py-3 pl-10 pr-4 text-sm outline-none transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                    />
                  </div>

                  <div className="space-y-8">
                    {(() => {
                      const getPrimaryRole = (m: any) => {
                        const allMemberRoles = new Set<string>();
                        if (m.role) allMemberRoles.add(m.role.toLowerCase().trim());
                        if (m.roles && Array.isArray(m.roles)) {
                          m.roles.forEach((r: any) => allMemberRoles.add((typeof r === 'string' ? r : r.name).toLowerCase().trim()));
                        }
                        if (m.ministries && Array.isArray(m.ministries)) {
                          m.ministries.forEach((min: any) => allMemberRoles.add((typeof min === 'string' ? min : min.name).toLowerCase().trim()));
                        }

                        const rolesArray = Array.from(allMemberRoles);

                        for (const role of allRoles) {
                          const targetRole = role.toLowerCase().trim();
                          if (targetRole === "diácono" || targetRole === "diaconisa") {
                            if (rolesArray.some(r => r.includes("diácono") || r.includes("diacono") || r.includes("diaconisa"))) return "Diácono";
                          } else {
                            if (rolesArray.some(r => r === targetRole || r.includes(targetRole))) return role;
                          }
                        }
                        return m.role === "Visitante" ? "Visitante" : "Membro";
                      };

                      const groupedMembers = new Map<string, any[]>();
                      members.forEach(m => {
                        const pr = getPrimaryRole(m);
                        if (!groupedMembers.has(pr)) groupedMembers.set(pr, []);
                        if (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase())) {
                          groupedMembers.get(pr)!.push(m);
                        }
                      });

                      return (
                        <>
                          {/* Team Categories - Now visible to all members */}
                          {(() => {
                            const allPossibleRoles = allRoles.filter(r => !["Membro", "Visitante", "Administradores", "Diaconisa"].includes(r));

                            return allPossibleRoles.map(rawRole => {
                              const isDiaconia = rawRole === "Diácono";
                              const displayRole = isDiaconia ? "Diácono/Diaconisa" : rawRole;
                              const roleKey = isDiaconia ? "Diaconia" : rawRole;

                              let roleMembers = groupedMembers.get(rawRole) || [];
                              if (isDiaconia) {
                                roleMembers = [...roleMembers, ...(groupedMembers.get("Diaconisa") || [])];
                              }

                              roleMembers.sort((a, b) => {
                                const isLeaderA = (a.ministries || []).some((min: any) => typeof min === 'object' && (min.name === rawRole || (isDiaconia && min.name === "Diaconisa")) && min.isLeader) || a.role === "Administradores" || a.role === "Desenvolvedor";
                                const isLeaderB = (b.ministries || []).some((min: any) => typeof min === 'object' && (min.name === rawRole || (isDiaconia && min.name === "Diaconisa")) && min.isLeader) || b.role === "Administradores" || b.role === "Desenvolvedor";
                                if (isLeaderA && !isLeaderB) return -1;
                                if (!isLeaderA && isLeaderB) return 1;
                                return (a.name || "").localeCompare(b.name || "");
                              });

                              if (roleMembers.length === 0 && (rightSidebarSearch)) return null;

                              const isCollapsed = collapsedTeamCategories[roleKey] ?? true;

                              return (
                                <div key={`role-group-${roleKey}`} className="space-y-1">
                                  <button
                                    onClick={async () => {
                                      if (isCollapsed) {
                                        const roleMembersAlreadyLoaded = members.filter(m => {
                                          const pr = getPrimaryRole(m);
                                          return pr === roleKey || (roleKey === "Diaconia" && (pr === "Diácono" || pr === "Diaconisa"));
                                        }).length;

                                        if (roleMembersAlreadyLoaded === 0 || members.length === 0) {
                                          try {
                                            let data: any[] = [];
                                            if (roleKey === "Diaconia") {
                                              const [dias, diacas] = await Promise.all([
                                                firestoreService.getCollection<any>("members", [where("role", "==", "Diácono")], 1000 * 60 * 30),
                                                firestoreService.getCollection<any>("members", [where("role", "==", "Diaconisa")], 1000 * 60 * 30)
                                              ]);
                                              data = [...dias, ...diacas];
                                            } else {
                                              data = await firestoreService.getCollection<any>("members", [where("role", "==", rawRole)], 1000 * 60 * 30);
                                            }

                                            setMembers(prev => {
                                              const existingIds = new Set(prev.map(p => p.id));
                                              const newOnes = data.filter(d => !existingIds.has(d.id));
                                              return [...prev, ...newOnes].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                                            });
                                          } catch (err) {
                                            console.error("Error loading role members:", err);
                                          }
                                        }
                                      }
                                      setCollapsedTeamCategories(prev => ({ ...prev, [roleKey]: !isCollapsed }));
                                    }}
                                    style={{
                                      backgroundColor: isDarkMode ? `${ROLE_COLORS[roleKey] || '#BF76FF'}15` : `${ROLE_COLORS[roleKey] || '#BF76FF'}08`
                                    }}
                                    className={cn("w-full transition-opacity hover:opacity-70 group flex items-center justify-between p-2.5 rounded-xl mb-1")}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: ROLE_COLORS[roleKey] || '#BF76FF', boxShadow: `0 0 10px ${ROLE_COLORS[roleKey] || '#BF76FF'}` }} />
                                      <h5 className="text-[11px] font-black uppercase tracking-widest" style={{ color: ROLE_COLORS[roleKey] || '#BF76FF' }}>
                                        {displayRole}
                                      </h5>
                                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border", isDarkMode ? "bg-white/5 border-white/10 text-gray-400" : "bg-black/5 border-black/10 text-gray-500")}>
                                        {roleMembers.length || roleCounts[roleKey] || 0}
                                      </span>
                                    </div>
                                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-white/50" /> : <ChevronDown className="w-3.5 h-3.5 text-white/50" />}
                                  </button>

                                  {!isCollapsed && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                      {roleMembers.length > 0 ? (
                                        roleMembers.map((member, i) => (
                                          <TeamMember
                                            key={`role-member-${roleKey}-${member.id || i}`}
                                            member={member}
                                            active={member.email === user?.email}
                                            onWhatsApp={() => openWhatsApp(member)}
                                            onNoWhatsApp={() => setNoWhatsAppUser(member)}
                                            onViewProfile={() => {
                                              setActiveTab("membros");
                                              setViewingMember(member);
                                              if (window.innerWidth < 1280) setRightSidebarView("hidden");
                                            }}
                                            isDark={isDarkMode}
                                            isAdmin={isAdminOrDev}
                                            logAction={logAction}
                                          />
                                        ))
                                      ) : (
                                        <p className={cn("text-[10px] italic pl-3", isDarkMode ? "text-gray-600" : "text-gray-400")}>Nenhum membro carregado</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}

                          {/* Others in Sidebar 3 */}
                          {(() => {
                            const standardMembers = groupedMembers.get("Membro") || [];
                            if (standardMembers.length === 0) return null;
                            const isCollapsed = collapsedTeamCategories["Membro"] ?? true;

                            return (
                              <div className="space-y-1">
                                <button
                                  onClick={async () => {
                                    if (isCollapsed) {
                                      const alreadyLoaded = members.filter(m => getPrimaryRole(m) === "Membro").length;
                                      const expected = roleCounts["Membro"] || 0;
                                      if (alreadyLoaded < expected || members.length === 0) {
                                        try {
                                          const data = await firestoreService.getCollection<any>("members", [where("role", "==", "Membro")], 1000 * 60 * 30);
                                          setMembers(prev => {
                                            const existingIds = new Set(prev.map(p => p.id));
                                            const newOnes = data.filter(d => !existingIds.has(d.id));
                                            return [...prev, ...newOnes].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                                          });
                                        } catch (err) {
                                          console.error("Error loading Member role:", err);
                                        }
                                      }
                                    }
                                    setCollapsedTeamCategories(prev => ({ ...prev, ["Membro"]: !isCollapsed }));
                                  }}
                                  style={{
                                    backgroundColor: isDarkMode ? `${ROLE_COLORS["Membro"]}15` : `${ROLE_COLORS["Membro"]}08`
                                  }}
                                  className={cn("w-full transition-opacity hover:opacity-70 group flex items-center justify-between p-2.5 rounded-xl mb-1")}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: ROLE_COLORS["Membro"], boxShadow: `0 0 10px ${ROLE_COLORS["Membro"]}` }} />
                                    <h5 className="text-[11px] font-black uppercase tracking-widest" style={{ color: ROLE_COLORS["Membro"] }}>
                                      Membros
                                    </h5>
                                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border", isDarkMode ? "bg-white/5 border-white/10 text-gray-400" : "bg-black/5 border-black/10 text-gray-500")}>
                                      {(rightSidebarSearch && rightSidebarSearch.trim() !== "") ? standardMembers.length : (roleCounts["Membro"] || 0)}
                                    </span>
                                  </div>
                                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-white/100" /> : <ChevronDown className="w-3.5 h-3.5 text-white/100" />}
                                </button>

                                {!isCollapsed && (
                                  <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {standardMembers.map((member, i) => (
                                      <TeamMember
                                        key={`sidebar-standard-${member.id || i}`}
                                        member={member}
                                        active={member.email === user?.email}
                                        onWhatsApp={() => openWhatsApp(member)}
                                        onNoWhatsApp={() => setNoWhatsAppUser(member)}
                                        onViewProfile={() => {
                                          setActiveTab("membros");
                                          setViewingMember(member);
                                          if (window.innerWidth < 1280) setRightSidebarView("hidden");
                                        }}
                                        onDelete={() => handleDelete(member.id, "members")}
                                        isDark={isDarkMode}
                                        isAdmin={isAdmin}
                                        logAction={logAction}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}

                    {/* Visitors in Sidebar 4 */}
                    {(() => {
                      const sidebarVisitors = visitors.filter(m => {
                        return (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
                      });
                      if (sidebarVisitors.length === 0) return null;
                      const isCollapsed = collapsedTeamCategories["Visitantes"] ?? true;

                      return (
                        <div className="space-y-1">
                          <button
                            onClick={async () => {
                              if (isCollapsed) {
                                const alreadyLoaded = members.filter(m => m.status === "visitor_session").length;
                                const expected = roleCounts["Visitantes"] || 0;
                                if (alreadyLoaded < expected || members.length === 0) {
                                  try {
                                    const data = await firestoreService.getCollection<any>("members", [where("status", "==", "visitor_session")], 1000 * 60 * 30);
                                    setMembers(prev => {
                                      const existingIds = new Set(prev.map(p => p.id));
                                      const newOnes = data.filter(d => !existingIds.has(d.id));
                                      return [...prev, ...newOnes].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                                    });
                                  } catch (err) {
                                    console.error("Error loading Visitor status:", err);
                                  }
                                }
                              }
                              setCollapsedTeamCategories(prev => ({ ...prev, ["Visitantes"]: !isCollapsed }));
                            }}
                            style={{
                              backgroundColor: isDarkMode ? `${ROLE_COLORS["Visitantes"]}15` : `${ROLE_COLORS["Visitantes"]}08`
                            }}
                            className="w-full transition-opacity hover:opacity-70 group flex items-center justify-between p-2.5 rounded-xl mb-1"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: ROLE_COLORS["Visitantes"], boxShadow: `0 0 10px ${ROLE_COLORS["Visitantes"]}` }} />
                              <h5 className="text-[11px] font-black uppercase tracking-widest" style={{ color: ROLE_COLORS["Visitantes"] }}>
                                Visitantes
                              </h5>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#b9ffa9]/10 border border-[#b9ffa9]/10 text-[#b9ffa9]">
                                {(rightSidebarSearch && rightSidebarSearch.trim() !== "") ? sidebarVisitors.length : (roleCounts["Visitantes"] || 0)}
                              </span>
                            </div>
                            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-white/100" /> : <ChevronDown className="w-3.5 h-3.5 text-white/100" />}
                          </button>

                          {!isCollapsed && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                              {sidebarVisitors.map((member, i) => (
                                <TeamMember
                                  key={`sidebar-visitor-${member.id || i}`}
                                  member={member}
                                  active={member.email === user?.email}
                                  onWhatsApp={() => openWhatsApp(member)}
                                  onNoWhatsApp={() => setNoWhatsAppUser(member)}
                                  onViewProfile={() => {
                                    setActiveTab("visitantes");
                                    setViewingMember(member);
                                    if (window.innerWidth < 1280) setRightSidebarView("hidden");
                                  }}
                                  onDelete={() => handleDelete(member.id, "members")}
                                  isDark={isDarkMode}
                                  isAdmin={isAdmin}
                                  logAction={logAction}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {rightSidebarView === "profile" && viewingMember && (
            <div className={cn("flex-1 min-h-0 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-roxo-bg" : "bg-white lg:bg-gray-50")}>
              <div className="p-6 pt-4 pb-2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setRightSidebarView("team")} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors mr-1">
                    <ArrowLeft className={cn("w-5 h-5", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                  </button>
                  <h2 className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-black")}>Perfil</h2>
                </div>
                <button
                  onClick={() => setRightSidebarView("hidden")}
                  className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative mb-4">
                    {viewingMember.photoURL || viewingMember.photoUrl ? (
                      <img src={getImageUrl(viewingMember.photoURL || viewingMember.photoUrl)} className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-white/10" />
                    ) : (
                      <div className="w-32 h-32 rounded-3xl bg-[#1a1a1a] text-4xl font-bold flex items-center justify-center text-[#BF76FF] shadow-2xl">
                        {viewingMember.name?.[0] || 'M'}
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{viewingMember.name}</h3>
                  <p className="text-[#BF76FF] font-black uppercase text-xs tracking-widest mt-1">{viewingMember.role || viewingMember.profession || 'Membro'}</p>
                </div>

                <div className="space-y-6">
                  {viewingMember.bio && (
                    <div>
                      <h4 className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40 mb-2">Sobre</h4>
                      <p className="text-sm opacity-70 leading-relaxed italic">"{viewingMember.bio}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-[24px] bg-black/5 dark:bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3 mb-1">
                        <Calendar className="w-4 h-4 text-[#BF76FF]" />
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Membro desde</span>
                      </div>
                      <p className="text-sm font-bold">{viewingMember.joinedDate || 'N/A'}</p>
                    </div>

                    {viewingMember.phone && (
                      <div className="p-4 rounded-[24px] bg-black/5 dark:bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-1">
                          <Phone className="w-4 h-4 text-[#BF76FF]" />
                          <span className="text-[10px] uppercase font-black tracking-widest opacity-40">WhatsApp</span>
                        </div>
                        <p className="text-sm font-bold">{viewingMember.phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 pb-20">
                    <Button
                      onClick={() => openWhatsApp(viewingMember)}
                      className="w-full h-14 bg-[#BF76FF] hover:bg-[#A05ADB] text-white rounded-[20px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rightSidebarView === "chat-list" && (
            <div className={cn("flex-1 min-h-0 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-roxo-bg" : "bg-white lg:bg-gray-50")}>
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
                          {m.photoURL || m.photoUrl ? (
                            <img src={getImageUrl(m.photoURL || m.photoUrl)} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-xl font-bold flex items-center justify-center text-[#BF76FF]">
                              {m.name?.[0] || 'M'}
                            </div>
                          )}
                          {(m.status_presence === "online" || m.status_presence === "ocupado") && (
                            <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-white dark:border-[#0f0f0f] rounded-full", getStatusColor(m.status_presence))} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className={cn("font-bold text-sm truncate mb-1", isDarkMode ? "text-white" : "text-black")}>{m.name || 'Membro'}</h4>
                          <p className="text-xs text-gray-500 truncate font-medium flex items-center gap-1">
                            {chat.lastSenderId && chat.lastSenderId !== profile?.id ? (
                              <i className="font-bold">{m.name?.[0]?.toUpperCase()}: </i>
                            ) : chat.lastSenderId === profile?.id ? (
                              <i>Você: </i>
                            ) : null}
                            {stripMentions(chat.lastMessage) || "Toque para abrir a conversa"}
                          </p>
                        </div>
                        {chat.unreadCount?.[profile?.id || ''] > 0 && (
                          <div className="bg-red-500 text-white min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shrink-0 shadow-sm ml-2 self-center">
                            <span className="text-[10px] font-black">
                              {chat.unreadCount[profile?.id || ''] > 9 ? '+9' : chat.unreadCount[profile?.id || '']}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {rightSidebarView === "chat-active" && activeChatUser && (
            <div className={cn("flex-1 min-h-0 flex flex-col relative overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-roxo-bg" : "bg-white lg:bg-gray-50")}>
              {/* Header */}
              <div className={cn("px-5 py-4 border-b flex items-center justify-between shadow-sm z-10 shrink-0", isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-black/5")}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setRightSidebarView("chat-list")} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors mr-1">
                    <ArrowLeft className={cn("w-5 h-5", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                  </button>
                  <div className="relative shrink-0">
                    {activeChatUser.photoURL || activeChatUser.photoUrl ? (
                      <img src={getImageUrl(activeChatUser.photoURL || activeChatUser.photoUrl)} className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5 text-lg font-bold flex items-center justify-center text-[#BF76FF]">
                        {activeChatUser.name?.[0] || 'M'}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-[#111] rounded-full" style={{ backgroundColor: activeChatUser.status_online === 'online' ? '#22c55e' : activeChatUser.status_online === 'busy' ? '#ef4444' : activeChatUser.status_online === 'away' ? '#f59e0b' : '#6b7280' }} />
                  </div>
                  <div className="flex flex-col relative top-0.5">
                    <h3 className={cn("font-extrabold text-[15px] leading-tight", isDarkMode ? "text-white" : "text-gray-900")}>{activeChatUser.name || 'Membro'}</h3>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", activeChatUser.status_online === 'online' ? 'text-[#22c55e]' : activeChatUser.status_online === 'busy' ? 'text-red-500' : activeChatUser.status_online === 'away' ? 'text-amber-500' : 'text-gray-500')}>
                      {activeChatUser.status_online === 'online' ? 'Online' : activeChatUser.status_online === 'busy' ? 'Ocupado' : activeChatUser.status_online === 'away' ? 'Ausente' : 'Offline'}
                    </p>
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
              <div className={cn("p-4 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] relative", isDarkMode ? "bg-roxo-bg border-white/5" : "bg-white border-t border-black/5")}>
                {/* Mention Suggestions */}
                {showMentionSuggestions && (
                  <div className={cn(
                    "absolute bottom-[calc(100%+8px)] left-4 right-4 max-h-64 overflow-y-auto rounded-2xl shadow-2xl z-[100] border p-1 animate-in fade-in slide-in-from-bottom-2 duration-200",
                    isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
                  )}>
                    {members
                      .filter(m => !!m.name && m.name.trim() !== '' && m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                      .slice(0, 10)
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
                            "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group",
                            isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                          )}
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#BF76FF]/30 overflow-hidden transition-all">
                            {m.photoURL ? (
                              <img src={m.photoURL} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-[#BF76FF]">{m.name?.[0]}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={cn("text-sm font-bold truncate", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                              {m.name}
                            </span>
                            <span className="text-[10px] opacity-40 uppercase tracking-tighter font-black">Membro da Equipe</span>
                          </div>
                        </button>
                      ))
                    }
                    {members.filter(m => !!m.name && m.name.trim() !== '' && m.name.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-[10px] text-center opacity-40 italic flex flex-col items-center gap-2">
                        <Users className="w-4 h-4" />
                        Nenhum membro encontrado
                      </div>
                    )}
                  </div>
                )}

                <div className={cn("flex items-end gap-2 p-1.5 pl-3 rounded-3xl transition-transform focus-within:-translate-y-1", isDarkMode ? "bg-cinza-input border border-white/10 focus-within:bg-cinza-input" : "bg-gray-100 focus-within:bg-gray-200")}>
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
          <DialogContent className={cn("border rounded-[32px] p-8 max-w-sm transition-colors", isDarkMode ? "bg-roxo-bg border-white/10 text-white" : "bg-white border-black/10 text-black")}>
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

        {/* Import Event Dialog */}
        <Dialog open={isImportEventDialogOpen} onOpenChange={setIsImportEventDialogOpen}>
          <DialogContent className={cn("sm:max-w-xl p-0 overflow-hidden max-h-[85vh] flex flex-col rounded-[32px] border", isDarkMode ? "bg-roxo-bg border-white/10" : "bg-white border-black/10")}>
            <div className="p-8 pb-4">
              <DialogHeader>
                <DialogTitle className={cn("text-2xl font-black transition-colors", isDarkMode ? "text-white" : "text-black")}>Adicionar Evento Existente</DialogTitle>
              </DialogHeader>
              <div className="mt-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar em eventos e agenda comum..."
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  className={cn("pl-12 h-14 rounded-2xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin scrollbar-thumb-[#BF76FF]/20">
              <div className="space-y-3 pt-4">
                {eventsToImport.length > 0 ? (
                  eventsToImport.map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      onClick={() => handleImportEvent(event)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between",
                        isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-[#BF76FF]/30" : "bg-gray-50 border-black/5 hover:bg-white hover:shadow-lg hover:border-[#BF76FF]/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {event.thumbnail ? (
                          <img src={event.thumbnail} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                        ) : (
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", event.type === 'post' ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500")}>
                            {event.type === 'post' ? <Star className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className={cn("font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{event.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                            <CalendarDays className="w-3 h-3" />
                            <span>{safeFormatDate(event.date)}</span>
                            <span>•</span>
                            <span className="uppercase tracking-widest">{event.type === 'post' ? 'Evento' : 'Agenda'}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="group-hover:text-[#BF76FF] transition-colors rounded-full">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 opacity-40">
                    <Search className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-bold">Nenhum evento encontrado</p>
                  </div>
                )}
              </div>
            </div>

            <div className={cn("p-6 border-t flex justify-end", isDarkMode ? "border-white/5" : "border-black/5")}>
              <Button variant="ghost" onClick={() => setIsImportEventDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bug Report Dialog */}
        <Dialog open={isReportingBug} onOpenChange={setIsReportingBug}>
          <DialogContent className={cn(
            "sm:max-w-md rounded-[32px] border p-0 overflow-hidden [&>button:last-child]:top-6 [&>button:last-child]:right-6",
            isDarkMode ? "bg-roxo-bg border-white/10 text-white" : "bg-white border-black/10 text-black"
          )}>
            {showBugSuccess ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Relato Enviado!</h3>
                  <p className="opacity-70">Seu relato foi enviado com sucesso, obrigado por cooperar com o nosso crescimento!</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-8 pb-4">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                      <Bug className="w-6 h-6 text-red-500" />
                      Reportar Bug
                    </DialogTitle>
                    <DialogDescription className="text-xs uppercase font-bold text-gray-500 tracking-widest">
                      Encontrou um erro no sistema? Descreva-o detalhadamente abaixo para que possamos corrigir.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Descrição do Problema</Label>
                      <Textarea
                        value={bugDescription}
                        onChange={(e) => setBugDescription(e.target.value)}
                        placeholder="Ex: Não consigo editar o perfil do membro, quando clico em salvar nada acontece..."
                        className={cn("min-h-[150px] rounded-2xl border transition-all resize-none shadow-inner", isDarkMode ? "bg-white/5 border-white/5 text-white placeholder:text-gray-600 focus:border-[#BF76FF]/50" : "bg-gray-50 border-black/5 text-black placeholder:text-gray-400 focus:border-[#BF76FF]/50")}
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium leading-relaxed uppercase tracking-wider">
                        Ao enviar este relatório, capturamos automaticamente seu nome e data para facilitar o rastreio do erro.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 p-8 pt-4 bg-transparent border-t border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsReportingBug(false)}
                    className={cn("w-full rounded-2xl h-12 font-bold cursor-pointer transition-all", isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
                    disabled={isSavingBug}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReportBug}
                    disabled={!bugDescription.trim() || isSavingBug}
                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] cursor-pointer shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    {isSavingBug ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Member Selector Dialog */}
        <Dialog open={isMemberSelectorOpen} onOpenChange={setIsMemberSelectorOpen}>
          <DialogContent className={cn("sm:max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col rounded-[32px] border", isDarkMode ? "bg-roxo-bg border-white/10" : "bg-white border-black/10")}>
            <div className="p-8 pb-4">
              <DialogHeader>
                <DialogTitle className={cn("text-2xl font-black transition-colors", isDarkMode ? "text-white" : "text-black")}>Convidar Membros</DialogTitle>
              </DialogHeader>
              <div className="mt-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por nome ou cargo..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className={cn("pl-12 h-14 rounded-2xl border transition-all", isDarkMode ? "bg-cinza-input border-white/5 text-gray-500 focus:text-white" : "bg-white border-black/5 text-gray-400 focus:text-black")}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin scrollbar-thumb-[#BF76FF]/20">
              <div className="space-y-2 pt-4">
                {members
                  .filter(m => !!m.name && m.name.trim() !== '' && (m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.role?.toLowerCase().includes(memberSearch.toLowerCase())) && m.status !== "pending")
                  .map((member, idx) => {
                    const isSelected = formData.invitedMembers?.some((m: any) => m.id === member.id);
                    return (
                      <div
                        key={`invited-member-selection-${member.id || idx}`}
                        onClick={() => {
                          const currentInvited = formData.invitedMembers || [];
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              invitedMembers: currentInvited.filter((m: any) => m.id !== member.id)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              invitedMembers: [...currentInvited, { id: member.id, name: member.name, photo: member.photoURL }]
                            });
                          }
                        }}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                          isSelected
                            ? isDarkMode ? "bg-[#BF76FF]/20 border-[#BF76FF]/40" : "bg-[#BF76FF]/10 border-[#BF76FF]/30"
                            : isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-black/5 hover:bg-white hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                            {member.photoURL ? (
                              <img src={getImageUrl(member.photoURL)} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#BF76FF]/20 text-[#BF76FF] font-bold">
                                {member.name?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className={cn("text-sm font-bold truncate", isDarkMode ? "text-white" : "text-black")}>{member.name}</h4>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none mt-1">
                              {formatRoles(member)}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                          isSelected ? "bg-[#BF76FF] text-white" : isDarkMode ? "bg-white/10 text-transparent" : "bg-black/5 text-transparent"
                        )}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className={cn("p-6 border-t flex justify-between items-center", isDarkMode ? "border-white/5" : "border-black/5")}>
              <p className="text-xs text-gray-500 font-bold">
                {formData.invitedMembers?.length || 0} selecionados
              </p>
              <Button
                className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white rounded-xl font-bold px-8"
                onClick={() => setIsMemberSelectorOpen(false)}
              >
                Concluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação para Limpar Galeria */}
        <Dialog open={showClearGalleryDialog} onOpenChange={setShowClearGalleryDialog}>
          <DialogContent className={cn("border sm:max-w-[400px] p-0 overflow-hidden transition-colors rounded-[32px] border-none shadow-2xl", isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black")}>
            <div className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Tem certeza?</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Esta ação irá remover permanentemente todas as fotos desta galeria. Você terá que adicioná-las novamente ou sincronizar com o Drive.
                </DialogDescription>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  className={cn("flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]", isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
                  onClick={() => setShowClearGalleryDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
                  onClick={() => {
                    setFormData((prev: any) => ({ ...prev, gallery: [] }));
                    setShowClearGalleryDialog(false);
                  }}
                >
                  Sim, Limpar Tudo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para Editar Cargo (Pendentes) */}
        <Dialog open={isRoleEditModalOpen} onOpenChange={setIsRoleEditModalOpen}>
          <DialogContent className={cn("border sm:max-w-[440px] w-[95vw] p-0 transition-colors rounded-[32px] border-none shadow-2xl overflow-visible", isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black")}>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#BF76FF]/10 flex items-center justify-center mx-auto text-[#BF76FF]">
                  <Edit className="w-8 h-8" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight mt-4">Alterar Cargo</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Selecione o cargo correto para <span className="font-bold text-[#BF76FF]">{memberToProcess?.name}</span>
                </DialogDescription>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">Novo Cargo</Label>
                <Select
                  value={selectedRoleForEdit}
                  onValueChange={setSelectedRoleForEdit}
                >
                  <SelectTrigger className={cn("w-full h-14 rounded-2xl border-none flex items-center justify-between px-4 text-xs font-bold uppercase tracking-widest", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black")}>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn("rounded-2xl border-none min-w-[var(--anchor-width)] shadow-2xl z-[100]", isDarkMode ? "bg-[#222] text-white" : "bg-white text-black")}
                    align="start"
                    sideOffset={8}
                  >
                    <div className="p-1.5 space-y-1">
                      {allRoles.map(role => (
                        <SelectItem key={role} value={role} className="rounded-xl focus:bg-[#BF76FF] focus:text-white uppercase font-bold text-[10px] tracking-widest py-3.5 px-4 cursor-pointer transition-colors">
                          {role}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className={cn("flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]", isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
                  onClick={() => setIsRoleEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl bg-[#BF76FF] hover:bg-[#a656f0] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#BF76FF]/20"
                  onClick={handleUpdateMemberRole}
                >
                  Salvar Alteração
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para Motivo de Recusa */}
        <Dialog open={isMemberRejectModalOpen} onOpenChange={setIsMemberRejectModalOpen}>
          <DialogContent className={cn("border sm:max-w-[400px] p-0 overflow-hidden transition-colors rounded-[32px] border-none shadow-2xl", isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black")}>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                  <XCircle className="w-8 h-8" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight mt-4">Recusar Cadastro</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Por que você está recusando a solicitação de {memberToProcess?.name}?
                </DialogDescription>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Motivo da Recusa</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Seu cargo na igreja não possui permissão de Diácono..."
                  className={cn("min-h-[120px] rounded-2xl border-none focus-visible:ring-offset-0", isDarkMode ? "bg-white/5 text-white placeholder:text-white/20" : "bg-gray-100 text-black placeholder:text-gray-400")}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  className={cn("flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]", isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
                  onClick={() => setIsMemberRejectModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
                  onClick={handleRejectMember}
                  disabled={!rejectionReason.trim()}
                >
                  Confirmar Recusa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para alerta de Sem WhatsApp */}
        <Dialog open={noWhatsAppUser !== null} onOpenChange={(open) => !open && setNoWhatsAppUser(null)}>
          <DialogContent className={cn("border sm:max-w-[400px] p-0 overflow-hidden transition-colors rounded-[32px] border-none shadow-2xl", isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black")}>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                  <Phone className="w-8 h-8" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight mt-4">WhatsApp indisponível</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Este usuário não possui número de WhatsApp cadastrado.
                </DialogDescription>
              </div>
              <div className="flex gap-4 pt-2">
                <Button
                  variant="ghost"
                  className={cn("w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]", isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
                  onClick={() => setNoWhatsAppUser(null)}
                >
                  Voltar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Global Footer (Desktop Only) */}
      <footer className={cn(
        "hidden md:flex h-12 border-t items-center justify-between px-8 shrink-0 transition-colors bg-roxo-bg border-white/5",
        isDarkMode ? "bg-roxo-bg border-white/10" : "bg-white border-black/5"
      )}>
        <div className="flex items-center gap-8">
          <div className={cn("text-[9px] uppercase font-black tracking-widest flex items-center gap-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
            © 2026 IGREJA EVANGELICA MINISTERIO PROFECIA <span className="opacity-20">|</span> TODOS OS DIREITOS RESERVADOS
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn("text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-1.5", isDarkMode ? "text-gray-400" : "text-gray-500")}>
            <span>Desenvolvido com</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
            <span>por</span>
            <a
              href="https://danielvaleweb.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#BF76FF] hover:underline font-extrabold"
            >
              Daniel Vale
            </a>
          </div>
          <div className="h-6 w-[1px] bg-white/5 mx-2" />
          <div className="text-[10px] font-black text-[#BF76FF] tracking-tighter bg-[#BF76FF]/10 px-3 py-0.5 rounded-full border border-[#BF76FF]/20">
            Versão 1.2
          </div>
        </div>
      </footer>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] md:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileSearchOpen(false)} />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={cn(
                "relative w-full max-h-[80vh] border-b p-6 flex flex-col",
                isDarkMode ? "bg-[#0b0016] border-white/10" : "bg-white border-black/5"
              )}
            >
              <div className="flex items-center gap-4 mb-6">
                <Search className="w-5 h-5 text-[#BF76FF]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="O que você está procurando?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder:text-gray-600",
                    isDarkMode ? "text-white" : "text-black"
                  )}
                />
                <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {globalSearchResults.length > 0 ? (
                  <div className="space-y-2">
                    {globalSearchResults.map((res, i) => (
                      <button
                        key={`mobile-search-res-${i}`}
                        onClick={() => {
                          if (res.type === 'membros') setViewingMember(res.item);
                          setSelectedItem(res.item);
                          setFormData({ ...res.item });
                          setActiveTab(res.type);
                          setIsEditing(!(res.type === 'membros' || res.type === 'agenda' || res.type === 'visitantes'));
                          setIsReadOnly(true);
                          setIsMobileSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border",
                          isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-black/5 hover:bg-gray-100"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                          <res.icon className="w-5 h-5 text-[#BF76FF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-bold text-sm truncate", isDarkMode ? "text-white" : "text-black")}>{res.title}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{res.sub}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="py-12 text-center opacity-40">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Nenhum resultado encontrado</p>
                  </div>
                ) : (
                  <div className="py-12 text-center opacity-20">
                    <Search className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Digite para buscar</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableSidebarItem(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
    >
      <SidebarItem {...props} />
    </div>
  );
}

function SidebarItem({ icon: Icon, active, onClick, label, collapsed, isDark, mobile, notificationCount, iconClassName }: { icon: any, active?: boolean, onClick: () => void, label: string, collapsed?: boolean, isDark?: boolean, mobile?: boolean, notificationCount?: number, iconClassName?: string }) {
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
          <Icon className={cn("w-6 h-6", iconClassName)} />
          {notificationCount ? (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center font-black shadow-md border border-white dark:border-[#0a0a0a]">
              {notificationCount > 99 ? '99+' : notificationCount}
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
        {notificationCount && collapsed ? (
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

function UpcomingEvents({ agenda, isDark, isAdmin, onView }: { agenda: any[], isDark: boolean, isAdmin?: boolean, onView?: (item: any) => void }) {
  const upcoming = agenda
    .filter(event => {
      // Filtrar itens pendentes
      if (event.status === 'pending') return false;

      const date = new Date(event.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return date >= now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20);

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-40">
        <Calendar className="w-12 h-12 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">Nenhum compromisso próximo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      {upcoming.map((event, index) => {
        const date = new Date(event.date);
        const day = format(date, "dd");
        const weekDay = format(date, "EEE", { locale: ptBR });
        const monthShort = format(date, "MMM", { locale: ptBR });
        const time = format(date, "HH:mm");
        const formattedTime = event.endTime ? `${time} às ${event.endTime}` : time;

        const colors = ["bg-green-500", "bg-[#BF76FF]", "bg-orange-500", "bg-pink-500", "bg-blue-500"];
        const colorClass = colors[index % colors.length];

        return (
          <div key={event.id} className="flex items-center gap-4 md:gap-8 group">
            {/* Date Section */}
            <div className="flex flex-col items-center shrink-0 w-12 md:w-20">
              <span className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
                {weekDay}
              </span>
              <span className={cn("text-2xl md:text-5xl font-black tracking-tighter leading-none transition-colors", isDark ? "text-white" : "text-black")}>
                {day}
              </span>
              <span className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1", isDark ? "text-[#BF76FF]" : "text-[#BF76FF]")}>
                {monthShort}
              </span>
            </div>

            {/* Content Section */}
            <div 
              onClick={() => onView?.(event)}
              className={cn(
                "flex-1 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-2xl cursor-pointer",
                isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/5" : "bg-white border-black/5 shadow-sm hover:shadow-lg"
              )}
            >
              <div className={cn("absolute top-0 left-0 bottom-0 w-1.5 md:w-2", colorClass)} />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className={cn("text-sm md:text-xl font-bold transition-colors line-clamp-1", isDark ? "text-white/90" : "text-black")}>
                    {event.title}
                  </h5>
                  <p className={cn("text-[10px] md:text-sm flex items-center gap-2", isDark ? "text-white/40" : "text-gray-500")}>
                    <MapPin className="w-3 h-3 md:w-4 h-4" />
                    <span className="truncate">{event.location || "Local em breve"}</span>
                  </p>
                  {(event.authorName || (event.phone && isAdmin)) && (
                    <p className={cn("text-[9px] md:text-[10px] flex items-center gap-1 font-medium mt-1 truncate", isDark ? "text-[#BF76FF]/70" : "text-[#BF76FF]/80")}>
                      {event.authorName && <span className="uppercase tracking-widest font-black">Org: <span className="text-gray-500 font-bold normal-case">{event.authorName}</span></span>}
                      {event.authorName && (event.phone && isAdmin) && <span className="opacity-50">|</span>}
                      {(event.phone && isAdmin) && (
                        <span className="flex items-center gap-1">
                          <span className="uppercase tracking-widest font-black">Tel:</span> <span className="text-gray-500 font-bold normal-case">{event.phone}</span>
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-sm normal-case whitespace-nowrap ml-1 font-bold">Só admins</span>
                        </span>
                      )}
                    </p>
                  )}
                  {event.inviteChurch && event.invitedMembers && event.invitedMembers.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {event.invitedMembers.slice(0, 3).map((mId: string, i: number) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-[#BF76FF]/20 border-2 border-[#1A1A1A] flex items-center justify-center text-[6px] font-bold text-[#BF76FF]">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {event.invitedMembers.length} Membros presentes
                      </span>
                    </div>
                  )}
                  {(event.observations || event.additionalInfo) && (
                    <div className={cn("mt-3 p-3 rounded-2xl border text-[9px] md:text-[11px] leading-relaxed", isDark ? "bg-black/20 border-white/5 text-gray-400" : "bg-gray-50 border-black/5 text-gray-600")}>
                      {event.observations && <p className="line-clamp-2"><span className="font-black uppercase tracking-tighter text-[#BF76FF] mr-1">Obs:</span> {event.observations}</p>}
                      {event.additionalInfo && <p className={cn("line-clamp-2", event.observations && "mt-1 pt-1 border-t border-white/5")}><span className="font-black uppercase tracking-tighter text-[#BF76FF] mr-1">Info:</span> {event.additionalInfo}</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600")}>
                    <Clock className="w-3 h-3 md:w-4 h-4 text-[#BF76FF]" />
                    {formattedTime}
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
        <p className={cn("text-sm transition-colors", isDark ? "text-white/90" : "text-black")}>
          <span className="font-bold">{user || "Sistema"}</span> <span className={isDark ? "text-white/40" : "text-gray-500"}>{action}</span>
        </p>
      </div>
      <span className={cn("text-[10px] font-medium", isDark ? "text-white/30" : "text-gray-600")}>{time}</span>
    </div>
  );
}

interface TeamMemberProps {
  key?: any;
  member: any;
  active?: boolean;
  onWhatsApp: () => void;
  onNoWhatsApp?: (member: any) => void;
  onViewProfile?: () => void;
  onEditProfile?: () => void;
  onDelete?: () => void;
  onUpdateRole?: (member: any) => void;
  onReject?: (member: any) => void;
  isDark?: boolean;
  isAdmin?: boolean;
  logAction?: (action: string, target: string, details: string, oldData?: any, newData?: any) => void;
}

function TeamMember({ member, active, onWhatsApp, onNoWhatsApp, onViewProfile, onEditProfile, onDelete, onUpdateRole, onReject, isDark, isAdmin, logAction }: TeamMemberProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const name = member.name || "Membro";
  const status = member.status_online || "offline";
  const isPending = member.status === "pending" || member.status === "pending_approval";

  const isBirthdayToday = (() => {
    if (!member.birthDate) return false;
    try {
      const birth = parseISO(member.birthDate + "T12:00:00");
      const now = new Date();
      return birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth();
    } catch (e) { return false; }
  })();

  const getStatusColor = (s: string) => {
    switch (s) {
      case "online": return "bg-green-500";
      case "busy": return "bg-red-500";
      case "away": return "bg-amber-500";
      default: return "bg-gray-500";
    }
  };

  const isGlobalAdmin = member.role === "Administradores" || member.role === "Desenvolvedor";
  const isLeader = isGlobalAdmin || (member.ministries || []).some((min: any) => typeof min === 'object' && min.isLeader);

  return (
    <div className={cn("flex flex-col", isPending ? "gap-4" : "gap-0")}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isBirthdayToday && (
              <div className="absolute -top-3 -right-2 z-20 drop-shadow-md transform rotate-[15deg]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-[15px] mt-1 ml-0 pl-0">
                  <path d="M12 2L4 18H20L12 2Z" fill="#FFC107" />
                  <path d="M12 2L4 18H20L12 2Z" stroke="#FF9800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="2" r="2" fill="#F44336" />
                  <circle cx="6" cy="18" r="1.5" fill="#2196F3" />
                  <circle cx="10" cy="18" r="1.5" fill="#4CAF50" />
                  <circle cx="14" cy="18" r="1.5" fill="#E91E63" />
                  <circle cx="18" cy="18" r="1.5" fill="#9C27B0" />
                </svg>
              </div>
            )}
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors overflow-hidden", isDark ? "bg-gradient-to-tr from-gray-700 to-gray-800 text-white" : "bg-gray-200 text-black")}>
              {member.photoURL ? (
                <img src={getImageUrl(member.photoURL)} alt="" className="w-full h-full object-cover" />
              ) : (
                name?.[0]
              )}
            </div>
            <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse", isDark ? "border-[#0a0a0a]" : "border-white", getStatusColor(status))} />
          </div>
          <div className="flex flex-col">
            <div className="cursor-pointer group flex items-center gap-2" onClick={onViewProfile}>
              <p className={cn("text-sm font-bold transition-colors group-hover:text-[#BF76FF]", isDark ? "text-white" : "text-black")}>{name}</p>
              {isLeader && (
                <span className="text-[8px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#BF76FF] to-[#7300FF] px-1.5 py-0.5 rounded-sm">Líder</span>
              )}
            </div>
            {isPending ? (
              <button
                onClick={() => onUpdateRole?.(member)}
                className="text-[10px] text-[#BF76FF] font-bold hover:underline flex items-center gap-1 mt-0.5 uppercase tracking-widest text-left"
              >
                {formatRoles(member)}
                <Edit className="w-2.5 h-2.5" />
              </button>
            ) : (
              <p className="text-[10px] text-gray-500">{formatRoles(member)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 mr-1">
          <button
            onClick={onWhatsApp}
            title="Chat"
            className="p-2 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const firstname = (member.name || "Membro").split(" ")[0];
                const msg = `Paz do Senhor Jesus ${firstname}, esse telefone é o novo contato da secretaria, adicione aos seus contatos para não perder!\nQue Deus abençoe seu dia!`;
                const phone = member.phone || "";
                const cleanPhone = phone.replace(/\D/g, "");
                const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                if (cleanPhone) {
                  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                } else {
                  if (onNoWhatsApp) {
                    onNoWhatsApp(member);
                  }
                }
              }}
              title="WhatsApp Secretaria"
              className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isAdmin && isPending && (
        <div className="flex items-center gap-2 pt-4 border-t border-white/5 w-full">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const updateData: any = {
                  status: "active",
                  updatedAt: serverTimestamp()
                };
                if (member.signupPassword) {
                  updateData.signupPassword = deleteField();
                  try {
                    await addDoc(collection(db, "saved-logins"), {
                      title: `Cadastro - ${member.name}`,
                      username: member.email,
                      password: member.signupPassword,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    });
                  } catch (e) {
                    console.error("Failed to save login password", e);
                  }
                }
                await updateDoc(doc(db, "members", member.id), updateData);
                firestoreService.clearCache("members");

                // WhatsApp Logic
                const roleName = formatRoles(member);
                const msg = `Paz do Senhor *${member.name}*, Seu cadastro no site foi APROVADO ✅\nJá pode fazer login com seu email e senha.\nSeu cargo atualmente é *${roleName}*.\nFicou algum dúvida? Só responder aqui...`;
                const phone = member.phone?.replace(/\D/g, "");
                window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");

                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#BF76FF', '#7300FF', '#CC7EFF', '#ffffff']
                });
                if (logAction) {
                  logAction("member_approval", "members", `Aprovado cadastro de ${member.name}`, member, { ...member, status: "active" });
                }
              } catch (err) {
                console.error(err);
              }
            }}
            title="Aprovar Cadastro"
            className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm font-bold text-xs uppercase tracking-tight"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprovar Cadastro</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onReject) onReject(member);
            }}
            title="Recusar Cadastro"
            className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-tight"
          >
            <XCircle className="w-4 h-4" />
            <span>Recusar</span>
          </button>
        </div>
      )}
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

function ActionIcon({ icon: Icon, onClick, active, isDark, hasNotification, notificationCount }: { icon: any, onClick?: () => void, active?: boolean, isDark?: boolean, hasNotification?: boolean, notificationCount?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
        active
          ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20"
          : isDark ? "bg-transparent text-[#BF76FF] hover:bg-[#BF76FF]/10" : "bg-transparent text-[#BF76FF] hover:bg-[#BF76FF]/5"
      )}
    >
      <Icon className="w-5 h-5" />
      {hasNotification && !notificationCount && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#0a0a0a]" />
      )}
      {notificationCount !== undefined && notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full border-[2px] border-white dark:border-[#0f0f0f] text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  );
}

export default Admin;
