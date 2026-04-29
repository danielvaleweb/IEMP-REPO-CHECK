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
  emptyLabel = "Nenhum item cadastrado.",
  buttonIcon: ButtonIcon = Plus
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
  emptyLabel?: string,
  buttonIcon?: any
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
            <ButtonIcon className="w-4 h-4 mr-2" /> {buttonLabel}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-20">
        {events.map((event) => (
          <div key={event.id} className={cn("rounded-[32px] overflow-hidden border group relative aspect-[9/13] flex flex-col transition-all", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-md hover:shadow-xl")}>
            <div className="absolute inset-0 z-0 text-white">
              <img 
                src={event.image || "https://picsum.photos/seed/evento/400/700"} 
                alt={event.title} 
                className={cn("w-full h-full object-cover transition-all duration-700 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110")}
              />
              <div className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-40")} />
            </div>
            
            <div className="relative z-10 p-5 flex flex-col h-full justify-end">
              <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white">
                <button 
                  onClick={() => onViewEvent(event)} 
                  title="Visualizar"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent hover:text-[#BF76FF] transition-colors p-0"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {canEdit && (
                  <button 
                    onClick={() => onEditEvent(event)} 
                    title="Editar"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent hover:text-[#BF76FF] transition-colors p-0"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                {canDelete && (
                  <button 
                    onClick={() => {
                      if (window.confirm("Deseja realmente excluir este evento?")) {
                        onDeleteEvent(event);
                      }
                    }} 
                    title="Excluir"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent hover:text-red-500 transition-colors p-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <h3 className="text-xl font-black text-white mb-2 line-clamp-2 drop-shadow-lg leading-tight uppercase tracking-tight">{event.title}</h3>
              <div className="flex items-center gap-2 text-xs text-white/90 mb-1 font-bold drop-shadow">
                <Calendar className="w-4 h-4 text-[#BF76FF]" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70 font-medium drop-shadow-sm">
                <MapPin className="w-4 h-4 text-[#BF76FF]" />
                <span className="line-clamp-1">{event.location || event.category || "Notícia"}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-20">
            <Plus className="w-20 h-20 mx-auto mb-4" />
            <p className="font-bold">{emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
