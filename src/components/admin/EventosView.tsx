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
  onViewEvent 
}: { 
  events: any[], 
  onNewEvent: () => void, 
  onEditEvent: (event: any) => void, 
  onDeleteEvent: (event: any) => void, 
  onViewEvent: (event: any) => void 
}) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Eventos do Mês</h2>
        <Button 
          className="bg-[#BF76FF] hover:bg-[#BF76FF]/90 text-white rounded-xl h-12 px-6 font-bold cursor-pointer"
          onClick={onNewEvent}
        >
          <Plus className="w-4 h-4 mr-2" /> Cadastrar novo evento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
        {events.map((event) => (
          <div key={event.id} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 group relative aspect-[9/16] flex flex-col">
            <div className="absolute inset-0 z-0">
              <img 
                src={event.image || "https://picsum.photos/seed/evento/400/700"} 
                alt={event.title} 
                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
            
            <div className="relative z-10 p-4 flex flex-col h-full justify-end">
              <div className="mb-auto flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onViewEvent(event)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onEditEvent(event)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#BF76FF] transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteEvent(event)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{event.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                <Calendar className="w-3 h-3 text-[#BF76FF]" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <MapPin className="w-3 h-3 text-[#BF76FF]" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            Nenhum evento cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
