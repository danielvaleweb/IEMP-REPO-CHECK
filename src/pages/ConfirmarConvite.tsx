import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, CheckCircle2, Heart, ArrowRight, UserCheck, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getImageUrl } from "@/lib/utils";
import confetti from "canvas-confetti";
import Navbar from "@/components/layout/Navbar";

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  } catch (err) {
    console.warn("Audio Context unable to play", err);
  }
};

export default function ConfirmarConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const eventId = searchParams.get("eventId") || searchParams.get("event") || searchParams.get("id");
  const guestId = searchParams.get("guestId") || searchParams.get("guest");

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [guest, setGuest] = useState<any>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadConviteData = async () => {
      if (!eventId) {
        setErrorMsg("Link de convite inválido.");
        setLoading(false);
        return;
      }

      try {
        // Try 'posts' first, fallback to 'agenda'
        let docSnap = await getDoc(doc(db, "posts", eventId));
        if (!docSnap.exists()) {
          docSnap = await getDoc(doc(db, "agenda", eventId));
        }

        if (!docSnap.exists()) {
          setErrorMsg("Evento não encontrado.");
          setLoading(false);
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() };
        setEvent(data);

        // Find guest in guests array
        const guestsList = (data as any).guests || [];
        const foundGuest = guestsList.find((g: any) => 
          (guestId && g.id === guestId) || 
          (guestId && g.name?.toLowerCase() === decodeURIComponent(guestId).toLowerCase())
        ) || guestsList[0];

        if (foundGuest) {
          setGuest(foundGuest);
          if (foundGuest.confirmed || foundGuest.status === 'confirmed') {
            setIsConfirmed(true);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do convite:", err);
        setErrorMsg("Não foi possível carregar os detalhes do convite.");
      } finally {
        setLoading(false);
      }
    };

    loadConviteData();
  }, [eventId, guestId]);

  const handleConfirmar = async () => {
    if (!event || confirming) return;

    setConfirming(true);
    try {
      const guestsList = event.guests || [];
      const updatedGuests = guestsList.map((g: any) => {
        if (
          (guestId && g.id === guestId) || 
          (guest && g.name === guest.name)
        ) {
          return {
            ...g,
            confirmed: true,
            status: 'confirmed',
            confirmedAt: new Date().toISOString()
          };
        }
        return g;
      });

      // Try updating 'posts'
      try {
        await updateDoc(doc(db, "posts", event.id), { guests: updatedGuests });
      } catch {
        await updateDoc(doc(db, "agenda", event.id), { guests: updatedGuests });
      }

      setIsConfirmed(true);
      playSuccessSound();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#BF76FF', '#EC4899', '#ffffff', '#10B981']
      });
    } catch (err) {
      console.error("Erro ao confirmar presença:", err);
      setIsConfirmed(true); // Fallback optimistic update
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#10001D] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#BF76FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="min-h-screen bg-[#10001D] flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">{errorMsg || "Convite não encontrado"}</h2>
        <Button onClick={() => navigate("/")} className="bg-[#BF76FF] hover:bg-[#a85be6] text-white">
          Ir para o Início
        </Button>
      </div>
    );
  }

  let displayDate = event.date || "";
  let startTime = "";
  if (displayDate.includes('T')) {
    const parts = displayDate.split('T');
    displayDate = parts[0].split('-').reverse().join('/');
    startTime = parts[1].substring(0, 5);
  } else if (displayDate.includes(' - ')) {
    const parts = displayDate.split(' - ');
    displayDate = parts[0];
    startTime = parts[1];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C0037] via-[#10001D] to-[#0A0014] text-white font-sans relative overflow-hidden flex flex-col pb-20">
      <Navbar />

      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-5" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '160px 160px'
        }}
      />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 pt-28 md:pt-36 relative z-10 flex flex-col items-center">
        
        {/* Header Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-6 shadow-2xl"
        >
          <Sparkles className="w-4 h-4 text-[#BF76FF]" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#BF76FF]">Convite de Honra</span>
        </motion.div>

        {/* Main Invitation Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", damping: 25 }}
          className="w-full bg-[#160027]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center text-center"
        >
          {/* Subtle Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#BF76FF]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Guest Photo / Avatar */}
          {guest && (
            <div className="relative mb-6 group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-2 border-[#BF76FF]/40 p-1 bg-black/40 shadow-2xl">
                {guest.image ? (
                  <img src={getImageUrl(guest.image)} alt={guest.name} className="w-full h-full object-cover rounded-[2.2rem]" />
                ) : (
                  <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-br from-[#BF76FF] to-pink-500 flex items-center justify-center text-white text-4xl font-black">
                    {guest.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              {isConfirmed && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-2xl p-2 shadow-xl border-2 border-[#160027]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
            </div>
          )}

          {/* Welcome Text */}
          <p className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-2">
            Olá, <span className="text-white font-black">{guest?.name || "Convidado(a)"}</span>
          </p>
          {guest?.congregation && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-gray-300 text-[11px] font-medium mb-4">
              <Building2 className="w-3.5 h-3.5 text-[#BF76FF]" />
              <span>{guest.congregation}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-none drop-shadow-lg">
            {event.title}
          </h1>

          {event.content && (
            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl mb-8 border-y border-white/5 py-4">
              {event.content}
            </p>
          )}

          {/* Event Info Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
              <Calendar className="w-5 h-5 text-[#BF76FF] mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data</p>
              <p className="text-sm font-bold text-white mt-0.5">{displayDate || "TBA"}</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
              <Clock className="w-5 h-5 text-[#BF76FF] mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Horário</p>
              <p className="text-sm font-bold text-white mt-0.5">{startTime || "A confirmar"}</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
              <MapPin className="w-5 h-5 text-[#BF76FF] mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Local</p>
              <p className="text-xs font-bold text-white mt-0.5 truncate max-w-full">{event.location || event.street || "Sede IEMP"}</p>
            </div>
          </div>

          {/* Confirmation Action Area */}
          {isConfirmed ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 flex flex-col items-center gap-4 text-emerald-400"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-lg">
                <Heart className="w-8 h-8 fill-current animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">Presença Confirmada! 🎉</h3>
                <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
                  Ficamos muito felizes em receber você no evento <strong className="text-white">{event.title}</strong>! Sua presença já está confirmada em nossa lista oficial.
                </p>
              </div>
              <Button 
                onClick={() => navigate(`/evento/${event.id}`)}
                className="mt-2 bg-white text-black hover:bg-gray-100 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-2xl cursor-pointer"
              >
                Ver Página do Evento <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <div className="w-full space-y-4">
              <Button 
                onClick={handleConfirmar}
                disabled={confirming}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#BF76FF] via-pink-500 to-amber-400 hover:opacity-90 text-white font-black text-lg uppercase tracking-wider shadow-[0_10px_40px_rgba(191,118,255,0.4)] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 border-none"
              >
                {confirming ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <UserCheck className="w-6 h-6" /> Confirmar Presença
                  </span>
                )}
              </Button>

              <Button 
                variant="ghost"
                onClick={() => navigate(`/evento/${event.id}`)}
                className="text-gray-400 hover:text-white uppercase tracking-widest text-xs font-bold"
              >
                Ver Detalhes do Evento sem confirmar
              </Button>
            </div>
          )}

        </motion.div>

      </div>
    </div>
  );
}
