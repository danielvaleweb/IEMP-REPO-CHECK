import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function EventosView({ 
  events, 
  onNewEvent, 
  onEditEvent, 
  onDeleteEvent, 
  onViewEvent,
  isDark,
  canEdit = false,
  canDelete = false,
  title = "Eventos do Mês",
  buttonLabel = "Cadastrar novo evento",
  emptyLabel = "Nenhum item cadastrado."
}: { 
  events: any[], 
  onNewEvent: () => void, 
  onEditEvent: (event: any) => void, 
  onDeleteEvent: (event: any) => void, 
  onViewEvent: (event: any) => void,
  isDark?: boolean,
  canEdit?: boolean,
  canDelete?: boolean,
  title?: string,
  buttonLabel?: string,
  emptyLabel?: string
}) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className={cn("text-2xl font-bold transition-colors", isDark ? "text-white" : "text-black")}>{title}</h2>
        {canEdit && (
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer"
            onClick={onNewEvent}
          >
            <Plus className="w-4 h-4 mr-2" /> {buttonLabel}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-20">
        {events.map((event) => (
          <div key={event.id} className={cn("rounded-2xl overflow-hidden border group relative aspect-[9/16] flex flex-col transition-all", isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-md hover:shadow-xl")}>
            <div className="absolute inset-0 z-0">
              <img 
                src={event.image || "https://picsum.photos/seed/evento/400/700"} 
                alt={event.title} 
                className={cn("w-full h-full object-cover transition-opacity", isDark ? "opacity-50 group-hover:opacity-70" : "opacity-90 group-hover:opacity-100")}
              />
              <div className={cn("absolute inset-0 bg-gradient-to-t", isDark ? "from-black via-black/50 to-transparent" : "from-black/60 via-transparent to-transparent")} />
            </div>
            
            <div className="relative z-10 p-4 flex flex-col h-full justify-end">
              <div className="mb-auto flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onViewEvent(event)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button onClick={() => onEditEvent(event)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#BF76FF] transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => onDeleteEvent(event)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 drop-shadow-md">{event.title}</h3>
              <div className="flex items-center gap-2 text-xs text-white/80 mb-1 drop-shadow-md">
                <Calendar className="w-3 h-3 text-[#BF76FF]" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80 drop-shadow-md">
                <MapPin className="w-3 h-3 text-[#BF76FF]" />
                <span className="line-clamp-1">{event.location || event.category || "Notícia"}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
