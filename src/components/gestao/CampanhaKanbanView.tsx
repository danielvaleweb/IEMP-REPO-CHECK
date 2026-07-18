import React, { useEffect, useState } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  closestCorners, 
  pointerWithin,
  useDndContext,
  CollisionDetection,
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { 
  Campanha, 
  CardMembro, 
  SaidaDespesa, 
  PipelineType, 
  MembroOrganizador, 
  PIPELINE_ORDER, 
  PIPELINE_LABELS 
} from "@/types/GestaoTypes";
import { gestaoService } from "@/services/gestaoService";
import { useAuth } from "@/contexts/AuthContext";
import { CardMembroItem } from "./CardMembroItem";
import { CardDetalhesModal } from "./CardDetalhesModal";
import { ModalCobranca, ModalPagou, ModalSaida, ModalAlterarMensagem, ModalEditarOrganizadores, ModalEditarParticipantes } from "./ModaisKanban";
import { RelatorioCampanhaModal } from "./RelatorioCampanhaModal";
import { ArrowLeft, PlusCircle, CheckCircle, DollarSign, Users, Settings, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampanhaKanbanViewProps {
  campanha: Campanha;
  todosMembros: MembroOrganizador[];
  onVoltar: () => void;
}

// Subcomponente Coluna Kanban
const customCollisionDetection: CollisionDetection = (args) => {
  // 1. Tenta detectar primeiro com pointerWithin (onde o cursor do mouse/dedo está exatamente apontando)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // 2. Se o cursor estiver fora dos limites, usa closestCorners como fallback
  return closestCorners(args);
};

const ColunaKanban: React.FC<{
  pipeline: PipelineType;
  cards: CardMembro[];
  onClickCard: (card: CardMembro) => void;
  valorSugerido?: number;
  todosMembros?: MembroOrganizador[];
}> = ({ pipeline, cards, onClickCard, valorSugerido, todosMembros }) => {
  const { setNodeRef } = useDroppable({ id: pipeline });
  const { over, active } = useDndContext();

  const isOverEstaColuna = Boolean(
    active && over && (over.id === pipeline || cards.some(c => c.id === over.id))
  );

  const totalColunaPagou = cards.reduce((acc, c) => acc + (c.valor_pago || 0), 0);

  const getHeaderStyle = () => {
    switch (pipeline) {
      case "a_contatar": return "bg-[#1c1412] border-b border-[#4a2e23] text-[#e89a3c]";
      case "msg_enviada": return "bg-[#111e18] border-b border-[#1f4a35] text-[#42d38b]";
      case "msg_nao_chegou": return "bg-[#221318] border-b border-[#5a2533] text-[#f46a85]";
      case "respondeu": return "bg-[#161426] border-b border-[#312a5e] text-[#9b8afb]";
      case "cobrar": return "bg-[#121c2b] border-b border-[#223d63] text-[#5ba2f4]";
      case "pagou": return "bg-[#0f2323] border-b border-[#1b4f4f] text-[#3dd6d6]";
      case "cancelou": return "bg-[#17171d] border-b border-[#2e2e38] text-[#8e8e9f]";
      default: return "bg-card border-b border-border text-foreground";
    }
  };

  const getPillStyle = () => {
    switch (pipeline) {
      case "a_contatar": return "bg-[#e89a3c] text-white";
      case "msg_enviada": return "bg-[#42d38b] text-white";
      case "msg_nao_chegou": return "bg-[#f46a85] text-white";
      case "respondeu": return "bg-[#9b8afb] text-white";
      case "cobrar": return "bg-[#5ba2f4] text-white";
      case "pagou": return "bg-[#3dd6d6] text-white";
      case "cancelou": return "bg-[#8e8e9f] text-white";
      default: return "bg-primary text-white";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-full min-w-0 bg-[#0d0d14] border rounded-2xl overflow-hidden shadow-xl h-auto min-h-[450px] transition-all duration-150",
        isOverEstaColuna 
          ? "border-primary ring-2 ring-primary/60 bg-[#151528] shadow-2xl scale-[1.01]" 
          : "border-[#222230]"
      )}
    >
      {/* Topo da Coluna */}
      <div className={cn("p-4 border-b flex flex-col gap-1.5 transition-colors", getHeaderStyle())}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm tracking-tight">{PIPELINE_LABELS[pipeline]}</span>
          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm", getPillStyle())}>
            {cards.length}
          </span>
        </div>

      </div>

      {/* Área de cards */}
      <div className="p-3 space-y-3 transition-colors flex-1 min-h-[360px] w-full flex flex-col">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => {
            const m = todosMembros?.find(mem => mem.id === card.membro_id || (mem.name && card.membro_nome && mem.name.toLowerCase().trim() === card.membro_nome.toLowerCase().trim()));
            const foto = card.membro_foto || m?.photoURL || m?.photoUrl || m?.foto || "";
            const fone = card.membro_phone || card.membro_telefone || m?.phone || m?.telefone || m?.whatsapp || m?.celular || "";
            return (
              <CardMembroItem
                key={card.id}
                card={{
                  ...card,
                  membro_phone: fone,
                  membro_telefone: fone,
                  membro_foto: foto
                }}
                onClick={onClickCard}
                valorSugerido={valorSugerido}
                fotoUrl={foto}
              />
            );
          })}
        </SortableContext>

        {cards.length === 0 && (
          <div className={cn(
            "flex-1 min-h-[220px] border-2 border-dashed rounded-xl flex items-center justify-center text-xs italic transition-all duration-150",
            isOverEstaColuna
              ? "border-primary bg-primary/15 text-primary font-bold shadow-inner"
              : "border-[#2a2a40] text-gray-500"
          )}>
            {isOverEstaColuna ? "✨ Solte o cartão aqui!" : "Arraste cartões aqui"}
          </div>
        )}
      </div>
    </div>
  );
};

