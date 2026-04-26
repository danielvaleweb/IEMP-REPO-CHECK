import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Image as ImageIcon,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Save,
  Youtube,
  ChevronLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Bell,
  MoreHorizontal,
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
  Facebook,
  Instagram,
  Share2,
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
  PartyPopper,
  ExternalLink,
  ClipboardList,
  Newspaper
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  increment,
  getCountFromServer,
  limit
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
const WhatsAppIcon = ({ className }) => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className, children: /* @__PURE__ */ jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" }) });
const CandleIcon = ({ isDark = true }) => /* @__PURE__ */ jsxs("div", { className: "relative w-10 h-10 flex items-center justify-center", children: [
  /* @__PURE__ */ jsx("div", { className: cn("w-3 h-8 rounded-t-lg absolute bottom-1 shadow-sm", isDark ? "bg-pink-500/40" : "bg-pink-100") }),
  /* @__PURE__ */ jsx("div", { className: "w-0.5 h-2 bg-gray-600 absolute bottom-9" }),
  /* @__PURE__ */ jsx(
    motion.div,
    {
      animate: {
        scale: [1, 1.15, 1, 1.08, 1],
        y: [0, -1.5, 0, -1, 0],
        rotate: [-1.5, 1.5, -1.5, 0.8, -0.8]
      },
      transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
      className: "absolute bottom-10",
      children: /* @__PURE__ */ jsx(Flame, { className: "w-5 h-5 text-orange-500", fill: "currentColor" })
    }
  )
] });
const safeFormatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (typeof dateStr === "string" && dateStr.includes(" - ")) {
      return dateStr.split(" - ")[0];
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};
const safeFormatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (typeof dateStr === "string" && dateStr.includes("-")) {
      const parts = dateStr.split("-");
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
  newEventButtonLabel = "Cadastrar novo evento",
  deleteButtonLabel = "Excluir"
}) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(/* @__PURE__ */ new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b"];
  const selectedDayEvents = selectedDay ? agenda.filter((event) => event.date && isSameDay(parseISO(event.date), selectedDay)) : [];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: cn(
      "border rounded-3xl p-4 md:p-8 transition-colors duration-500",
      isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl"
    ), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 md:mb-6", children: [
        /* @__PURE__ */ jsx("h2", { className: cn("text-lg md:text-2xl font-bold capitalize transition-colors", isDark ? "text-white" : "text-black"), children: format(currentMonth, "MMMM yyyy", { locale: ptBR }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: cn("w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-black/5"), onClick: () => setCurrentMonth(subMonths(currentMonth, 1)), children: /* @__PURE__ */ jsx(ChevronLeft, { className: cn("w-4 h-4 md:w-5 h-5", isDark ? "text-white" : "text-black") }) }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: cn("w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-black/5"), onClick: () => setCurrentMonth(addMonths(currentMonth, 1)), children: /* @__PURE__ */ jsx(ChevronRight, { className: cn("w-4 h-4 md:w-5 h-5", isDark ? "text-white" : "text-black") }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2", children: weekDays.map((day) => /* @__PURE__ */ jsx("div", { className: "text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest py-1 md:py-2", children: day }, day)) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 md:gap-2", children: days.map((day, i) => {
        const dayEvents = agenda.filter((event) => event.date && isSameDay(parseISO(event.date), day));
        const isCurrentMonth = isSameMonth(day, monthStart);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setSelectedDay(day),
            className: cn(
              "min-h-[50px] md:min-h-[100px] p-1 md:p-2 rounded-lg md:rounded-xl border transition-all cursor-pointer relative group",
              isCurrentMonth ? isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5" : isDark ? "bg-[#1a1a1a]/30 border-white/5 opacity-50" : "bg-gray-50/30 border-black/5 opacity-50",
              "hover:border-[#BF76FF]/50",
              isSameDay(day, /* @__PURE__ */ new Date()) && "ring-2 ring-[#BF76FF]",
              day.getDay() === 6 && "md:border-black/5 border-green-500/50 dark:border-green-500/30 md:dark:border-white/5"
            ),
            children: [
              /* @__PURE__ */ jsx("div", { className: cn(
                "text-right text-[8px] md:text-xs font-bold mb-1 md:mb-2 transition-colors",
                day.getDay() === 6 ? "text-green-500 md:text-gray-400" : "text-gray-400"
              ), children: format(day, dateFormat) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 md:space-y-1", children: [
                dayEvents.slice(0, 3).map((event, j) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(
                      "text-[7px] md:text-[10px] p-0.5 md:p-1.5 rounded truncate transition-colors relative group/event",
                      day.getDay() === 6 ? "bg-green-500/20 text-green-500 md:bg-[#BF76FF]/20 md:text-[#BF76FF]" : "bg-[#BF76FF]/20 text-[#BF76FF]"
                    ),
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "md:inline hidden", children: event.title }),
                      /* @__PURE__ */ jsx("span", { className: "md:hidden", children: "\u25CF" }),
                      /* @__PURE__ */ jsxs("div", { className: cn(
                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden md:group-hover/event:block w-56 border p-4 rounded-2xl shadow-2xl z-50 transition-all duration-300 backdrop-blur-md",
                        isDark ? "bg-black/90 border-white/10 text-white" : "bg-white/95 border-black/10 text-black"
                      ), children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                          /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#BF76FF]" }),
                          /* @__PURE__ */ jsx("p", { className: cn("font-black text-sm whitespace-normal tracking-tight", isDark ? "text-white" : "text-black"), children: event.title })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-gray-400", children: [
                            /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                            /* @__PURE__ */ jsx("span", { children: safeFormatTime(event.date) })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-gray-400", children: [
                            /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                            /* @__PURE__ */ jsx("span", { className: "line-clamp-1", children: event.location || "Sem local definido" })
                          ] })
                        ] })
                      ] })
                    ]
                  },
                  `calendar-event-${day.toISOString()}-${j}-${event.id || "no-id"}`
                )),
                dayEvents.length > 3 && /* @__PURE__ */ jsxs("div", { className: "text-[7px] text-gray-500 text-center font-bold", children: [
                  "+",
                  dayEvents.length - 3
                ] })
              ] })
            ]
          },
          `calendar-day-${day.toISOString()}`
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: selectedDay !== null, onOpenChange: (open) => !open && setSelectedDay(null), children: /* @__PURE__ */ jsx(DialogContent, { className: cn("border sm:max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col transition-colors rounded-[32px]", isDark ? "bg-[#111] border-white/10 text-white" : "bg-white border-black/10 text-black"), children: /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto scrollbar-hide p-6", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "text-xl", children: [
        modalTitle,
        " (",
        selectedDay ? format(selectedDay, "dd/MM/yyyy") : "",
        ")"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-6", children: [
        selectedDayEvents.length > 0 ? selectedDayEvents.map((event, idx) => {
          return /* @__PURE__ */ jsxs("div", { className: cn("p-4 rounded-2xl border space-y-3 transition-colors", isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-lg", children: event.title }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
                safeFormatTime(event.date),
                " \u2022 ",
                event.location || "Sem local"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-[#BF76FF] mt-1", children: [
                "Adicionado por: ",
                event.authorName || "Admin"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: cn("flex gap-2 pt-2 border-t", isDark ? "border-white/5" : "border-black/5"), children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: cn("flex-1 cursor-pointer transition-colors", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"),
                  onClick: (e) => {
                    e.stopPropagation();
                    setSelectedDay(null);
                    onViewEvent(event);
                  },
                  children: [
                    /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                    " Ver"
                  ]
                }
              ),
              canEdit && /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer",
                  onClick: (e) => {
                    e.stopPropagation();
                    setSelectedDay(null);
                    onEditEvent(event);
                  },
                  children: [
                    /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 mr-2" }),
                    " Editar"
                  ]
                }
              ),
              (canDelete || event.authorId === user?.uid) && /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer",
                  onClick: (e) => {
                    e.stopPropagation();
                    setSelectedDay(null);
                    onDeleteEvent(event);
                  },
                  children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                    " ",
                    deleteButtonLabel
                  ]
                }
              )
            ] })
          ] }, `day-event-detail-${selectedDay?.toISOString()}-${idx}-${event.id || "no-id"}`);
        }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-gray-400", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-12 h-12 mx-auto mb-3 opacity-20" }),
          /* @__PURE__ */ jsx("p", { children: emptyMessage })
        ] }),
        canEdit && /* @__PURE__ */ jsxs(
          Button,
          {
            className: "w-full bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white font-bold cursor-pointer mt-4",
            onClick: () => {
              if (selectedDay) {
                onNewEvent(selectedDay);
                setSelectedDay(null);
              }
            },
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " ",
              newEventButtonLabel
            ]
          }
        )
      ] })
    ] }) }) })
  ] });
}
const formatRoles = (member) => {
  let roles = [];
  if (member.ministries && Array.isArray(member.ministries) && member.ministries.length > 0) {
    roles = member.ministries.map((m) => typeof m === "string" ? m : m.name);
  } else if (member.role) {
    roles = [member.role];
  } else {
    roles = ["Membro"];
  }
  const uniqueRoles = Array.from(new Set(roles));
  const mappedRoles = uniqueRoles.map((r) => {
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
function MemberProfile({ member, onBack, onEdit, isDark, notifications, onChat }) {
  const isBirthdayToday = useMemo(() => {
    if (!member.birthDate) return false;
    try {
      const birth = parseISO(member.birthDate);
      const now = /* @__PURE__ */ new Date();
      return birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth();
    } catch (e) {
      return false;
    }
  }, [member.birthDate]);
  useEffect(() => {
    if (isBirthdayToday) {
      const duration = 3 * 1e3;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      const interval = setInterval(function() {
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
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onBack,
        className: cn("flex items-center gap-2 text-sm font-bold transition-colors mb-4", isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"),
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          " Voltar para lista"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: cn("rounded-[40px] overflow-hidden border transition-all", isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-2xl"), children: [
      /* @__PURE__ */ jsxs("div", { className: "relative min-h-[500px] md:h-80", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: member.coverImage || "https://picsum.photos/seed/church/1200/400",
            className: "w-full h-full object-cover opacity-60",
            alt: ""
          }
        ),
        /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-t", isDark ? "from-[#111] to-transparent" : "from-white/80 to-transparent") }),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto", children: [
            /* @__PURE__ */ jsx("div", { className: "w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-[#111] bg-[#1a1a1a] overflow-hidden shadow-2xl relative z-10", children: member.photoURL ? /* @__PURE__ */ jsx("img", { src: member.photoURL, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-4xl font-bold text-[#BF76FF]", children: member.name?.[0] || "M" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-center md:text-left pb-2", children: [
              /* @__PURE__ */ jsx("h2", { className: cn("text-3xl md:text-5xl font-black tracking-tighter transition-colors", isDark ? "text-white" : "text-black"), children: member.name }),
              /* @__PURE__ */ jsx("p", { className: "text-[#BF76FF] font-bold uppercase tracking-[0.2em] text-xs md:text-sm mt-1", children: formatRoles(member) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 w-full md:w-auto justify-center md:justify-end", children: [
            onEdit && /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: onEdit,
                className: "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs",
                children: [
                  /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 mr-2" }),
                  " Editar Perfil"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                className: cn("rounded-2xl h-14 px-6 border-white/10 transition-colors", isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"),
                children: /* @__PURE__ */ jsx(Bookmark, { className: "w-4 h-4" })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 md:p-12 grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 space-y-12", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: [
            {
              label: (() => {
                try {
                  if (!member.joinedDate) return "Membro";
                  const start = parseISO(member.joinedDate);
                  const now = /* @__PURE__ */ new Date();
                  return differenceInMonths(now, start) < 1 ? "Membro" : "Membro \xE0";
                } catch (e) {
                  return "Membro";
                }
              })(),
              value: (() => {
                try {
                  if (!member.joinedDate) return "Novo";
                  const start = parseISO(member.joinedDate);
                  const now = /* @__PURE__ */ new Date();
                  const years = differenceInYears(now, start);
                  const months = differenceInMonths(now, start);
                  if (years >= 1) return years === 1 ? "1 ano" : `${years} anos`;
                  if (months >= 1) return months === 1 ? "1 m\xEAs" : `${months} meses`;
                  return "Novo";
                } catch (e) {
                  return "Novo";
                }
              })(),
              icon: Calendar,
              color: "text-blue-500"
            },
            { label: "Status", value: "Ativo", icon: CheckCircle2, color: "text-green-500" },
            {
              label: "Anivers\xE1rio",
              value: member.birthDate ? (() => {
                if (isBirthdayToday) return "Hoje!";
                try {
                  const d = parseISO(member.birthDate);
                  return format(d, "dd/MMMM", { locale: ptBR });
                } catch (e) {
                  return "N\xE3o informado";
                }
              })() : "N\xE3o informado",
              icon: isBirthdayToday ? CandleIcon : Cake,
              color: isBirthdayToday ? "text-orange-500 animate-pulse" : "text-pink-500"
            }
          ].map((stat) => /* @__PURE__ */ jsxs("div", { className: cn("p-6 rounded-3xl border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsxs("div", { className: cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 relative", isDark ? "bg-white/5" : "bg-white shadow-sm"), children: [
              stat.label === "Anivers\xE1rio" && isBirthdayToday ? /* @__PURE__ */ jsx(CandleIcon, { isDark }) : /* @__PURE__ */ jsx(stat.icon, { className: cn("w-5 h-5", stat.color) }),
              stat.label === "Anivers\xE1rio" && isBirthdayToday && /* @__PURE__ */ jsx(Cake, { className: "w-8 h-8 absolute -top-1 -right-1 text-pink-500/20 rotate-12" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1", children: stat.label }),
            /* @__PURE__ */ jsx("p", { className: cn("text-xl font-black transition-colors uppercase", isDark ? "text-white" : "text-black"), children: stat.value })
          ] }, `stat-${stat.label}`)) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsx("h3", { className: cn("text-xl font-bold transition-colors", isDark ? "text-white" : "text-black"), children: "Sobre o Membro" }),
            /* @__PURE__ */ jsx("p", { className: cn("text-lg leading-relaxed transition-colors", isDark ? "text-gray-400" : "text-gray-600"), children: member.bio || "Nenhuma biografia informada para este membro. Adicione informa\xE7\xF5es sobre sua jornada, minist\xE9rios e dons para que outros possam conhec\xEA-lo melhor." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsx("h3", { className: cn("text-xl font-bold transition-colors", isDark ? "text-white" : "text-black"), children: "Informa\xE7\xF5es de Contato" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF]", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 group cursor-pointer", onClick: onChat, children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Conversas" }),
                    /* @__PURE__ */ jsx("p", { className: cn("font-bold transition-colors group-hover:text-[#BF76FF]", isDark ? "text-white" : "text-black"), children: "Iniciar Bate-papo" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500", children: /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "E-mail" }),
                    /* @__PURE__ */ jsx("p", { className: cn("font-bold transition-colors", isDark ? "text-white" : "text-black"), children: member.email || "N\xE3o informado" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsx("h3", { className: cn("text-xl font-bold transition-colors", isDark ? "text-white" : "text-black"), children: "Minist\xE9rios" }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: member.ministries?.length > 0 ? Array.from(new Set(member.ministries.map((m) => typeof m === "string" ? m : m.name))).map((mName, i) => {
                const ministry = member.ministries.find((min) => (typeof min === "string" ? min : min.name) === mName);
                const isLeader = typeof ministry === "object" && ministry.isLeader;
                let displayPath = mName === "Desenvolvedor" ? "Desenvolvimento" : mName === "Administradores" ? "Administra\xE7\xE3o" : mName;
                const getPreposition = (name) => {
                  const n = name.toLowerCase();
                  if (n.endsWith("a")) return "da";
                  if (n.endsWith("as")) return "das";
                  if (n.endsWith("s")) return "dos";
                  return "do";
                };
                const prep = getPreposition(displayPath);
                return /* @__PURE__ */ jsx("span", { className: cn("px-4 py-2 rounded-full text-xs font-bold", isLeader ? "bg-[#BF76FF] text-white" : "bg-[#BF76FF]/10 text-[#BF76FF]"), children: isLeader ? `L\xEDder ${prep} ${displayPath}` : `Participa ${prep} ${displayPath}` }, `ministry-${mName}`);
              }) : /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500 italic", children: "Nenhum minist\xE9rio vinculado" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: cn("p-8 rounded-[32px] border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsx("h3", { className: cn("text-xl font-bold mb-6 transition-colors", isDark ? "text-white" : "text-black"), children: "Atividade Recente" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-6", children: (() => {
              const activities = (notifications || []).filter((n) => n.memberId === member.id && n.type === "activity").slice(0, 5);
              if (activities.length === 0) {
                return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: [
                  { action: "Participou do Culto de Domingo", time: "2 dias atr\xE1s" },
                  { action: "Bio atualizada", time: "Hoje" }
                ].map((act, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[#BF76FF] mt-1.5 shrink-0" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: cn("text-sm font-bold transition-colors", isDark ? "text-white" : "text-black"), children: act.action }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 uppercase font-black tracking-widest", children: act.time })
                  ] })
                ] }, `act-primary-${act.action}-${i}`)) });
              }
              return activities.map((act, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[#BF76FF] mt-1.5 shrink-0" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: cn("text-sm font-bold transition-colors", isDark ? "text-white" : "text-black"), children: act.message }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 uppercase font-black tracking-widest", children: act.createdAt ? (() => {
                    try {
                      const date = typeof act.createdAt === "string" ? parseISO(act.createdAt) : act.createdAt.toDate ? act.createdAt.toDate() : new Date(act.createdAt);
                      const diff = Math.floor(((/* @__PURE__ */ new Date()).getTime() - date.getTime()) / 1e3);
                      if (diff < 60) return "Agora mesmo";
                      if (diff < 3600) return `${Math.floor(diff / 60)} min atr\xE1s`;
                      if (diff < 86400) return `${Math.floor(diff / 3600)} horas atr\xE1s`;
                      return date.toLocaleDateString();
                    } catch (e) {
                      return "Recentemente";
                    }
                  })() : "Hoje" })
                ] })
              ] }, `act-list-${act.id || i}`));
            })() })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: cn("p-8 rounded-[32px] border transition-colors", isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsx("h3", { className: cn("text-xl font-bold mb-6 transition-colors", isDark ? "text-white" : "text-black"), children: "Habilidades" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: (member.skills || ["Lideran\xE7a", "M\xFAsica", "Comunica\xE7\xE3o", "Organiza\xE7\xE3o"]).map((skill, i) => /* @__PURE__ */ jsx("span", { className: cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors", isDark ? "bg-white/5 text-gray-400" : "bg-white text-gray-600 shadow-sm"), children: skill }, `skill-${skill}-${i}`)) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Admin() {
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
  const [viewingMember, setViewingMember] = useState(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [rightSidebarView, setRightSidebarView] = useState("hidden");
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const stripMentions = (text) => {
    if (!text) return "";
    return text.replace(/@\{([^}]+)\}/g, "@$1");
  };
  useEffect(() => {
    if (rightSidebarView === "chat-active" && activeChatUser?.id && profile?.id) {
      const chatId = [profile.id, activeChatUser.id].sort().join("_");
      updateDoc(doc(db, "chats", chatId), {
        [`unreadCount.${profile.id}`]: 0
      }).catch((err) => console.error("Error resetting unread count", err));
    }
  }, [rightSidebarView, activeChatUser?.id, profile?.id, chatMessages.length]);
  const renderMessageWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\{[^}]+\})|(https?:\/\/[^\s]+)/g);
    return /* @__PURE__ */ jsx("p", { className: "text-sm whitespace-pre-wrap", children: parts.filter(Boolean).map((part, i) => {
      if (part.startsWith("@{") && part.endsWith("}")) {
        const fullName = part.substring(2, part.length - 1);
        const member = members.find((m) => m.name === fullName);
        if (member) {
          return /* @__PURE__ */ jsxs(
            "span",
            {
              onClick: (e) => {
                e.stopPropagation();
                setActiveTab("membros");
                setViewingMember(member);
              },
              className: "font-black text-[#BF76FF] hover:text-[#A05ADB] underline underline-offset-2 cursor-pointer transition-colors",
              children: [
                "@",
                fullName
              ]
            },
            `content-part-${i}`
          );
        }
        return `@${fullName}`;
      }
      if (part.startsWith("http")) {
        return /* @__PURE__ */ jsx(
          "a",
          {
            href: part,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-blue-400 hover:underline break-all",
            children: part
          },
          `social-link-${i}`
        );
      }
      return part;
    }) });
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
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (!profile?.id || !activeChatUser?.id) return;
    const chatId = [profile.id, activeChatUser.id].sort().join("_");
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() })));
    }, (err) => console.error(err));
    return () => unsub();
  }, [profile?.id, activeChatUser?.id]);
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !profile?.id || !activeChatUser?.id) return;
    const chatId = [profile.id, activeChatUser.id].sort().join("_");
    const msgText = chatInput.trim();
    setChatInput("");
    try {
      await setDoc(doc(db, "chats", chatId), {
        participants: [profile.id, activeChatUser.id],
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${activeChatUser.id}`]: increment(1)
      }, { merge: true });
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: msgText,
        senderId: profile.id,
        timestamp: serverTimestamp()
      });
      await addDoc(collection(db, "notifications"), {
        userId: activeChatUser.id,
        title: "Nova mensagem",
        message: `${profile.name || user?.displayName || "Algu\xE9m"} enviou uma mensagem para voc\xEA`,
        read: false,
        type: "chat",
        senderId: profile.id,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
    }
  };
  const [posts, setPosts] = useState([]);
  const [blog, setBlog] = useState([]);
  const [members, setMembers] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [agendaDirecao, setAgendaDirecao] = useState([]);
  const [vignettes, setVignettes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({
    members: 0,
    agenda: 0,
    posts: 0,
    blog: 0,
    vignettes: 0,
    unreadNotifications: 0
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("visao-geral");
  useEffect(() => {
    setRightSidebarView("hidden");
  }, [activeTab]);
  const [showPending, setShowPending] = useState(false);
  const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const pendingMembers = members.filter((m) => m.status === "pending" || m.status === "pending_approval");
  const activeMembersForDisplay = showPending ? pendingMembers : members.filter((m) => m.status !== "pending" && m.status !== "pending_approval");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (rightSidebarView === "chat-active") {
      scrollToBottom();
    }
  }, [chatMessages, rightSidebarView]);
  const [authError, setAuthError] = useState("");
  const userStatus = profile?.status_presence || "online";
  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "ocupado":
        return "bg-red-500";
      case "ausente":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };
  const updatePresenceStatus = async (status) => {
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
    const query2 = searchQuery.toLowerCase();
    const results = [];
    vignettes.forEach((v) => {
      if (v.title?.toLowerCase().includes(query2)) {
        results.push({ type: "radio", item: v, title: v.title, sub: "Vinheta de R\xE1dio", icon: Mic });
      }
    });
    members.forEach((m) => {
      if (m.name?.toLowerCase().includes(query2) || m.email?.toLowerCase().includes(query2)) {
        results.push({ type: "membros", item: m, title: m.name, sub: formatRoles(m), icon: Users });
      }
    });
    posts.forEach((p) => {
      const isMatch = p.title?.toLowerCase().includes(query2) || p.content?.toLowerCase().includes(query2);
      if (isMatch) {
        results.push({ type: "eventos", item: p, title: p.title, sub: `Evento \u2022 ${p.date || "Sem data"}`, icon: PartyPopper });
      }
    });
    blog.forEach((b) => {
      const isMatch = b.title?.toLowerCase().includes(query2) || b.content?.toLowerCase().includes(query2);
      if (isMatch) {
        results.push({ type: "noticias", item: b, title: b.title, sub: `Not\xEDcia \u2022 ${b.date || "Sem data"}`, icon: Newspaper });
      }
    });
    agenda.forEach((a) => {
      if (a.title?.toLowerCase().includes(query2) || a.description?.toLowerCase().includes(query2)) {
        results.push({ type: "agenda", item: a, title: a.title, sub: a.date || "Sem data", icon: Calendar });
      }
    });
    return results.slice(0, 8);
  }, [searchQuery, members, posts, agenda]);
  useEffect(() => {
    const seedNotifs = async () => {
      if (user && notifications.length === 0 && !loading) {
        try {
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
                title: "Anivers\xE1rio",
                message: "Hoje \xE9 anivers\xE1rio de Josy Pereira",
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
        } catch (error) {
          console.error("Error seeding notifications:", error);
        }
      }
    };
    seedNotifs();
  }, [user, notifications.length, loading]);
  const allRoles = useMemo(() => [
    "Administradores",
    "Dire\xE7\xE3o",
    "Secretaria",
    "Desenvolvedor",
    "M\xEDdia",
    "Di\xE1cuno",
    "Minis. infantil",
    "Minis. louvor",
    "Minis. Jovens",
    "Visitante",
    "Membro"
  ], []);
  const isMasterAdmin = user?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com";
  const isAdminOrDev = profile?.role === "Administradores" || profile?.role === "Desenvolvedor" || isMasterAdmin;
  const displayNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (n.type === "registration" || n.type === "activity") {
        return isAdminOrDev;
      }
      if (n.userId === user?.uid) {
        return true;
      }
      return false;
    });
  }, [notifications, isAdminOrDev, user?.uid]);
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = displayNotifications.filter((n) => !n.read);
      const updatePromises = unreadNotifications.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }));
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };
  useEffect(() => {
    const migrateRoles = async () => {
      if (!isMasterAdmin || members.length === 0) return;
      const toUpdate = members.filter((m) => {
        const hasOldRoleInRole = m.role === "Desenvolvimento";
        const hasOldRoleInMinistries = (m.ministries || []).some(
          (min) => (typeof min === "string" ? min : min.name) === "Desenvolvimento"
        );
        return hasOldRoleInRole || hasOldRoleInMinistries;
      });
      for (const member of toUpdate) {
        const newMinistries = (member.ministries || []).map((m) => {
          if (typeof m === "string") return m === "Desenvolvimento" ? "Desenvolvedor" : m;
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
  const [activeViewRole, setActiveViewRole] = useState(null);
  const currentRole = activeViewRole || profile?.role || "Membro";
  useEffect(() => {
    if (currentRole === "Dire\xE7\xE3o" && activeTab !== "agenda-direcao") {
      setActiveTab("agenda-direcao");
    }
  }, [currentRole, activeTab, setActiveTab]);
  const [availableSkills, setAvailableSkills] = useState(["M\xFAsica", "Instrumentos", "Canto", "Som/\xC1udio", "V\xEDdeo/Edi\xE7\xE3o", "Design Gr\xE1fico", "M\xEDdias Sociais", "Lideran\xE7a", "Prega\xE7\xE3o", "Ensino Infantil", "Organiza\xE7\xE3o", "Cozinha", "Limpeza", "Recep\xE7\xE3o"]);
  const [newSkillName, setNewSkillName] = useState("");
  useEffect(() => {
    if (profile?.role && !activeViewRole) {
      setActiveViewRole(profile.role);
    }
  }, [profile?.role]);
  useEffect(() => {
    if (user && profile?.status === "pending") {
      setAuthError("Seu cadastro via Google ainda est\xE1 em an\xE1lise. Aguarde a aprova\xE7\xE3o do administrador.");
    }
  }, [user, profile]);
  useEffect(() => {
    if (user && profile?.role === "Visitante") {
      navigate("/");
    }
  }, [user, profile, navigate]);
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({});
  useEffect(() => {
    if (isEditing && formData?.location && !formData?.street && !formData?.city) {
      const loc = formData.location;
      const regex = /^(.*?),\s*(\d+.*?|S\/N)\s*-\s*(.*?),\s*(.*?)\s*-\s*([A-Za-z]{2})$/i;
      const match = loc.match(regex);
      if (match) {
        setFormData((prev) => ({
          ...prev,
          street: match[1],
          streetNumber: match[2],
          neighborhood: match[3],
          city: match[4],
          state: match[5].toUpperCase()
        }));
      } else {
        const commaParts = loc.split(",").map((s) => s.trim());
        if (commaParts.length >= 2) {
          setFormData((prev) => ({ ...prev, street: commaParts[0], streetNumber: commaParts[1] }));
        }
      }
    }
  }, [isEditing, formData?.location]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isImportEventDialogOpen, setIsImportEventDialogOpen] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [settings, setSettings] = useState({ enableHeaderVideos: true });
  const [localSettings, setLocalSettings] = useState({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [logs, setLogs] = useState([]);
  const logAction = async (action, target, details) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "audit-logs"), {
        action,
        target,
        details,
        userId: user.uid,
        userName: profile?.name || user.displayName || "Usu\xE1rio desconhecido",
        userEmail: user.email,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao registrar log:", error);
    }
  };
  const isEffectivelyAdmin = (isMasterAdmin || profile?.role === "Administradores") && (!activeViewRole || activeViewRole === "Administradores");
  const canViewSettings = currentRole === "Desenvolvedor" || currentRole === "Administradores" || isMasterAdmin && (!activeViewRole || activeViewRole === "Administradores" || activeViewRole === "Desenvolvedor");
  const canViewLogs = canViewSettings;
  const canViewTab = (tab) => {
    if ((tab === "config" || tab === "logs") && !canViewSettings) return false;
    if (currentRole === "Dire\xE7\xE3o") {
      return tab === "agenda-direcao";
    }
    if (isEffectivelyAdmin) return true;
    const rolePerms = settings.permissions?.[currentRole];
    const defaultVals = {
      "visao-geral": true,
      "eventos": !["Membro", "Visitante", "Dire\xE7\xE3o"].includes(currentRole),
      "noticias": !["Membro", "Visitante", "Dire\xE7\xE3o"].includes(currentRole),
      "radio": !["Membro", "Visitante", "Dire\xE7\xE3o"].includes(currentRole),
      "membros": !["Membro", "Visitante", "Dire\xE7\xE3o"].includes(currentRole),
      "agenda": !["Membro", "Visitante", "Dire\xE7\xE3o"].includes(currentRole),
      "agenda-direcao": currentRole === "Administradores" || currentRole === "Desenvolvedor" || currentRole === "Dire\xE7\xE3o"
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
  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const safeGetCount = async (coll, label) => {
        try {
          const snap = await getCountFromServer(coll);
          return snap.data().count;
        } catch (err) {
          console.error(`Error fetching count for ${label}:`, err);
          return 0;
        }
      };
      const [membersCount, agendaCount, vignettesCount, postsCount, blogCount, unreadCount] = await Promise.all([
        isAdmin ? safeGetCount(collection(db, "members"), "members") : Promise.resolve(0),
        safeGetCount(collection(db, "agenda"), "agenda"),
        safeGetCount(collection(db, "vignettes"), "vignettes"),
        safeGetCount(collection(db, "posts"), "posts"),
        safeGetCount(collection(db, "blog"), "blog"),
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
        unreadNotifications: unreadCount
      });
    };
    fetchCounts();
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    }, (err) => console.error("Error loading settings:", err));
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200)), (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading posts:", err));
    const unsubBlog = onSnapshot(query(collection(db, "blog"), limit(200)), (snap) => {
      setBlog(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading blog:", err));
    const unsubMembers = isAdmin ? onSnapshot(query(collection(db, "members"), limit(200)), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading members:", err)) : () => {
    };
    const unsubAgenda = onSnapshot(query(collection(db, "agenda"), orderBy("date", "asc"), limit(200)), (snap) => {
      setAgenda(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading agenda:", err));
    const unsubAgendaDirecao = isAdmin ? onSnapshot(query(collection(db, "agenda-direcao"), orderBy("date", "asc"), limit(200)), (snap) => {
      setAgendaDirecao(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading agenda-direcao:", err)) : () => {
    };
    const unsubVignettes = onSnapshot(query(collection(db, "vignettes"), orderBy("createdAt", "desc"), limit(200)), (snap) => {
      setVignettes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading vignettes:", err));
    const unsubLogs = canViewLogs ? onSnapshot(query(collection(db, "audit-logs"), orderBy("timestamp", "desc"), limit(100)), (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error loading logs:", err)) : () => {
    };
    const unsubNotifs = onSnapshot(query(
      collection(db, "notifications"),
      where("userId", "in", isAdmin ? [user?.uid, "all", "admin"] : [user?.uid, "all"]),
      orderBy("createdAt", "desc"),
      limit(100)
    ), (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      if (!isAdmin) {
        onSnapshot(query(collection(db, "notifications"), where("userId", "==", user?.uid), limit(100)), (snapFallback) => {
          setNotifications(snapFallback.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, (errFallback) => console.error("Error in fallback notifications listener:", errFallback));
      } else {
        onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(100)), (snapFallback) => {
          setNotifications(snapFallback.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, (errFallback) => console.error("Error in fallback notifications listener:", errFallback));
      }
    });
    const unsubSkills = onSnapshot(doc(db, "settings", "skills"), (snap) => {
      if (snap.exists()) {
        setAvailableSkills(snap.data().list || []);
      }
    }, (err) => console.error("Error loading skills settings:", err));
    return () => {
      unsubSettings();
      unsubPosts();
      unsubBlog();
      unsubMembers();
      unsubAgenda();
      unsubAgendaDirecao();
      unsubVignettes();
      unsubLogs();
      unsubNotifs();
      unsubSkills();
    };
  }, [user, isAdmin]);
  useEffect(() => {
    if (!profile?.id) return;
    const unsubChats = onSnapshot(
      query(collection(db, "chats"), where("participants", "array-contains", profile.id)),
      (snap) => {
        let chats = snap.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
        chats.sort((a, b) => {
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
  const filteredItems = useMemo(() => {
    const query2 = searchQuery.toLowerCase();
    if (activeTab === "eventos") return posts.filter((p) => p.title?.toLowerCase().includes(query2) || p.content?.toLowerCase().includes(query2));
    if (activeTab === "noticias") return blog.filter((p) => p.title?.toLowerCase().includes(query2) || p.content?.toLowerCase().includes(query2));
    if (activeTab === "radio") return vignettes.filter((v) => v.title?.toLowerCase().includes(query2));
    if (activeTab === "membros") return members.filter((m) => m.name?.toLowerCase().includes(query2) || m.email?.toLowerCase().includes(query2));
    if (activeTab === "agenda") return agenda.filter((a) => a.title?.toLowerCase().includes(query2) || a.description?.toLowerCase().includes(query2));
    if (activeTab === "agenda-direcao") return agendaDirecao.filter((a) => a.title?.toLowerCase().includes(query2) || a.description?.toLowerCase().includes(query2));
    return [];
  }, [activeTab, searchQuery, posts, members, agenda, agendaDirecao]);
  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let collectionName = activeTab === "eventos" ? "posts" : activeTab === "noticias" ? "blog" : activeTab === "membros" ? "members" : activeTab === "agenda-direcao" ? "agenda-direcao" : "agenda";
      if (selectedItem?.type) {
        collectionName = selectedItem.type === "post" ? "posts" : selectedItem.type === "agenda-direcao" ? "agenda-direcao" : "agenda";
      }
      const sanitizeData = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map((v) => sanitizeData(v)).filter((v) => v !== void 0);
        }
        if (obj !== null && typeof obj === "object") {
          return Object.entries(obj).reduce((acc, [key, value]) => {
            const sanitized = sanitizeData(value);
            if (sanitized !== void 0) {
              acc[key] = sanitized;
            }
            return acc;
          }, {});
        }
        return obj === void 0 ? null : obj;
      };
      let dataToSave = sanitizeData(formData);
      const currentInvited = formData.invitedMembers || [];
      const previousInvitedIds = new Set((selectedItem?.invitedMembers || []).map((m) => m.id));
      const newInvitedMembers = currentInvited.filter((m) => !previousInvitedIds.has(m.id));
      if (formData.street || formData.city) {
        const streetNum = formData.street ? formData.streetNumber ? `${formData.street}, ${formData.streetNumber}` : formData.street : "";
        const parts = [
          streetNum,
          formData.neighborhood,
          formData.city,
          formData.state
        ].filter(Boolean);
        let formattedLocation = streetNum;
        if (formData.neighborhood) formattedLocation += ` - ${formData.neighborhood}`;
        if (formData.city) formattedLocation += `, ${formData.city}`;
        if (formData.state) formattedLocation += ` - ${formData.state.toUpperCase()}`;
        dataToSave.location = formattedLocation || formData.location;
      }
      if (activeTab === "membros" && formData.ministries?.length > 0) {
        dataToSave.ministries = formData.ministries.map((m) => {
          if (typeof m === "string") return m === "Desenvolvimento" ? "Desenvolvedor" : m;
          return { ...m, name: m.name === "Desenvolvimento" ? "Desenvolvedor" : m.name };
        });
        const firstMinistry = dataToSave.ministries[0];
        dataToSave.role = typeof firstMinistry === "string" ? firstMinistry : firstMinistry.name;
        dataToSave.isLeader = dataToSave.ministries.some((m) => typeof m === "object" && m.isLeader);
      }
      if (selectedItem?.id) {
        await setDoc(doc(db, collectionName, selectedItem.id), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        }, { merge: true });
        logAction("atualizar", collectionName, `Atualizou ${activeTab === "eventos" ? "evento" : activeTab === "agenda" ? "item na agenda" : activeTab === "radio" ? "vinheta" : "registro"}: ${dataToSave.title || dataToSave.name}`);
        await addDoc(collection(db, "notifications"), {
          title: "Atividade",
          message: `Atualizou ${activeTab === "eventos" ? "evento" : activeTab === "agenda" ? "item na agenda" : activeTab === "radio" ? "vinheta" : "perfil"}: ${dataToSave.title || dataToSave.name}`,
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
        logAction("criar", collectionName, `Criou ${activeTab === "eventos" ? "evento" : activeTab === "agenda" ? "item na agenda" : activeTab === "agenda-direcao" ? "compromisso na dire\xE7\xE3o" : activeTab === "radio" ? "vinheta" : "registro"}: ${dataToSave.title || dataToSave.name} (ID: ${newDoc.id})`);
        await addDoc(collection(db, "notifications"), {
          title: "Atividade",
          message: `Criou ${activeTab === "eventos" ? "evento" : activeTab === "agenda" ? "item na agenda" : activeTab === "agenda-direcao" ? "compromisso na dire\xE7\xE3o" : activeTab === "radio" ? "vinheta" : "registro"}: ${dataToSave.title || dataToSave.name}`,
          type: "activity",
          memberId: user?.uid || profile?.id || "admin",
          createdAt: serverTimestamp(),
          read: true
        });
      }
      if (newInvitedMembers.length > 0 && profile?.id && dataToSave.title) {
        for (const member of newInvitedMembers) {
          const chatId = [profile.id, member.id].sort().join("_");
          const autoMsg = `Voc\xEA foi escalado para o compromisso: "${dataToSave.title}"`;
          try {
            await setDoc(doc(db, "chats", chatId), {
              participants: [profile.id, member.id],
              lastMessage: autoMsg,
              lastMessageTime: serverTimestamp(),
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
              message: `${profile.name || user?.displayName || "Admin"} escalou voc\xEA: ${dataToSave.title}`,
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
    const fromPosts = posts.filter((p) => p.date).map((p) => {
      let isoDate = p.date;
      if (typeof p.date === "string" && p.date.includes("/") && p.date.includes(" - ")) {
        const parts = p.date.split(" - ");
        if (parts.length >= 2) {
          const dateParts = parts[0].split("/");
          if (dateParts.length === 3) {
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
        type: "post"
      };
    });
    const fromAgenda = agenda.map((a) => ({ ...a, type: "agenda" }));
    return [...fromAgenda, ...fromPosts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [posts, agenda]);
  const eventsToImport = useMemo(() => {
    return mergedAgenda.filter(
      (item) => item.title?.toLowerCase().includes(importSearch.toLowerCase()) || item.location?.toLowerCase().includes(importSearch.toLowerCase())
    );
  }, [mergedAgenda, importSearch]);
  const handleImportEvent = async (event) => {
    try {
      const dataToSave = {
        title: event.title,
        date: event.date,
        endTime: event.endTime || "",
        location: event.location || "",
        description: event.description || "",
        organization: event.organization || "Importado",
        inviteChurch: false,
        invitedMembers: [],
        thumbnail: event.thumbnail || "",
        createdAt: serverTimestamp(),
        authorId: user?.uid || profile?.id || "admin",
        authorName: user?.displayName || profile?.name || "Admin"
      };
      await addDoc(collection(db, "agenda-direcao"), dataToSave);
      await addDoc(collection(db, "notifications"), {
        title: "Atividade",
        message: `Importou evento para agenda da dire\xE7\xE3o: ${dataToSave.title}`,
        type: "activity",
        memberId: user?.uid || profile?.id || "admin",
        createdAt: serverTimestamp(),
        read: true
      });
      setIsImportEventDialogOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "agenda-direcao");
    }
  };
  const handleDelete = (id, collectionOverride) => {
    const colName = collectionOverride || (activeTab === "eventos" ? "posts" : activeTab === "radio" ? "vignettes" : activeTab === "membros" ? "members" : activeTab === "agenda-direcao" ? "agenda-direcao" : "agenda");
    setDeleteConfirm({ id, collection: colName });
  };
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      console.log("Excluindo item:", deleteConfirm.id, "da cole\xE7\xE3o:", deleteConfirm.collection);
      await deleteDoc(doc(db, deleteConfirm.collection, deleteConfirm.id));
      logAction("excluir", deleteConfirm.collection, `Excluiu item ID: ${deleteConfirm.id}`);
      setSelectedItem(null);
      setIsEditing(false);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Erro ao excluir:", err);
      handleFirestoreError(err, OperationType.DELETE, activeTab);
      setDeleteConfirm(null);
    }
  };
  const openWhatsApp = (member) => {
    setRightSidebarView("chat-active");
    setActiveChatUser(member);
  };
  const confirmWhatsApp = (member, message) => {
    openWhatsApp(member);
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#0a0a0a] flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-[#BF76FF]/20 border-t-[#BF76FF] rounded-full animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "text-white/40 text-sm font-medium animate-pulse", children: "Carregando painel..." })
    ] }) });
  }
  if (!user || !isMasterAdmin && !canViewTab("visao-geral") && !canViewTab("eventos") && !canViewTab("membros") && !canViewTab("agenda") && !canViewTab("agenda-direcao")) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-12", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-6 h-6" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full mx-auto flex-1 flex flex-col justify-center pb-20", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-6", children: isSignUpMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "Solicitar ",
          /* @__PURE__ */ jsx("span", { className: "text-[#BF76FF]", children: "Acesso" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          "\xC1rea de ",
          /* @__PURE__ */ jsx("span", { className: "text-[#BF76FF]", children: "Membros" })
        ] }) }),
        authError && /* @__PURE__ */ jsxs("div", { className: "bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl mb-6 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: authError }),
          /* @__PURE__ */ jsx("button", { onClick: () => setAuthError(""), className: "hover:text-red-400", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
        ] }),
        user && !isAdmin && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm p-4 rounded-xl mb-6", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold mb-1", children: "Acesso Restrito" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Voc\xEA est\xE1 logado como ",
            /* @__PURE__ */ jsx("span", { className: "underline", children: user.email }),
            ", mas esta conta n\xE3o tem permiss\xE3o de administrador."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-4", children: [
            /* @__PURE__ */ jsx("button", { onClick: logout, className: "text-xs underline hover:text-amber-400", children: "Sair e tentar outra conta" }),
            /* @__PURE__ */ jsx("button", { onClick: () => window.location.reload(), className: "text-xs underline hover:text-amber-400", children: "Atualizar p\xE1gina" })
          ] })
        ] }),
        !isSignUpMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "email",
                  placeholder: "membro@ministerioprofecia.com.br",
                  className: "h-16 bg-[#1a1a1a] border-none rounded-2xl px-6 text-lg focus-visible:ring-1 focus-visible:ring-[#BF76FF]/50 transition-all text-white",
                  value: email,
                  onChange: (e) => setEmail(e.target.value)
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute right-6 top-1/2 -translate-y-1/2 text-[#BF76FF]", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: showPassword ? "text" : "password",
                  placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                  className: "h-16 bg-[#1a1a1a] border-none rounded-2xl px-6 text-lg focus-visible:ring-1 focus-visible:ring-[#BF76FF]/50 transition-all text-white",
                  value: password,
                  onChange: (e) => setPassword(e.target.value)
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors cursor-pointer",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-center mb-10", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-[#666666]", children: [
            "Ao clicar, voc\xEA concorda com termos da igreja Evangelica minist\xE9rio Profecia.",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx(Link, { to: "/terms", className: "underline hover:text-white", children: "Termos de uso" }),
            " & ",
            /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "underline hover:text-white", children: "Pol\xEDtica de privacidade" })
          ] }) }),
          /* @__PURE__ */ jsx(
            Button,
            {
              className: "w-full h-16 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#7300FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50",
              disabled: isSubmitting,
              onClick: async () => {
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
                      email,
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
                    setAuthError("Usu\xE1rio n\xE3o encontrado.");
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
                    setAuthError("Senha incorreta.");
                    setIsSubmitting(false);
                    return;
                  }
                  if (memberData.status === "pending") {
                    setAuthError("Seu cadastro ainda est\xE1 em an\xE1lise.");
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
              },
              children: isSubmitting ? "Entrando..." : "Logar"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative my-6", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-white/10" }) }),
            /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-[#0a0a0a] px-2 text-gray-500", children: "Ou continue com" }) })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full h-16 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full text-lg font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3",
              onClick: async () => {
                try {
                  setAuthError("");
                  setIsSubmitting(true);
                  await login();
                  window.alert("Login efetuado com sucesso!");
                } catch (error) {
                  console.error("Erro no login Google:", error);
                  if (error.code === "auth/unauthorized-domain") {
                    setAuthError(`Este dom\xEDnio (${window.location.hostname}) n\xE3o est\xE1 autorizado no Firebase. Adicione-o na se\xE7\xE3o 'Authentication > Settings > Authorized domains' do Console do Firebase.`);
                  } else if (error.code === "auth/popup-closed-by-user") {
                    setAuthError("A janela de login foi fechada antes de completar. Tente novamente.");
                  } else if (error.code === "auth/network-request-failed") {
                    setAuthError("Falha na conex\xE3o com o Google. Verifique sua internet ou desative extens\xF5es como AdBlock que podem estar bloqueando o login.");
                  } else {
                    setAuthError("Erro ao entrar com Google: " + (error.message || "Tente novamente."));
                  }
                } finally {
                  setIsSubmitting(false);
                }
              },
              children: [
                /* @__PURE__ */ jsxs("svg", { className: "w-6 h-6", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      fill: "currentColor",
                      d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      fill: "currentColor",
                      d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      fill: "currentColor",
                      d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      fill: "currentColor",
                      d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    }
                  )
                ] }),
                "Google"
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "mt-4 text-center", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setAuthError("Dica: Se a janela n\xE3o abrir, verifique se o seu navegador n\xE3o est\xE1 bloqueando pop-ups ou tente usar uma aba an\xF4nima.");
              },
              className: "text-xs text-gray-500 hover:text-[#BF76FF] transition-colors cursor-pointer",
              children: "Problemas com o login do Google?"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 text-center space-y-4", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-white", children: [
              "Esqueceu a senha? ",
              /* @__PURE__ */ jsx("button", { className: "text-[#BF76FF] hover:underline transition-colors cursor-pointer", children: "clique aqui" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-white", children: [
              "N\xE3o tem uma conta? ",
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setIsSignUpMode(true);
                setAuthError("");
              }, className: "text-[#BF76FF] hover:underline transition-colors cursor-pointer", children: "Cadastre-se" })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Nome" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                    value: signUpData.firstName,
                    onChange: (e) => setSignUpData({ ...signUpData, firstName: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Sobrenome" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                    value: signUpData.lastName,
                    onChange: (e) => setSignUpData({ ...signUpData, lastName: e.target.value })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "E-mail" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "email",
                  className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                  value: signUpData.email,
                  onChange: (e) => setSignUpData({ ...signUpData, email: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Data de Nascimento" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "date",
                    className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white [color-scheme:dark]",
                    value: signUpData.birthDate,
                    onChange: (e) => setSignUpData({ ...signUpData, birthDate: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Telefone/WhatsApp" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                    placeholder: "11999999999",
                    value: signUpData.phone,
                    onChange: (e) => setSignUpData({ ...signUpData, phone: e.target.value })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Qual sua fun\xE7\xE3o na igreja?" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                  placeholder: "Ex: Membro, M\xEDdia, Louvor...",
                  value: signUpData.churchRole,
                  onChange: (e) => setSignUpData({ ...signUpData, churchRole: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Senha" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "password",
                    className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                    value: signUpData.password,
                    onChange: (e) => setSignUpData({ ...signUpData, password: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Confirmar Senha" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "password",
                    className: "bg-[#1a1a1a] border-none h-14 rounded-2xl px-4 text-white",
                    value: signUpData.confirmPassword,
                    onChange: (e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              className: "w-full h-16 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full text-xl font-bold shadow-lg shadow-[#7300FF]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50",
              disabled: isSubmitting,
              onClick: async () => {
                setAuthError("");
                if (!signUpData.firstName || !signUpData.email || !signUpData.password) {
                  setAuthError("Por favor, preencha nome, e-mail e senha.");
                  return;
                }
                if (signUpData.password !== signUpData.confirmPassword) {
                  setAuthError("As senhas n\xE3o coincidem.");
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
                  createdAt: (/* @__PURE__ */ new Date()).toISOString()
                };
                try {
                  console.log("DEBUG: Iniciando processo de cadastro para:", newMember.email);
                  const safetyTimeout = setTimeout(() => {
                    if (isSubmitting) {
                      console.error("DEBUG: Timeout de seguran\xE7a atingido!");
                      setAuthError("Tempo limite excedido. O banco de dados est\xE1 demorando para responder. Tente atualizar a p\xE1gina.");
                      setIsSubmitting(false);
                    }
                  }, 15e3);
                  console.log("DEBUG: Chamando addDoc para 'members'...");
                  const newMemberRef = await addDoc(collection(db, "members"), newMember);
                  console.log("DEBUG: Membro salvo com sucesso, ID:", newMemberRef.id);
                  console.log("DEBUG: Chamando addDoc para 'notifications'...");
                  await addDoc(collection(db, "notifications"), {
                    title: "Novo Cadastro",
                    message: `${newMember.name} solicitou acesso ao painel com cargo de ${newMember.churchRole || "Membro"}.`,
                    type: "registration",
                    memberId: newMemberRef.id,
                    read: false,
                    createdAt: (/* @__PURE__ */ new Date()).toISOString()
                  });
                  console.log("DEBUG: Notifica\xE7\xE3o salva com sucesso");
                  clearTimeout(safetyTimeout);
                  setIsSignUpMode(false);
                  setShowSignUpSuccessModal(true);
                  setSignUpData({ firstName: "", lastName: "", email: "", birthDate: "", churchRole: "", phone: "", password: "", confirmPassword: "" });
                } catch (error) {
                  console.error("DEBUG: Erro capturado no catch:", error);
                  let errorMessage = "Erro ao solicitar cadastro. ";
                  if (error.code === "permission-denied") {
                    errorMessage += "Permiss\xE3o negada no banco de dados.";
                  } else if (error.message && error.message.includes("offline")) {
                    errorMessage += "Voc\xEA parece estar offline ou a conex\xE3o foi recusada.";
                  } else {
                    errorMessage += error.message || "Tente novamente.";
                  }
                  setAuthError(errorMessage);
                } finally {
                  console.log("DEBUG: Finalizando bloco try-catch-finally");
                  setIsSubmitting(false);
                }
              },
              children: isSubmitting ? "Solicitando..." : "Solicitar Acesso"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-white", children: [
            "J\xE1 tem uma conta? ",
            /* @__PURE__ */ jsx("button", { onClick: () => {
              setIsSignUpMode(false);
              setAuthError("");
            }, className: "text-[#BF76FF] hover:underline transition-colors cursor-pointer", children: "Fa\xE7a login" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Dialog, { open: showSignUpSuccessModal, onOpenChange: setShowSignUpSuccessModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-[#111] border-white/10 text-white sm:max-w-md text-center py-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-8 h-8" }) }),
        /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-2xl text-center mb-2", children: "Cadastro Solicitado!" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Seu cadastro foi solicitado com sucesso. Retornaremos em breve com a confirma\xE7\xE3o de acesso ao painel." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            className: "w-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer mt-6 h-12 rounded-xl",
            onClick: () => setShowSignUpSuccessModal(false),
            children: "Fechar"
          }
        )
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn(
    "flex flex-col md:flex-row h-screen h-[100dvh] overflow-hidden font-sans transition-colors duration-500 relative",
    isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"
  ), children: [
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: cn(
          "transition-all duration-300 ease-in-out z-50",
          "md:h-full md:border-r",
          isSidebarCollapsed ? "md:w-20" : "md:w-64",
          // Mobile specifics
          "fixed bottom-0 left-0 right-0 h-20 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:border-t-0",
          isDarkMode ? "bg-[#0a0a0a]/80 md:bg-[#0a0a0a] border-white/5 backdrop-blur-lg" : "bg-white/80 md:bg-gray-50 border-black/5 backdrop-blur-lg"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col w-full px-4 pt-6 mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
              !isSidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start leading-none gap-0 pl-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: cn("font-black text-base tracking-tight uppercase", isDarkMode ? "text-white" : "text-black"), children: "Ministerio" }),
                  /* @__PURE__ */ jsx("span", { className: cn("font-light text-base tracking-tight uppercase", isDarkMode ? "text-white/80" : "text-gray-600"), children: "Profecia" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: cn("text-[8px] font-bold uppercase tracking-[0.1em] opacity-60 mt-0.5", isDarkMode ? "text-white" : "text-black"), children: "\xE1rea de membro" })
              ] }),
              isSidebarCollapsed && /* @__PURE__ */ jsx("div", { className: "w-full flex justify-center mb-4", children: /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-[#BF76FF] to-[#8E44AD] flex items-center justify-center text-white shadow-lg shadow-[#BF76FF]/20", children: /* @__PURE__ */ jsx("span", { className: "font-black text-xs", children: "MP" }) }) }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsSidebarCollapsed(!isSidebarCollapsed),
                  className: cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    isDarkMode ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-black/5 text-gray-400 hover:text-black"
                  ),
                  children: isSidebarCollapsed ? /* @__PURE__ */ jsx(PanelLeftOpen, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(PanelLeftClose, { className: "w-5 h-5" })
                }
              )
            ] }),
            !isSidebarCollapsed && (isMasterAdmin || profile?.role === "Desenvolvedor") && /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => isMasterAdmin ? setIsWorkspaceOpen(!isWorkspaceOpen) : setActiveTab("config"),
                  className: cn(
                    "border rounded-2xl p-3 mb-2 flex items-center justify-between group cursor-pointer transition-all",
                    isDarkMode ? "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]" : "bg-black/[0.02] border-black/[0.05] hover:bg-black/[0.04]",
                    isWorkspaceOpen && "ring-1 ring-[#BF76FF]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors",
                        isDarkMode ? "bg-[#1a1a1a] text-gray-400 border-white/5" : "bg-white text-gray-600 border-black/5 shadow-sm"
                      ), children: currentRole[0] || "A" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col font-['Helvetica_Neue',_sans-serif]", children: [
                        /* @__PURE__ */ jsx("span", { className: cn("text-[10px] font-light transition-colors", isDarkMode ? "text-gray-400" : "text-gray-500"), children: "Workspace" }),
                        /* @__PURE__ */ jsx("span", { className: cn("text-xs font-bold transition-colors uppercase tracking-wider", isDarkMode ? "text-white" : "text-black"), children: currentRole === "Administradores" ? "Administrador Master" : currentRole })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(ChevronDown, { className: cn("w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-transform", isWorkspaceOpen && "rotate-180") })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(AnimatePresence, { children: isWorkspaceOpen && /* @__PURE__ */ jsx(
                motion.div,
                {
                  initial: { opacity: 0, y: -10, scale: 0.95 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  exit: { opacity: 0, y: -10, scale: 0.95 },
                  className: cn(
                    "absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl border z-[60] shadow-2xl",
                    isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"
                  ),
                  children: /* @__PURE__ */ jsx("div", { className: "space-y-1 max-h-[400px] overflow-y-auto overflow-x-hidden p-1 scrollbar-hide", children: allRoles.map((role) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setActiveViewRole(role);
                        setIsWorkspaceOpen(false);
                        if (role === "Dire\xE7\xE3o") {
                          setActiveTab("agenda-direcao");
                        } else {
                          setActiveTab("visao-geral");
                        }
                      },
                      className: cn(
                        "w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-colors",
                        currentRole === role ? "bg-[#BF76FF]/10 text-[#BF76FF]" : isDarkMode ? "hover:bg-white/5 text-gray-400" : "hover:bg-black/5 text-gray-600"
                      ),
                      children: role === "Administradores" ? "Administrador Master" : role
                    },
                    `role-option-${role}`
                  )) })
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 w-full px-2 md:px-3 overflow-y-auto scrollbar-hide flex md:block items-center", children: /* @__PURE__ */ jsxs("nav", { className: "flex md:flex-col flex-row justify-around md:justify-start gap-1 md:gap-1.5 w-full md:pb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col gap-1.5 w-full", children: [
              canViewTab("visao-geral") && /* @__PURE__ */ jsx(SidebarItem, { icon: Home, active: activeTab === "visao-geral", onClick: () => setActiveTab("visao-geral"), label: "In\xEDcio", collapsed: isSidebarCollapsed, isDark: isDarkMode }),
              canViewTab("eventos") && /* @__PURE__ */ jsx(SidebarItem, { icon: PartyPopper, active: activeTab === "eventos", onClick: () => setActiveTab("eventos"), label: "Eventos", collapsed: isSidebarCollapsed, isDark: isDarkMode }),
              canViewTab("noticias") && /* @__PURE__ */ jsx(SidebarItem, { icon: Newspaper, active: activeTab === "noticias", onClick: () => setActiveTab("noticias"), label: "Blog / Not\xEDcias", collapsed: isSidebarCollapsed, isDark: isDarkMode }),
              canViewTab("membros") && /* @__PURE__ */ jsx(SidebarItem, { icon: Users, active: activeTab === "membros", onClick: () => {
                setActiveTab("membros");
                setShowPending(false);
              }, label: "Membros", collapsed: isSidebarCollapsed, isDark: isDarkMode, notificationCount: isMasterAdmin || profile?.role === "Desenvolvedor" ? pendingMembers.length : 0 }),
              canViewTab("agenda") && /* @__PURE__ */ jsx(SidebarItem, { icon: Clock, active: activeTab === "agenda", onClick: () => setActiveTab("agenda"), label: "Agenda", collapsed: isSidebarCollapsed, isDark: isDarkMode }),
              canViewTab("agenda-direcao") && /* @__PURE__ */ jsx(SidebarItem, { icon: CalendarDays, active: activeTab === "agenda-direcao", onClick: () => setActiveTab("agenda-direcao"), label: "Agen. Dire\xE7\xE3o", collapsed: isSidebarCollapsed, isDark: isDarkMode }),
              canViewLogs && /* @__PURE__ */ jsx(SidebarItem, { icon: ClipboardList, active: activeTab === "logs", onClick: () => setActiveTab("logs"), label: "Audit Logs", collapsed: isSidebarCollapsed, isDark: isDarkMode })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col gap-1.5 w-full mt-auto pt-4 border-t border-white/5", children: [
              canViewSettings && /* @__PURE__ */ jsx(
                SidebarItem,
                {
                  icon: Settings,
                  active: activeTab === "config",
                  onClick: () => {
                    setActiveTab("config");
                    setRightSidebarView("team");
                  },
                  label: "Configura\xE7\xF5es",
                  collapsed: isSidebarCollapsed,
                  isDark: isDarkMode
                }
              ),
              /* @__PURE__ */ jsx(
                SidebarItem,
                {
                  icon: LogOut,
                  active: false,
                  onClick: () => auth.signOut(),
                  label: "Sair",
                  collapsed: isSidebarCollapsed,
                  isDark: isDarkMode
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-row justify-around w-full items-center px-2 py-1", children: [
              canViewTab("visao-geral") && /* @__PURE__ */ jsx(SidebarItem, { icon: Home, active: activeTab === "visao-geral" && rightSidebarView === "hidden", onClick: () => {
                setActiveTab("visao-geral");
                setRightSidebarView("hidden");
              }, label: "In\xEDcio", collapsed: true, isDark: isDarkMode, mobile: true }),
              canViewTab("eventos") && /* @__PURE__ */ jsx(SidebarItem, { icon: PartyPopper, active: activeTab === "eventos" && rightSidebarView === "hidden", onClick: () => {
                setActiveTab("eventos");
                setRightSidebarView("hidden");
              }, label: "Eventos", collapsed: true, isDark: isDarkMode, mobile: true }),
              canViewTab("noticias") && /* @__PURE__ */ jsx(SidebarItem, { icon: Newspaper, active: activeTab === "noticias" && rightSidebarView === "hidden", onClick: () => {
                setActiveTab("noticias");
                setRightSidebarView("hidden");
              }, label: "Not\xEDcias", collapsed: true, isDark: isDarkMode, mobile: true }),
              canViewTab("agenda") && /* @__PURE__ */ jsx(SidebarItem, { icon: Calendar, active: activeTab === "agenda" && rightSidebarView === "hidden", onClick: () => {
                setActiveTab("agenda");
                setRightSidebarView("hidden");
              }, label: "Agenda", collapsed: true, isDark: isDarkMode, mobile: true }),
              canViewTab("agenda-direcao") && /* @__PURE__ */ jsx(SidebarItem, { icon: CalendarDays, active: activeTab === "agenda-direcao" && rightSidebarView === "hidden", onClick: () => {
                setActiveTab("agenda-direcao");
                setRightSidebarView("hidden");
              }, label: "Dire\xE7\xE3o", collapsed: true, isDark: isDarkMode, mobile: true, iconClassName: "text-[#BF76FF]" }),
              /* @__PURE__ */ jsx(SidebarItem, { icon: MessageSquare, active: rightSidebarView === "chat-list" || rightSidebarView === "chat-active", onClick: () => setRightSidebarView(rightSidebarView === "chat-list" ? "hidden" : "chat-list"), label: "Chat", collapsed: true, isDark: isDarkMode, mobile: true }),
              /* @__PURE__ */ jsxs(Sheet, { children: [
                /* @__PURE__ */ jsxs(
                  SheetTrigger,
                  {
                    className: cn(
                      "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all outline-none",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    ),
                    children: [
                      /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" }),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase", children: "Menu" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", className: cn("rounded-t-[32px] p-6 border-none max-h-[90vh] overflow-y-auto scrollbar-hide flex flex-col gap-6", isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"), children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-2 mb-2", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Apar\xEAncia do Tema" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setIsDarkMode(false),
                          className: cn("p-2 rounded-full transition-all", !isDarkMode ? "bg-white text-[#BF76FF] shadow-sm" : "text-gray-500"),
                          children: /* @__PURE__ */ jsx(Sun, { className: "w-4 h-4" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setIsDarkMode(true),
                          className: cn("p-2 rounded-full transition-all", isDarkMode ? "bg-[#1a1a1a] text-[#BF76FF] shadow-inner" : "text-gray-500"),
                          children: /* @__PURE__ */ jsx(Moon, { className: "w-4 h-4" })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2", children: "Busca R\xE1pida" }),
                      /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                        /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            placeholder: "Pesquisar no painel...",
                            value: searchQuery,
                            onChange: (e) => setSearchQuery(e.target.value),
                            className: cn(
                              "w-full rounded-2xl py-4 pl-12 pr-4 text-sm outline-none border transition-all",
                              isDarkMode ? "bg-white/5 border-white/10 text-white focus:border-[#BF76FF]/50" : "bg-gray-100 border-black/5 text-black focus:border-[#BF76FF]/50"
                            )
                          }
                        )
                      ] }),
                      globalSearchResults.length > 0 && searchQuery && /* @__PURE__ */ jsx("div", { className: "space-y-2 mt-2", children: globalSearchResults.slice(0, 4).map((res, i) => /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => {
                            if (res.type === "membros") setViewingMember(res.item);
                            setSelectedItem(res.item);
                            setFormData({ ...res.item });
                            setActiveTab(res.type);
                            setIsEditing(!(res.type === "membros" || res.type === "agenda" || res.type === "agenda-direcao"));
                            setIsReadOnly(true);
                            setSearchQuery("");
                          },
                          className: cn(
                            "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left border",
                            isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-black/5 hover:bg-gray-50 shadow-sm"
                          ),
                          children: [
                            /* @__PURE__ */ jsx("div", { className: cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isDarkMode ? "bg-white/5" : "bg-black/5"), children: /* @__PURE__ */ jsx(res.icon, { className: "w-5 h-5 text-[#BF76FF]" }) }),
                            /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0 flex-1", children: [
                              /* @__PURE__ */ jsx("span", { className: cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-black"), children: res.title }),
                              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 truncate", children: res.sub })
                            ] }),
                            /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-gray-500" })
                          ]
                        },
                        `search-res-list-${res.type}-${res.item?.id || i}`
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2", children: "Op\xE7\xF5es do Sistema" }),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                        canViewSettings && /* @__PURE__ */ jsxs(
                          SheetClose,
                          {
                            onClick: () => {
                              setActiveTab("config");
                              setRightSidebarView("hidden");
                            },
                            className: cn("flex flex-col gap-2 p-4 rounded-2xl transition-all text-left", isDarkMode ? "bg-white/5" : "bg-gray-100"),
                            children: [
                              /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 text-gray-400" }),
                              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: "Configura\xE7\xF5es" })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxs(
                          SheetClose,
                          {
                            onClick: logout,
                            className: cn("flex flex-col gap-2 p-4 rounded-2xl transition-all text-left", isDarkMode ? "bg-red-500/10" : "bg-red-50"),
                            children: [
                              /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5 text-red-500" }),
                              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-red-500", children: "Sair" })
                            ]
                          }
                        )
                      ] })
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("main", { className: cn("flex-1 flex flex-col min-h-0 transition-all duration-500 relative", isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50"), children: [
      /* @__PURE__ */ jsxs("header", { className: cn(
        "h-14 md:h-20 border-b flex items-center transition-all duration-500 z-50 sticky top-0 shadow-sm",
        isDarkMode ? "border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl" : "border-black/5 bg-white/80 backdrop-blur-xl"
      ), children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 px-4 md:px-8 shrink-0", children: isEditing ? /* @__PURE__ */ jsx(
          "button",
          {
            className: cn("p-1.5 rounded-lg transition-colors cursor-pointer md:hidden", isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black"),
            onClick: () => setIsEditing(false),
            children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" })
          }
        ) : /* @__PURE__ */ jsx("div", { className: "md:hidden flex items-center gap-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start leading-none gap-0 ml-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: cn("font-black text-[13px] tracking-tight uppercase", isDarkMode ? "text-white" : "text-black"), children: "Ministerio" }),
            /* @__PURE__ */ jsx("span", { className: cn("font-light text-[13px] tracking-tight uppercase", isDarkMode ? "text-white/80" : "text-gray-600"), children: "Profecia" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: cn("text-[8px] font-bold uppercase tracking-[0.1em] opacity-60 mt-0.5", isDarkMode ? "text-white" : "text-black"), children: "\xE1rea de membro" })
        ] }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex md:hidden items-center justify-end px-4 gap-2", children: [
          /* @__PURE__ */ jsxs(Dialog, { children: [
            /* @__PURE__ */ jsx(DialogTrigger, { className: cn("p-2 rounded-full transition-colors cursor-pointer outline-none", isDarkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-black/5"), children: /* @__PURE__ */ jsx(Search, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsxs(DialogContent, { className: cn("border-none", isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"), children: [
              /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-black uppercase tracking-tighter", children: "Pesquisar no Painel" }) }),
              /* @__PURE__ */ jsxs("div", { className: "py-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      value: searchQuery,
                      onChange: (e) => setSearchQuery(e.target.value),
                      placeholder: "Buscar membros, eventos, m\xFAsicas...",
                      className: cn("h-14 pl-12 rounded-2xl border-none", isDarkMode ? "bg-white/5" : "bg-black/5")
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "mt-4 max-h-[300px] overflow-y-auto", children: globalSearchResults.map((res, i) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (res.type === "membros") setViewingMember(res.item);
                      setSelectedItem(res.item);
                      setFormData({ ...res.item });
                      setActiveTab(res.type);
                      setIsEditing(!(res.type === "membros" || res.type === "agenda" || res.type === "agenda-direcao"));
                      setSearchQuery("");
                    },
                    className: cn("w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors", isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"),
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-[#BF76FF]/10 flex items-center justify-center shrink-0", children: res.type === "membros" ? /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-[#BF76FF]" }) : /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[#BF76FF]" }) }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold truncate", children: res.title }),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-bold text-gray-500", children: res.type })
                      ] })
                    ]
                  },
                  `search-res-overlay-${res.type}-${i}-${res.item?.id || "no-id"}`
                )) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Sheet, { children: [
            /* @__PURE__ */ jsx(SheetTrigger, { className: cn("p-2 rounded-full transition-colors cursor-pointer outline-none", isDarkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-black/5"), children: /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" }) }),
            /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", className: cn("rounded-t-[32px] p-6 border-none max-h-[90vh] overflow-y-auto scrollbar-hide flex flex-col gap-6", isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"), children: [
              /* @__PURE__ */ jsx(SheetTitle, { className: "sr-only", children: "Menu Mobile do Dashboard" }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between px-2 mb-2", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Painel Administrativo" }) }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs(Button, { onClick: () => setActiveTab("visao-geral"), variant: "ghost", className: "h-20 flex flex-col items-center justify-center gap-2 rounded-[24px] border border-white/5", children: [
                  /* @__PURE__ */ jsx(Home, { className: "w-6 h-6" }),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold", children: "In\xEDcio" })
                ] }),
                /* @__PURE__ */ jsxs(Button, { onClick: () => setActiveTab("membros"), variant: "ghost", className: "h-20 flex flex-col items-center justify-center gap-2 rounded-[24px] border border-white/5", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-6 h-6" }),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold", children: "Membros" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:flex flex-[2] justify-center relative", children: /* @__PURE__ */ jsxs("div", { className: cn(
          "relative group transition-all duration-300 w-full max-w-[400px]",
          isEditing ? "hidden md:flex" : "hidden md:flex"
        ), children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Pesquisar...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: cn(
                "border-none rounded-full h-10 pl-11 pr-4 text-sm w-full outline-none transition-colors",
                isDarkMode ? "bg-[#1a1a1a] text-white focus:ring-1 focus:ring-[#BF76FF]/30" : "bg-gray-100 text-black focus:ring-1 focus:ring-[#BF76FF]/50 shadow-inner"
              )
            }
          ),
          globalSearchResults.length > 0 && searchQuery && /* @__PURE__ */ jsx("div", { className: cn(
            "absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[70]",
            isDarkMode ? "bg-[#111] border-white/10" : "bg-white border-black/10"
          ), children: globalSearchResults.map((res, i) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                if (res.type === "membros") setViewingMember(res.item);
                setSelectedItem(res.item);
                setFormData(res.item);
                setActiveTab(res.type);
                setIsEditing(true);
                setIsReadOnly(true);
                setSearchQuery("");
              },
              className: cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
              ),
              children: [
                /* @__PURE__ */ jsx("div", { className: cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isDarkMode ? "bg-white/5" : "bg-black/5"), children: /* @__PURE__ */ jsx(res.icon, { className: "w-4 h-4 text-[#BF76FF]" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("span", { className: cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-black"), children: res.title }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 truncate", children: res.sub })
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 text-gray-500" })
              ]
            },
            `search-res-desktop-${res.type}-${i}-${res.item?.id || "no-id"}`
          )) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 md:gap-4 pl-0 pr-2 md:px-8 md:flex-1 justify-end relative ml-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden md:flex xl:hidden items-center gap-1 mr-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setRightSidebarView(rightSidebarView === "team" ? "hidden" : "team"),
                className: cn(
                  "p-2 rounded-xl transition-all",
                  rightSidebarView === "team" ? "bg-[#BF76FF]/10 text-[#BF76FF]" : "text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                ),
                title: "Membros",
                children: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setRightSidebarView(rightSidebarView === "chat-list" ? "hidden" : "chat-list"),
                className: cn(
                  "p-2 rounded-xl transition-all",
                  rightSidebarView === "chat-list" ? "bg-[#BF76FF]/10 text-[#BF76FF]" : "text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                ),
                title: "Mensagens",
                children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: cn("p-2 rounded-xl relative transition-all group", isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"),
                onClick: () => setShowNotifications(!showNotifications),
                children: [
                  /* @__PURE__ */ jsx(Bell, { className: cn("w-5 h-5", counts.unreadNotifications > 0 && "text-[#BF76FF]") }),
                  counts.unreadNotifications > 0 && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#BF76FF] rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] text-white font-black shadow-lg px-1 animate-bounce", children: counts.unreadNotifications })
                ]
              }
            ),
            /* @__PURE__ */ jsx(AnimatePresence, { children: showNotifications && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40", onClick: () => setShowNotifications(false) }),
              /* @__PURE__ */ jsxs(
                motion.div,
                {
                  initial: { opacity: 0, y: 10, scale: 0.95 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  exit: { opacity: 0, y: 10, scale: 0.95 },
                  className: cn(
                    "fixed top-20 right-4 w-80 max-w-[calc(100vw-32px)] md:absolute md:top-full md:right-0 md:mt-4 md:w-72 max-h-[80vh] overflow-y-auto scrollbar-hide rounded-[28px] border shadow-2xl p-3 z-50",
                    isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"
                  ),
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-2 mb-3", children: [
                      /* @__PURE__ */ jsx("h6", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Notifica\xE7\xF5es" }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: handleMarkAllAsRead,
                          className: "text-[10px] text-[#BF76FF] hover:underline font-bold",
                          children: "Marcar como lida"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "space-y-1", children: displayNotifications.length > 0 ? displayNotifications.map((n, i) => /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: async () => {
                          try {
                            if (!n.read) await updateDoc(doc(db, "notifications", n.id), { read: true });
                          } catch (e) {
                            handleFirestoreError(e, OperationType.UPDATE, `notifications/${n.id}`);
                          }
                          if (n.type === "registration" && n.memberId) {
                            setActiveTab("membros");
                            const member = members.find((m) => m.id === n.memberId);
                            if (member) {
                              setSelectedItem(member);
                              setFormData(member);
                              setIsEditing(true);
                              setIsReadOnly(false);
                            }
                          } else if (n.type === "chat" && n.senderId) {
                            const sender = members.find((m) => m.id === n.senderId);
                            if (sender) {
                              setRightSidebarView("chat-active");
                              setActiveChatUser(sender);
                            }
                          }
                          setShowNotifications(false);
                        },
                        className: cn(
                          "w-full text-left p-3 rounded-2xl text-[10px] transition-all",
                          isDarkMode ? n.read ? "bg-white/5 text-gray-500" : "bg-white/10 text-gray-300" : n.read ? "bg-gray-50 text-gray-500" : "bg-primary/5 text-gray-700"
                        ),
                        children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
                            !n.read && /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#BF76FF]" }),
                            /* @__PURE__ */ jsx("span", { className: cn("font-bold block", isDarkMode ? "text-white" : "text-black"), children: n.title })
                          ] }),
                          /* @__PURE__ */ jsx("p", { className: "line-clamp-2", children: n.message })
                        ]
                      },
                      n.id || i
                    )) : /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 text-center py-4", children: "Nenhuma notifica\xE7\xE3o" }) })
                  ]
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-3 pl-2 md:pl-4 md:border-l relative", isDarkMode ? "border-white/10" : "border-black/10"), children: [
            /* @__PURE__ */ jsxs("div", { className: "text-right hidden md:block", children: [
              /* @__PURE__ */ jsx("p", { className: cn("text-sm font-bold transition-colors", isDarkMode ? "text-white" : "text-black"), children: user?.displayName || "Admin" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 grayscale opacity-70", children: formatRoles(profile || { role: currentRole }) })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                },
                className: "relative group cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] p-0.5 shadow-lg shadow-[#BF76FF]/20 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsx("div", { className: cn("w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-colors relative", isDarkMode ? "bg-[#0a0a0a]" : "bg-white"), children: user?.photoURL ? /* @__PURE__ */ jsx("img", { src: user.photoURL, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("span", { className: cn("font-bold text-xs uppercase", isDarkMode ? "text-white" : "text-black"), children: (user?.displayName || "A")[0] }) }) }),
                  /* @__PURE__ */ jsx("div", { className: cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse", isDarkMode ? "border-[#0a0a0a]" : "border-white", getStatusColor(userStatus)) })
                ]
              }
            ),
            /* @__PURE__ */ jsx(AnimatePresence, { children: showProfileMenu && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40", onClick: () => setShowProfileMenu(false) }),
              /* @__PURE__ */ jsxs(
                motion.div,
                {
                  initial: { opacity: 0, y: 10, scale: 0.95 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  exit: { opacity: 0, y: 10, scale: 0.95 },
                  className: cn(
                    "fixed top-20 right-4 w-72 max-w-[calc(100vw-32px)] md:absolute md:top-full md:right-0 md:mt-4 md:w-72 rounded-[28px] border shadow-2xl p-3 z-50",
                    isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"
                  ),
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1 p-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2", children: "Seu Status" }),
                      [
                        { id: "online", label: "Online", color: "bg-green-500" },
                        { id: "ocupado", label: "Ocupado", color: "bg-red-500" },
                        { id: "ausente", label: "Ausente", color: "bg-yellow-500" }
                      ].map((st) => /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => {
                            updatePresenceStatus(st.id);
                            setShowProfileMenu(false);
                          },
                          className: cn(
                            "w-full flex items-center justify-between p-2.5 rounded-xl transition-all",
                            userStatus === st.id ? "bg-[#BF76FF]/10 text-[#BF76FF]" : isDarkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-600 hover:bg-black/5"
                          ),
                          children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                              /* @__PURE__ */ jsx("div", { className: cn("w-2 h-2 rounded-full", st.color) }),
                              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: st.label })
                            ] }),
                            userStatus === st.id && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3" })
                          ]
                        },
                        st.id
                      ))
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "p-1 mt-2 pt-2 border-t border-white/5", children: /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: logout,
                        className: cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-xl text-red-500 transition-all",
                          isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-50/10"
                        ),
                        children: [
                          /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: "Encerrar Sess\xE3o" })
                        ]
                      }
                    ) })
                  ]
                }
              )
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 p-2 md:p-8 pb-32 md:pb-8 overflow-y-auto scroll-smooth scrollbar-hide overscroll-contain touch-pan-y", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto w-full space-y-4 md:space-y-8", children: isEditing ? /* @__PURE__ */ jsx(Card, { className: cn("border-white/5 rounded-3xl p-4 md:p-10 shadow-2xl transition-all", isDarkMode ? "bg-[#111]" : "bg-white border-black/5"), children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        isReadOnly && (activeTab === "agenda" || activeTab === "agenda-direcao" || activeTab === "eventos" || activeTab === "noticias") ? /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            onClick: () => setIsEditing(false),
            className: "pl-0 text-gray-500 hover:text-[#BF76FF] hover:bg-transparent uppercase tracking-[0.2em] text-[10px] font-bold",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
              "Voltar"
            ]
          }
        ) }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center", children: activeTab === "noticias" ? /* @__PURE__ */ jsx(Newspaper, { className: "w-6 h-6 text-[#BF76FF]" }) : /* @__PURE__ */ jsx(Edit, { className: "w-6 h-6 text-[#BF76FF]" }) }),
          /* @__PURE__ */ jsxs("h4", { className: cn("text-2xl md:text-3xl font-black tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black"), children: [
            isReadOnly ? "Visualizar" : selectedItem ? "Editar" : "Nova",
            " ",
            activeTab === "eventos" ? "Evento" : activeTab === "noticias" ? "Mat\xE9ria" : activeTab === "membros" ? "Membro" : activeTab === "agenda-direcao" ? "Compromisso" : "Agenda"
          ] })
        ] }),
        activeTab === "membros" && selectedItem?.status === "pending" && /* @__PURE__ */ jsxs("div", { className: "bg-[#BF76FF]/10 border border-[#BF76FF]/30 rounded-2xl p-6 mb-6", children: [
          /* @__PURE__ */ jsxs("h5", { className: "text-[#BF76FF] font-bold mb-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5" }),
            " Solicita\xE7\xE3o de Cadastro Pendente"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mb-6", children: "Este usu\xE1rio solicitou acesso ao painel. Verifique as informa\xE7\xF5es abaixo e decida se deseja aprovar ou reprovar." }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                className: "flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg",
                onClick: async () => {
                  try {
                    await updateDoc(doc(db, "members", selectedItem.id), { status: "approved" });
                    const msg = `Ol\xE1 ${selectedItem.name}, seu cadastro no painel do Minist\xE9rio Profecia foi APROVADO! Voc\xEA j\xE1 pode acessar usando seu e-mail e a senha padr\xE3o (admin).`;
                    if (selectedItem.phone) {
                      window.open(`https://wa.me/55${selectedItem.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                    }
                    setIsEditing(false);
                    setSelectedItem(null);
                  } catch (e) {
                    handleFirestoreError(e, OperationType.UPDATE, `members/${selectedItem.id}`);
                  }
                },
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 mr-2" }),
                  " Aprovar"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                className: "flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-lg",
                onClick: async () => {
                  let reason = "N\xE3o atende aos requisitos no momento.";
                  try {
                    try {
                      const userReason = window.prompt("Motivo da reprova\xE7\xE3o:");
                      if (userReason === null) return;
                      if (userReason) reason = userReason;
                    } catch (e) {
                    }
                    await updateDoc(doc(db, "members", selectedItem.id), { status: "rejected", rejectReason: reason });
                    const msg = `Ol\xE1 ${selectedItem.name}, seu cadastro no painel do Minist\xE9rio Profecia foi REPROVADO. Motivo: ${reason}`;
                    if (selectedItem.phone) {
                      window.open(`https://wa.me/55${selectedItem.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                    }
                    setIsEditing(false);
                    setSelectedItem(null);
                  } catch (e) {
                    handleFirestoreError(e, OperationType.UPDATE, `members/${selectedItem.id}`);
                  }
                },
                children: [
                  /* @__PURE__ */ jsx(X, { className: "w-5 h-5 mr-2" }),
                  " Reprovar"
                ]
              }
            )
          ] })
        ] }),
        (activeTab === "agenda" || activeTab === "agenda-direcao" || activeTab === "eventos" || activeTab === "noticias") && (isReadOnly ? /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            className: "space-y-10 py-4",
            children: [
              activeTab === "eventos" && formData.image && /* @__PURE__ */ jsxs("div", { className: "relative aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl mb-12", children: [
                /* @__PURE__ */ jsx("img", { src: formData.image, alt: "", className: "w-full h-full object-cover" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-8 left-8", children: /* @__PURE__ */ jsx("span", { className: "bg-primary px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest", children: formData.organization || "Evento" }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-[2px] w-8 bg-[#BF76FF]" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[#BF76FF] font-black uppercase tracking-[0.2em] text-[10px]", children: activeTab === "eventos" ? "Detalhes do Evento" : activeTab === "noticias" ? "Detalhes da Not\xEDcia" : "Agenda da Dire\xE7\xE3o" })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: cn("text-4xl md:text-6xl font-black tracking-tighter transition-colors leading-[0.9]", isDarkMode ? "text-white" : "text-black"), children: formData.title })
              ] }),
              (activeTab === "eventos" || activeTab === "noticias") && formData.content && /* @__PURE__ */ jsxs("div", { className: cn("p-8 md:p-12 rounded-[40px] border transition-all text-lg md:text-xl font-medium leading-relaxed", isDarkMode ? "bg-white/5 border-white/5 text-gray-300" : "bg-white border-black/5 text-gray-700 shadow-sm"), children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1 h-6 bg-primary rounded-full" }),
                  /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase tracking-widest text-gray-500", children: activeTab === "eventos" ? "Sobre o Evento" : "Mat\xE9ria jornal\xEDstica" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: formData.content })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm"), children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[#BF76FF] mb-4" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1", children: "Data" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: cn("text-xl font-black", isDarkMode ? "text-white" : "text-black"), children: (() => {
                    try {
                      if (!formData.date) return "...";
                      if (formData.date.includes("T")) {
                        return format(parseISO(formData.date.split("T")[0]), "dd/MM/yyyy");
                      }
                      return formData.date;
                    } catch (e) {
                      return "...";
                    }
                  })() })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm"), children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-[#BF76FF] mb-4" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1", children: "Hor\xE1rio" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: cn("text-xl font-black", isDarkMode ? "text-white" : "text-black"), children: formData.date && formData.date.includes("T") && formData.date.split("T")[1] ? `${formData.date.split("T")[1].substring(0, 5)}${formData.endTime ? ` \xE0s ${formData.endTime}` : ""}` : "Hor\xE1rio n\xE3o definido" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: cn("p-6 rounded-[32px] border transition-all flex flex-col justify-between min-h-[140px]", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/5 shadow-sm"), children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-[#BF76FF] mb-4" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1", children: "Organiza\xE7\xE3o" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: cn("text-xl font-black truncate", isDarkMode ? "text-white" : "text-black"), children: formData.organization || formData.organizer || "Igreja Local" })
                ] })
              ] }),
              activeTab === "eventos" && formData.gallery && Array.isArray(formData.gallery) && formData.gallery.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-[2px] w-6 bg-primary" }),
                  /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase tracking-widest text-gray-500", children: "Galeria de Fotos" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3", children: formData.gallery.map((url, i) => /* @__PURE__ */ jsx("div", { className: "aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-lg", children: /* @__PURE__ */ jsx("img", { src: url, alt: "", className: "w-full h-full object-cover" }) }, `gallery-preview-${url}-${i}`)) })
              ] }),
              formData.location && /* @__PURE__ */ jsxs("div", { className: cn("p-8 md:p-10 rounded-[40px] border relative overflow-hidden group transition-all", isDarkMode ? "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/5" : "bg-gradient-to-br from-gray-50 to-white border-black/5 shadow-inner"), children: [
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-green-500 animate-pulse" }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Localiza\xE7\xE3o do Evento" })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: cn("text-xl md:text-3xl font-black max-w-xl leading-tight tracking-tight", isDarkMode ? "text-white" : "text-black"), children: formData.location })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    Button,
                    {
                      onClick: () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`, "_blank"),
                      className: "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-full h-16 md:h-20 px-8 md:px-12 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 shadow-2xl shadow-[#BF76FF]/40 transition-all hover:scale-105 active:scale-95",
                      children: [
                        "Abrir no GPS ",
                        /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-80 h-80 bg-[#BF76FF]/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-[#BF76FF]/3 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" })
              ] }),
              formData.invitedMembers?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-8 py-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                  /* @__PURE__ */ jsx("h5", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] whitespace-nowrap", children: "Quem estar\xE1 presente" }),
                  /* @__PURE__ */ jsx("div", { className: cn("h-[1px] flex-1", isDarkMode ? "bg-white/5" : "bg-black/5") })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-x-8 gap-y-10", children: formData.invitedMembers.map((m) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4 group", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx("div", { className: cn("w-24 h-24 md:w-28 md:h-28 rounded-[2rem] border-2 border-white/5 p-1.5 transition-all duration-500 group-hover:border-[#BF76FF] group-hover:rotate-6 rotate-[-3deg]", isDarkMode ? "bg-white/5" : "bg-black/5"), children: /* @__PURE__ */ jsx("div", { className: "w-full h-full rounded-[1.6rem] bg-gray-200 overflow-hidden shadow-2xl border border-white/10", children: m.photo ? /* @__PURE__ */ jsx("img", { src: m.photo, alt: m.name, className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", referrerPolicy: "no-referrer" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center bg-gray-100 text-gray-400", children: /* @__PURE__ */ jsx(Users, { className: "w-10 h-10" }) }) }) }),
                    /* @__PURE__ */ jsx("div", { className: cn("absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-4 z-10 hidden md:block", isDarkMode ? "border-[#111]" : "border-white") })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-center space-y-0.5", children: /* @__PURE__ */ jsx("p", { className: cn("text-[11px] font-black uppercase tracking-[0.15em] transition-colors", isDarkMode ? "text-white group-hover:text-[#BF76FF]" : "text-black"), children: m.name }) })
                ] }, m.id)) })
              ] }),
              (formData.additionalInfo || formData.observations) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 pt-12 border-t border-white/5", children: [
                formData.additionalInfo && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1 h-1 rounded-full bg-[#BF76FF]" }),
                    /* @__PURE__ */ jsx("h6", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]", children: "Contatos e Infos" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: cn("p-8 rounded-[32px] text-sm leading-relaxed font-medium md:min-h-[160px]", isDarkMode ? "bg-white/5 text-gray-400" : "bg-gray-50 text-gray-600 shadow-sm"), children: formData.additionalInfo })
                ] }),
                formData.observations && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1 h-1 rounded-full bg-[#BF76FF]" }),
                    /* @__PURE__ */ jsx("h6", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]", children: "Observa\xE7\xF5es Importantes (Dashboard)" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: cn("p-8 rounded-[32px] text-sm leading-relaxed italic md:min-h-[160px] border border-dashed border-[#BF76FF]/20", isDarkMode ? "bg-[#BF76FF]/5 text-[#BF76FF]/80" : "bg-purple-50 text-[#BF76FF]"), children: [
                    '"',
                    formData.observations,
                    '"'
                  ] })
                ] })
              ] })
            ]
          }
        ) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          activeTab === "eventos" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "URL da Imagem de Capa (Evento)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: "https://exemplo.com/banner.jpg",
                  value: formData.image || "",
                  onChange: (e) => setFormData({ ...formData, image: e.target.value }),
                  readOnly: isReadOnly
                }
              ),
              formData.image && /* @__PURE__ */ jsx("div", { className: "mt-2 relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/20", children: /* @__PURE__ */ jsx("img", { src: formData.image, alt: "Preview", className: "w-full h-full object-cover" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "URL da Moldura (Criar Foto)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: "https://exemplo.com/moldura.png",
                  value: formData.frameUrl || "",
                  onChange: (e) => setFormData({ ...formData, frameUrl: e.target.value }),
                  readOnly: isReadOnly
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 mt-1 ml-2", children: 'URL da imagem para a fun\xE7\xE3o "Criar Minha Foto" (Ex: imagem com fundo transparente)' })
            ] })
          ] }),
          activeTab === "noticias" && /* @__PURE__ */ jsx("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-[32px] bg-primary/5 border border-primary/10", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-black uppercase tracking-widest text-[#BF76FF] mb-6 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[#BF76FF] animate-pulse" }),
              "Estrutura Jornal\xEDstica"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2", children: "T\xEDtulo da Mat\xE9ria" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: cn("border-none h-16 rounded-2xl px-6 text-xl font-black transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-white text-black shadow-sm border-black/5"),
                    placeholder: "T\xEDtulo impactante da not\xEDcia...",
                    value: formData.title || "",
                    onChange: (e) => setFormData({ ...formData, title: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2", children: "Subt\xEDtulo / Gravata" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    className: cn("border-none min-h-[80px] rounded-2xl p-6 transition-colors font-medium", isDarkMode ? "bg-white/5 text-gray-300" : "bg-white text-gray-700 shadow-sm border-black/5"),
                    placeholder: "Um resumo breve que aparece logo abaixo do t\xEDtulo",
                    value: formData.subtitle || "",
                    onChange: (e) => setFormData({ ...formData, subtitle: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2", children: "Fonte da Mat\xE9ria" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-white text-black shadow-sm border-black/5"),
                    placeholder: "Ex: Reda\xE7\xE3o Minist\xE9rio Profecia, G1, Gospel Prime...",
                    value: formData.source || "",
                    onChange: (e) => setFormData({ ...formData, source: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "py-4 border-y border-white/5 space-y-4", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2", children: "Previs\xE3o de Compartilhamento" }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 fill-current" }) }),
                    "WhatsApp"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-2xl bg-[#E1306C]/10 text-[#E1306C] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white", children: /* @__PURE__ */ jsx(Instagram, { className: "w-4 h-4" }) }),
                    "Instagram"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white", children: /* @__PURE__ */ jsx(Facebook, { className: "w-4 h-4 fill-current" }) }),
                    "Facebook"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-2xl bg-white/5 text-gray-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white", children: /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }) }),
                    "Geral"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between ml-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest", children: "V\xEDdeo de Destaque" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20", children: "YouTube" }),
                    /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-[8px] font-black uppercase tracking-widest border border-purple-500/20", children: "Instagram" }),
                    /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20", children: "Shorts" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: cn("border-none h-12 rounded-2xl px-6 transition-colors italic", isDarkMode ? "bg-white/5 text-white" : "bg-white text-black shadow-sm border-black/5"),
                    placeholder: "Cole o link (YouTube, Instagram ou Shorts)...",
                    value: formData.videoUrl || "",
                    onChange: (e) => setFormData({ ...formData, videoUrl: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-white/5", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2", children: "URL da Imagem Capa" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-white text-black shadow-sm border-black/5"),
                        placeholder: "https://exemplo.com/cafe.jpg",
                        value: formData.image || "",
                        onChange: (e) => setFormData({ ...formData, image: e.target.value })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2", children: "Legenda da Imagem" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-white text-black shadow-sm border-black/5"),
                        placeholder: "Descreva a foto (Ex: Fiel orando no monte)",
                        value: formData.imageCaption || "",
                        onChange: (e) => setFormData({ ...formData, imageCaption: e.target.value })
                      }
                    )
                  ] })
                ] }),
                formData.image && /* @__PURE__ */ jsxs("div", { className: "relative aspect-video rounded-[32px] overflow-hidden border border-white/10 group", children: [
                  /* @__PURE__ */ jsx("img", { src: formData.image, className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105", alt: "" }),
                  /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-white/80 italic", children: formData.imageCaption || "Sem legenda" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 ml-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1 h-3 bg-[#BF76FF] rounded-full" }),
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest", children: "Corpo da Mat\xE9ria (Texto Principal)" })
                ] }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    className: cn("border-none min-h-[300px] rounded-[32px] p-8 transition-colors text-lg leading-relaxed scrollbar-thin", isDarkMode ? "bg-white/5 text-gray-200" : "bg-white text-gray-800 shadow-xl border-black/5"),
                    placeholder: "Escreva aqui a reportagem completa. Use par\xE1grafos para melhor leitura.",
                    value: formData.content || "",
                    onChange: (e) => setFormData({ ...formData, content: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-6 pt-6 border-t border-white/5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between ml-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-gray-500 uppercase tracking-widest", children: "Galeria / Fotos Enviadas" }),
                  !isReadOnly && /* @__PURE__ */ jsxs(
                    Button,
                    {
                      type: "button",
                      onClick: () => {
                        const currentGallery = typeof formData.gallery === "string" ? formData.gallery.split("\n").filter((l) => l.trim()) : Array.isArray(formData.gallery) ? formData.gallery : [];
                        setFormData({ ...formData, gallery: [...currentGallery, ""].join("\n") });
                      },
                      className: "h-8 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white transition-all text-[10px] font-black uppercase px-4",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 mr-2" }),
                        " Adicionar Foto"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [
                  (() => {
                    const urls = typeof formData.gallery === "string" ? formData.gallery.split("\n") : Array.isArray(formData.gallery) ? formData.gallery : [];
                    const displayUrls = typeof formData.gallery === "string" ? formData.gallery.split("\n") : Array.isArray(formData.gallery) ? formData.gallery : [];
                    return displayUrls.map((url, i) => /* @__PURE__ */ jsxs("div", { className: cn("p-4 rounded-3xl border transition-all space-y-3 relative group", isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-black/5 shadow-sm"), children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                          /* @__PURE__ */ jsx(ImageIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" }),
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              className: cn("border-none h-10 rounded-xl pl-10 pr-4 text-[10px] transition-all", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black"),
                              placeholder: "URL da imagem...",
                              value: url.trim(),
                              onChange: (e) => {
                                const newGallery = [...displayUrls];
                                newGallery[i] = e.target.value;
                                setFormData({ ...formData, gallery: newGallery.join("\n") });
                              },
                              readOnly: isReadOnly
                            }
                          )
                        ] }),
                        !isReadOnly && /* @__PURE__ */ jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            className: "w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0",
                            onClick: () => {
                              const newGallery = displayUrls.filter((_, idx) => idx !== i);
                              setFormData({ ...formData, gallery: newGallery.join("\n") });
                            },
                            children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                          }
                        )
                      ] }),
                      url.trim() && /* @__PURE__ */ jsx("div", { className: "relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/20 group-hover:scale-[1.02] transition-transform duration-300", children: /* @__PURE__ */ jsx("img", { src: url.trim(), alt: "", className: "w-full h-full object-cover", onError: (e) => e.currentTarget.style.display = "none" }) })
                    ] }, `form-gallery-noticia-${i}`));
                  })(),
                  (!formData.gallery || typeof formData.gallery === "string" && formData.gallery.trim() === "" || Array.isArray(formData.gallery) && formData.gallery.length === 0) && /* @__PURE__ */ jsxs("div", { className: cn("col-span-full py-12 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center text-gray-500 gap-3 opacity-50", isDarkMode ? "border-white/10" : "border-black/10"), children: [
                    /* @__PURE__ */ jsx(ImageIcon, { className: "w-10 h-10 opacity-20" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-center", children: "Nenhuma foto enviada" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-[24px] bg-white/5 border border-white/5", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4", children: "Se\xE7\xE3o: \xDAltimas Not\xEDcias" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-3 opacity-40 grayscale", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-gray-500 shrink-0" }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1 flex-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-gray-500 rounded" }),
                      /* @__PURE__ */ jsx("div", { className: "h-2 w-2/3 bg-gray-500 rounded" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-4 text-[9px] text-gray-500 italic text-center", children: "Ativado automaticamente para novos posts" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-[24px] bg-white/5 border border-white/5", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4", children: "Se\xE7\xE3o: Mat\xE9rias Relacionadas" }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 opacity-40 grayscale", children: [
                    /* @__PURE__ */ jsx("div", { className: "aspect-square bg-gray-500 rounded-lg" }),
                    /* @__PURE__ */ jsx("div", { className: "aspect-square bg-gray-500 rounded-lg" }),
                    /* @__PURE__ */ jsx("div", { className: "aspect-square bg-gray-500 rounded-lg" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-4 text-[9px] text-gray-500 italic text-center", children: "Calculado por similaridade de conte\xFAdo" })
                ] })
              ] })
            ] })
          ] }) }),
          activeTab !== "noticias" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: activeTab === "eventos" ? "T\xEDtulo da Postagem" : "T\xEDtulo do Compromisso" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: activeTab === "eventos" ? "Ex: Confer\xEAncia de Jovens 2024" : "Ex: Visitar igreja no Grama",
                  value: formData.title || "",
                  onChange: (e) => setFormData({ ...formData, title: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] }),
            activeTab === "eventos" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Bio/Descri\xE7\xE3o do Evento" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  className: cn("border-none min-h-[150px] rounded-2xl p-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: "Conte mais sobre o evento...",
                  value: formData.content || "",
                  onChange: (e) => setFormData({ ...formData, content: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Data e Hor\xE1rio" }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 ml-2 uppercase font-bold", children: "Data" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        type: "date",
                        className: cn("border-none h-14 rounded-2xl px-6 transition-colors w-full", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                        value: typeof formData.date === "string" ? formData.date.split("T")[0] : "",
                        onChange: (e) => {
                          const time = typeof formData.date === "string" && formData.date.includes("T") ? formData.date.split("T")[1] : "";
                          setFormData({ ...formData, date: time ? `${e.target.value}T${time}` : e.target.value });
                        },
                        readOnly: isReadOnly
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 ml-2 uppercase font-bold", children: "In\xEDcio" }),
                    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsx(Clock, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF76FF] z-10" }),
                      /* @__PURE__ */ jsx(
                        Input,
                        {
                          type: "time",
                          className: cn("border-none h-14 rounded-2xl pl-10 pr-4 transition-colors w-full", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                          value: typeof formData.date === "string" && formData.date.includes("T") ? formData.date.split("T")[1]?.substring(0, 5) : "",
                          onChange: (e) => {
                            const date = typeof formData.date === "string" ? formData.date.split("T")[0] : format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
                            setFormData({ ...formData, date: `${date}T${e.target.value}` });
                          },
                          readOnly: isReadOnly
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 ml-2 uppercase font-bold", children: "T\xE9rmino" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        type: "time",
                        className: cn("border-none h-14 rounded-2xl px-6 transition-colors w-full", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                        value: formData.endTime || "",
                        onChange: (e) => setFormData({ ...formData, endTime: e.target.value }),
                        readOnly: isReadOnly
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-[#BF76FF] uppercase tracking-widest", children: "Nome do Organizador / Igreja Local" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: cn("border-none h-14 rounded-2xl px-6 transition-colors shadow-sm", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                    placeholder: "Ex: Pr. Fernando ou Igreja Batista...",
                    value: formData.organizer || formData.organization || "",
                    onChange: (e) => setFormData({ ...formData, organizer: e.target.value, organization: e.target.value }),
                    readOnly: isReadOnly
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-[#BF76FF] uppercase tracking-widest", children: "Foto do Organizador (URL)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    className: cn("border-none h-14 rounded-2xl px-6 transition-colors shadow-sm", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                    placeholder: "URL da foto do organizador (Convener)",
                    value: formData.organizerImage || "",
                    onChange: (e) => setFormData({ ...formData, organizerImage: e.target.value }),
                    readOnly: isReadOnly
                  }
                ),
                formData.organizerImage && /* @__PURE__ */ jsx("div", { className: "mt-2 w-16 h-16 overflow-hidden rounded-xl border border-white/5", children: /* @__PURE__ */ jsx("img", { src: formData.organizerImage, alt: "Preview", className: "w-full h-full object-cover" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4 p-6 rounded-2xl border border-[#BF76FF]/20 bg-[#BF76FF]/5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Deve convidar a igreja?" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400", children: "Marque se os membros devem ser informados/convidados" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex bg-black/10 dark:bg-white/5 p-1 rounded-xl", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      disabled: isReadOnly,
                      onClick: () => setFormData({ ...formData, inviteChurch: false, invitedMembers: [] }),
                      className: cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", !formData.inviteChurch ? "bg-red-500 text-white shadow-lg" : "text-gray-500"),
                      children: "N\xE3o"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      disabled: isReadOnly,
                      onClick: () => setFormData({ ...formData, inviteChurch: true }),
                      className: cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", formData.inviteChurch ? "bg-green-500 text-white shadow-lg" : "text-gray-500"),
                      children: "Sim"
                    }
                  )
                ] })
              ] }),
              formData.inviteChurch && /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-[#BF76FF]/10 animate-in fade-in slide-in-from-top-2 duration-300", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => setIsMemberSelectorOpen(true),
                    className: cn("w-full border-dashed border-2 py-8 rounded-2xl flex flex-col gap-2 transition-all", isDarkMode ? "border-white/10 hover:border-[#BF76FF] bg-white/5" : "border-black/10 hover:border-[#BF76FF] bg-black/5"),
                    disabled: isReadOnly,
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "w-6 h-6 text-[#BF76FF]" }),
                      /* @__PURE__ */ jsx("span", { className: cn("text-xs font-bold", isDarkMode ? "text-white" : "text-black"), children: formData.invitedMembers?.length > 0 ? `${formData.invitedMembers.length} membros espec\xEDficos convidados` : "Convidar membros espec\xEDficos" })
                    ]
                  }
                ),
                formData.invitedMembers?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 px-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2", children: "Membros selecionados:" }),
                  /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: (formData.invitedMembers || []).map((m) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-[#BF76FF]/10 px-3 py-1.5 rounded-full border border-[#BF76FF]/20 group relative", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-5 h-5 rounded-full bg-gray-200 overflow-hidden shrink-0", children: m.photo ? /* @__PURE__ */ jsx("img", { src: m.photo, alt: "", className: "w-full h-full object-cover", referrerPolicy: "no-referrer" }) : /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 m-1 text-gray-500" }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-[#BF76FF]", children: m.name }),
                    !isReadOnly && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const filtered = formData.invitedMembers.filter((item) => item.id !== m.id);
                          setFormData({ ...formData, invitedMembers: filtered });
                        },
                        className: "w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1",
                        children: /* @__PURE__ */ jsx(X, { className: "w-2 h-2" })
                      }
                    )
                  ] }, m.id)) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("label", { className: cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500"), children: "Endere\xE7o do Local" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Rua / Logradouro" }),
                  /* @__PURE__ */ jsx("div", { className: "relative group", children: /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                      placeholder: "Ex: Rua das Flores",
                      value: formData.street || "",
                      onChange: (e) => setFormData({ ...formData, street: e.target.value }),
                      readOnly: isReadOnly
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "N\xFAmero" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                      placeholder: "123 ou S/N",
                      value: formData.streetNumber || "",
                      onChange: (e) => setFormData({ ...formData, streetNumber: e.target.value }),
                      readOnly: isReadOnly
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Bairro" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                      placeholder: "Bairro",
                      value: formData.neighborhood || "",
                      onChange: (e) => setFormData({ ...formData, neighborhood: e.target.value }),
                      readOnly: isReadOnly
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Cidade" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                      placeholder: "Cidade",
                      value: formData.city || "",
                      onChange: (e) => setFormData({ ...formData, city: e.target.value }),
                      readOnly: isReadOnly
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Estado (UF)" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-12 rounded-2xl px-6 transition-colors uppercase", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                      placeholder: "UF",
                      maxLength: 2,
                      value: formData.state || "",
                      onChange: (e) => setFormData({ ...formData, state: e.target.value.toUpperCase() }),
                      readOnly: isReadOnly
                    }
                  )
                ] })
              ] }),
              !formData.street && formData.location && /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-amber-500 font-bold", children: [
                "Endere\xE7o legado: ",
                formData.location
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-[32px] border border-white/5", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxs("label", { className: "text-xs font-black text-[#BF76FF] uppercase tracking-[0.2em] flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1 h-3 bg-[#BF76FF] rounded-full" }),
                  "Contatos & Informa\xE7\xF5es"
                ] }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    className: cn("border-none min-h-[120px] rounded-2xl p-6 transition-all shadow-inner", isDarkMode ? "bg-black/40 text-white focus:bg-black/60" : "bg-white text-black"),
                    placeholder: "Informa\xE7\xF5es de contato e detalhes adicionais...",
                    value: formData.additionalInfo || "",
                    onChange: (e) => setFormData({ ...formData, additionalInfo: e.target.value }),
                    readOnly: isReadOnly
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxs("label", { className: "text-xs font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1 h-3 bg-amber-500 rounded-full" }),
                  "Observa\xE7\xF5es Importantes"
                ] }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    className: cn("border-none min-h-[120px] rounded-2xl p-6 transition-all shadow-inner", isDarkMode ? "bg-amber-500/5 text-amber-200 focus:bg-amber-500/10" : "bg-amber-50 text-amber-900"),
                    placeholder: "Observa\xE7\xF5es importantes para a equipe...",
                    value: formData.observations || "",
                    onChange: (e) => setFormData({ ...formData, observations: e.target.value }),
                    readOnly: isReadOnly
                  }
                )
              ] })
            ] }),
            activeTab === "eventos" && /* @__PURE__ */ jsxs("div", { className: "space-y-6 pt-6 border-t border-white/5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Convidados / Palestrantes" }),
                !isReadOnly && /* @__PURE__ */ jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: () => {
                      const current = Array.isArray(formData.guests) ? formData.guests : [];
                      setFormData({ ...formData, guests: [...current, { name: "", image: "", role: "" }] });
                    },
                    className: "h-8 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white transition-all text-[10px] font-black uppercase px-4",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 mr-2" }),
                      " Adicionar Convidado"
                    ]
                  }
                )
              ] }),
              formData.guests && Array.isArray(formData.guests) && formData.guests.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-4", children: formData.guests.map((guest, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4 p-4 rounded-b-2xl rounded-t-lg bg-black/10 dark:bg-white/5 border border-white/5 relative group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsx(
                      Input,
                      {
                        className: cn("border-none h-12 rounded-xl px-4 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-white text-black"),
                        placeholder: "Nome (Ex: Pr. Fernando)",
                        value: guest.name || "",
                        onChange: (e) => {
                          const newGuests = [...formData.guests];
                          newGuests[i].name = e.target.value;
                          setFormData({ ...formData, guests: newGuests });
                        },
                        readOnly: isReadOnly
                      }
                    ) }),
                    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsx(
                      Input,
                      {
                        className: cn("border-none h-12 rounded-xl px-4 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-white text-black"),
                        placeholder: "Fun\xE7\xE3o (Ex: Convener)",
                        value: guest.role || "",
                        onChange: (e) => {
                          const newGuests = [...formData.guests];
                          newGuests[i].role = e.target.value;
                          setFormData({ ...formData, guests: newGuests });
                        },
                        readOnly: isReadOnly
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-12 rounded-xl px-4 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-white text-black"),
                      placeholder: "URL da Foto do Convidado",
                      value: guest.image || "",
                      onChange: (e) => {
                        const newGuests = [...formData.guests];
                        newGuests[i].image = e.target.value;
                        setFormData({ ...formData, guests: newGuests });
                      },
                      readOnly: isReadOnly
                    }
                  ) }),
                  guest.image && /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20", children: /* @__PURE__ */ jsx("img", { src: guest.image, alt: guest.name, className: "w-full h-full object-cover" }) })
                ] }),
                !isReadOnly && /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    className: "absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity p-0 flex items-center justify-center shrink-0",
                    onClick: () => {
                      const newGuests = formData.guests.filter((_, idx) => idx !== i);
                      setFormData({ ...formData, guests: newGuests });
                    },
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                  }
                )
              ] }, `guest-form-${guest.name || "new"}-${i}`)) })
            ] }),
            activeTab === "eventos" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 pt-6 border-t border-white/5", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Link do V\xEDdeo do YouTube" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(Youtube, { className: "absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      className: cn("border-none h-14 rounded-full pl-14 pr-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                      placeholder: "https://www.youtube.com/watch?v=...",
                      value: formData.youtubeLink || "",
                      onChange: (e) => setFormData({ ...formData, youtubeLink: e.target.value }),
                      readOnly: isReadOnly
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Galeria de Fotos" }),
                  !isReadOnly && /* @__PURE__ */ jsxs(
                    Button,
                    {
                      type: "button",
                      onClick: () => {
                        const current = Array.isArray(formData.gallery) ? formData.gallery : [];
                        setFormData({ ...formData, gallery: [...current, ""] });
                      },
                      className: "h-8 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white transition-all text-[10px] font-black uppercase px-4",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 mr-2" }),
                        " Adicionar Foto"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [
                  (Array.isArray(formData.gallery) ? formData.gallery : []).map((url, i) => /* @__PURE__ */ jsxs("div", { className: cn("p-4 rounded-3xl border transition-all space-y-3 relative group", isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-black/5 shadow-sm"), children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                        /* @__PURE__ */ jsx(ImageIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" }),
                        /* @__PURE__ */ jsx(
                          Input,
                          {
                            className: cn("border-none h-10 rounded-xl pl-10 pr-4 text-[10px] transition-all", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black"),
                            placeholder: "URL da imagem...",
                            value: url,
                            onChange: (e) => {
                              const newGallery = [...formData.gallery];
                              newGallery[i] = e.target.value;
                              setFormData({ ...formData, gallery: newGallery });
                            },
                            readOnly: isReadOnly
                          }
                        )
                      ] }),
                      !isReadOnly && /* @__PURE__ */ jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          className: "w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0",
                          onClick: () => {
                            const newGallery = formData.gallery.filter((_, idx) => idx !== i);
                            setFormData({ ...formData, gallery: newGallery });
                          },
                          children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                        }
                      )
                    ] }),
                    url && /* @__PURE__ */ jsx("div", { className: "relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/20 group-hover:scale-[1.02] transition-transform duration-300", children: /* @__PURE__ */ jsx("img", { src: url, alt: "", className: "w-full h-full object-cover", onError: (e) => e.currentTarget.style.display = "none" }) })
                  ] }, `gallery-form-${i}`)),
                  (Array.isArray(formData.gallery) ? formData.gallery : []).length === 0 && /* @__PURE__ */ jsxs("div", { className: cn("col-span-full py-12 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center text-gray-500 gap-3 opacity-50", isDarkMode ? "border-white/10" : "border-black/10"), children: [
                    /* @__PURE__ */ jsx(ImageIcon, { className: "w-10 h-10 opacity-20" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-center", children: "Cole o link de uma imagem para ver a miniatura" })
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }) })),
        activeTab === "membros" && /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Foto de Perfil (URL)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: "https://exemplo.com/foto.jpg",
                  value: formData.photoURL || "",
                  onChange: (e) => setFormData({ ...formData, photoURL: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Foto de Capa (URL)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: "https://exemplo.com/capa.jpg",
                  value: formData.coverImage || "",
                  onChange: (e) => setFormData({ ...formData, coverImage: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Nome" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  value: formData.name || "",
                  onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "E-mail" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  value: formData.email || "",
                  onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "WhatsApp (com DDD)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  placeholder: "11999999999",
                  value: formData.phone || "",
                  onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Data de Nascimento" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "date",
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  value: formData.birthDate || "",
                  onChange: (e) => setFormData({ ...formData, birthDate: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Data que se tornou membro" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "date",
                  className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                  value: formData.joinedDate || "",
                  onChange: (e) => setFormData({ ...formData, joinedDate: e.target.value }),
                  readOnly: isReadOnly
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest block", children: "Minist\xE9rios e Cargos" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: allRoles.map((role) => {
              const ministry = (formData.ministries || []).find((m) => (typeof m === "string" ? m : m.name) === role);
              const isSelected = !!ministry;
              const isLeader = typeof ministry === "object" ? ministry.isLeader : false;
              return /* @__PURE__ */ jsxs("div", { className: cn("p-4 rounded-2xl border flex items-center justify-between transition-all", isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-black/5"), children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isSelected,
                      disabled: isReadOnly,
                      onChange: (e) => {
                        const currentMinistries = formData.ministries || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            ministries: [...currentMinistries, { name: role, isLeader: false }]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            ministries: currentMinistries.filter((m) => (typeof m === "string" ? m : m.name) !== role)
                          });
                        }
                      },
                      className: "w-5 h-5 rounded border-gray-300 text-[#BF76FF] focus:ring-[#BF76FF] cursor-pointer"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: cn("text-sm font-bold", isDarkMode ? "text-white" : "text-black"), children: role })
                ] }),
                isSelected && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      id: `leader-${role}`,
                      checked: isLeader,
                      disabled: isReadOnly,
                      onChange: (e) => {
                        const currentMinistries = formData.ministries || [];
                        setFormData({
                          ...formData,
                          ministries: currentMinistries.map(
                            (m) => (typeof m === "string" ? m : m.name) === role ? { name: role, isLeader: e.target.checked } : m
                          )
                        });
                      },
                      className: "w-4 h-4 rounded border-gray-300 text-[#BF76FF] focus:ring-[#BF76FF] cursor-pointer"
                    }
                  ),
                  /* @__PURE__ */ jsx("label", { htmlFor: `leader-${role}`, className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer", children: "L\xEDder" })
                ] })
              ] }, `role-selection-${role}`);
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest block", children: "Habilidades" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: availableSkills.map((skill) => {
              const isSelected = (formData.skills || []).includes(skill);
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  disabled: isReadOnly,
                  onClick: () => {
                    const currentSkills = formData.skills || [];
                    if (isSelected) {
                      setFormData({ ...formData, skills: currentSkills.filter((s) => s !== skill) });
                    } else {
                      setFormData({ ...formData, skills: [...currentSkills, skill] });
                    }
                  },
                  className: cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    isSelected ? "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white shadow-lg shadow-[#7300FF]/20" : isDarkMode ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  ),
                  children: skill
                },
                skill
              );
            }) }),
            isMasterAdmin && !isReadOnly && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-4 max-w-xs", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "Nova habilidade...",
                  className: cn("border-none h-10 rounded-xl px-4 text-xs transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black"),
                  value: newSkillName,
                  onChange: (e) => setNewSkillName(e.target.value)
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  onClick: async () => {
                    if (!newSkillName.trim()) return;
                    if (availableSkills.includes(newSkillName.trim())) {
                      return;
                    }
                    const newList = [...availableSkills, newSkillName.trim()];
                    try {
                      try {
                        await setDoc(doc(db, "settings", "skills"), { list: newList });
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, "settings/skills");
                      }
                      setNewSkillName("");
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, "settings/skills");
                    }
                  },
                  className: "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white rounded-xl font-bold h-10",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-1" }),
                    " Add"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Sobre o Membro (Bio)" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                className: cn("border-none min-h-[120px] rounded-2xl p-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                placeholder: "Fale um pouco sobre a jornada, dons e minist\xE9rios do membro...",
                value: formData.bio || "",
                onChange: (e) => setFormData({ ...formData, bio: e.target.value }),
                readOnly: isReadOnly
              }
            )
          ] })
        ] }),
        activeTab === "radio" && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "T\xEDtulo da Vinheta" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                placeholder: "Ex: Identidade Profecia, Chamada de Culto...",
                value: formData.title || "",
                onChange: (e) => setFormData({ ...formData, title: e.target.value }),
                readOnly: isReadOnly
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Link do YouTube (Vinheta)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                className: cn("border-none h-14 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-black"),
                placeholder: "Cole o link do YouTube aqui...",
                value: formData.youtubeUrl || "",
                onChange: (e) => {
                  const url = e.target.value;
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                  const match = url.match(regExp);
                  const videoId = match && match[2].length === 11 ? match[2] : null;
                  setFormData({
                    ...formData,
                    youtubeUrl: url,
                    videoId: videoId || "",
                    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ""
                  });
                },
                readOnly: isReadOnly
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5 items-stretch sm:items-center", children: [
          isReadOnly && (activeTab === "agenda" || activeTab === "agenda-direcao" || activeTab === "eventos") ? /* @__PURE__ */ jsxs(Fragment, { children: [
            currentRole !== "Dire\xE7\xE3o" && activeTab === "agenda-direcao" && /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: cn("w-full sm:w-auto rounded-2xl h-12 px-8 font-bold border-none transition-all", isDarkMode ? "bg-white/5 text-white hover:bg-[#BF76FF] hover:text-white" : "bg-gray-100 text-black hover:bg-[#BF76FF] hover:text-white"),
                onClick: () => setIsReadOnly(false),
                children: [
                  /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 mr-2" }),
                  " Editar Compromisso"
                ]
              }
            ),
            activeTab === "agenda-direcao" && (canDelete || selectedItem?.authorId === user?.uid) && /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                className: "w-full sm:w-auto text-red-500 hover:bg-red-500/10 rounded-2xl h-12 px-8 font-bold cursor-pointer transition-all",
                onClick: () => {
                  if (selectedItem) {
                    handleDelete(selectedItem.id, "agenda-direcao");
                    setIsEditing(false);
                  }
                },
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                  " Remover da Agenda"
                ]
              }
            ),
            activeTab === "eventos" && canEdit && /* @__PURE__ */ jsxs(
              Button,
              {
                className: "w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer",
                onClick: () => setIsReadOnly(false),
                children: [
                  /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 mr-2" }),
                  " Editar Evento"
                ]
              }
            )
          ] }) : !isReadOnly && /* @__PURE__ */ jsxs(
            Button,
            {
              className: "w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-12 px-10 font-bold cursor-pointer disabled:opacity-50 order-1 sm:order-2 sm:ml-auto",
              onClick: handleSave,
              disabled: isSubmitting,
              children: [
                /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
                " ",
                isSubmitting ? "Salvando..." : activeTab === "agenda-direcao" ? "Salvar Compromisso" : "Salvar"
              ]
            }
          ),
          !(isReadOnly && activeTab === "agenda-direcao") && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              className: cn(
                "w-full sm:w-auto rounded-2xl h-12 px-8 text-gray-400 cursor-pointer order-2 sm:order-3",
                isReadOnly && "sm:ml-auto"
              ),
              onClick: () => setIsEditing(false),
              children: isReadOnly ? "Voltar" : "Cancelar"
            }
          ),
          selectedItem && !isReadOnly && (canDelete || selectedItem.authorId === user?.uid) && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              className: "w-full sm:w-auto text-red-500 hover:bg-red-500/10 rounded-2xl h-12 px-6 cursor-pointer order-3 sm:order-1",
              onClick: () => {
                const col = selectedItem.type === "post" ? "posts" : selectedItem.type === "agenda" ? "agenda" : activeTab === "eventos" ? "posts" : activeTab === "membros" ? "members" : "agenda";
                handleDelete(selectedItem.id, col);
              },
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                " Excluir"
              ]
            }
          )
        ] })
      ] }) }) : activeTab === "membros" && !isEditing ? /* @__PURE__ */ jsx("div", { className: "space-y-6", children: viewingMember ? /* @__PURE__ */ jsx(
        MemberProfile,
        {
          member: viewingMember,
          isDark: isDarkMode,
          notifications,
          onBack: () => setViewingMember(null),
          onEdit: canEditProfiles || viewingMember.email === user?.email ? () => {
            setSelectedItem(viewingMember);
            setFormData(viewingMember);
            setIsReadOnly(false);
            setIsEditing(true);
            setViewingMember(null);
          } : void 0,
          onChat: () => {
            setViewingMember(null);
            setRightSidebarView("chat-active");
            setActiveChatUser(viewingMember);
          }
        }
      ) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("h2", { className: cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black"), children: showPending ? "Solicita\xE7\xF5es de Cadastro" : "Membros da Equipe" }),
            (isMasterAdmin || profile?.role === "Desenvolvedor") && pendingMembers.length > 0 && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setShowPending(!showPending),
                className: cn(
                  "text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer",
                  showPending ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" : isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                ),
                children: [
                  showPending ? "Ver Membros Ativos" : "Solicita\xE7\xF5es",
                  !showPending && /* @__PURE__ */ jsx("span", { className: "bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black", children: pendingMembers.length })
                ]
              }
            )
          ] }),
          !showPending && canEditProfiles && /* @__PURE__ */ jsxs(
            Button,
            {
              className: "w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-11 px-6 font-bold truncate",
              onClick: () => {
                setSelectedItem(null);
                setFormData({});
                setIsReadOnly(false);
                setIsEditing(true);
              },
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2 shrink-0" }),
                " Novo Membro"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
          activeMembersForDisplay.map((member, i) => /* @__PURE__ */ jsx("div", { className: cn("p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5 shadow-sm"), children: /* @__PURE__ */ jsx(
            TeamMember,
            {
              member,
              active: member.email === user?.email,
              onWhatsApp: () => openWhatsApp(member),
              onViewProfile: () => {
                setViewingMember(member);
              },
              onEditProfile: canEditProfiles || member.email === user?.email ? () => {
                setSelectedItem(member);
                setFormData(member);
                setIsReadOnly(false);
                setIsEditing(true);
                setViewingMember(null);
              } : void 0,
              onDelete: canDelete || member.email === user?.email ? () => handleDelete(member.id, "members") : void 0,
              isDark: isDarkMode,
              isAdmin: isMasterAdmin || profile?.role === "Desenvolvedor"
            },
            member.id || i
          ) }, member.id || i)),
          activeMembersForDisplay.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full text-center py-12 text-gray-500", children: showPending ? "Nenhuma solicita\xE7\xE3o de cadastro pendente." : "Nenhum membro ativo encontrado." })
        ] })
      ] }) }) : activeTab === "radio" ? /* @__PURE__ */ jsxs("div", { className: "space-y-6 pb-32", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", children: [
          /* @__PURE__ */ jsx("h2", { className: cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Vinhetas da Web R\xE1dio" }),
          canEdit && /* @__PURE__ */ jsxs(
            Button,
            {
              className: "w-full sm:w-auto bg-gradient-to-r from-[#BF76FF] to-[#8E44AD] hover:opacity-90 text-white rounded-xl h-12 px-6 font-bold truncate",
              onClick: () => {
                setSelectedItem(null);
                setFormData({});
                setIsReadOnly(false);
                setIsEditing(true);
              },
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2 shrink-0" }),
                " Adicionar Vinheta"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
          filteredItems.map((vignette) => /* @__PURE__ */ jsx("div", { className: cn("p-4 rounded-2xl border transition-colors cursor-pointer relative group", isDarkMode ? "bg-[#1a1a1a] border-white/5 hover:bg-[#222]" : "bg-white border-black/5 hover:bg-gray-50"), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("img", { src: vignette.thumbnail || "https://picsum.photos/seed/mic/100/100", className: "w-12 h-12 rounded-xl object-cover", alt: "" }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("h4", { className: cn("font-bold truncate", isDarkMode ? "text-white" : "text-black"), children: vignette.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest", children: "Vinheta \u26A1" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                onClick: (e) => {
                  e.stopPropagation();
                  setSelectedItem(vignette);
                  setFormData(vignette);
                  setIsReadOnly(!canEdit);
                  setIsEditing(true);
                },
                children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 text-gray-500" })
              }
            )
          ] }) }, vignette.id)),
          filteredItems.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full text-center py-12 text-gray-500", children: "Nenhuma vinheta encontrada." })
        ] })
      ] }) : (activeTab === "eventos" || activeTab === "noticias") && !isEditing ? /* @__PURE__ */ jsx(
        EventosView,
        {
          events: filteredItems,
          isDark: isDarkMode,
          canEdit,
          canDelete,
          title: activeTab === "eventos" ? "Eventos do M\xEAs" : "Blog & Not\xEDcias",
          buttonLabel: activeTab === "eventos" ? "Cadastrar novo evento" : "Nova mat\xE9ria",
          buttonIcon: activeTab === "eventos" ? Plus : Newspaper,
          emptyLabel: activeTab === "eventos" ? "Nenhum evento cadastrado." : "Nenhuma not\xEDcia publicada.",
          onNewEvent: () => {
            setSelectedItem(null);
            setFormData({
              organization: profile?.role || "Membro"
            });
            setIsReadOnly(false);
            setIsEditing(true);
          },
          onViewEvent: (item) => {
            setSelectedItem(item);
            setFormData(item);
            setIsReadOnly(true);
            setIsEditing(true);
          },
          onEditEvent: (item) => {
            setSelectedItem(item);
            setFormData(item);
            setIsReadOnly(false);
            setIsEditing(true);
          },
          onDeleteEvent: (item) => {
            handleDelete(item.id, activeTab === "noticias" ? "blog" : "posts");
          }
        }
      ) : activeTab === "agenda" ? /* @__PURE__ */ jsx(
        CalendarView,
        {
          agenda: mergedAgenda,
          isDark: isDarkMode,
          canEdit,
          canDelete,
          onNewEvent: (date) => {
            setSelectedItem(null);
            setFormData({ date: format(date, "yyyy-MM-dd'T'19:00") });
            setIsReadOnly(false);
            setIsEditing(true);
          },
          onViewEvent: (item) => {
            setSelectedItem(item);
            setFormData(item);
            setIsReadOnly(true);
            setIsEditing(true);
          },
          onEditEvent: (item) => {
            setSelectedItem(item);
            setFormData(item);
            setIsReadOnly(false);
            setIsEditing(true);
          },
          onDeleteEvent: (item) => {
            const col = item.type === "post" ? "posts" : "agenda";
            handleDelete(item.id, col);
          }
        }
      ) : activeTab === "visao-geral" ? /* @__PURE__ */ jsxs("div", { className: "space-y-8 md:space-y-12 flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "order-1 md:order-2 space-y-6 md:space-y-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsx("h4", { className: cn("text-xl md:text-2xl font-black tracking-tighter transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Pr\xF3ximos Eventos" }) }),
          /* @__PURE__ */ jsxs("div", { className: cn("border rounded-[32px] p-6 md:p-12 transition-colors", isDarkMode ? "bg-[#111]/50 border-white/5" : "bg-white border-black/5 shadow-xl"), children: [
            /* @__PURE__ */ jsx(UpcomingEvents, { agenda: mergedAgenda, isDark: isDarkMode }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 flex justify-center md:hidden", children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                className: "w-full h-12 rounded-2xl bg-[#BF76FF]/10 text-[#BF76FF] font-bold text-xs uppercase tracking-widest hover:bg-[#BF76FF]/20 cursor-pointer",
                onClick: () => setActiveTab("agenda"),
                children: "Ver agenda completa"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "hidden md:flex justify-end", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "text-xs text-[#BF76FF] hover:underline", onClick: () => setActiveTab("agenda"), children: "Ver agenda completa" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "order-2 md:order-1 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mt-4", children: [
          /* @__PURE__ */ jsxs(Card, { className: cn("border-white/5 p-6 rounded-3xl transition-colors flex flex-col items-center justify-center text-center gap-3", isDarkMode ? "bg-[#111]" : "bg-white shadow-lg border-black/5"), children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-blue-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1", children: "Membros" }),
              /* @__PURE__ */ jsx("h4", { className: cn("text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black"), children: counts.members })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: cn("border-white/5 p-6 rounded-3xl transition-colors flex flex-col items-center justify-center text-center gap-3", isDarkMode ? "bg-[#111]" : "bg-white shadow-lg border-black/5"), children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6 text-orange-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1", children: "Agendados" }),
              /* @__PURE__ */ jsx("h4", { className: cn("text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black"), children: counts.agenda })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: cn("border-white/5 p-6 rounded-3xl transition-colors flex flex-col items-center justify-center text-center gap-3", isDarkMode ? "bg-[#111]" : "bg-white shadow-lg border-black/5"), children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-6 h-6 text-[#BF76FF]" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1", children: "Mensagens" }),
              /* @__PURE__ */ jsx("h4", { className: cn("text-2xl font-black transition-colors leading-none", isDarkMode ? "text-white" : "text-black"), children: counts.unreadNotifications })
            ] })
          ] })
        ] })
      ] }) : activeTab === "agenda-direcao" ? /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
          /* @__PURE__ */ jsx("h2", { className: cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Agenda da Dire\xE7\xE3o" }),
          canEdit && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => setIsImportEventDialogOpen(true),
              className: cn("rounded-xl border-dashed border-[#BF76FF] text-[#BF76FF] hover:bg-[#BF76FF]/10 cursor-pointer hidden md:flex"),
              children: [
                /* @__PURE__ */ jsx(LinkIcon, { className: "w-4 h-4 mr-2" }),
                " Adicionar Existente"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          CalendarView,
          {
            agenda: agendaDirecao.map((a) => ({ ...a, type: "agenda-direcao" })),
            isDark: isDarkMode,
            canEdit,
            canDelete,
            modalTitle: "Novo Compromisso",
            emptyMessage: "N\xE3o tem compromisso agendados para hoje.",
            newEventButtonLabel: "Novo Compromisso",
            deleteButtonLabel: "Remover da Agenda",
            onNewEvent: (date) => {
              setSelectedItem(null);
              setFormData({ date: format(date, "yyyy-MM-dd"), inviteChurch: false, invitedMembers: [] });
              setIsReadOnly(false);
              setIsEditing(true);
            },
            onViewEvent: (item) => {
              setSelectedItem(item);
              setFormData(item);
              setIsReadOnly(true);
              setIsEditing(true);
            },
            onEditEvent: (item) => {
              setSelectedItem(item);
              setFormData(item);
              setIsReadOnly(false);
              setIsEditing(true);
            },
            onDeleteEvent: (item) => {
              handleDelete(item.id, "agenda-direcao");
            }
          }
        )
      ] }) : activeTab === "conversas" ? /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-8", children: /* @__PURE__ */ jsx("h2", { className: cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black"), children: "Conversas" }) }),
        /* @__PURE__ */ jsxs(Card, { className: cn("border rounded-[32px] p-8 md:p-12 transition-colors min-h-[500px] flex flex-col items-center justify-center text-center", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl"), children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-[28px] bg-[#BF76FF]/10 flex items-center justify-center mb-6 transition-transform hover:rotate-12", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-10 h-10 text-[#BF76FF]" }) }),
          /* @__PURE__ */ jsx("h3", { className: cn("text-2xl font-black mb-3", isDarkMode ? "text-white" : "text-black"), children: "O Chat est\xE1 chegando!" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm max-w-sm leading-relaxed", children: "Estamos preparando um sistema de mensagens robusto para que toda a lideran\xE7a e membros possam se comunicar diretamente aqui no dashboard." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "px-4 py-2 rounded-full bg-[#BF76FF]/10 text-[#BF76FF] text-[10px] font-bold uppercase tracking-widest", children: "Tempo Real" }),
            /* @__PURE__ */ jsx("div", { className: "px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest", children: "Privacidade" })
          ] })
        ] })
      ] }) : activeTab === "config" ? /* @__PURE__ */ jsx("div", { className: "p-4 md:p-8", children: /* @__PURE__ */ jsx(Card, { className: cn("border rounded-3xl p-4 md:p-8 transition-colors", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl"), children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h4", { className: cn("text-2xl font-bold transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Configura\xE7\xF5es do Site" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              disabled: isSavingSettings || Object.keys(localSettings).length === 0,
              onClick: async () => {
                setIsSavingSettings(true);
                try {
                  await setDoc(doc(db, "settings", "general"), { ...localSettings }, { merge: true });
                  logAction("atualizar", "settings", `Atualizou configura\xE7\xF5es gerais: ${Object.keys(localSettings).join(", ")}`);
                  setLocalSettings({});
                } catch (error) {
                  handleFirestoreError(error, OperationType.UPDATE, "settings/general");
                } finally {
                  setIsSavingSettings(false);
                }
              },
              className: "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-10 px-6 font-bold",
              children: isSavingSettings ? /* @__PURE__ */ jsx(Fragment, { children: "Salvando..." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
                " Salvar"
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("label", { className: cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500"), children: "YouTube Channel ID" }),
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: "https://commentpicker.com/youtube-channel-id.php",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-[10px] text-[#BF76FF] hover:underline flex items-center gap-1",
                    children: [
                      "Como encontrar o ID? ",
                      /* @__PURE__ */ jsx(ExternalLink, { className: "w-2 h-2" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-black/20 text-white" : "bg-white text-black shadow-sm"),
                  placeholder: "Ex: UCILgaItnqDH3plhRXD54QUg",
                  value: localSettings.youtubeChannelId ?? settings.youtubeChannelId ?? "UCILgaItnqDH3plhRXD54QUg",
                  onChange: (e) => {
                    setLocalSettings((prev) => ({ ...prev, youtubeChannelId: e.target.value }));
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsx("label", { className: cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500"), children: "YouTube Handle" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-black/20 text-white" : "bg-white text-black shadow-sm"),
                  placeholder: "Ex: @ministerio_profecia",
                  value: localSettings.youtubeHandle ?? settings.youtubeHandle ?? "@ministerio_profecia",
                  onChange: (e) => {
                    setLocalSettings((prev) => ({ ...prev, youtubeHandle: e.target.value }));
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 italic pl-1", children: "Essas configura\xE7\xF5es definem de qual canal o site buscar\xE1 os v\xEDdeos e lives recentes." }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: cn("flex flex-col gap-4 p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5"), children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsx("label", { className: cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-gray-400" : "text-gray-500"), children: "Pr\xF3ximo Culto (Frase no in\xEDcio)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                className: cn("border-none h-12 rounded-2xl px-6 transition-colors", isDarkMode ? "bg-black/20 text-white" : "bg-white text-black shadow-sm"),
                placeholder: "Ex: Domingo \xE0s 19:00",
                value: localSettings.nextService ?? settings.nextService ?? "Domingo \xE0s 19:00",
                onChange: (e) => {
                  setLocalSettings((prev) => ({ ...prev, nextService: e.target.value }));
                }
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 italic mt-1 pl-1", children: "Esta frase aparece no topo da p\xE1gina inicial abaixo do t\xEDtulo principal." })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h5", { className: cn("font-bold transition-colors", isDarkMode ? "text-white" : "text-black"), children: "V\xEDdeos no Header (In\xEDcio)" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Ativa ou desativa a reprodu\xE7\xE3o autom\xE1tica de v\xEDdeos no topo da p\xE1gina inicial." })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  className: "sr-only peer",
                  checked: localSettings.enableHeaderVideos ?? settings.enableHeaderVideos ?? true,
                  onChange: (e) => {
                    setLocalSettings((prev) => ({ ...prev, enableHeaderVideos: e.target.checked }));
                  }
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#BF76FF]" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: cn("pt-8 border-t transition-colors", isDarkMode ? "border-white/5" : "border-black/5"), children: [
          /* @__PURE__ */ jsx("h4", { className: cn("text-xl font-bold mb-6 transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Permiss\xF5es por Cargo" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: allRoles.map((role) => /* @__PURE__ */ jsxs("div", { className: cn("p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5"), children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsx("h5", { className: "font-bold text-[#BF76FF]", children: role === "Administradores" ? "Administrador Master" : role }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block", children: "A\xE7\xF5es Dispon\xEDveis" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  { label: "Criar/Editar", key: "edit" },
                  { label: "Excluir", key: "delete" },
                  { label: "Gerenciar Perfis", key: "editProfiles" }
                ].map((perm) => {
                  let defaultPerm = true;
                  if (perm.key === "editProfiles") {
                    defaultPerm = role === "Administradores" || role === "Desenvolvedor";
                  } else {
                    defaultPerm = !["Membro", "Visitante"].includes(role);
                  }
                  const isChecked = settings.permissions?.[role]?.[perm.key] ?? defaultPerm;
                  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between p-3 rounded-xl transition-colors", isDarkMode ? "bg-white/5" : "bg-black/5"), children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: perm.label }),
                    /* @__PURE__ */ jsxs("label", { className: "relative inline-flex items-center cursor-pointer scale-75", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "checkbox",
                          className: "sr-only peer",
                          checked: isChecked,
                          onChange: async (e) => {
                            const newValue = e.target.checked;
                            const newPermissions = {
                              ...settings.permissions,
                              [role]: {
                                ...settings.permissions?.[role] || {
                                  edit: !["Membro", "Visitante"].includes(role),
                                  delete: !["Membro", "Visitante"].includes(role),
                                  editProfiles: role === "Administradores" || role === "Desenvolvedor",
                                  tabs: {}
                                },
                                [perm.key]: newValue
                              }
                            };
                            try {
                              try {
                                await setDoc(doc(db, "settings", "general"), { permissions: newPermissions }, { merge: true });
                              } catch (e2) {
                                handleFirestoreError(e2, OperationType.UPDATE, "settings/general");
                              }
                            } catch (error) {
                              handleFirestoreError(error, OperationType.WRITE, "settings/general");
                            }
                          }
                        }
                      ),
                      /* @__PURE__ */ jsx("div", { className: "w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BF76FF]" })
                    ] })
                  ] }, perm.key);
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block", children: "P\xE1ginas Vis\xEDveis" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
                  { label: "In\xEDcio", key: "visao-geral" },
                  { label: "Eventos", key: "eventos" },
                  { label: "Not\xEDcias", key: "noticias" },
                  { label: "Membros", key: "membros" },
                  { label: "Agenda", key: "agenda" },
                  { label: "Agen. Dire\xE7\xE3o", key: "agenda-direcao" }
                ].map((tab) => {
                  const defaultVals = {
                    "visao-geral": true,
                    "eventos": !["Membro", "Visitante"].includes(role),
                    "noticias": !["Membro", "Visitante"].includes(role),
                    "membros": !["Membro", "Visitante"].includes(role),
                    "agenda": !["Membro", "Visitante"].includes(role),
                    "agenda-direcao": role === "Administradores" || role === "Desenvolvedor"
                  };
                  const isChecked = settings.permissions?.[role]?.tabs?.[tab.key] ?? defaultVals[tab.key];
                  return /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: async () => {
                        const newPermissions = {
                          ...settings.permissions,
                          [role]: {
                            ...settings.permissions?.[role] || { edit: true, delete: true, tabs: {} },
                            tabs: {
                              ...settings.permissions?.[role]?.tabs || {},
                              [tab.key]: !isChecked
                            }
                          }
                        };
                        try {
                          await setDoc(doc(db, "settings", "general"), { permissions: newPermissions }, { merge: true });
                        } catch (error) {
                          handleFirestoreError(error, OperationType.WRITE, "settings/general");
                        }
                      },
                      className: cn(
                        "px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                        isChecked ? "bg-[#BF76FF]/10 text-[#BF76FF] border-[#BF76FF]/30 shadow-lg shadow-[#BF76FF]/10" : "bg-transparent text-gray-500 border-gray-700 hover:border-gray-500"
                      ),
                      children: tab.label
                    },
                    tab.key
                  );
                }) })
              ] })
            ] })
          ] }, `role-permission-${role}`)) })
        ] })
      ] }) }) }) : activeTab === "logs" ? /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-8", children: /* @__PURE__ */ jsx("h2", { className: cn("text-3xl font-black transition-colors uppercase tracking-tighter", isDarkMode ? "text-white" : "text-black"), children: "Audit Logs" }) }),
        /* @__PURE__ */ jsx(Card, { className: cn("border rounded-[32px] transition-colors overflow-hidden", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-xl"), children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: cn("border-b transition-colors", isDarkMode ? "border-white/5" : "border-black/5"), children: [
            /* @__PURE__ */ jsx("th", { className: "p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Data/Hora" }),
            /* @__PURE__ */ jsx("th", { className: "p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Usu\xE1rio" }),
            /* @__PURE__ */ jsx("th", { className: "p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "A\xE7\xE3o" }),
            /* @__PURE__ */ jsx("th", { className: "p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Alvo" }),
            /* @__PURE__ */ jsx("th", { className: "p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest", children: "Detalhes" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: cn("divide-y", isDarkMode ? "divide-white/5" : "divide-black/5"), children: [
            logs.map((log, i) => /* @__PURE__ */ jsxs("tr", { className: cn("hover:bg-white/5 transition-colors"), children: [
              /* @__PURE__ */ jsx("td", { className: "p-6 text-xs text-gray-400 whitespace-nowrap", children: log.timestamp?.toDate ? format(log.timestamp.toDate(), "dd/MM/yyyy HH:mm:ss") : "Carregando..." }),
              /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: cn("text-xs font-bold", isDarkMode ? "text-white" : "text-black"), children: log.userName || "Admin" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500", children: log.userEmail })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("span", { className: cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                log.action === "criar" ? "bg-green-500/10 text-green-500" : log.action === "atualizar" ? "bg-blue-500/10 text-blue-500" : log.action === "excluir" ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-400"
              ), children: log.action }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6 text-xs font-medium text-gray-400", children: log.target }),
              /* @__PURE__ */ jsx("td", { className: "p-6 text-xs text-gray-400 min-w-[200px]", children: log.details })
            ] }, log.id || i)),
            logs.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-20 text-center text-gray-500 text-sm", children: "Nenhum log encontrado." }) })
          ] })
        ] }) }) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-20 flex flex-col items-center justify-center h-full", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Plus, { className: "w-10 h-10 text-gray-500" }) }),
        /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold mb-2 text-white", children: "Selecione um item para editar" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: 'Ou clique no bot\xE3o "Novo Item" para criar um novo registro.' }),
        canEdit && /* @__PURE__ */ jsxs(
          Button,
          {
            className: "mt-6 bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-12 px-8 font-bold cursor-pointer",
            onClick: () => {
              setSelectedItem(null);
              setFormData({});
              setIsReadOnly(false);
              setIsEditing(true);
            },
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " Novo Item"
            ]
          }
        )
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("aside", { className: cn(
      "fixed top-14 bottom-20 right-0 z-[40] w-full xl:top-0 xl:bottom-0 xl:z-auto xl:w-80 border-l flex-col overflow-hidden transition-all duration-300 xl:relative xl:flex",
      rightSidebarView !== "hidden" ? "translate-x-0 flex" : "translate-x-full xl:translate-x-0 hidden xl:flex",
      isDarkMode ? "bg-[#0f0f0f] border-white/5" : "bg-white lg:bg-gray-50 border-black/5"
    ), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between xl:justify-end items-center p-6 pb-4 shrink-0 border-b border-black/5 dark:border-white/5", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden md:block xl:hidden", children: /* @__PURE__ */ jsx("button", { onClick: () => setRightSidebarView("hidden"), className: "w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-gray-500", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsx(
            ActionIcon,
            {
              icon: isDarkMode ? Sun : Moon,
              onClick: () => setIsDarkMode(!isDarkMode),
              active: false,
              isDark: isDarkMode
            }
          ) }),
          /* @__PURE__ */ jsx(
            ActionIcon,
            {
              icon: MessageSquare,
              active: rightSidebarView === "chat-list" || rightSidebarView === "chat-active",
              onClick: () => setRightSidebarView(rightSidebarView === "chat-list" ? "hidden" : "chat-list"),
              isDark: isDarkMode
            }
          ),
          currentRole !== "Dire\xE7\xE3o" && /* @__PURE__ */ jsx(
            ActionIcon,
            {
              icon: Users,
              active: rightSidebarView === "team",
              onClick: () => setRightSidebarView(rightSidebarView === "team" ? "hidden" : "team"),
              isDark: isDarkMode
            }
          )
        ] })
      ] }),
      rightSidebarView === "team" && /* @__PURE__ */ jsx("div", { className: "flex-1 px-6 pt-4 overflow-y-auto scrollbar-hide flex flex-col", children: /* @__PURE__ */ jsx("div", { className: "space-y-8 flex-1", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Pesquisar membro...",
              value: rightSidebarSearch,
              onChange: (e) => setRightSidebarSearch(e.target.value),
              className: cn("w-full border-none rounded-2xl py-3 pl-10 pr-4 text-sm outline-none transition-colors", isDarkMode ? "bg-[#1a1a1a] text-white focus:ring-1 focus:ring-[#BF76FF]/30" : "bg-gray-100 text-black focus:ring-1 focus:ring-[#BF76FF]/50")
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          allRoles.filter((r) => r !== "Membro" && r !== "Administradores" && r !== "Visitante").map((role) => {
            const roleMembers = members.filter((m) => {
              const ministry = (m.ministries || []).find((min) => (typeof min === "string" ? min : min.name) === role);
              const isLeaderOfThisRole = typeof ministry === "object" ? ministry.isLeader : m.role === role && m.isLeader;
              return isLeaderOfThisRole && (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
            });
            if (roleMembers.length === 0 && rightSidebarSearch) return null;
            return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("h5", { className: cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", isDarkMode ? "text-gray-500" : "text-gray-400"), children: [
                /* @__PURE__ */ jsx("div", { className: "w-1 h-2 bg-[#BF76FF] rounded-full" }),
                role === "Administradores" ? "Administrador Master" : role
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-4", children: roleMembers.length > 0 ? roleMembers.slice(0, rightSidebarSearch ? void 0 : 3).map((member, i) => /* @__PURE__ */ jsx(
                TeamMember,
                {
                  member,
                  active: member.email === user?.email,
                  onWhatsApp: () => openWhatsApp(member),
                  onViewProfile: () => {
                    setActiveTab("membros");
                    setViewingMember(member);
                  },
                  onDelete: () => handleDelete(member.id, "members"),
                  isDark: isDarkMode
                },
                `role-member-${role}-${member.id || i}`
              )) : /* @__PURE__ */ jsx("p", { className: cn("text-[10px] italic pl-3", isDarkMode ? "text-gray-600" : "text-gray-400"), children: "Nenhum l\xEDder cadastrado" }) })
            ] }, `role-group-${role}`);
          }),
          (() => {
            const standardMembers = members.filter((m) => {
              const isAnyLeader = (m.ministries || []).some((min) => typeof min === "object" && min.isLeader) || m.isLeader;
              const isVisitor = m.role === "Visitante" || (m.ministries || []).some((min) => (typeof min === "string" ? min : min.name) === "Visitante");
              return !isAnyLeader && !isVisitor && (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
            });
            if (standardMembers.length === 0) return null;
            return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("h5", { className: cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", isDarkMode ? "text-gray-500" : "text-gray-400"), children: [
                /* @__PURE__ */ jsx("div", { className: "w-1 h-2 bg-gray-600 rounded-full" }),
                "Membros"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-4", children: standardMembers.slice(0, rightSidebarSearch ? void 0 : 5).map((member, i) => /* @__PURE__ */ jsx(
                TeamMember,
                {
                  member,
                  active: member.email === user?.email,
                  onWhatsApp: () => openWhatsApp(member),
                  onViewProfile: () => {
                    setActiveTab("membros");
                    setViewingMember(member);
                  },
                  onDelete: () => handleDelete(member.id, "members"),
                  isDark: isDarkMode
                },
                `sidebar-standard-${member.id || i}`
              )) })
            ] });
          })(),
          (() => {
            const visitors = members.filter((m) => {
              const isVisitor = m.role === "Visitante" || (m.ministries || []).some((min) => (typeof min === "string" ? min : min.name) === "Visitante");
              return isVisitor && (!rightSidebarSearch || m.name?.toLowerCase().includes(rightSidebarSearch.toLowerCase()));
            });
            if (visitors.length === 0) return null;
            return /* @__PURE__ */ jsxs("div", { className: cn("space-y-3 mt-6 pt-6 border-t", isDarkMode ? "border-white/5" : "border-black/5"), children: [
              /* @__PURE__ */ jsxs("h5", { className: cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-blue-400"), children: [
                /* @__PURE__ */ jsx("div", { className: "w-1 h-2 bg-blue-400 rounded-full" }),
                "Visitantes"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-4", children: visitors.map((member, i) => /* @__PURE__ */ jsx(
                TeamMember,
                {
                  member,
                  active: member.email === user?.email,
                  onWhatsApp: () => openWhatsApp(member),
                  onViewProfile: () => {
                    setActiveTab("membros");
                    setViewingMember(member);
                  },
                  onDelete: () => handleDelete(member.id, "members"),
                  isDark: isDarkMode
                },
                `sidebar-visitor-${member.id || i}`
              )) })
            ] });
          })()
        ] })
      ] }) }) }),
      rightSidebarView === "chat-list" && /* @__PURE__ */ jsxs("div", { className: cn("flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-[#0f0f0f]" : "bg-white lg:bg-gray-50"), children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 pt-4 pb-2", children: /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-4", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { className: cn("text-2xl font-black", isDarkMode ? "text-white" : "text-black"), children: "Mensagens" }) }) }) }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-4 pb-6 space-y-1 scrollbar-hide", children: activeChats.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-center opacity-50 mt-10", children: [
          /* @__PURE__ */ jsx(MessageSquare, { className: "w-12 h-12 mb-4 mx-auto" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Voc\xEA n\xE3o tem mensagens" })
        ] }) : activeChats.map((chat, i) => {
          const otherUserId = chat.participants?.find((p) => p !== profile?.id) || "";
          const m = members.find((member) => member.id === otherUserId);
          if (!m) return null;
          return /* @__PURE__ */ jsxs("div", { onClick: () => openWhatsApp(m), className: "flex items-center gap-4 p-3 mb-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
              m.photoURL ? /* @__PURE__ */ jsx("img", { src: m.photoURL, className: "w-12 h-12 rounded-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-gray-200 dark:bg-[#1a1a1a] text-xl font-bold flex items-center justify-center text-[#BF76FF]", children: m.name?.[0] || "M" }),
              (m.status_presence === "online" || m.status_presence === "ocupado") && /* @__PURE__ */ jsx("div", { className: cn("absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-white dark:border-[#0f0f0f] rounded-full", getStatusColor(m.status_presence)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline mb-1", children: [
                /* @__PURE__ */ jsx("h4", { className: cn("font-bold text-sm truncate", isDarkMode ? "text-white" : "text-black"), children: m.name || "Membro" }),
                chat.unreadCount?.[profile?.id || ""] > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-[#BF76FF] text-white text-[10px] font-black h-5 px-2 rounded-full flex items-center justify-center gap-1 animate-pulse shadow-sm shadow-[#BF76FF]/40", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-2.5 h-2.5" }),
                  /* @__PURE__ */ jsx("span", { children: chat.unreadCount[profile?.id || ""] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 truncate font-medium flex items-center gap-1", children: stripMentions(chat.lastMessage) || "Toque para abrir a conversa" })
            ] })
          ] }, chat.id);
        }) })
      ] }),
      rightSidebarView === "chat-active" && activeChatUser && /* @__PURE__ */ jsxs("div", { className: cn("flex-1 flex flex-col relative overflow-hidden animate-in slide-in-from-right-4 duration-300", isDarkMode ? "bg-[#0f0f0f]" : "bg-white lg:bg-gray-50"), children: [
        /* @__PURE__ */ jsx("div", { className: cn("px-5 py-4 border-b flex items-center justify-between shadow-sm z-10 shrink-0", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-black/5"), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setRightSidebarView("chat-list"), className: "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors mr-1", children: /* @__PURE__ */ jsx(ArrowLeft, { className: cn("w-5 h-5", isDarkMode ? "text-gray-300" : "text-gray-600") }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
            activeChatUser.photoURL ? /* @__PURE__ */ jsx("img", { src: activeChatUser.photoURL, className: "w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" }) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5 text-lg font-bold flex items-center justify-center text-[#BF76FF]", children: activeChatUser.name?.[0] || "M" }),
            /* @__PURE__ */ jsx("div", { className: "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#111] rounded-full" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col relative top-0.5", children: [
            /* @__PURE__ */ jsx("h3", { className: cn("font-extrabold text-[15px] leading-tight", isDarkMode ? "text-white" : "text-gray-900"), children: activeChatUser.name || "Membro" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-green-500 font-bold uppercase tracking-wider", children: "Online" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-6 space-y-4 flex flex-col scrollbar-hide min-h-0", children: [
          chatMessages.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-center opacity-50", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "w-12 h-12 mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Envie uma mensagem para iniciar a conversa." })
          ] }) : chatMessages.map((msg) => {
            const isMe = msg.senderId === profile?.id;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "p-3 px-4 rounded-2xl w-max max-w-[85%] shadow-sm",
                  isMe ? "bg-gradient-to-r from-[#BF76FF] to-[#A05ADB] text-white rounded-tr-sm self-end ml-auto" : isDarkMode ? "bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-sm self-start mr-auto" : "bg-white border border-black/5 text-gray-800 rounded-tl-sm self-start mr-auto"
                ),
                children: renderMessageWithMentions(msg.text)
              },
              msg.id
            );
          }),
          /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: cn("p-4 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] relative", isDarkMode ? "bg-[#111] border-white/5" : "bg-white border-t border-black/5"), children: [
          showMentionSuggestions && /* @__PURE__ */ jsxs("div", { className: cn(
            "absolute bottom-[calc(100%+8px)] left-4 right-4 max-h-64 overflow-y-auto rounded-2xl shadow-2xl z-[100] border p-1 animate-in fade-in slide-in-from-bottom-2 duration-200",
            isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
          ), children: [
            members.filter((m) => m.name?.toLowerCase().includes(mentionSearch.toLowerCase())).slice(0, 10).map((m) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  const lastAtIndex = chatInput.lastIndexOf("@");
                  const beforeAt = chatInput.substring(0, lastAtIndex);
                  setChatInput(`${beforeAt}@{${m.name}} `);
                  setShowMentionSuggestions(false);
                  setMentionSearch("");
                },
                className: cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group",
                  isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                ),
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#BF76FF]/30 overflow-hidden transition-all", children: m.photoURL ? /* @__PURE__ */ jsx("img", { src: m.photoURL, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-[#BF76FF]", children: m.name?.[0] }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0", children: [
                    /* @__PURE__ */ jsx("span", { className: cn("text-sm font-bold truncate", isDarkMode ? "text-gray-100" : "text-gray-900"), children: m.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] opacity-40 uppercase tracking-tighter font-black", children: "Membro da Equipe" })
                  ] })
                ]
              },
              m.id
            )),
            members.filter((m) => m.name?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 text-[10px] text-center opacity-40 italic flex flex-col items-center gap-2", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
              "Nenhum membro encontrado"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: cn("flex items-end gap-2 p-1.5 pl-3 rounded-3xl transition-transform focus-within:-translate-y-1", isDarkMode ? "bg-white/5 focus-within:bg-white/10" : "bg-gray-100 focus-within:bg-gray-200"), children: [
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 1,
                placeholder: "Mensagem...",
                value: chatInput,
                onChange: (e) => {
                  const val = e.target.value;
                  setChatInput(val);
                  const lastAtIndex = val.lastIndexOf("@");
                  if (lastAtIndex !== -1) {
                    const textAfterAt = val.substring(lastAtIndex + 1);
                    if (!textAfterAt.includes("\n")) {
                      setMentionSearch(textAfterAt);
                      setShowMentionSuggestions(true);
                    } else {
                      setShowMentionSuggestions(false);
                    }
                  } else {
                    setShowMentionSuggestions(false);
                  }
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                },
                className: cn("flex-1 bg-transparent border-none outline-none text-sm py-3 px-1 resize-none max-h-32 scrollbar-hide", isDarkMode ? "text-white" : "text-black"),
                onInput: (e) => {
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: sendChatMessage,
                disabled: !chatInput.trim(),
                className: "w-10 h-10 shrink-0 bg-gradient-to-tr from-[#BF76FF] to-[#8E44AD] text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center justify-center mb-0.5 cursor-pointer",
                children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 ml-0.5" })
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: deleteConfirm !== null, onOpenChange: (open) => !open && setDeleteConfirm(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: cn("border rounded-[32px] p-8 max-w-sm transition-colors", isDarkMode ? "bg-[#111] border-white/10 text-white" : "bg-white border-black/10 text-black"), children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500", children: /* @__PURE__ */ jsx(Trash2, { className: "w-8 h-8" }) }),
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-center text-xl font-bold", children: "Confirmar Exclus\xE3o" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-6 pt-4", children: [
        /* @__PURE__ */ jsx("p", { className: cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600"), children: "Voc\xEA tem certeza que deseja excluir este item? Esta a\xE7\xE3o n\xE3o poder\xE1 ser desfeita." }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              className: "flex-1 rounded-2xl h-12 px-6 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer",
              onClick: () => setDeleteConfirm(null),
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              className: "flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 px-6 font-bold cursor-pointer",
              onClick: executeDelete,
              children: "Excluir"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: isImportEventDialogOpen, onOpenChange: setIsImportEventDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: cn("sm:max-w-xl p-0 overflow-hidden max-h-[85vh] flex flex-col rounded-[32px] border", isDarkMode ? "bg-[#111] border-white/10" : "bg-white border-black/10"), children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 pb-4", children: [
        /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { className: cn("text-2xl font-black transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Adicionar Evento Existente" }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Pesquisar em eventos e agenda comum...",
              value: importSearch,
              onChange: (e) => setImportSearch(e.target.value),
              className: cn("pl-12 h-14 rounded-2xl border-none transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin scrollbar-thumb-[#BF76FF]/20", children: /* @__PURE__ */ jsx("div", { className: "space-y-3 pt-4", children: eventsToImport.length > 0 ? eventsToImport.map((event) => /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => handleImportEvent(event),
          className: cn(
            "p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between",
            isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-[#BF76FF]/30" : "bg-gray-50 border-black/5 hover:bg-white hover:shadow-lg hover:border-[#BF76FF]/30"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              event.thumbnail ? /* @__PURE__ */ jsx("img", { src: event.thumbnail, className: "w-12 h-12 rounded-xl object-cover shrink-0", alt: "" }) : /* @__PURE__ */ jsx("div", { className: cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", event.type === "post" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"), children: event.type === "post" ? /* @__PURE__ */ jsx(Star, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6" }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("h4", { className: cn("font-bold truncate", isDarkMode ? "text-white" : "text-black"), children: event.title }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-gray-500 font-medium", children: [
                  /* @__PURE__ */ jsx(CalendarDays, { className: "w-3 h-3" }),
                  /* @__PURE__ */ jsx("span", { children: safeFormatDate(event.date) }),
                  /* @__PURE__ */ jsx("span", { children: "\u2022" }),
                  /* @__PURE__ */ jsx("span", { className: "uppercase tracking-widest", children: event.type === "post" ? "Evento" : "Agenda" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "group-hover:text-[#BF76FF] transition-colors rounded-full", children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }) })
          ]
        },
        `${event.type}-${event.id}`
      )) : /* @__PURE__ */ jsxs("div", { className: "text-center py-20 opacity-40", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-12 h-12 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold", children: "Nenhum evento encontrado" })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: cn("p-6 border-t flex justify-end", isDarkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-gray-50"), children: /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setIsImportEventDialogOpen(false), className: "rounded-xl font-bold", children: "Cancelar" }) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: isMemberSelectorOpen, onOpenChange: setIsMemberSelectorOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: cn("sm:max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col rounded-[32px] border", isDarkMode ? "bg-[#111] border-white/10" : "bg-white border-black/10"), children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 pb-4", children: [
        /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { className: cn("text-2xl font-black transition-colors", isDarkMode ? "text-white" : "text-black"), children: "Convidar Membros" }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Pesquisar por nome ou cargo...",
              value: memberSearch,
              onChange: (e) => setMemberSearch(e.target.value),
              className: cn("pl-12 h-14 rounded-2xl border-none transition-colors", isDarkMode ? "bg-white/5 text-white" : "bg-gray-100 text-black")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin scrollbar-thumb-[#BF76FF]/20", children: /* @__PURE__ */ jsx("div", { className: "space-y-2 pt-4", children: members.filter((m) => (m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.role?.toLowerCase().includes(memberSearch.toLowerCase())) && m.status !== "pending").map((member, idx) => {
        const isSelected = formData.invitedMembers?.some((m) => m.id === member.id);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => {
              const currentInvited = formData.invitedMembers || [];
              if (isSelected) {
                setFormData({
                  ...formData,
                  invitedMembers: currentInvited.filter((m) => m.id !== member.id)
                });
              } else {
                setFormData({
                  ...formData,
                  invitedMembers: [...currentInvited, { id: member.id, name: member.name, photo: member.photoURL }]
                });
              }
            },
            className: cn(
              "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
              isSelected ? isDarkMode ? "bg-[#BF76FF]/20 border-[#BF76FF]/40" : "bg-[#BF76FF]/10 border-[#BF76FF]/30" : isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-black/5 hover:bg-white hover:shadow-md"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl overflow-hidden bg-gray-200 shrink-0", children: member.photoURL ? /* @__PURE__ */ jsx("img", { src: member.photoURL, className: "w-full h-full object-cover", alt: "", referrerPolicy: "no-referrer" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center bg-[#BF76FF]/20 text-[#BF76FF] font-bold", children: member.name?.[0] }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("h4", { className: cn("text-sm font-bold truncate", isDarkMode ? "text-white" : "text-black"), children: member.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none mt-1", children: formatRoles(member) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                isSelected ? "bg-[#BF76FF] text-white" : isDarkMode ? "bg-white/10 text-transparent" : "bg-black/5 text-transparent"
              ), children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }) })
            ]
          },
          `invited-member-selection-${member.id || idx}`
        );
      }) }) }),
      /* @__PURE__ */ jsxs("div", { className: cn("p-6 border-t flex justify-between items-center", isDarkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-gray-50"), children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 font-bold", children: [
          formData.invitedMembers?.length || 0,
          " selecionados"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            className: "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white rounded-xl font-bold px-8",
            onClick: () => setIsMemberSelectorOpen(false),
            children: "Concluir"
          }
        )
      ] })
    ] }) })
  ] });
}
function SidebarItem({ icon: Icon, active, onClick, label, collapsed, isDark, mobile, notificationCount, iconClassName }) {
  if (mobile) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick,
        className: cn(
          "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all relative shrink-0",
          active ? isDark ? "text-white" : "text-[#BF76FF]" : isDark ? "text-gray-500" : "text-gray-400"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative",
            active ? isDark ? "bg-white/10 text-white" : "bg-[#BF76FF]/10 text-[#BF76FF]" : "bg-transparent"
          ), children: [
            /* @__PURE__ */ jsx(Icon, { className: cn("w-6 h-6", iconClassName) }),
            notificationCount ? /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-md border border-white dark:border-[#0a0a0a]", children: notificationCount }) : null
          ] }),
          /* @__PURE__ */ jsx("span", { className: cn(
            "text-[9px] font-bold uppercase tracking-tighter transition-all",
            active ? isDark ? "text-white" : "text-black" : "text-gray-500"
          ), children: label }),
          active && /* @__PURE__ */ jsx(
            motion.div,
            {
              layoutId: "mobile-active-dot",
              className: "absolute -top-1 w-1 h-1 rounded-full bg-[#BF76FF]"
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      className: cn(
        "w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-all relative group overflow-hidden",
        active ? isDark ? "bg-gradient-to-r from-white/[0.08] to-[#BF76FF]/10 text-white font-semibold shadow-[0_0_20px_rgba(191,118,255,0.1)]" : "bg-[#BF76FF]/10 text-[#BF76FF] font-semibold" : isDark ? "bg-transparent text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 font-medium" : "bg-transparent text-gray-500 hover:bg-black/[0.05] hover:text-black font-medium"
      ),
      title: collapsed ? label : "",
      children: [
        /* @__PURE__ */ jsxs("div", { className: cn(
          "flex items-center justify-center transition-colors relative",
          collapsed ? "w-full" : "w-5",
          active ? "text-[#BF76FF]" : isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"
        ), children: [
          /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }),
          notificationCount ? /* @__PURE__ */ jsx("span", { className: "absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] shadow-md font-black", children: notificationCount > 9 ? "9+" : notificationCount }) : null
        ] }),
        !collapsed && /* @__PURE__ */ jsxs("span", { className: "text-sm flex-1 text-left whitespace-nowrap transition-opacity duration-300 flex justify-between items-center", children: [
          label,
          notificationCount ? /* @__PURE__ */ jsx("span", { className: "bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black", children: notificationCount }) : null
        ] }),
        active && /* @__PURE__ */ jsx(
          motion.div,
          {
            layoutId: "active-indicator",
            className: "absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#BF76FF] rounded-l-full shadow-[0_0_10px_#BF76FF]",
            initial: { opacity: 0, x: 5 },
            animate: { opacity: 1, x: 0 }
          }
        )
      ]
    }
  );
}
function ListItem({ title, subtitle, image, icon: Icon, active, status, onClick }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick,
      className: cn(
        "p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all",
        active ? "bg-[#1a1a1a] border border-white/5" : "hover:bg-white/5"
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl overflow-hidden bg-[#222] flex items-center justify-center shrink-0", children: image ? /* @__PURE__ */ jsx("img", { src: image, alt: "", className: "w-full h-full object-cover" }) : Icon ? /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-gray-500" }) : /* @__PURE__ */ jsx(File, { className: "w-6 h-6 text-gray-500" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("h4", { className: cn("text-sm font-bold truncate flex items-center gap-2", active ? "text-white" : "text-gray-300"), children: [
            title,
            status === "pending" && /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full", children: "Pendente" }),
            status === "approved" && /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full", children: "Aprovado" }),
            status === "rejected" && /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full", children: "Reprovado" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 truncate", children: subtitle })
        ] }),
        active && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[#BF76FF] shadow-[0_0_8px_#BF76FF]" })
      ]
    }
  );
}
function UpcomingEvents({ agenda, isDark }) {
  const upcoming = agenda.filter((item) => {
    try {
      return isAfter(new Date(item.date), /* @__PURE__ */ new Date());
    } catch (e) {
      return false;
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  if (upcoming.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isDark ? "bg-white/5" : "bg-gray-100"), children: /* @__PURE__ */ jsx(CalendarDays, { className: "w-8 h-8 text-gray-500" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 font-bold", children: "Nenhum evento pr\xF3ximo agendado." }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 mt-1", children: "Fique atento \xE0s novidades da nossa congrega\xE7\xE3o." })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-6 md:space-y-10", children: upcoming.map((event, index) => {
    const date = new Date(event.date);
    const day = format(date, "dd");
    const weekDay = format(date, "EEE", { locale: ptBR });
    const monthYear = format(date, "MMMM", { locale: ptBR });
    const time = format(date, "HH:mm");
    const colors = ["bg-green-500", "bg-[#BF76FF]", "bg-orange-500", "bg-pink-500", "bg-blue-500"];
    const colorClass = colors[index % colors.length];
    return /* @__PURE__ */ jsxs("div", { className: "flex gap-4 md:gap-8 group", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center shrink-0 w-12 md:w-20", children: [
        /* @__PURE__ */ jsx("span", { className: cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-gray-500" : "text-gray-400"), children: weekDay }),
        /* @__PURE__ */ jsx("span", { className: cn("text-2xl md:text-5xl font-black tracking-tighter leading-none transition-colors", isDark ? "text-white" : "text-black"), children: day })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: cn(
        "flex-1 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-2xl",
        isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/5" : "bg-white border-black/5 shadow-sm hover:shadow-lg"
      ), children: [
        /* @__PURE__ */ jsx("div", { className: cn("absolute top-0 left-0 bottom-0 w-1.5 md:w-2", colorClass) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("h5", { className: cn("text-sm md:text-xl font-bold transition-colors line-clamp-1", isDark ? "text-white" : "text-black"), children: event.title }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] md:text-sm text-gray-500 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 md:w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "truncate", children: event.location || "Local em breve" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 md:gap-4", children: /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-1.5 px-2.5 py-1 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600"), children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 md:w-4 h-4 text-[#BF76FF]" }),
            time
          ] }) })
        ] })
      ] })
    ] }, event.id);
  }) });
}
function ActivityItem({ user, action, time, isDark }) {
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between py-2 border-b last:border-0", isDark ? "border-white/5" : "border-black/5"), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-[#BF76FF]/20 flex items-center justify-center text-[#BF76FF] text-[10px] font-bold", children: user ? user[0] : "A" }),
      /* @__PURE__ */ jsxs("p", { className: cn("text-sm transition-colors", isDark ? "text-white" : "text-black"), children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: user || "Sistema" }),
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: action })
      ] })
    ] }),
    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-600 font-medium", children: time })
  ] });
}
function TeamMember({ member, active, onWhatsApp, onViewProfile, onEditProfile, onDelete, isDark, isAdmin, logAction }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const name = member.name || "Membro";
  const status = member.status_presence || "offline";
  const getStatusColor = (s) => {
    switch (s) {
      case "online":
        return "bg-green-500";
      case "ocupado":
        return "bg-red-500";
      case "ausente":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors overflow-hidden", isDark ? "bg-gradient-to-tr from-gray-700 to-gray-800 text-white" : "bg-gray-200 text-black"), children: member.photoURL ? /* @__PURE__ */ jsx("img", { src: member.photoURL, alt: "", className: "w-full h-full object-cover" }) : name[0] }),
        /* @__PURE__ */ jsx("div", { className: cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse", isDark ? "border-[#0a0a0a]" : "border-white", getStatusColor(status)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "cursor-pointer group", onClick: onViewProfile, children: [
        /* @__PURE__ */ jsx("p", { className: cn("text-sm font-bold transition-colors group-hover:text-[#BF76FF]", isDark ? "text-white" : "text-black"), children: name }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500", children: formatRoles(member) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onWhatsApp,
          title: "Chat Interno",
          className: "p-2 rounded-lg bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white transition-all cursor-pointer",
          children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" })
        }
      ),
      onEditProfile && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onEditProfile,
          className: "p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer",
          children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowTooltip(!showTooltip),
            onBlur: () => setTimeout(() => setShowTooltip(false), 300),
            className: cn("hover:text-[#BF76FF] p-2 transition-colors cursor-pointer", isDark ? "text-gray-600" : "text-gray-400"),
            children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsx(AnimatePresence, { children: showTooltip && /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 10, scale: 0.9, x: 20 },
            animate: { opacity: 1, y: 0, scale: 1, x: 0 },
            exit: { opacity: 0, y: 10, scale: 0.9, x: 20 },
            className: cn(
              "absolute right-0 top-full mt-2 w-64 md:w-72 rounded-[32px] shadow-2xl border overflow-hidden z-[100] p-1",
              isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "relative h-24 rounded-[28px] overflow-hidden", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: member.coverImage || "https://picsum.photos/seed/church/400/200",
                    className: "w-full h-full object-cover opacity-60",
                    alt: ""
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-3 right-3", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10", children: /* @__PURE__ */ jsx(Bookmark, { className: "w-4 h-4 text-white/70" }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "px-6 -mt-8 relative z-10", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-end justify-between mb-4", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full border-4 border-[#0a0a0a] bg-[#1a1a1a] overflow-hidden shadow-xl", children: member.photoURL ? /* @__PURE__ */ jsx("img", { src: member.photoURL, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-xl font-bold text-[#BF76FF]", children: name[0] }) }) }),
                /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                  /* @__PURE__ */ jsx("h5", { className: "text-lg font-bold text-white leading-tight", children: name }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-medium", children: formatRoles(member) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mb-6 py-4 border-y border-white/5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1 text-white font-bold text-sm", children: [
                      /* @__PURE__ */ jsx(Star, { className: "w-3 h-3 text-yellow-500 fill-yellow-500" }),
                      /* @__PURE__ */ jsx("span", { children: "4.8" })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] text-gray-500 uppercase font-black tracking-tighter", children: "Rating" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center border-x border-white/5", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-white font-bold text-sm", children: "2 Anos" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] text-gray-500 uppercase font-black tracking-tighter", children: "Membro" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-white font-bold text-sm", children: "Ativo" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] text-gray-500 uppercase font-black tracking-tighter", children: "Status" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setShowTooltip(false);
                      if (onViewProfile) onViewProfile();
                    },
                    className: "w-full bg-white text-black h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all mb-2 cursor-pointer",
                    children: "Ver perfil"
                  }
                ),
                isAdmin && (member.status === "pending" || member.status === "pending_approval") ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: async () => {
                        setShowTooltip(false);
                        try {
                          await updateDoc(doc(db, "members", member.id), { status: "active", updatedAt: serverTimestamp() });
                        } catch (err) {
                          console.error(err);
                        }
                      },
                      className: "flex-1 bg-green-500/10 text-green-500 h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all cursor-pointer",
                      children: "Aprovar"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setShowTooltip(false);
                        if (onDelete) onDelete();
                      },
                      className: "flex-1 bg-red-500/10 text-red-500 h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer",
                      children: "Recusar"
                    }
                  )
                ] }) : onDelete && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setShowTooltip(false);
                      onDelete();
                    },
                    className: "w-full bg-red-500/10 text-red-500 h-10 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer",
                    children: "Excluir Membro"
                  }
                )
              ] })
            ]
          }
        ) })
      ] })
    ] })
  ] });
}
function FileCategory({ icon: Icon, label, count, active, isDark }) {
  return /* @__PURE__ */ jsxs("div", { className: cn(
    "p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all",
    active ? isDark ? "bg-[#1a1a1a] border border-white/5" : "bg-gray-100 border border-black/5" : isDark ? "hover:bg-white/5" : "hover:bg-black/5"
  ), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: cn("w-8 h-8 rounded-xl flex items-center justify-center", active ? "bg-[#BF76FF]/20 text-[#BF76FF]" : isDark ? "bg-white/5 text-gray-500" : "bg-black/5 text-gray-400"), children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsx("span", { className: cn("text-xs font-medium transition-colors", isDark ? "text-white" : "text-black"), children: label })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-bold", children: count }),
      /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 text-gray-700" })
    ] })
  ] });
}
function ActionIcon({ icon: Icon, onClick, active, isDark }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick,
      className: cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
        active ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/20" : isDark ? "bg-transparent text-[#BF76FF] hover:bg-[#BF76FF]/10" : "bg-transparent text-[#BF76FF] hover:bg-[#BF76FF]/5"
      ),
      children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" })
    }
  );
}
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
export {
  Admin as default
};
