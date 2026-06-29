import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardMembro } from "@/types/GestaoTypes";
import { Clock, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { BorderGlow } from "@/components/ui/BorderGlow";

interface CardMembroItemProps {
  card: CardMembro;
  onClick: (card: CardMembro) => void;
  valorSugerido?: number;
  fotoUrl?: string;
}

export const CardMembroItem: React.FC<CardMembroItemProps> = ({ card, onClick, valorSugerido, fotoUrl }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const iniciais = card.membro_nome
    ? card.membro_nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "M";

  // Calcular alerta de cobrança
  const renderAlertaCobranca = () => {
    if (card.pipeline !== "cobrar" || !card.data_cobranca) return null;

    const hojeStr = new Date().toISOString().split("T")[0];
    const dataCobrancaStr = card.data_cobranca;
    
    const diffTime = new Date(dataCobrancaStr + "T00:00:00").getTime() - new Date(hojeStr + "T00:00:00").getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-semibold mt-2.5 border border-blue-500/30">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Cobrar em {diffDays} {diffDays === 1 ? "dia" : "dias"}</span>
        </div>
      );
    } else if (diffDays === 0) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold mt-2.5 border border-amber-500/30 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Vence hoje</span>
        </div>
      );
    } else {
      const diasPassados = Math.abs(diffDays);
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold mt-2.5 border border-red-500/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Vencido há {diasPassados} {diasPassados === 1 ? "dia" : "dias"}</span>
        </div>
      );
    }
  };

  const valorExibir = card.valor_pago || valorSugerido || 0;
  const imagemExibir = fotoUrl || card.membro_foto;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) {
          onClick(card);
        }
      }}
      className={cn(
        "group relative rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing select-none block w-full",
        isDragging && "opacity-30 border-2 border-dashed border-primary/60 bg-primary/5 shadow-none pointer-events-none"
      )}
    >
      <BorderGlow
        edgeSensitivity={45}
        glowColor="40 80 80"
        backgroundColor="#151520"
        borderRadius={16}
        glowRadius={35}
        glowIntensity={1.8}
        coneSpread={30}
        colors={['#c084fc', '#f472b6', '#38bdf8']}
        className="w-full hover:bg-[#1f1f30] transition-colors border border-[#2b2b40] group-hover:border-[#4c4c70] shadow-md group-hover:shadow-xl"
      >
        <div className="p-3.5">
          <div className="flex items-start gap-3">
        {/* Avatar */}
        {imagemExibir ? (
          <img
            src={imagemExibir}
            alt={card.membro_nome}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-indigo-500/30 shadow-inner"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-extrabold text-indigo-300 shrink-0 shadow-inner">
            {iniciais}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm text-gray-100 truncate group-hover:text-primary transition-colors leading-tight">
            {card.membro_nome}
          </h4>
          {card.membro_phone ? (
            <p className="text-xs text-gray-400 truncate mt-0.5 font-sans">
              {card.membro_phone}
            </p>
          ) : (
            <p className="text-xs text-gray-600 truncate mt-0.5">Sem telefone</p>
          )}
        </div>
      </div>

      {renderAlertaCobranca()}

      {/* Footer do Card */}
      <div className="mt-3 pt-2.5 border-t border-[#232336] flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 tracking-tight">
          R$ {valorExibir.toFixed(2)}
        </span>

        <div className="flex items-center gap-2">
          {card.comprovante_url && card.pipeline === "pagou" && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Anexo</span>
            </div>
          )}
          {card.tem_comentarios && (
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center transition-colors shadow-sm" title="Possui comentário">
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
            </div>
          )}
        </div>
      </div>
      </div>
      </BorderGlow>
    </div>
  );
};