export const CampanhaKanbanView: React.FC<CampanhaKanbanViewProps> = ({
  campanha,
  todosMembros,
  onVoltar
}) => {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState<CardMembro[]>([]);
  const [saidas, setSaidas] = useState<SaidaDespesa[]>([]);
  const [cardSelecionado, setCardSelecionado] = useState<CardMembro | null>(null);

  // Estados dos modais de movimentação e saídas
  const [modalCobrancaOpen, setModalCobrancaOpen] = useState(false);
  const [modalPagouOpen, setModalPagouOpen] = useState(false);
  const [modalSaidaOpen, setModalSaidaOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [configMenuOpen, setConfigMenuOpen] = useState(false);
  const [modalAlterarMsgOpen, setModalAlterarMsgOpen] = useState(false);
  const [modalEditarOrgsOpen, setModalEditarOrgsOpen] = useState(false);
  const [modalEditarParticipantesOpen, setModalEditarParticipantesOpen] = useState(false);

  const orgsListaInicial = (campanha.organizadores_ids && campanha.organizadores_ids.length > 0)
    ? campanha.organizadores_ids.map(id => todosMembros.find(m => m.id === id)).filter(Boolean) as MembroOrganizador[]
    : (campanha.membros_organizadores || []);

  const organizadores = orgsListaInicial.map(org => {
    const atualizado = todosMembros.find(m => m.id === org.id || (org.email && m.email === org.email) || m.name === org.name);
    return atualizado || org;
  });

  // Guardar movimentação pendente esperando confirmação do modal
  const [movimentoPendente, setMovimentoPendente] = useState<{
    cardId: string;
    colOrigem: PipelineType;
    colDestino: PipelineType;
  } | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCard = activeId ? cards.find(c => c.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // resposta rápida e suave ao arrastar sem travar cliques
      },
    })
  );

  useEffect(() => {
    const unsubCards = gestaoService.subscribeCards(campanha.id, (lista) => {
      setCards(lista);
    });

    const unsubSaidas = gestaoService.subscribeSaidas(campanha.id, (lista) => {
      setSaidas(lista);
    });

    return () => {
      unsubCards();
      unsubSaidas();
    };
  }, [campanha.id]);

  useEffect(() => {
    if (cardSelecionado) {
      const cardAtualizado = cards.find(c => c.id === cardSelecionado.id);
      if (cardAtualizado && JSON.stringify(cardAtualizado) !== JSON.stringify(cardSelecionado)) {
        setCardSelecionado(cardAtualizado);
      }
    }
  }, [cards, cardSelecionado]);

  const usuarioId = profile?.id || user?.uid || "anonimo";
  const usuarioNome = profile?.name || user?.displayName || user?.email || "Usuário";

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // A coluna de destino pode ser o ID do próprio contêiner (ex: 'a_contatar') ou o ID de outro card nessa coluna
    let colDestino: PipelineType;
    if (PIPELINE_ORDER.includes(overId as PipelineType)) {
      colDestino = overId as PipelineType;
    } else {
      const overCard = cards.find(c => c.id === overId);
      if (!overCard) return;
      colDestino = overCard.pipeline;
    }

    const colOrigem = activeCard.pipeline;
    if (colOrigem === colDestino) return; // Não mudou de coluna

    // Atualização otimista IMEDIATA para o dnd-kit animar suavemente para a coluna de destino!
    setCards((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, pipeline: colDestino } : c))
    );

    // Comportamento especial - Pipeline Cobrar
    if (colDestino === "cobrar") {
      setMovimentoPendente({ cardId: activeId, colOrigem, colDestino });
      setModalCobrancaOpen(true);
      return;
    }

    // Comportamento especial - Pipeline Pagou
    if (colDestino === "pagou") {
      setMovimentoPendente({ cardId: activeId, colOrigem, colDestino });
      setModalPagouOpen(true);
      return;
    }

    // Outras colunas movem direto no banco
    try {
      await gestaoService.moverCard(activeId, colDestino, colOrigem, usuarioId, usuarioNome);
    } catch (err) {
      console.error("Erro ao mover card:", err);
      alert("Não foi possível mover o card.");
      // reverte otimista
      setCards((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, pipeline: colOrigem } : c))
      );
    }
  };

  const handleCancelMovimento = () => {
    if (movimentoPendente) {
      // Reverte o otimista se cancelar o modal
      setCards((prev) =>
        prev.map((c) => (c.id === movimentoPendente.cardId ? { ...c, pipeline: movimentoPendente.colOrigem } : c))
      );
    }
    setModalCobrancaOpen(false);
    setModalPagouOpen(false);
    setMovimentoPendente(null);
  };

  const handleConfirmCobranca = async (dataCobranca: string) => {
    if (!movimentoPendente) return;
    try {
      await gestaoService.moverCard(
        movimentoPendente.cardId,
        "cobrar",
        movimentoPendente.colOrigem,
        usuarioId,
        usuarioNome,
        { data_cobranca: dataCobranca }
      );
    } catch (err) {
      console.error("Erro ao agendar cobrança:", err);
      setCards((prev) =>
        prev.map((c) => (c.id === movimentoPendente.cardId ? { ...c, pipeline: movimentoPendente.colOrigem } : c))
      );
    } finally {
      setModalCobrancaOpen(false);
      setMovimentoPendente(null);
    }
  };

  const handleConfirmPagou = async (dados: { valor_pago: number; comprovante_url?: string }) => {
    if (!movimentoPendente) return;
    try {
      let finalComprovanteUrl = dados.comprovante_url;
      if (finalComprovanteUrl?.startsWith("data:")) {
        const path = `campanhas/${campanha.id}/cards/${movimentoPendente.cardId}/comprovantes/${Date.now()}`;
        finalComprovanteUrl = await gestaoService.uploadImage(finalComprovanteUrl, path);
      }

      await gestaoService.moverCard(
        movimentoPendente.cardId,
        "pagou",
        movimentoPendente.colOrigem,
        usuarioId,
        usuarioNome,
        { ...dados, comprovante_url: finalComprovanteUrl }
      );
    } catch (err) {
      console.error("Erro ao registrar pagamento:", err);
      setCards((prev) =>
        prev.map((c) => (c.id === movimentoPendente.cardId ? { ...c, pipeline: movimentoPendente.colOrigem } : c))
      );
    } finally {
      setModalPagouOpen(false);
      setMovimentoPendente(null);
    }
  };

  const handleAddSaida = async (dados: { titulo: string; valor: number; operador_id: string; operador_nome: string; data_hora: string }) => {
    try {
      await gestaoService.addSaida({
        ...dados,
        campanha_id: campanha.id
      });
      setModalSaidaOpen(false);
    } catch (err) {
      console.error("Erro ao registrar saída:", err);
      alert("Erro ao cadastrar despesa.");
    }
  };

  const handleConcluirCampanha = async () => {
    if (!window.confirm(`Deseja realmente concluir a campanha "${campanha.nome}"? Ela será movida para o histórico concluído.`)) {
      return;
    }
    try {
      await gestaoService.concluirCampanha(campanha.id);
      setRelatorioOpen(false);
      onVoltar();
    } catch (err) {
      console.error("Erro ao concluir campanha:", err);
      alert("Erro ao concluir campanha.");
    }
  };

  // Soma total de todos na coluna pagou
  const totalGeralArrecadado = cards
    .filter(c => c.pipeline === "pagou")
    .reduce((acc, c) => acc + (c.valor_pago || 0), 0);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Barra superior de controles e totais */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-[#13131f] border border-[#2a2a40] text-gray-100 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onVoltar}
            className="p-2.5 rounded-xl bg-[#1f1f30] hover:bg-[#2a2a40] text-gray-300 hover:text-white transition-all cursor-pointer shrink-0 border border-[#2a2a40]"
            title="Voltar para campanhas em aberto"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{campanha.nome}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                CRM Ativo
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{cards.length} membros envolvidos na campanha</span>
            </p>
          </div>
        </div>

        {/* Meio: Fotos dos organizadores no centro do topo */}
        <div className="flex items-center gap-3.5 bg-[#181424] px-4 py-2 rounded-2xl border border-[#262036] shadow-inner">
          <div className="flex -space-x-2.5 overflow-visible py-1">
            {organizadores.slice(0, 5).map((org, idx) => (
              <div key={org.id || idx} className="relative group/tooltip shrink-0">
                <div className="h-8 w-8 rounded-full ring-2 ring-[#181424] overflow-hidden bg-primary/20 flex items-center justify-center text-xs font-bold text-white shadow-md cursor-pointer transition-transform group-hover/tooltip:scale-110 group-hover/tooltip:z-10">
                  {org.photoUrl ? (
                    <img src={org.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    org.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Tooltip Card Customizado */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 hidden group-hover/tooltip:flex flex-col items-center bg-[#120f17] border border-[#262036] rounded-2xl overflow-hidden shadow-2xl z-[9999] w-44 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                  <div className="w-44 h-44 bg-primary/20 relative overflow-hidden flex items-center justify-center text-4xl font-extrabold text-white shrink-0">
                    {org.photoUrl ? (
                      <img src={org.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      org.name.charAt(0).toUpperCase()
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#120f17] to-transparent" />
                  </div>
                  <div className="p-3 w-full flex flex-col items-center -mt-4 relative z-10 bg-[#120f17]">
                    <span className="text-xs font-extrabold text-white text-center leading-tight line-clamp-1 w-full px-1">
                      {org.name}
                    </span>
                    <span className="text-[10px] font-bold text-primary text-center mt-1 bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shadow-sm max-w-full truncate">
                      {org.role || "Organizador"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {organizadores.length > 5 && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#181424] bg-[#262036] flex items-center justify-center text-xs font-bold text-gray-300 shadow-md">
                +{organizadores.length - 5}
              </div>
            )}
          </div>
          <div className="flex flex-col border-l border-[#262036] pl-3">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Organizadores</span>
            <span className="text-xs font-black text-white">
              {organizadores.length} {organizadores.length === 1 ? "adicionado" : "adicionados"}
            </span>
          </div>
        </div>

        {/* Indicadores globais e ações rápidas */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm shadow-sm">
            <DollarSign className="w-4 h-4" />
            <span>Arrecadado: R$ {totalGeralArrecadado.toFixed(2)}</span>
          </div>

          {/* Botão de Configuração no cantinho */}
          <div className="relative">
            <button
              onClick={() => setConfigMenuOpen(!configMenuOpen)}
              className="p-2.5 rounded-xl bg-[#151520] hover:bg-[#1f1f30] border border-[#2b2b40] text-gray-300 hover:text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Configurações da Campanha"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Configuração</span>
            </button>

            {configMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#151520] border border-[#2b2b40] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => { setConfigMenuOpen(false); setModalAlterarMsgOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-200 hover:bg-[#1f1f30] flex items-center gap-2.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-primary" />
                  <span>Alterar Mensagem Geral</span>
                </button>
                <button
                  onClick={() => { setConfigMenuOpen(false); setModalEditarOrgsOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-purple-400 hover:bg-[#1f1f30] flex items-center gap-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Editar Organizadores</span>
                </button>
                <button
                  onClick={() => { setConfigMenuOpen(false); setModalEditarParticipantesOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-sky-400 hover:bg-[#1f1f30] flex items-center gap-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Editar Participantes</span>
                </button>
                <button
                  onClick={() => { setConfigMenuOpen(false); setModalSaidaOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-[#1f1f30] flex items-center gap-2.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 rotate-45" />
                  <span>Adicionar Saída</span>
                </button>
                <button
                  onClick={() => { setConfigMenuOpen(false); setRelatorioOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-[#1f1f30] flex items-center gap-2.5 border-t border-[#2b2b40] mt-1 pt-2.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Concluir Campanha</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela / Pipeline Kanban com Drag and Drop */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={customCollisionDetection} 
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={(e) => { setActiveId(null); handleDragEnd(e); }}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="w-full pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 w-full">
            {PIPELINE_ORDER.map((pipeline) => {
              let cardsDaColuna = cards.filter(c => c.pipeline === pipeline);

              if (pipeline === 'pagou') {
                const valorSugerido = campanha.campos_pagamento?.valor || 0;
                cardsDaColuna.sort((a, b) => {
                  const devA = Math.max(0, valorSugerido - (a.valor_pago || 0));
                  const devB = Math.max(0, valorSugerido - (b.valor_pago || 0));
                  
                  if (devA > 0 && devB === 0) return -1;
                  if (devB > 0 && devA === 0) return 1;
                  
                  return devB - devA;
                });
              }

              return (
                <ColunaKanban
                  key={pipeline}
                  pipeline={pipeline}
                  cards={cardsDaColuna}
                  onClickCard={(card) => setCardSelecionado(card)}
                  valorSugerido={campanha.campos_pagamento?.valor}
                  todosMembros={todosMembros}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard ? (
            <div className="bg-[#1f1f30] border-2 border-primary rounded-2xl p-3.5 shadow-2xl scale-105 rotate-2 cursor-grabbing select-none w-full min-w-[220px]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {activeCard.membro_nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{activeCard.membro_nome}</h4>
                  {(activeCard.membro_phone || activeCard.membro_telefone) && <p className="text-[11px] text-gray-400 mt-0.5">{activeCard.membro_phone || activeCard.membro_telefone}</p>}
                  <div className="mt-2.5 flex items-center justify-between">
                    {Math.max(0, (campanha.campos_pagamento?.valor || 0) - (activeCard.valor_pago || 0)) > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-rose-500/15 text-rose-400 border-rose-500/25 shrink-0 whitespace-nowrap">
                        R$ {Math.max(0, (campanha.campos_pagamento?.valor || 0) - (activeCard.valor_pago || 0)).toFixed(2)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shrink-0 whitespace-nowrap">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        Pago
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modais de Ações do Kanban */}
      <CardDetalhesModal
        card={cardSelecionado}
        campanha={campanha}
        todosMembros={todosMembros}
        onClose={() => setCardSelecionado(null)}
      />

      <ModalCobranca
        isOpen={modalCobrancaOpen}
        onClose={handleCancelMovimento}
        onConfirm={handleConfirmCobranca}
      />

      <ModalPagou
        isOpen={modalPagouOpen}
        valorSugerido={campanha.campos_pagamento.valor || 0}
        onClose={handleCancelMovimento}
        onConfirm={handleConfirmPagou}
      />

      <ModalSaida
        isOpen={modalSaidaOpen}
        membros={todosMembros}
        onClose={() => setModalSaidaOpen(false)}
        onConfirm={handleAddSaida}
      />

      <RelatorioCampanhaModal
        isOpen={relatorioOpen}
        campanha={campanha}
        cards={cards}
        saidas={saidas}
        todosMembros={todosMembros}
        onClose={() => setRelatorioOpen(false)}
        onConcluir={handleConcluirCampanha}
      />

      <ModalAlterarMensagem
        isOpen={modalAlterarMsgOpen}
        onClose={() => setModalAlterarMsgOpen(false)}
        campanha={campanha}
        onSave={async (novaMsg, novosCampos) => {
          try {
            await gestaoService.updateCampanhaMensagem(campanha.id, novaMsg, novosCampos);
            setModalAlterarMsgOpen(false);
          } catch (err) {
            console.error("Erro ao alterar mensagem da campanha:", err);
          }
        }}
      />

      <ModalEditarOrganizadores
        isOpen={modalEditarOrgsOpen}
        onClose={() => setModalEditarOrgsOpen(false)}
        organizadoresAtual={campanha.organizadores_ids || (campanha.membros_organizadores || []).map(m => m.id)}
        todosMembros={todosMembros}
        onSave={async (ids, objs) => {
          try {
            await gestaoService.updateOrganizadores(campanha.id, ids, objs);
            setModalEditarOrgsOpen(false);
          } catch (err) {
            console.error("Erro ao atualizar organizadores:", err);
          }
        }}
      />

      <ModalEditarParticipantes
        isOpen={modalEditarParticipantesOpen}
        onClose={() => setModalEditarParticipantesOpen(false)}
        cards={cards}
        todosMembros={todosMembros}
        onAddMembros={async (ids) => {
          try {
            await gestaoService.addParticipantes(
              campanha.id,
              ids,
              todosMembros,
              usuarioId,
              usuarioNome
            );
          } catch (err) {
            console.error("Erro ao adicionar participantes:", err);
          }
        }}
        onRemoveCard={async (cardId) => {
          try {
            await gestaoService.removeParticipante(cardId);
          } catch (err) {
            console.error("Erro ao remover participante:", err);
          }
        }}
      />
    </div>
  );
};
