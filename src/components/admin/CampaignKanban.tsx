import React, { useState } from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Member } from './WhatsAppBlastView';
import { 
  MessageSquare, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  X, 
  Send, 
  Paperclip, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LeadStatus = 'a_enviar' | 'contactado' | 'erro' | 'respondeu' | 'pagamento_pendente' | 'pago' | 'cancelado';

export interface LeadComment {
  id: string;
  text: string;
  createdAt: string;
  attachments?: string[];
}

export interface Lead {
  member: Member;
  status: LeadStatus;
  comments?: LeadComment[];
  paymentValue?: string;
  paymentDate?: string;
  paymentMethod?: string;
}

const COLUMNS: { id: LeadStatus; title: string; color: string; bg: string }[] = [
  { id: 'a_enviar', title: 'A Contatar', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { id: 'contactado', title: 'Contactados', color: 'text-[#25D366]', bg: 'bg-[#25D366]/10 border-[#25D366]/20' },
  { id: 'erro', title: 'Não Chegou', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { id: 'respondeu', title: 'Respostas', color: 'text-[#BF76FF]', bg: 'bg-[#BF76FF]/10 border-[#BF76FF]/20' },
  { id: 'pagamento_pendente', title: 'Cobrança', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'pago', title: 'Pago', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { id: 'cancelado', title: 'Cancelado', color: 'text-gray-500', bg: 'bg-white/5 border-white/10' }
];

// Sortable Card Component
function KanbanCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.member.id,
    data: { lead }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const name = lead.member.name || 'Membro';
  const photo = lead.member.photoURL || lead.member.photoUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-[#1a1325] hover:bg-[#231a31] border border-white/5 hover:border-white/10 rounded-2xl p-3.5 cursor-pointer transition-all shadow-md group space-y-2.5"
    >
      <div className="flex items-center gap-3">
        {photo ? (
          <img src={photo} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" alt={name} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate group-hover:text-[#BF76FF] transition-colors">{name}</p>
          <p className="text-[11px] text-gray-400 truncate">{lead.member.phone || 'Sem telefone'}</p>
        </div>
      </div>

      {/* Badges/Indicators */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
        {lead.paymentValue ? (
          <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
            R$ {lead.paymentValue}
          </span>
        ) : (
          <span className="text-gray-600 font-medium">Sem valor</span>
        )}
        
        {lead.comments && lead.comments.length > 0 && (
          <span className="flex items-center gap-1 text-[#BF76FF] font-semibold">
            <MessageSquare className="w-3 h-3" />
            {lead.comments.length}
          </span>
        )}
      </div>
    </div>
  );
}

// Droppable Column Component
function KanbanColumn({ column, leads, onCardClick }: { 
  column: typeof COLUMNS[0]; 
  leads: Lead[]; 
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="w-full sm:w-72 shrink-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-[28px] max-h-[75vh] overflow-hidden">
      {/* Column Header */}
      <div className={cn("p-4 border-b flex items-center justify-between font-black uppercase text-xs tracking-wider", column.bg)}>
        <span className={column.color}>{column.title}</span>
        <span className="bg-black/20 text-white px-2 py-0.5 rounded-full text-[10px]">
          {leads.length}
        </span>
      </div>

      {/* Cards List */}
      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto space-y-2.5 min-h-[100px]">
        <SortableContext items={leads.map(l => l.member.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <KanbanCard key={lead.member.id} lead={lead} onClick={() => onCardClick(lead)} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="h-24 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-gray-600 text-[11px] font-medium">
            Arraste cards aqui
          </div>
        )}
      </div>
    </div>
  );
}

export function CampaignKanban({ 
  leads, 
  setLeads, 
  message, 
  imageUrl,
  billingValue,
  billingType,
  pixKey,
  onFinish
}: {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  message: string;
  imageUrl: string;
  billingValue: string;
  billingType: string;
  pixKey: string;
  onFinish: () => void;
}) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentAttachment, setCommentAttachment] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [mobileTab, setMobileTab] = useState<LeadStatus>('a_enviar');

  const handleCommentFile = async (file: File) => {
    setIsUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'site_uploads');

      const res = await fetch('https://api.cloudinary.com/v1_1/dvkgodvhm/image/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setCommentAttachment(data.secure_url);
      }
    } catch (err) {
      console.error('Error uploading attachment', err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as LeadStatus;

    // Check if overId is a valid column
    if (COLUMNS.some(c => c.id === overId)) {
      setLeads(prev => prev.map(l => {
        if (l.member.id === leadId) {
          return { ...l, status: overId };
        }
        return l;
      }));
    }
  };

  const updateLeadStatus = (newStatus: LeadStatus) => {
    if (!activeLead) return;
    setLeads(prev => prev.map(l => {
      if (l.member.id === activeLead.member.id) {
        const updated = { ...l, status: newStatus };
        setActiveLead(updated);
        return updated;
      }
      return l;
    }));
  };

  const addComment = () => {
    if ((!newComment.trim() && !commentAttachment) || !activeLead) return;
    const comment: LeadComment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      createdAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      attachments: commentAttachment ? [commentAttachment] : undefined
    };

    setLeads(prev => prev.map(l => {
      if (l.member.id === activeLead.member.id) {
        const comments = [comment, ...(l.comments || [])];
        const updated = { ...l, comments };
        setActiveLead(updated);
        return updated;
      }
      return l;
    }));
    setNewComment('');
    setCommentAttachment('');
  };

  // Generate WA text
  const openWhatsApp = (lead: Lead) => {
    const phone = lead.member.phone?.replace(/\D/g, '') || '';
    if (!phone) return;
    const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
    
    let text = message.replace(/\{\{nome\}\}/gi, lead.member.name?.split(' ')[0] || '');
    if (imageUrl) text += `\n\n${imageUrl}`;
    
    // If in billing stage, attach PIX
    if (lead.status === 'pagamento_pendente' && pixKey) {
      text = `Paz do Senhor ${lead.member.name?.split(' ')[0]}! 🙏\nSegue os dados para pagamento (${billingType}):\nValor: R$ ${billingValue || lead.paymentValue || '0,00'}\nChave PIX: ${pixKey}\n\nDeus abençoe!`;
    }

    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.03] border border-white/5 p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            Funil de Campanha (CRM)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {leads.length} membros selecionados — Arraste os cards pelas etapas ou clique para gerenciar.
          </p>
        </div>
        <button
          onClick={onFinish}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-500/20"
        >
          Concluir Campanha
        </button>
      </div>

      {/* Mobile Column Selector Pills */}
      <div className="sm:hidden flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-hide">
        {COLUMNS.map(col => {
          const count = leads.filter(l => l.status === col.id).length;
          const isActive = mobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 transition-all border",
                isActive ? cn(col.bg, col.color, "border-white/30 shadow-lg scale-[1.03]") : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              <span>{col.title}</span>
              <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", isActive ? "bg-black/30 text-white" : "bg-white/10 text-gray-400")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Columns Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        {/* Desktop View: All Columns */}
        <div className="hidden sm:flex gap-4 overflow-x-auto pb-6 pt-2">
          {COLUMNS.map(col => (
            <KanbanColumn 
              key={col.id} 
              column={col} 
              leads={leads.filter(l => l.status === col.id)}
              onCardClick={lead => setActiveLead(lead)}
            />
          ))}
        </div>

        {/* Mobile View: Selected Column Only */}
        <div className="sm:hidden pt-1 pb-6">
          {COLUMNS.filter(c => c.id === mobileTab).map(col => (
            <div key={col.id} className="w-full animate-in fade-in duration-200">
              <KanbanColumn 
                column={col} 
                leads={leads.filter(l => l.status === col.id)}
                onCardClick={lead => setActiveLead(lead)}
              />
            </div>
          ))}
        </div>
      </DndContext>

      {/* ─── Lead Details Modal ────────────────────────────────────────────── */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150f1d] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {activeLead.member.photoURL || activeLead.member.photoUrl ? (
                  <img src={activeLead.member.photoURL || activeLead.member.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-[#BF76FF]" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{activeLead.member.name}</h3>
                  <p className="text-xs text-[#BF76FF] font-bold">{activeLead.member.role || 'Membro'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activeLead.member.phone || 'Sem telefone cadastrado'}</p>
                </div>
              </div>
              <button onClick={() => setActiveLead(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* WhatsApp Actions */}
              <div className="bg-[#25D366]/10 border border-[#25D366]/20 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#25D366] uppercase tracking-wider">Ação Rápida</p>
                  <p className="text-xs text-gray-300 mt-0.5">Enviar mensagem personalizada da etapa atual via WhatsApp</p>
                </div>
                <button
                  onClick={() => openWhatsApp(activeLead)}
                  className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fa851] text-white font-bold text-xs flex items-center gap-2 shrink-0 transition-transform active:scale-95 shadow-lg shadow-[#25D366]/20"
                >
                  <Send className="w-4 h-4" />
                  Abrir WhatsApp
                </button>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Mover para etapa:</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map(col => (
                    <button
                      key={col.id}
                      onClick={() => updateLeadStatus(col.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        activeLead.status === col.id 
                          ? cn(col.bg, col.color, "ring-2 ring-white/20") 
                          : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                      )}
                    >
                      {col.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Info */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Controle de Pagamento
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Valor Combinado (R$)</label>
                    <input
                      type="text"
                      defaultValue={activeLead.paymentValue || billingValue}
                      onChange={e => {
                        const val = e.target.value;
                        setLeads(prev => prev.map(l => l.member.id === activeLead.member.id ? { ...l, paymentValue: val } : l));
                      }}
                      placeholder="0,00"
                      className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-white text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Data Pagamento</label>
                    <input
                      type="date"
                      defaultValue={activeLead.paymentDate}
                      onChange={e => {
                        const val = e.target.value;
                        setLeads(prev => prev.map(l => l.member.id === activeLead.member.id ? { ...l, paymentDate: val } : l));
                      }}
                      className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-white text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#BF76FF] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Comentários e Histórico
                </span>

                {/* Input with Paperclip */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment()}
                      placeholder="Adicionar comentário ou observação..."
                      className="flex-1 h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-[#BF76FF]"
                    />
                    
                    <label className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 cursor-pointer transition-all shrink-0",
                      isUploadingAttachment ? "bg-[#BF76FF]/20 text-[#BF76FF] animate-pulse cursor-not-allowed" : 
                      commentAttachment ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    )}>
                      <Paperclip className="w-5 h-5" />
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        disabled={isUploadingAttachment}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleCommentFile(f);
                        }} 
                      />
                    </label>

                    <button
                      onClick={addComment}
                      className="w-11 h-11 rounded-xl bg-[#BF76FF] hover:bg-[#a45cf0] flex items-center justify-center text-white font-bold transition-all shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {commentAttachment && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                      <span className="truncate max-w-[200px]">📄 Anexo pronto para enviar</span>
                      <button onClick={() => setCommentAttachment('')} className="text-red-400 hover:underline">Remover</button>
                    </div>
                  )}
                </div>

                {/* Thread List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {activeLead.comments && activeLead.comments.length > 0 ? (
                    activeLead.comments.map(c => (
                      <div key={c.id} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                          <span>Você</span>
                          <span>{c.createdAt}</span>
                        </div>
                        {c.text && <p className="text-xs text-gray-200 leading-relaxed">{c.text}</p>}
                        
                        {c.attachments && c.attachments.map((att, idx) => (
                          <div key={idx} className="mt-2 pt-2 border-t border-white/5">
                            <a href={att} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] text-[#BF76FF] hover:underline bg-[#BF76FF]/10 p-2 rounded-lg">
                              <Paperclip className="w-3.5 h-3.5" /> Ver documento anexo
                            </a>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 italic py-4 text-center">Nenhum comentário registrado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
