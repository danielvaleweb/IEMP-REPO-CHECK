import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, getImageUrl } from "@/lib/utils";

export function EventosView({ 
  events, 
  onNewEvent, 
  onEditEvent, 
  onDeleteEvent, 
  onViewEvent,
  onLoadMore,
  isDark,
  canEdit = false,
  canDelete = false,
  canCreate = false,
  title = "Eventos do Mês",
  buttonLabel = "Cadastrar novo evento",
  emptyLabel = "Nenhum item cadastrado.",
  buttonIcon: ButtonIcon = Plus

}: { 
  events: any[], 
  onNewEvent: (type?: 'evento' | 'culto' | 'visita') => void, 
  onEditEvent: (event: any) => void, 
  onDeleteEvent: (event: any) => void, 
  onViewEvent: (event: any) => void,
  onLoadMore?: () => void,
  isDark?: boolean,
  canEdit?: boolean,
  canDelete?: boolean,
  canCreate?: boolean,
  title?: string,
  buttonLabel?: string,
  emptyLabel?: string,
  buttonIcon?: any
}) {

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className={cn("text-2xl font-bold transition-colors", isDark ? "text-white" : "text-black")}>{title}</h2>
        {canCreate && (
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            {buttonLabel === "Nova matéria" ? (
              <Button 
                className="flex-1 sm:flex-initial bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-[#7300FF]/15 border-none"
                onClick={() => onNewEvent()}
              >
                <ButtonIcon className="w-4 h-4 mr-2" /> {buttonLabel}
              </Button>
            ) : (
              <>
                <Button 
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-[#7300FF]/20 border-none"
                  onClick={() => onNewEvent('evento')}
                >
                  <Plus className="w-4.5 h-4.5 mr-1" /> Eventos
                </Button>
                <Button 
                  className="flex-1 sm:flex-initial bg-[#00A859] hover:bg-[#008A49] text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-emerald-500/20 border-none"
                  onClick={() => onNewEvent('culto')}
                >
                  <Plus className="w-4.5 h-4.5 mr-1" /> Cultos
                </Button>
                <Button 
                  className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-amber-500/20 border-none"
                  onClick={() => onNewEvent('visita')}
                >
                  <Plus className="w-4.5 h-4.5 mr-1" /> Visita
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-20">
        {events.map((event) => (
          <div key={event.id} className={cn("rounded-[32px] overflow-hidden border group relative aspect-[9/13] flex flex-col transition-all", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-md hover:shadow-xl")}>
            <div className="absolute inset-0 z-0 text-white">
              <img 
                src={getImageUrl(event.image || "https://picsum.photos/seed/evento/400/700")} 
                alt={event.title} 
                className={cn("w-full h-full object-cover transition-all duration-700 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110")}
              />
              <div className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-40")} />
            </div>
            
            <div className="relative z-10 p-5 flex flex-col h-full justify-end">
              <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEvent(event);
                  }} 
                  title="Visualizar"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent hover:text-[#BF76FF] transition-colors p-0 hover:scale-110"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {canEdit && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }} 
                    title="Editar"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent hover:text-[#BF76FF] transition-colors p-0 hover:scale-110"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                {canDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event);
                    }} 
                    title="Excluir"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent hover:text-red-500 transition-colors p-0 hover:scale-110"
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

      {onLoadMore && events.length > 0 && (
        <div className="flex justify-center mt-8 pb-10">
          <Button 
            variant="outline"
            className="rounded-xl px-8 border-[#BF76FF]/20 hover:bg-[#BF76FF]/10 text-[#BF76FF] font-bold uppercase tracking-widest text-xs h-12"
            onClick={onLoadMore}
          >
            Ver mais
          </Button>
        </div>
      )}
    </div>
  );
}
