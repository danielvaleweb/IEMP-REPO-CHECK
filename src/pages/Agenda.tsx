import { useMemo } from "react";
import { useCachedCollection } from "@/hooks/useFirestore";
import { format, isAfter, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Agenda() {
  const { data: posts, loading: loadingPosts } = useCachedCollection<any>("posts", [], 1000 * 60 * 5);

  const futureEvents = useMemo(() => {
    const today = startOfDay(new Date());

    const parseDate = (dateVal: any) => {
      if (!dateVal) return null;
      if (dateVal.toDate) return dateVal.toDate();
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d;
      return null;
    };

    const normalizePosts = (posts || []).filter((p: any) => p.date).map((p: any) => ({
      ...p,
      type: 'post',
      parsedDate: parseDate(p.date)
    }));

    const allEvents = [...normalizePosts]
      .filter(e => e.parsedDate)
      .filter(e => isAfter(e.parsedDate, today) || isSameDay(e.parsedDate, today))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    return allEvents;
  }, [posts]);

  const isLoading = loadingPosts;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-24 md:py-32">
      <div className="flex flex-col items-center justify-center text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
          Nossa <span className="text-[#BF76FF]">Agenda</span>
        </h1>
        <p className="text-muted-foreground font-bold text-lg md:text-xl max-w-2xl">
          Fique por dentro de todos os nossos próximos eventos, encontros e celebrações.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-12 h-12 text-[#BF76FF] animate-spin" />
          <p className="text-muted-foreground font-bold animate-pulse">Carregando eventos...</p>
        </div>
      ) : futureEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {futureEvents.map((event, index) => (
            <Link 
              to={event.type === 'post' ? `/evento/${event.id}` : '#'} 
              key={event.id || index}
              className={cn(
                "group relative bg-card border rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-300",
                event.type === 'post' ? "hover:border-[#BF76FF] hover:shadow-[0_0_30px_-5px_rgba(191,118,255,0.3)] cursor-pointer" : "cursor-default"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#BF76FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-black text-2xl leading-tight uppercase tracking-tight group-hover:text-[#BF76FF] transition-colors">{event.title}</h3>
                <div className="bg-[#BF76FF]/10 text-[#BF76FF] p-3 rounded-2xl shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
              
              <div className="space-y-4 mt-auto">
                <div className="flex items-center text-sm sm:text-base font-bold text-muted-foreground gap-3">
                  <div className="w-8 h-8 rounded-full bg-card border flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#BF76FF]" />
                  </div>
                  <span>
                    {format(event.parsedDate, "dd 'de' MMMM", { locale: ptBR })}
                    <span className="block text-xs text-muted-foreground/70 uppercase tracking-widest mt-0.5">
                      {format(event.parsedDate, "HH:mm")}
                      {event.endTime ? ` às ${event.endTime}` : ''}
                    </span>
                  </span>
                </div>
                
                {event.location && (
                  <div className="flex items-center text-sm sm:text-base font-bold text-muted-foreground gap-3">
                    <div className="w-8 h-8 rounded-full bg-card border flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#BF76FF]" />
                    </div>
                    <span className="line-clamp-2">{event.location}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-card rounded-[3rem] border border-border/50">
          <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground mb-2">Nenhum evento futuro</h2>
          <p className="text-muted-foreground font-bold text-lg">Nossa agenda está livre no momento.</p>
        </div>
      )}
    </div>
  );
}
