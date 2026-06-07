import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, addDoc, query, orderBy, serverTimestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Calendar, Clock, MapPin, Tag, Download, Lock, CheckCircle2, MessageCircle, Mail, ThumbsUp, Eye, Share, X, ChevronLeft, ChevronRight, Heart, Headset, Star, User, Info, AlertCircle, Share2, Copy, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getImageUrl } from "@/lib/utils";
import { handleFirestoreError, OperationType } from "@/lib/firebase";
import confetti from "canvas-confetti";
import Navbar from "@/components/layout/Navbar";
import CreatePhotoModal from "@/components/CreatePhotoModal";
import { firestoreService } from "@/services/firestoreService";
import { useCachedDoc, useCachedCollection } from "@/hooks/useFirestore";
import { appAlert } from "@/lib/modalHelpers";

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
  const { favoriteIds, toggleFavorite: toggleFavoriteCtx } = useFavorites();
  
  // Use Cached Hooks
  const { data: eventPost, loading: loadingPost } = useCachedDoc<any>("posts", id || "");
  const { data: eventAgenda, loading: loadingAgenda } = useCachedDoc<any>("agenda", id || "");
  const { data: eventAgendaDirecao, loading: loadingAgendaDirecao } = useCachedDoc<any>("agenda-direcao", id || "");
  const event = eventPost || eventAgenda || eventAgendaDirecao;
  const loadingEvent = (loadingPost || loadingAgenda || loadingAgendaDirecao) && !event;
  const { data: allFeedbacks } = useCachedCollection<any>("event_feedbacks", [orderBy("createdAt", "desc")], 1000 * 60 * 15);
  
  const getLightboxPhotos = () => {
    const photos: string[] = [];
    if (event?.gallery && Array.isArray(event.gallery)) {
      photos.push(...event.gallery);
    }
    if (event?.driveFolders && Array.isArray(event.driveFolders)) {
      event.driveFolders.forEach((folder: any) => {
        if (folder.images && Array.isArray(folder.images)) {
          folder.images.forEach((imgId: string) => {
            photos.push(`https://drive.google.com/thumbnail?id=${imgId}&sz=w2000`);
          });
        }
      });
    }
    return photos;
  };

  const lightboxPhotos = getLightboxPhotos();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileShare, setShowMobileShare] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setShowMobileShare(false);
  }, [selectedPhotoIndex]);

  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);

  const handleDrag = (_event: any, info: any) => {
    const dragThreshold = 15;
    if (info.offset.x < -dragThreshold) {
      setDragDirection("left");
    } else if (info.offset.x > dragThreshold) {
      setDragDirection("right");
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (_event: any, info: any) => {
    setDragDirection(null);
    const photos = lightboxPhotos;
    if (photos.length === 0) return;
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setSelectedPhotoIndex(i => i !== null && i < (photos.length - 1) ? i + 1 : 0);
    } else if (info.offset.x > swipeThreshold) {
      setSelectedPhotoIndex(i => i !== null && i > 0 ? i - 1 : (photos.length - 1));
    }
  };

  const handleToggleFavorite = (photoUrl: string) => {
    if (!event) return;
    toggleFavoriteCtx({
      id: photoUrl,
      title: event.title,
      thumbnail: photoUrl,
      published: event.date || new Date().toISOString(),
      link: photoUrl,
      category: "photo"
    });
  };

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [visiblePhotosCount, setVisiblePhotosCount] = useState(4);
  const [driveVisibleCounts, setDriveVisibleCounts] = useState<Record<number, number>>({});
  const [memberPhotos, setMemberPhotos] = useState<Record<string, string>>({});
  const [isPastEvent, setIsPastEvent] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [showSafariModal, setShowSafariModal] = useState(false);

  // Removal request states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRemovedFeedback, setShowRemovedFeedback] = useState(false);

  const handleRequestRemoval = async (photoUrl: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "photo_removals"), {
        photoUrl,
        albumId: id,
        requestedBy: user.uid,
        requestedByName: profile?.name || "Visitante",
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        userId: "admin",
        title: "Solicitação de Remoção de Foto",
        message: `${profile?.name || "Um usuário"} solicitou a remoção de uma foto no evento "${event?.title}".`,
        type: "gallery_removal",
        photoUrl,
        albumId: id,
        read: false,
        createdAt: serverTimestamp()
      });

      setShowInfoModal(false);
      setShowRemovedFeedback(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch member photos from Firestore (dashboard photos)
  useEffect(() => {
    const ids = (event?.invitedMembers || []).map((m: any) => m.id).filter(Boolean);
    if (ids.length === 0) return;
    const fetchPhotos = async () => {
      const photos: Record<string, string> = {};
      await Promise.all(ids.map(async (memberId: string) => {
        try {
          const snap = await getDoc(doc(db, 'members', memberId));
          if (snap.exists()) {
            const data = snap.data();
            if (data.photoURL) photos[memberId] = data.photoURL;
          }
        } catch {}
      }));
      setMemberPhotos(photos);
    };
    fetchPhotos();
  }, [event?.invitedMembers]);

  // Derived state for current event feedbacks
  useEffect(() => {
    if (allFeedbacks && id) {
      const filtered = allFeedbacks.filter((f: any) => f.eventId === id);
      setFeedbacks(filtered);
      
      let localHasGiven = localStorage.getItem(`feedback_${id}`) === 'true';
      if (user && filtered.find((f: any) => f.userId === user.uid)) {
        localHasGiven = true;
      }
      setHasGivenFeedback(localHasGiven);
    }
  }, [allFeedbacks, id, user]);

  useEffect(() => {
    if (event) {
      const isWorship = event.typeEvent === 'culto' || event.title?.toLowerCase().includes('culto') || event.title?.toLowerCase().includes('cilto');
      if (isWorship) {
        navigate('/galeria', { state: { selectedAlbumId: event.id }, replace: true });
        return;
      }

      let eventDate = new Date(0);
      let displayDate = event.date || "";
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
            let hours = 0;
            let minutes = 0;
            if (event.time) {
              const timeParts = event.time.toString().split(':');
              if (timeParts.length >= 2) {
                hours = parseInt(timeParts[0]);
                minutes = parseInt(timeParts[1]);
              }
            }
            eventDate = new Date(year, month, day, hours, minutes);
          }
        }
      }
      const now = new Date();
      // Add a 2-hour buffer so it changes to "Eu fui" 2 hours after the event start time
      const eventEndTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
      setIsPastEvent(eventEndTime < now);
    }
  }, [event, navigate]);

  useEffect(() => {
    const fetchAttendeeStatus = async () => {
      if (user && id) {
        try {
          const attendeeSnap = await firestoreService.getDoc<any>(`posts/${id}/attendees`, user.uid, 1000 * 60 * 10);
          setIsConfirmed(!!attendeeSnap);
        } catch (e) {
          console.error("Error fetching attendee status", e);
        }
      }
    };
    fetchAttendeeStatus();
  }, [user, id]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

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
          name: profile?.name || user.displayName || "Visitante", 
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

  const WatermarkOverlay = ({ title, size = "normal" }: { title: string, size?: "normal" | "large" }) => (
    <div className={cn(
      "absolute pointer-events-none select-none opacity-20 text-white flex flex-col items-center justify-center z-10 w-full",
      size === "large" ? "inset-0" : "bottom-6 left-0 right-0"
    )}>
      <div className="flex flex-col items-center">
        <p className={cn(
          "font-black uppercase tracking-tighter text-white whitespace-nowrap px-4",
          size === "large" ? "text-4xl md:text-6xl" : "text-[10px] md:text-xs text-center"
        )}>
          {title}
        </p>
        <div className={cn(
          "flex items-center mt-0.5",
          size === "large" ? "text-xl md:text-3xl" : "text-[6px] md:text-[8px]"
        )}>
          <span className="text-white font-extralight tracking-tight uppercase">Ministério</span>
          <span className="text-white font-bold tracking-tight ml-1 uppercase">Profecia</span>
        </div>
      </div>
    </div>
  );

  const submitFeedback = async () => {
    if (!id || feedbackRating === 0) return;
    setSubmittingFeedback(true);
    try {
      const feedbackData = {
        eventId: id,
        rating: feedbackRating,
        comment: feedbackComment,
        userId: user?.uid || "anonymous",
        userName: profile?.name || user?.displayName || "Visitante",
        userPhoto: profile?.photoURL || user?.photoURL || "",
        createdAt: serverTimestamp(),
        date: new Date().toISOString()
      };

      await addDoc(collection(db, "event_feedbacks"), feedbackData);
      
      // Notify Administrators
      try {
        await addDoc(collection(db, "notifications"), {
          userId: "admin",
          title: "Nova Avaliação de Evento",
          message: `${profile?.name || user?.displayName || "Visitante"} avaliou o evento "${event?.title || 'um evento'}" com ${feedbackRating} estrelas.\n\n${feedbackComment ? `""${feedbackComment}""` : ""}`,
          type: "event_feedback",
          eventId: id,
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Error creating notification: ", e);
      }
      
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
      appAlert("Erro ao enviar feedback", "error");
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
      appAlert("Link da imagem copiado!", "success");
    }
  };

  const downloadPhoto = async (photoUrl: string, eventTitle: string) => {
    setDownloadingUrl(photoUrl);
    try {
      const realUrl = getImageUrl(photoUrl);
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(realUrl)}&output=jpeg&cors=1`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Proxy failed");
      const imageBlob = await response.blob();
      const localUrl = URL.createObjectURL(imageBlob);

      const img = new Image();
      img.src = localUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark Config
      const fontSize = Math.max(img.width * 0.04, 60);
      ctx.globalAlpha = 0.5; // Optional watermark opacity 
      ctx.fillStyle = "white";
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      const margin = fontSize * 1.5;
      const text = eventTitle.toUpperCase();
      const x = canvas.width / 2;
      const y = canvas.height - margin;
      
      // Draw Shadow for readability
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      
      // Draw Text
      ctx.fillText(text, x, y);
      
      // Small Subtitle
      ctx.font = `300 ${fontSize * 0.4}px "Inter", sans-serif`;
      ctx.fillText("MINISTÉRIO PROFECIA", x, y + (fontSize * 0.5));

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `profecia-${eventTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(localUrl);
      }
    } catch (error) {
      console.error("Erro ao baixar imagem:", error);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSafari = /^((?!chrome|crios|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS && isSafari) {
        setShowSafariModal(true);
        setDownloadingUrl(null);
        return;
      }

      const realUrl = getImageUrl(photoUrl);
      const match = realUrl.match(/[?&]id=([^&]+)/) || realUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Redireciona diretamente para o link de download nativo do Drive, que obriga o celular a baixar o arquivo
        window.location.href = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      } else {
        const a = document.createElement("a");
        a.href = realUrl;
        a.download = `foto-${Date.now()}.jpg`;
        a.target = "_top";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloadingUrl(null);
    }
  };

  if (loadingEvent) {
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
  const invitedMembers = event.invitedMembers || [];
  // Organizer card only shows when both name (organizer field specifically) AND image are filled
  const hasOrganizer = Boolean(event.organizer && event.organizerImage);
  const organizerDisplay = event.organizer || "";
  const organizerImage = event.organizerImage || "";

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
                   <div className="relative w-full aspect-square mb-3">
                     {/* Adaptive Glow */}
                     {guest.image && (
                       <div 
                         className="absolute inset-4 blur-2xl opacity-0 group-hover:opacity-70 transition-all duration-500 rounded-[30px] z-0 scale-110"
                         style={{ 
                           backgroundImage: `url(${guest.image})`, 
                           backgroundSize: 'cover',
                           backgroundPosition: 'center' 
                         }} 
                       />
                     )}
                     
                     <div 
                       className={cn(
                         "w-full h-full rounded-[30px] overflow-hidden relative transition-all duration-500 group-hover:-translate-y-2 z-10 bg-[#10001D]",
                         !guest.image && theme.shadow
                       )}
                     >
                       {guest.image ? (
                         <img src={getImageUrl(guest.image)} alt={guest.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                       ) : (
                         <div className={cn("w-full h-full flex items-center justify-center text-white/50 text-4xl font-black", theme.bg)}>{guest.name?.charAt(0)}</div>
                       )}
                     </div>
                   </div>
                   <h4 className="text-white font-light uppercase text-sm md:text-base text-center leading-tight tracking-tight mt-2">{guest.name}</h4>
                   <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1 text-center">{guest.role}</p>
                 </motion.div>
               );
             })}
          </div>

          {/* Organizer Card - Right Side (only when image AND name are filled) */}
          {hasOrganizer && (
            <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 mt-8 lg:mt-0 flex justify-center lg:justify-end">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.8 }}
                 className="relative overflow-hidden group w-full aspect-[4/5] rounded-[40px]"
               >
                 <div className="absolute inset-0 bg-gradient-to-t from-[#10001D]/90 via-transparent to-transparent z-10 pointer-events-none rounded-[40px]" />
                 <img src={getImageUrl(organizerImage)} alt={organizerDisplay} className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none rounded-[40px]" />
                 <div className="absolute bottom-6 left-0 w-full text-center z-20 px-6">
                   <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-lg">{organizerDisplay}</h3>
                   <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mt-2 drop-shadow-lg">Organizador (Convener)</p>
                 </div>
               </motion.div>
            </div>
          )}
        </div>

        {/* Invited Members Section — Photo bubbles only */}
        {invitedMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full mt-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-[2px] bg-[#BF76FF]" />
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                {isPastEvent ? 'Membros que foram.' : 'Membros que Vão!'}
              </h3>
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{invitedMembers.length} {isPastEvent ? 'participaram' : 'confirmados'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {invitedMembers.map((m: any, idx: number) => {
                const photo = memberPhotos[m.id] || m.photoURL;
                return (
                  <motion.div
                    key={`invited-${m.id || idx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03, type: 'spring', bounce: 0.4 }}
                    className="relative group cursor-default"
                  >
                    {/* Avatar */}
                    {photo ? (
                      <img
                        src={getImageUrl(photo)}
                        alt={m.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#BF76FF]/40 group-hover:border-[#BF76FF] group-hover:scale-110 transition-all duration-300 shadow-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF76FF] to-pink-500 flex items-center justify-center text-white font-black text-base border-2 border-[#BF76FF]/40 group-hover:border-[#BF76FF] group-hover:scale-110 transition-all duration-300 shadow-lg">
                        {m.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    {/* Rich tooltip with photo + name */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex flex-col items-center gap-2">
                      <div className="bg-black/95 backdrop-blur border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-2xl min-w-[90px]">
                        {photo ? (
                          <img src={getImageUrl(photo)} alt={m.name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#BF76FF] to-pink-500 flex items-center justify-center text-white font-black text-2xl">
                            {m.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <p className="text-white text-[10px] font-bold whitespace-nowrap text-center leading-tight">{m.name}</p>
                      </div>
                      <div className="w-2 h-2 bg-black/95 rotate-45 border-b border-r border-white/10" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

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

           {event?.moldura && (
             <Button 
               onClick={() => setIsPhotoModalOpen(true)}
               disabled={isPastEvent}
               className={cn(
                 "w-full md:w-auto h-16 px-10 rounded-2xl font-black text-lg transition-all duration-300 uppercase tracking-tight shadow-[0_10px_40px_rgba(255,255,255,0.2)] cursor-pointer",
                 isPastEvent ? "bg-gray-600/50 text-gray-400 cursor-not-allowed shadow-none border border-white/5" : "bg-white hover:bg-gray-100 text-[#10001D]"
               )}
             >
               <Eye className="w-5 h-5 mr-3" /> Criar Minha Foto
             </Button>
           )}
        </motion.div>

        {/* Feedbacks Display Area */}
        {isPastEvent && feedbacks.length > 0 && (
          <div className="w-full flex justify-center w-full max-w-4xl mx-auto mt-12 mb-4 px-4">
             <div className="w-full bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-white/10">
                <h4 className="text-xl font-bold text-white uppercase tracking-widest text-center mb-6">O que a galera achou</h4>
                <div className="space-y-4">
                  {feedbacks.map((f, idx) => {
                    const displayName = f.userName === "Anônimo" ? "Visitante" : f.userName;
                    const hasPhoto = f.userPhoto && !f.userPhoto.includes('dicebear');
                    
                    return (
                      <div key={idx} className="bg-black/40 rounded-2xl p-4 flex gap-4 items-start border border-white/5">
                        {hasPhoto ? (
                          <img src={getImageUrl(f.userPhoto)} alt={displayName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shrink-0">
                            <User className="w-6 h-6 text-zinc-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{displayName}</p>
                          <div className="flex text-yellow-400 mb-2 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn("w-3 h-3", i < f.rating ? "fill-current" : "text-gray-600")} />
                            ))}
                          </div>
                          {f.comment && <p className="text-gray-300 text-sm whitespace-pre-wrap">{f.comment}</p>}
                        </div>
                      </div>
                    );
                  })}
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
                    <WatermarkOverlay title={event.title} />
                    <img 
                      src={getImageUrl(url)} 
                      alt={`Galeria ${index + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-out"
                    />
                  </div>
                );
              })}
            </div>

            {visiblePhotosCount < event.gallery.length && (
              <div className="w-full flex justify-center mt-8 relative z-20">
                <Button
                  onClick={() => setVisiblePhotosCount((prev) => prev + 5)}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full px-8 py-3 h-auto uppercase tracking-widest text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                >
                  Exibir mais
                </Button>
              </div>
            )}
           </div>
        )}

        {/* Drive Folders Photo Gallery — one section per folder */}
        {event.driveFolders && Array.isArray(event.driveFolders) && event.driveFolders.some((f: any) => f.images && f.images.length > 0) && (() => {
          const foldersWithImages = event.driveFolders.filter((f: any) => f.images && f.images.length > 0);
          return (
            <div id="fototeca" className="w-full mt-24 space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">

              {/* Main heading */}
              <div className="flex flex-col items-start w-full">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-[2px] bg-[#BF76FF]" />
                  <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white">
                    Fototeca do Evento
                  </h3>
                </div>
                <p className="text-gray-400 mt-2 max-w-lg mb-4 ml-12">Encontre a sua, mande para um amigo.</p>
              </div>

              {foldersWithImages.map((folder: any, fi: number) => {
                const folderVisible = driveVisibleCounts[fi] ?? (isMobile ? 1 : 8);
                const visibleImages = folder.images.slice(0, folderVisible);
                const hasMore = folderVisible < folder.images.length;

                return (
                  <div key={`drive-folder-${fi}`}>
                    {/* Folder title — always shown */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-6 h-6 rounded-xl bg-[#BF76FF]/20 flex items-center justify-center border border-[#BF76FF]/30">
                        <div className="w-2 h-2 rounded-full bg-[#BF76FF]" />
                      </div>
                      <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                        {folder.title || `Pasta ${fi + 1}`}
                      </h4>
                      <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
                        {folder.images.length} fotos
                      </span>
                    </div>

                    {/* CSS Columns masonry — sem furos, sem spans variáveis */}
                    <div className="relative group/gallery z-10">

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

                      {/* Grid layout for sequential loading */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {visibleImages.map((imgId: string, index: number) => {
                          const thumbUrl = `https://drive.google.com/thumbnail?id=${imgId}&sz=w500`;
                          const fullUrl  = `https://drive.google.com/thumbnail?id=${imgId}&sz=w2000`;

                          return (
                            <div
                              key={`drive-img-${fi}-${imgId}-${index}`}
                              data-drive-img="true"
                              className={cn(
                                "rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/5 group relative transition-all duration-500 bg-white/[0.03]",
                                index === 0 ? "col-span-2 md:col-span-1 aspect-[4/3]" : "col-span-1 aspect-[4/3]",
                                !user && "filter blur-xl opacity-50 cursor-not-allowed",
                                user && "hover:shadow-[0_20px_50px_rgba(191,118,255,0.2)] cursor-pointer hover:z-10 border border-white/10"
                              )}
                              onClick={() => {
                                if (user) {
                                  const absIdx = lightboxPhotos.indexOf(fullUrl);
                                  if (absIdx !== -1) setSelectedPhotoIndex(absIdx);
                                }
                              }}
                            >
                              {/* Skeleton shimmer */}
                              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-white/[0.07] to-white/[0.03] animate-pulse" />
                              <WatermarkOverlay title={event.title} />
                              <img
                                src={thumbUrl}
                                alt={`Foto ${index + 1}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover block transition-transform duration-700 ease-out relative z-[1]"
                                onLoad={(e) => {
                                  const shimmer = (e.target as HTMLElement).previousElementSibling?.previousElementSibling as HTMLElement;
                                  if (shimmer) shimmer.style.display = 'none';
                                }}
                                onError={(e) => {
                                  const parent = (e.target as HTMLElement).closest('[data-drive-img]') as HTMLElement;
                                  if (parent) parent.style.display = 'none';
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* "Ver mais" button per folder */}
                    {hasMore && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setDriveVisibleCounts(prev => ({ ...prev, [fi]: (prev[fi] ?? (isMobile ? 1 : 8)) + 8 }))}
                          className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#BF76FF]/40 uppercase tracking-widest text-xs font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(191,118,255,0.15)] cursor-pointer"
                        >
                          <span>Ver mais</span>
                          <span className="text-white/40 font-normal">({folder.images.length - folderVisible} restantes)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}



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
             <Button onClick={() => window.open('https://api.whatsapp.com/send?phone=5532999194640', '_blank')} className="bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:from-green-500 hover:to-green-500 hover:text-white hover:shadow-green-500/30 active:scale-95 text-white border-none rounded-xl h-12 px-8 font-bold flex items-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg shadow-purple-500/20 transition-all group">
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
        {selectedPhotoIndex !== null && !isMobile && lightboxPhotos.length > 0 && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            {/* Top Bar inside Modal */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-white/50 font-bold text-sm tracking-widest uppercase">
                {selectedPhotoIndex + 1} / {lightboxPhotos.length}
              </span>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => downloadPhoto(lightboxPhotos[selectedPhotoIndex], event.title)}
                  disabled={downloadingUrl === lightboxPhotos[selectedPhotoIndex]}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0 cursor-pointer disabled:opacity-50 relative group"
                  title="Download"
                >
                  {downloadingUrl === lightboxPhotos[selectedPhotoIndex] ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloadingUrl === lightboxPhotos[selectedPhotoIndex] && (
                    <div className="absolute bottom-full mb-3 right-0 bg-black border border-white/20 rounded-xl px-4 py-2 whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in duration-200">
                      <div className="absolute -bottom-1.5 right-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">Baixando imagem, aguarde...</span>
                    </div>
                  )}
                </Button>
                <Button 
                  variant="ghost"  
                  onClick={() => sharePhoto(lightboxPhotos[selectedPhotoIndex])}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0 cursor-pointer"
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleToggleFavorite(lightboxPhotos[selectedPhotoIndex])}
                  className="bg-white/10 hover:bg-pink-500/20 text-white hover:text-pink-500 rounded-full w-12 h-12 p-0 cursor-pointer transition-colors"
                  title="Favoritar"
                >
                  <Heart className={cn("w-5 h-5", favoriteIds.includes(lightboxPhotos[selectedPhotoIndex]) && "fill-current text-pink-500")} />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowInfoModal(true)}
                  className="bg-white/10 hover:bg-red-500/20 text-white hover:text-red-500 rounded-full w-12 h-12 p-0 cursor-pointer transition-colors"
                  title="Pedir para remover"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <div className="w-[1px] h-8 bg-white/10 mx-1" />
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="bg-white/10 hover:bg-red-500/80 text-white rounded-full w-12 h-12 p-0 cursor-pointer shadow-xl"
                  title="Fechar"
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
            {selectedPhotoIndex < lightboxPhotos.length - 1 && (
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
              <WatermarkOverlay title={event.title} size="large" />
              <img 
                src={getImageUrl(lightboxPhotos[selectedPhotoIndex])} 
                alt="Fullscreen Gallery Preview" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                onClick={(e) => e.stopPropagation()} // prevent close on clicking image
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && isMobile && lightboxPhotos.length > 0 && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-between py-6 select-none"
          >
            {/* Top Bar with Album Info */}
            <div className="flex flex-col items-center text-center pt-4 px-6">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{event.date || "EVENTO"}</span>
              <h4 className="text-lg font-black uppercase tracking-tight mt-1 text-white">{event.title}</h4>
            </div>

            {/* Centered Image with Drag to Swipe Left/Right */}
            <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden my-4">
              <div className="relative w-full h-[75vh] flex items-center justify-center px-0">
                <WatermarkOverlay title={event.title} size="normal" />
                {(() => {
                  const len = lightboxPhotos.length;
                  let targetIdx = selectedPhotoIndex;
                  if (dragDirection === "left") {
                    targetIdx = (selectedPhotoIndex + 1) % len;
                  } else if (dragDirection === "right") {
                    targetIdx = (selectedPhotoIndex - 1 + len) % len;
                  }
                  return (
                    <>
                      {/* Underlay target image */}
                      {dragDirection && (
                        <motion.img
                          key={`mobile-lightbox-underlay-${targetIdx}`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 0.95, opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          src={getImageUrl(lightboxPhotos[targetIdx])}
                          className="absolute w-full h-full object-contain rounded-[2rem] border border-white/5 opacity-50 select-none pointer-events-none"
                        />
                      )}
                    </>
                  );
                })()}
                <motion.img
                  key={`mobile-lightbox-${selectedPhotoIndex}`}
                  initial={{ scale: 0.95, opacity: 0, x: 0 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  src={getImageUrl(lightboxPhotos[selectedPhotoIndex])}
                  className="relative z-10 w-full h-full object-contain rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 touch-none"
                />
              </div>
            </div>

            {/* Bottom Actions Row exactly matching the print */}
            <div className="relative flex flex-col items-center pb-8 gap-4 px-6">
              {/* Tooltip Share Menu */}
              <AnimatePresence>
                {showMobileShare && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-20 bg-[#151515] border border-white/10 rounded-2xl p-1.5 flex flex-col gap-0.5 shadow-2xl z-50 min-w-[140px]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sharePhoto(lightboxPhotos[selectedPhotoIndex]);
                        setShowMobileShare(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors text-left"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white">WhatsApp</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(getImageUrl(lightboxPhotos[selectedPhotoIndex]));
                        appAlert("Link copiado com sucesso!", "success");
                        setShowMobileShare(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white">Copiar Link</span>
                    </button>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-6 border-r-6 border-t-6 border-transparent border-t-[#151515]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Counter */}
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                {selectedPhotoIndex + 1} <span className="mx-1.5 opacity-30">/</span> {lightboxPhotos.length} fotos
              </div>

              {/* 4 Circular Buttons exactly like the screenshot */}
              <div className="flex items-center gap-5 justify-center">
                <button
                  onClick={() => downloadPhoto(lightboxPhotos[selectedPhotoIndex], event.title)}
                  disabled={downloadingUrl === lightboxPhotos[selectedPhotoIndex]}
                  className="w-14 h-14 rounded-full bg-[#161616] hover:bg-white/10 active:bg-white/10 text-white flex items-center justify-center border border-white/5 shadow-xl transition-all duration-300 disabled:opacity-50 relative"
                  title="Baixar Foto"
                >
                  {downloadingUrl === lightboxPhotos[selectedPhotoIndex] ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloadingUrl === lightboxPhotos[selectedPhotoIndex] && (
                    <div className="absolute bottom-full mb-3 left-0 bg-black border border-white/20 rounded-xl px-4 py-2 whitespace-nowrap z-[9999] shadow-2xl animate-in fade-in zoom-in duration-200 cursor-default">
                      <div className="absolute -bottom-1.5 left-5 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">Baixando imagem, aguarde...</span>
                    </div>
                  )}
                </button>

                {/* 2. Share */}
                <button
                  onClick={() => setShowMobileShare(!showMobileShare)}
                  className={cn(
                    "w-14 h-14 rounded-full bg-[#161616] hover:bg-white/10 active:bg-white/10 text-white flex items-center justify-center border border-white/5 shadow-xl transition-all duration-300",
                    showMobileShare && "bg-primary text-black"
                  )}
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {/* 3. Favorite */}
                <button
                  onClick={() => handleToggleFavorite(lightboxPhotos[selectedPhotoIndex])}
                  className={cn(
                    "w-14 h-14 rounded-full bg-[#161616] hover:bg-white/10 active:bg-white/10 text-white flex items-center justify-center border border-white/5 shadow-xl transition-all duration-300",
                    favoriteIds.includes(lightboxPhotos[selectedPhotoIndex]) && "border-red-500/30 bg-red-500/10 text-red-500"
                  )}
                  title="Favoritar"
                >
                  <Heart className={cn("w-5 h-5", favoriteIds.includes(lightboxPhotos[selectedPhotoIndex]) && "fill-current")} />
                </button>

                {/* 4. Request Removal */}
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-14 h-14 rounded-full bg-[#161616] hover:bg-red-500/20 active:bg-white/10 text-white flex items-center justify-center border border-white/5 shadow-xl transition-all duration-300 hover:text-red-500"
                  title="Pedir para remover"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* 5. Close */}
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="w-14 h-14 rounded-full bg-[#161616] hover:bg-red-500/20 active:bg-[#161616] text-white flex items-center justify-center border border-white/5 shadow-xl transition-all duration-300 hover:text-red-500"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
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
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
             <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[40px] shadow-2xl relative">
                <Button 
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="absolute top-4 right-4 bg-white/5 hover:bg-white/20 text-white w-10 h-10 rounded-full p-0 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#BF76FF] mb-4">
                    <img 
                      src={getImageUrl(profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Anon'}`)} 
                      alt={profile?.name || user?.displayName || "Sua foto"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-white text-center tracking-tighter uppercase mb-2">Avalie o Evento</h3>
                  <p className="text-gray-400 text-center text-sm mb-6">Como foi sua experiência?</p>
                </div>
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
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121212] border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Termos do Site</h3>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Direitos de Imagem e Autorização</p>
                </div>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 shadow-inner max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed">
                      Todas as fotografias exibidas nesta galeria são de propriedade exclusiva do <span className="text-white font-bold">Ministério Profecia</span>. O download é permitido apenas para uso pessoal em redes sociais pelo proprietário, devendo ser mantida a marca d'água oficial.
                    </p>
                    <p className="text-sm leading-relaxed text-red-400 font-medium">
                      O uso de imagem de terceiros sem a devida permissão pode configurar violação de direitos de personalidade, conforme o Artigo 20 do Código Civil Brasileiro, sujeitando o infrator às sanções legais.
                    </p>
                    <p className="text-sm leading-relaxed">
                      Ao utilizar este serviço, você reconhece que a igreja possui autorização implícita para o registro fotográfico dos cultos e eventos públicos.
                    </p>
                    
                    <div className="h-[1px] bg-white/10 my-4" />
                    
                    <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
                       Termo de autorização da igreja
                    </h4>
                    
                    <p className="text-[13px] leading-relaxed opacity-70">
                      Informamos que, ao participar das programações e eventos, poderão ser realizadas captação de imagens e vídeos para divulgação institucional e evangelística em nossos meios de comunicação. Ao permanecer no local, o participante autoriza o uso de sua imagem e voz nos termos descritos, conforme a <span className="text-white font-bold">LGPD (Lei nº 13.709/2018)</span>.
                    </p>
                    <p className="text-[13px] leading-relaxed font-black text-white">
                      Mesmo assim você pode pedir para que retiraremos sua foto!
                    </p>
                    <p className="text-[11px] leading-relaxed font-light italic opacity-50">
                      A solicitação de remoção de fotos ou vídeos poderá ser realizada exclusivamente pela própria pessoa que aparece na imagem. Pedidos feitos por terceiros não serão atendidos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {selectedPhotoIndex !== null && (
                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600 text-white h-14 rounded-2xl font-black uppercase tracking-wider text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 px-4 group"
                      onClick={() => handleRequestRemoval(lightboxPhotos[selectedPhotoIndex])}
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5 shrink-0 group-hover:animate-pulse" /> Pedir para remover minha imagem
                    </Button>
                  )}
                  <Button 
                    variant="ghost"
                    onClick={() => setShowInfoModal(false)}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-500 hover:text-white"
                  >
                    Entendi e concordo
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRemovedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 text-center"
            onClick={() => setShowRemovedFeedback(false)}
          >
            <div className="space-y-6">
              <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto animate-bounce">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Sua solicitação foi enviada!</h3>
                <p className="text-gray-400 font-medium max-w-md">Sua solicitação de remoção foi enviada para os administradores. Ela será avaliada o mais rápido possível.</p>
              </div>
              <Button 
                onClick={() => setShowRemovedFeedback(false)}
                className="bg-red-500 hover:bg-red-600 text-white h-14 w-full rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                Entendi
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safari Chrome Fallback Modal */}
      <AnimatePresence>
        {showSafariModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#10001D] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#BF76FF] to-pink-500" />
              <button 
                onClick={() => setShowSafariModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 text-red-400">
                <Download className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3">Download Bloqueado</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                O navegador Safari bloqueou o download da imagem. Para uma experiência perfeita, recomendamos utilizar o Google Chrome.
              </p>
              
              <Button
                onClick={() => window.open("https://apps.apple.com/br/app/google-chrome/id535886823", "_blank")}
                className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Google_Chrome_icon_%282011%29.png" alt="Chrome" className="w-6 h-6" />
                Baixar Chrome
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
