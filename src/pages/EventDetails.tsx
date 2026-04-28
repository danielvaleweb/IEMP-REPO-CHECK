import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Calendar, Clock, MapPin, Tag, Download, Lock, CheckCircle2, MessageCircle, Mail, ThumbsUp, Eye, Share, X, ChevronLeft, ChevronRight, Heart, Headset, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { handleFirestoreError, OperationType } from "@/lib/firebase";
import confetti from "canvas-confetti";
import Navbar from "@/components/layout/Navbar";
import CreatePhotoModal from "@/components/CreatePhotoModal";

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

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [visiblePhotosCount, setVisiblePhotosCount] = useState(4);
  const [isPastEvent, setIsPastEvent] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500); // Give it time to load and render photo gallery
    } else {
      window.scrollTo(0, 0);
    }

    const fetchEvent = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEvent({ id: docSnap.id, ...data });

          let eventDate = new Date(0);
          let displayDate = data.date || "";
          if (displayDate.includes(' - ')) displayDate = displayDate.split(' - ')[0];
          if (displayDate) {
            const dateString = displayDate.replace(/T.*$/, '').replace(/\s+/g, '');
            const dateParts = dateString.split(/[-/]/);
            if (dateParts.length >= 2) {
              let year, month, day;
              if (dateParts[0].length === 4) {
                year = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
                day = parseInt(dateParts[2] || "1");
              } else {
                day = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
                year = new Date().getFullYear();
                if (dateParts.length >= 3) {
                  year = parseInt(dateParts[2]);
                  if (year < 100) year += 2000;
                }
              }
              if (!isNaN(day) && !isNaN(month)) {
                eventDate = new Date(year, month, day);
              }
            }
          }
          const now = new Date();
          now.setHours(0,0,0,0);
          setIsPastEvent(eventDate < now);
        }
        
        if (user) {
          const attendeeRef = doc(db, "posts", id, "attendees", user.uid);
          const attendeeSnap = await getDoc(attendeeRef);
          setIsConfirmed(attendeeSnap.exists());
        }

        // Fetch feedbacks
        try {
          const q = query(collection(db, "event_feedbacks"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          const eventFeedbacks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((f: any) => f.eventId === id);
          setFeedbacks(eventFeedbacks);
          
          let localHasGiven = localStorage.getItem(`feedback_${id}`) === 'true';
          if (user) {
            if (eventFeedbacks.find((f: any) => f.userId === user.uid)) {
              localHasGiven = true;
            }
          }
          setHasGivenFeedback(localHasGiven);
        } catch(e) {
          console.error("Error fetching feedbacks", e);
        }

      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  const toggleConfirmation = async () => {
    if (isPastEvent) {
      if (hasGivenFeedback) return;
      setIsFeedbackModalOpen(true);
      return;
    }

    if (!user) {
      navigate("/admin"); // Redirect to login
      return;
    }
    
    setConfirming(true);
    try {
      if (!id) return;
      const attendeeRef = doc(db, "posts", id, "attendees", user.uid);
      if (isConfirmed) {
        await deleteDoc(attendeeRef);
        setIsConfirmed(false);
      } else {
        await setDoc(attendeeRef, { 
          name: profile?.name || user.displayName || "Usuário", 
          photo: profile?.photoURL || user.photoURL || "",
          confirmedAt: new Date().toISOString()
        });
        setIsConfirmed(true);
        playSuccessSound();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#BF76FF', '#EC4899', '#ffffff']
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${id}/attendees`);
    } finally {
      setConfirming(false);
    }
  };

  const submitFeedback = async () => {
    if (!id || feedbackRating === 0) return;
    setSubmittingFeedback(true);
    try {
      const feedbackData = {
        eventId: id,
        rating: feedbackRating,
        comment: feedbackComment,
        userId: user?.uid || "anonymous",
        userName: profile?.name || user?.displayName || "Anônimo",
        userPhoto: profile?.photoURL || user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anon",
        createdAt: serverTimestamp(),
        date: new Date().toISOString()
      };

      await addDoc(collection(db, "event_feedbacks"), feedbackData);
      
      setFeedbacks([{ id: Date.now().toString(), ...feedbackData, createdAt: { toDate: () => new Date() } }, ...feedbacks]);
      setHasGivenFeedback(true);
      localStorage.setItem(`feedback_${id}`, 'true');
      setIsFeedbackModalOpen(false);
      playSuccessSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#BF76FF', '#EC4899', '#ffffff']
      });
    } catch(err) {
      console.error(err);
      alert("Erro ao enviar feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const sharePhoto = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fototeca do Evento',
          text: 'Encontrei essa foto no evento, confira!',
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link da imagem copiado!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#190022] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#BF76FF] border-t-transparent rounded-full font-bold animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#190022] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Evento não encontrado</h2>
        <Button onClick={() => navigate("/")} variant="outline" className="border-[#BF76FF] text-white">Voltar para o Início</Button>
      </div>
    );
  }

  let displayDate = event.date || "";
  let startTime = "";
  let endTime = event.endTime || "";

  if (displayDate.includes('T')) {
    const parts = displayDate.split('T');
    displayDate = parts[0].split('-').reverse().join('/');
    startTime = parts[1].substring(0, 5);
  } else if (displayDate.includes(' - ')) {
    const parts = displayDate.split(' - ');
    displayDate = parts[0];
    startTime = parts[1];
    if (parts.length > 2) endTime = parts[2];
  }

  const navigateToMaps = () => {
    if (!event.location && !event.street) return;
    const loc = event.location || `${event.street || ''} ${event.streetNumber || ''} ${event.city || ''}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    window.open(url, '_blank');
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeVideoId(event.youtubeLink);

  const guests = event.guests || [];
  const organizerDisplay = event.organizer || event.organization || "Organizador Local";
  const organizerImage = event.organizerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(organizerDisplay)}&background=BF76FF&color=fff&size=512`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C0037] to-[#10001D] text-white font-sans selection:bg-[#BF76FF]/40 selection:text-white relative overflow-hidden flex flex-col pb-32">
      <Navbar />
      {/* Background Grid */}
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
      
      {/* Navigation Top Bar */}
      <div className="fixed top-20 md:top-24 left-0 w-full p-4 md:p-6 z-40 flex justify-between items-center pointer-events-none">
        {/* Navigation bar removed as requested */}
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-8 pt-24 md:pt-32 relative z-10 flex flex-col items-center">
        {/* Title */}
        <div className="text-left w-full mb-12 flex flex-col items-start">
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#BF76FF] mb-4 text-left"
          >
            Apresenta
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut", type: "spring", bounce: 0.4 }}
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] drop-shadow-2xl text-white uppercase text-left w-full block"
          >
            {event.title}
          </motion.h1>
          {event.content && (
             <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4, duration: 0.8 }}
               className="mt-8 text-gray-300 md:text-xl max-w-3xl leading-relaxed border-l-2 border-[#BF76FF] pl-4 text-left"
             >
               {event.content}
             </motion.p>
          )}
        </div>

        {/* Content Structure */}
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center mt-4">
          
          {/* Guests Grid - Left Side */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
             {guests.map((guest: any, idx: number) => {
               const colors = [
                 { bg: "bg-pink-500", shadow: "shadow-[0_0_20px_rgba(236,72,153,0.3)] group-hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]" },
                 { bg: "bg-purple-600", shadow: "shadow-[0_0_20px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_40px_rgba(147,51,234,0.6)]" },
                 { bg: "bg-orange-500", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_40px_rgba(249,115,22,0.6)]" },
                 { bg: "bg-teal-500", shadow: "shadow-[0_0_20px_rgba(20,184,166,0.3)] group-hover:shadow-[0_0_40px_rgba(20,184,166,0.6)]" },
                 { bg: "bg-blue-600", shadow: "shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]" },
                 { bg: "bg-yellow-500", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.3)] group-hover:shadow-[0_0_40px_rgba(234,179,8,0.6)]" }
               ];
               const theme = colors[idx % colors.length];
               return (
                 <motion.div 
                   key={`guest-detail-${guest.name}-${idx}`}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.1 }}
                   className="flex flex-col items-center group relative cursor-pointer"
                 >
                   <div 
                     className={cn(
                       "w-full aspect-square rounded-[30px] overflow-hidden mb-3 relative transition-all duration-500 group-hover:-translate-y-2 border-2 border-white/10",
                       theme.shadow
                     )}
                   >
                     {guest.image ? (
                       <img src={guest.image} alt={guest.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                     ) : (
                       <div className={cn("w-full h-full flex items-center justify-center text-white/50 text-4xl font-black", theme.bg)}>{guest.name?.charAt(0)}</div>
                     )}
                   </div>
                   <h4 className="text-white font-light uppercase text-sm md:text-base text-center leading-tight tracking-tight mt-2">{guest.name}</h4>
                   <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1 text-center">{guest.role}</p>
                 </motion.div>
               );
             })}
          </div>

          {/* Organizer Card - Right Side */}
          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 mt-8 lg:mt-0 flex justify-center lg:justify-end">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.8 }}
               className="relative overflow-hidden group w-full aspect-[4/5] rounded-[40px]"
             >
               <div className="absolute inset-0 bg-gradient-to-t from-[#10001D]/90 via-transparent to-transparent z-10 pointer-events-none rounded-[40px]" />
               <img src={organizerImage} alt={organizerDisplay} className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none rounded-[40px]" />
               <div className="absolute bottom-6 left-0 w-full text-center z-20 px-6">
                 <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-lg">{organizerDisplay}</h3>
                 <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mt-2 drop-shadow-lg">Organizador (Convener)</p>
               </div>
             </motion.div>
          </div>
        </div>

        {/* Info & Call to Action Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full mt-16 md:mt-24 bg-[#10001D]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] md:rounded-[40px] p-6 lg:p-8 flex flex-col items-center relative overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
           
           <div className="flex flex-col xl:flex-row gap-8 lg:gap-12 w-full items-center justify-between text-white relative z-10">
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 items-center justify-center xl:justify-start w-full md:w-auto">
                 {/* Box 1 (Data) */}
                 <div className="flex items-center gap-4 text-left md:border-r border-white/10 md:pr-8 lg:pr-12 w-full md:w-auto">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      <Calendar className="w-5 h-5 text-[#BF76FF]" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Data</p>
                      <h4 className="text-xl md:text-2xl font-black leading-none text-white">{displayDate || "TBA"}</h4>
                    </div>
                 </div>
                 
                 {/* Box 2 (Hora) */}
                 <div className="flex items-center gap-4 text-left md:border-r border-white/10 md:pr-8 lg:pr-12 w-full md:w-auto">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      <Clock className="w-5 h-5 text-[#BF76FF]" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Hora</p>
                      <h4 className="text-xl md:text-2xl font-black leading-none text-white">{startTime || "--:--"}</h4>
                    </div>
                 </div>

                 {/* Box 3 (Local) */}
                 <div className="flex items-center gap-4 text-left w-full md:w-auto">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      <MapPin className="w-5 h-5 text-[#BF76FF]" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Localização</p>
                      <h4 className="text-sm md:text-base lg:text-xl font-bold leading-tight max-w-[200px] text-white truncate">{event.location || event.street || "Sede IEMP"}</h4>
                    </div>
                 </div>
              </div>

              <Button 
                onClick={navigateToMaps}
                size="lg"
                className="w-full xl:w-auto h-14 xl:px-10 rounded-2xl font-black text-sm lg:text-base transition-all duration-300 uppercase tracking-widest bg-green-500 hover:bg-green-600 text-white shadow-lg shrink-0 cursor-pointer border-none"
              >
                Ver no Mapa
              </Button>
           </div>
        </motion.div>
        
        {/* Quick Action Buttons Space */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full flex flex-col md:flex-row items-center justify-center gap-4 mt-8"
        >
           <Button 
             onClick={toggleConfirmation}
             disabled={confirming || (isPastEvent && hasGivenFeedback)}
             className={cn(
               "w-full md:w-auto h-16 px-10 rounded-2xl font-black text-xl transition-all duration-300 uppercase tracking-tight relative overflow-hidden shrink-0 z-10 cursor-pointer",
               (isConfirmed || (isPastEvent && hasGivenFeedback)) 
                 ? (isPastEvent && hasGivenFeedback ? "bg-white text-black hover:bg-gray-100" : "bg-green-500 hover:bg-green-600 text-white") 
                 : "bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:opacity-90 text-white shadow-[0_10px_40px_rgba(191,118,255,0.4)]"
             )}
           >
             <span className="relative z-10 flex items-center gap-3">
               {confirming ? (
                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
               ) : isPastEvent ? (
                 hasGivenFeedback ? (
                   <>
                     <CheckCircle2 className="w-8 h-8 text-green-500" /> Eu fui!
                   </>
                 ) : (
                   <><CheckCircle2 className="w-8 h-8" /> Eu fui!</>
                 )
               ) : isConfirmed ? (
                 <>
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
                     <ThumbsUp className="w-8 h-8" />
                   </motion.div>
                   Tô dentro!
                 </>
               ) : (
                 <>Eu vou</>
               )}
             </span>
           </Button>

           <Button 
             onClick={() => setIsPhotoModalOpen(true)}
             disabled={isPastEvent}
             className={cn(
               "w-full md:w-auto h-16 px-10 rounded-2xl font-black text-lg transition-all duration-300 uppercase tracking-tight shadow-[0_10px_40px_rgba(255,255,255,0.2)] cursor-pointer",
               isPastEvent ? "bg-gray-600/50 text-gray-400 cursor-not-allowed shadow-none border border-white/5" : "bg-white hover:bg-gray-100 text-[#10001D]"
             )}
           >
             <span className="relative z-10 flex items-center gap-3">
               <Eye className="w-6 h-6" />
               Criar minha foto
             </span>
           </Button>
        </motion.div>

        {/* Feedbacks Display Area */}
        {isPastEvent && feedbacks.length > 0 && (
          <div className="w-full flex justify-center w-full max-w-4xl mx-auto mt-12 mb-4 px-4">
             <div className="w-full bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 max-h-[800px] overflow-y-auto border border-white/10">
                <h4 className="text-xl font-bold text-white uppercase tracking-widest text-center mb-6">O que a galera achou</h4>
                <div className="space-y-4">
                  {feedbacks.map((f, idx) => (
                    <div key={idx} className="bg-black/40 rounded-2xl p-4 flex gap-4 items-start border border-white/5">
                      <img src={f.userPhoto || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anon"} alt={f.userName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{f.userName}</p>
                        <div className="flex text-yellow-400 mb-2 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-3 h-3", i < f.rating ? "fill-current" : "text-gray-600")} />
                          ))}
                        </div>
                        {f.comment && <p className="text-gray-300 text-sm whitespace-pre-wrap">{f.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Video Area */}
        {youtubeId && (
           <div className="w-full mt-24">
             <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-8 gap-4">
               <div className="flex items-center gap-4 w-full">
                 <div className="w-8 h-[2px] bg-[#BF76FF]" />
                 <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white/90">Vídeo do Evento</h3>
               </div>
             </div>
             <div className="aspect-video w-full rounded-[30px] md:rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl">
               <iframe
                 src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                 className="w-full h-full relative z-10"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             </div>
           </div>
        )}

        {/* Photo Gallery Area */}
        {event.gallery && Array.isArray(event.gallery) && event.gallery.length > 0 && (
           <div id="galeria" className="w-full mt-24 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
            <div className="flex flex-col items-start w-full mb-12">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-8 h-[2px] bg-[#BF76FF]" />
                <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white">
                  Fototeca do Evento
                </h3>
              </div>
              <p className="text-gray-400 mt-2 max-w-lg mb-4 ml-12">Encontre a sua, mande para um amigo.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[240px] gap-3 md:gap-4 relative group/gallery z-10">
              
              {/* Blur Overlay for Guests */}
              {!user && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-x-0 inset-y-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-md rounded-[2.5rem]"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 20 }}
                    className="relative bg-[#10001D]/80 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center gap-6 max-w-sm"
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-[#BF76FF]/20 flex items-center justify-center text-[#BF76FF] mb-2 border border-[#BF76FF]/30">
                       <Lock className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-black uppercase tracking-tighter text-white">Fotos Restritas</p>
                      <p className="text-sm font-medium text-gray-400 leading-relaxed">Faça login para ver e baixar todas as fotos deste evento.</p>
                    </div>
                    <Button 
                      onClick={() => navigate("/admin")} 
                      className="bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:opacity-90 text-white shadow-2xl h-14 px-10 rounded-2xl w-full uppercase tracking-widest text-xs font-black transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      Fazer Login
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {event.gallery.slice(0, visiblePhotosCount).map((url: string, index: number) => {
                let spanClasses = "col-span-1 row-span-1";
                if (index % 7 === 0) spanClasses = "col-span-2 row-span-2"; // Big Focus
                else if (index % 7 === 3) spanClasses = "col-span-2 row-span-1"; // Wide
                else if (index % 7 === 5) spanClasses = "col-span-1 row-span-2"; // Tall
                
                return (
                  <div 
                    key={`event-gallery-${url}-${index}`} 
                    className={cn(
                      "rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/5 group relative transition-all duration-500",
                      spanClasses,
                      !user && "filter blur-xl opacity-50 cursor-not-allowed scale-[0.98]",
                      user && "hover:shadow-[0_20px_50px_rgba(191,118,255,0.2)] cursor-pointer hover:z-10 hover:scale-[1.02] border border-white/10"
                    )}
                    onClick={() => user && setSelectedPhotoIndex(index)}
                  >
                    <div className="absolute inset-0 bg-[#BF76FF]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 mix-blend-overlay pointer-events-none" />
                    <img 
                      src={url} 
                      alt={`Galeria ${index + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    
                    {user && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none gap-3">
                        <Button 
                          className="pointer-events-auto bg-white backdrop-blur-md hover:bg-gray-200 text-black border-none rounded-full w-12 h-12 p-0 shadow-2xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhotoIndex(index);
                          }}
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                        <Button 
                          className="pointer-events-auto bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:opacity-90 text-white border-none rounded-full w-12 h-12 p-0 shadow-2xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            sharePhoto(url);
                          }}
                        >
                          <Share className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {visiblePhotosCount < event.gallery.length && (
              <div className="w-full flex justify-center mt-8 relative z-20">
                <Button
                  onClick={() => setVisiblePhotosCount((prev) => prev + 12)}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full px-8 py-3 h-auto uppercase tracking-widest text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                >
                  Exibir mais
                </Button>
              </div>
            )}
           </div>
        )}

        {/* Contact Buttons Space */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full flex flex-col mt-24 items-end text-right"
        >
           <div className="flex items-center gap-4 mb-6 justify-end w-full">
             <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Ficou alguma dúvida?</p>
             <div className="w-8 h-[2px] bg-[#BF76FF]" />
           </div>
           <div className="flex flex-col sm:flex-row items-center justify-end gap-4 w-full sm:w-auto">
             <Button onClick={() => window.open('https://api.whatsapp.com/send?phone=5532998288650', '_blank')} className="bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:from-green-500 hover:to-green-500 hover:text-white hover:shadow-green-500/30 active:scale-95 text-white border-none rounded-xl h-12 px-8 font-bold flex items-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg shadow-purple-500/20 transition-all group">
               <MessageCircle className="w-4 h-4" /> WhatsApp
             </Button>
             <Button onClick={() => window.open('mailto:contato@ministerioprofecia.com.br')} className="bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:from-white hover:to-white hover:text-black hover:shadow-white/30 active:scale-95 text-white border-none rounded-xl h-12 px-8 font-bold flex items-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg shadow-purple-500/20 transition-all group">
               <Headset className="w-4 h-4" /> Suporte
             </Button>
           </div>
        </motion.div>
      </div>

      {/* Gallery Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && event.gallery && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            {/* Top Bar inside Modal */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-white/50 font-bold text-sm tracking-widest uppercase">
                {selectedPhotoIndex + 1} / {event.gallery.length}
              </span>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => sharePhoto(event.gallery[selectedPhotoIndex])}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0 cursor-pointer"
                >
                  <Share className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => alert("Favoritado! (funcionalidade em desenvolvimento)")}
                  className="bg-white/10 hover:bg-pink-500/20 text-white hover:text-pink-500 rounded-full w-12 h-12 p-0 cursor-pointer"
                >
                  <Heart className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="bg-white/10 hover:bg-red-500/80 text-white rounded-full w-12 h-12 p-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Prev Button */}
            {selectedPhotoIndex > 0 && (
              <Button 
                variant="ghost" 
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-14 h-14 p-0 backdrop-blur-md cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex - 1); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Next Button */}
            {selectedPhotoIndex < event.gallery.length - 1 && (
              <Button 
                variant="ghost" 
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-14 h-14 p-0 backdrop-blur-md cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex + 1); }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            <motion.div 
              key={selectedPhotoIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full p-4 md:p-20 flex items-center justify-center cursor-pointer"
              onClick={() => setSelectedPhotoIndex(null)}
            >
              <img 
                src={event.gallery[selectedPhotoIndex]} 
                alt="Fullscreen Gallery Preview" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                onClick={(e) => e.stopPropagation()} // prevent close on clicking image
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreatePhotoModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => setIsPhotoModalOpen(false)} 
        eventTitle={event.title} 
        frameUrl={event.frameUrl}
      />

      <AnimatePresence>
        {isFeedbackModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
             <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[40px] shadow-2xl relative">
                <Button 
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="absolute top-4 right-4 bg-white/5 hover:bg-white/20 text-white w-10 h-10 rounded-full p-0 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </Button>
                <h3 className="text-2xl font-black text-white text-center tracking-tighter uppercase mb-2">Avalie o Evento</h3>
                <p className="text-gray-400 text-center text-sm mb-6">Como foi sua experiência?</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star className={cn("w-10 h-10", feedbackRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-600")} />
                    </button>
                  ))}
                </div>
                <textarea 
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Deixe um comentário (opcional)"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white resize-none h-28 focus:outline-none focus:border-[#BF76FF] transition-colors mb-6"
                />
                <Button 
                  onClick={submitFeedback}
                  disabled={submittingFeedback || feedbackRating === 0}
                  className="w-full bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:opacity-90 text-white font-black uppercase tracking-widest h-14 rounded-2xl transition-all shadow-xl disabled:opacity-50"
                >
                  {submittingFeedback ? "Enviando..." : "Enviar Avaliação"}
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
