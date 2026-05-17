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
  const [activeMobileMenuId, setActiveMobileMenuId] = useState<string | null>(null);

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
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-[#FF0A6C] to-[#2D23FF] hover:opacity-90 text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-[#FF0A6C]/25 border-none transition-all duration-300"
                  onClick={() => onNewEvent('evento')}
                >
                  <Plus className="w-4.5 h-4.5 mr-1" /> Novo evento
                </Button>
                <Button 
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-[#FFE53B] to-[#00FFFF] hover:opacity-90 text-black rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-[#00FFFF]/20 border-none transition-all duration-300"
                  onClick={() => onNewEvent('culto')}
                >
                  <Plus className="w-4.5 h-4.5 mr-1 text-black" /> Novo culto
                </Button>
                <Button 
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-[#FFE53B] to-[#FF2525] hover:opacity-90 text-white rounded-xl h-14 sm:h-12 px-6 font-bold cursor-pointer apple-button shadow-lg shadow-[#FF2525]/25 border-none transition-all duration-300"
                  onClick={() => onNewEvent('visita')}
                >
                  <Plus className="w-4.5 h-4.5 mr-1" /> Nova visita
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-20">
        {events.map((event) => {
          const type = event.typeEvent || 'evento';
          const hoverBorderClass = type === 'culto'
            ? 'md:group-hover:border-[#00FFFF]/50 md:group-hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]'
            : type === 'visita'
              ? 'md:group-hover:border-[#FF2525]/50 md:group-hover:shadow-[0_0_20px_rgba(255,37,37,0.15)]'
              : 'md:group-hover:border-[#FF0A6C]/50 md:group-hover:shadow-[0_0_20px_rgba(255,10,108,0.15)]';

          const accentTextColor = type === 'culto'
            ? 'text-[#00FFFF]'
            : type === 'visita'
              ? 'text-[#FF2525]'
              : 'text-[#FF0A6C]';

          const hoverTextColorClass = type === 'culto'
            ? 'hover:text-[#00FFFF]'
            : type === 'visita'
              ? 'hover:text-[#FF2525]'
              : 'hover:text-[#FF0A6C]';

          return (
            <div key={event.id} className={cn("rounded-[32px] overflow-hidden border group relative aspect-[9/13] flex flex-col transition-all duration-300", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-md hover:shadow-xl", hoverBorderClass)}>
              <div className="absolute inset-0 z-0 text-white">
                <img 
                  src={getImageUrl(event.image || "https://picsum.photos/seed/evento/400/700")} 
                  alt={event.title} 
                  className={cn("w-full h-full object-cover transition-all duration-700 opacity-80 md:opacity-60 md:grayscale md:group-hover:grayscale-0 md:group-hover:opacity-100 md:group-hover:scale-110")}
                />
                <div className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity md:group-hover:opacity-40")} />
              </div>
              
              <div className="relative z-10 p-5 flex flex-col h-full justify-end">
                {/* Desktop Hover Actions Menu */}
                <div className="absolute top-4 right-4 z-20 hidden md:flex gap-2 opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-y-2 md:group-hover:translate-y-0 text-white">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewEvent(event);
                    }} 
                    title="Visualizar"
                    className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent transition-colors p-0 hover:scale-110", hoverTextColorClass)}
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
                      className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-transparent transition-colors p-0 hover:scale-110", hoverTextColorClass)}
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

                {/* Mobile Persistent Edit Pencil Icon */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMobileMenuId(activeMobileMenuId === event.id ? null : event.id);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl flex md:hidden items-center justify-center text-white bg-black/60 backdrop-blur-md transition-transform active:scale-95 absolute top-4 right-4 z-30 shadow-md",
                    activeMobileMenuId === event.id && "scale-90"
                  )}
                >
                  <Edit className="w-5 h-5" />
                </button>

                {/* Mobile Dynamic Actions Menu Popover */}
                {activeMobileMenuId === event.id && (
                  <>
                    <div 
                      className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMobileMenuId(null);
                      }}
                    />
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 gap-4 animate-in zoom-in-95 duration-200">
                      <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2 border-b border-white/10 pb-2 w-full text-center">Opções</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileMenuId(null);
                          onViewEvent(event);
                        }}
                        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-white/10 text-white font-bold hover:bg-white/20 active:scale-[0.97] transition-all text-sm border border-white/10"
                      >
                        <Eye className="w-4.5 h-4.5" /> Visualizar
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMobileMenuId(null);
                            onEditEvent(event);
                          }}
                          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFE53B] to-[#00FFFF] text-black font-black active:scale-[0.97] transition-all text-sm border-none shadow-lg shadow-[#00FFFF]/10"
                        >
                          <Edit className="w-4.5 h-4.5 text-black" /> Editar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMobileMenuId(null);
                            onDeleteEvent(event);
                          }}
                          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-red-500/20 text-red-500 font-bold hover:bg-red-500/30 active:scale-[0.97] transition-all text-sm border border-red-500/20"
                        >
                          <Trash2 className="w-4.5 h-4.5" /> Excluir
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileMenuId(null);
                        }}
                        className="w-full h-10 rounded-xl flex items-center justify-center text-gray-400 font-medium hover:text-white transition-colors text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}

                <h3 className="text-xl font-black text-white mb-2 line-clamp-2 drop-shadow-lg leading-tight uppercase tracking-tight">{event.title}</h3>
                <div className="flex items-center gap-2 text-xs text-white/90 mb-1 font-bold drop-shadow">
                  <Calendar className={cn("w-4 h-4", accentTextColor)} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70 font-medium drop-shadow-sm">
                  <MapPin className={cn("w-4 h-4", accentTextColor)} />
                  <span className="line-clamp-1">{event.location || event.category || "Notícia"}</span>
                </div>
              </div>
            </div>
          );
        })}
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
