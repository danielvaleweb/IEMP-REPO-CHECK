import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
  Plus,
  Check,
  Trash2,
  Upload
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
  paidValue?: string;
  paymentDate?: string;
  paymentMethod?: string;
  billingDueDate?: string;
}

const COLUMNS: { id: LeadStatus; title: string; color: string; bg: string }[] = [
  { id: 'a_enviar', title: 'A Contatar', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { id: 'contactado', title: 'Msg Enviada', color: 'text-[#25D366]', bg: 'bg-[#25D366]/10 border-[#25D366]/20' },
  { id: 'erro', title: 'Msg Não Chegou', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { id: 'respondeu', title: 'Respondeu', color: 'text-[#BF76FF]', bg: 'bg-[#BF76FF]/10 border-[#BF76FF]/20' },
  { id: 'pagamento_pendente', title: 'Cobrar ', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'pago', title: 'Pagou', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { id: 'cancelado', title: 'Cancelou', color: 'text-gray-500', bg: 'bg-white/5 border-white/10' }
];

// Sortable Card Component
function KanbanCard({ lead, prefix, billingValue, onClick }: { lead: Lead; prefix: string; billingValue?: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${prefix}${lead.member.id}`,
    data: { lead }
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
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
      className={cn(
        "bg-[#1a1325] hover:bg-[#231a31] border border-white/5 hover:border-white/10 rounded-2xl p-3.5 transition-all shadow-md group space-y-2.5 relative select-none",
        isDragging ? "cursor-grabbing border-[#BF76FF] border-dashed bg-white/5" : "cursor-grab"
      )}
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

      {/* Due Date Indicator */}
      {lead.status === 'pagamento_pendente' && lead.billingDueDate && (() => {
        const due = new Date(lead.billingDueDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="pt-1 pb-0.5">
            <div className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border w-fit shadow-sm",
              diffDays > 0 ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                diffDays === 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  "bg-red-500/15 text-red-400 border-red-500/30"
            )}>
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                {diffDays > 0 ? `Cobrar em ${diffDays} dia${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}` :
                  diffDays === 0 ? `Cobrar hoje` :
                    `Atrasado há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Badges/Indicators */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
        {(() => {
          const parseCur = (s?: string) => s ? parseFloat(s.replace(/[^\d,-]/g, '').replace(',', '.')) || 0 : 0;
          const fmtCur = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
          const effectiveVal = lead.paymentValue || billingValue;
          const total = parseCur(effectiveVal);
          const paid = parseCur(lead.paidValue);
          const diff = total - paid;

          if (lead.paidValue && paid > 0 && diff > 0) {
            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-gray-500 line-through text-[9px]">R$ {effectiveVal}</span>
                <span className="font-black text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px]">
                  Faltam R$ {fmtCur(diff)}
                </span>
              </div>
            );
          }
          if (lead.paidValue && paid >= total && total > 0) {
            return (
              <span className="font-bold text-emerald-400 bg-emerald-400/15 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                Pago R$ {lead.paymentValue || effectiveVal}
              </span>
            );
          }
          return effectiveVal ? (
            <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              R$ {effectiveVal}
            </span>
          ) : (
            <span className="text-gray-600 font-medium">Sem valor</span>
          );
        })()}

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
function KanbanColumn({ column, leads, prefix, billingValue, onCardClick }: {
  column: typeof COLUMNS[0];
  leads: Lead[];
  prefix: string;
  billingValue?: string;
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `${prefix}${column.id}` });

  return (
    <div className="w-full sm:w-72 shrink-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-[28px] h-fit pb-3">
      {/* Column Header */}
      <div className={cn("p-4 border-b flex items-center justify-between font-black uppercase text-xs tracking-wider", column.bg)}>
        <span className={column.color}>{column.title}</span>
        <span className="bg-black/20 text-white px-2 py-0.5 rounded-full text-[10px]">
          {leads.length}
        </span>
      </div>

      {/* Cards List */}
      <div ref={setNodeRef} className="p-3 flex-1 space-y-2.5 min-h-[140px]">
        <SortableContext items={leads.map(l => `${prefix}${l.member.id}`)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <KanbanCard key={lead.member.id} lead={lead} prefix={prefix} billingValue={billingValue} onClick={() => onCardClick(lead)} />
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
  campaignId = 'default',
  leads,
  setLeads,
  message,
  imageUrl,
  billingValue,
  billingType,
  pixKey,
  onFinish
}: {
  campaignId?: string;
  leads: Lead[];
  setLeads: (action: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  message: string;
  imageUrl?: string;
  billingValue?: string;
  billingType?: string;
  pixKey?: string;
  onFinish: () => void;
}) {
  const prefix = `${campaignId}::`;
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentAttachment, setCommentAttachment] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [mobileTab, setMobileTab] = useState<LeadStatus>('a_enviar');
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
  const [billingPromptLead, setBillingPromptLead] = useState<Lead | null>(null);
  const [paymentPromptLead, setPaymentPromptLead] = useState<Lead | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Pix' | 'Cartão' | 'Link de pagamento'>('Pix');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptUploading, setPaymentReceiptUploading] = useState(false);
  const [paymentReceiptError, setPaymentReceiptError] = useState('');
  const [tempBillingDate, setTempBillingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

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

  const handleDragStart = (event: DragStartEvent) => {
    const rawId = (event.active.id as string).replace(prefix, '');
    const lead = leads.find(l => l.member.id === rawId);
    if (lead) setActiveDragLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = (active.id as string).replace(prefix, '');
    const overId = (over.id as string).replace(prefix, '');

    let targetStatus: LeadStatus | null = null;
    if (COLUMNS.some(c => c.id === overId)) {
      targetStatus = overId as LeadStatus;
    } else {
      const overLead = leads.find(l => l.member.id === overId);
      if (overLead) targetStatus = overLead.status;
    }

    if (targetStatus) {
      const dragged = leads.find(l => l.member.id === leadId);
      if (!dragged) return;

      if (targetStatus === 'pagamento_pendente' && dragged.status !== 'pagamento_pendente') {
        setBillingPromptLead({ ...dragged, status: 'pagamento_pendente' });
      } else if (targetStatus === 'pago' && dragged.status !== 'pago') {
        setPaymentPromptLead(dragged);
        setPaymentMethod('Pix');
        setPaymentReceiptFile(null);
        setPaymentReceiptError('');
      } else {
        setLeads(prev => prev.map(l => l.member.id === leadId ? { ...l, status: targetStatus! } : l));
      }
    }
  };

  const updateLeadStatus = (newStatus: LeadStatus) => {
    if (!activeLead) return;
    if (newStatus === 'pagamento_pendente' && activeLead.status !== 'pagamento_pendente') {
      setBillingPromptLead({ ...activeLead, status: 'pagamento_pendente' });
    } else if (newStatus === 'pago' && activeLead.status !== 'pago') {
      setPaymentPromptLead(activeLead);
      setPaymentMethod('Pix');
      setPaymentReceiptFile(null);
      setPaymentReceiptError('');
    } else {
      setLeads(prev => prev.map(l => {
        if (l.member.id === activeLead.member.id) {
          const updated = { ...l, status: newStatus };
          setActiveLead(updated);
          return updated;
        }
        return l;
      }));
    }
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

  const customCollision = (args: any) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    const rect = rectIntersection(args);
    if (rect.length > 0) return rect;
    return closestCorners(args);
  };

  return (
    <div className="space-y-6">
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
      <DndContext sensors={sensors} collisionDetection={customCollision} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Desktop View: All Columns */}
        <div className="hidden sm:flex gap-4 overflow-x-auto pb-6 pt-2">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              leads={leads.filter(l => l.status === col.id)}
              prefix={prefix}
              billingValue={billingValue}
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
                prefix={prefix}
                billingValue={billingValue}
                onCardClick={lead => setActiveLead(lead)}
              />
            </div>
          ))}
        </div>

        {createPortal(
          <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeDragLead && (
              <div className="bg-[#241935] border-2 border-[#BF76FF] rounded-2xl p-3.5 shadow-2xl rotate-3 scale-105 cursor-grabbing z-[999999] opacity-95 w-72 pointer-events-none select-none space-y-2.5">
                <div className="flex items-center gap-3">
                  {activeDragLead.member.photoURL || activeDragLead.member.photoUrl ? (
                    <img src={activeDragLead.member.photoURL || activeDragLead.member.photoUrl} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{activeDragLead.member.name || 'Membro'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{activeDragLead.member.phone || 'Sem telefone'}</p>
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* ─── Modal: Solicitar Data de Cobrança ────────────────────────── */}
      {billingPromptLead && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setBillingPromptLead(null)}>
          <div className="bg-[#150f1d] border border-blue-500/30 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <Calendar className="w-7 h-7 font-black" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white uppercase tracking-tight">Agendar Cobrança</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Quando o lead <span className="text-white font-bold">"{billingPromptLead.member.name}"</span> deverá ser cobrado?
              </p>
            </div>
            <div className="text-left space-y-1.5 pt-1">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Data da Cobrança</label>
              <input
                type="date"
                value={tempBillingDate}
                onChange={e => setTempBillingDate(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setLeads(prev => prev.map(l => l.member.id === billingPromptLead.member.id ? { ...l, status: 'pagamento_pendente' } : l));
                  setBillingPromptLead(null);
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Sem Data
              </button>
              <button
                onClick={() => {
                  setLeads(prev => prev.map(l => {
                    if (l.member.id === billingPromptLead.member.id) {
                      const upd = { ...l, status: 'pagamento_pendente' as LeadStatus, billingDueDate: tempBillingDate };
                      if (activeLead && activeLead.member.id === l.member.id) setActiveLead(upd);
                      return upd;
                    }
                    return l;
                  }));
                  setBillingPromptLead(null);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment Confirmation Prompt Modal ─────────────────────────────── */}
      {paymentPromptLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPaymentPromptLead(null)}>
          <div className="bg-[#150f1d] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <DollarSign className="w-5 h-5 font-black" />
                <h3 className="font-black text-white uppercase text-sm tracking-wide">Confirmar Pagamento</h3>
              </div>
              <button onClick={() => setPaymentPromptLead(null)} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-300 leading-relaxed">
                Registrando pagamento para <span className="text-white font-bold">"{paymentPromptLead.member.name}"</span>. Qual foi a forma de pagamento?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Forma de Pagamento:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Dinheiro', 'Pix', 'Cartão', 'Link de pagamento'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      setPaymentReceiptError('');
                    }}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center",
                      paymentMethod === method
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md ring-1 ring-emerald-400/30"
                        : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod !== 'Dinheiro' ? (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Comprovante (Obrigatório)
                  </label>
                  {paymentReceiptFile && <span className="text-[10px] text-emerald-400 font-bold">✓ Arquivo selecionado</span>}
                </div>

                <label className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center",
                  paymentReceiptFile
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : paymentReceiptError
                      ? "bg-red-500/10 border-red-500/40 text-red-300"
                      : "bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-400"
                )}>
                  <Upload className="w-6 h-6 mb-1.5 opacity-80" />
                  <span className="text-xs font-bold truncate max-w-[280px]">
                    {paymentReceiptFile ? paymentReceiptFile.name : "Clique para anexar imagem ou PDF"}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">Obrigatório para Pix, Cartão e Link</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setPaymentReceiptFile(f);
                        setPaymentReceiptError('');
                      }
                    }}
                  />
                </label>
                {paymentReceiptError && (
                  <p className="text-[11px] text-red-400 font-bold animate-pulse text-center">{paymentReceiptError}</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-[11px] text-gray-400 text-center">
                💵 Para pagamento em Dinheiro não é necessário anexar comprovante.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button onClick={() => setPaymentPromptLead(null)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors">
                Cancelar
              </button>
              <button
                disabled={paymentReceiptUploading}
                onClick={async () => {
                  if (paymentMethod !== 'Dinheiro' && !paymentReceiptFile) {
                    setPaymentReceiptError('Anexe o comprovante obrigatório para continuar.');
                    return;
                  }

                  setPaymentReceiptUploading(true);
                  let receiptUrl = '';
                  try {
                    if (paymentReceiptFile) {
                      const formData = new FormData();
                      formData.append('file', paymentReceiptFile);
                      formData.append('upload_preset', 'site_uploads');

                      const res = await fetch('https://api.cloudinary.com/v1_1/dvkgodvhm/image/upload', {
                        method: 'POST',
                        body: formData
                      });
                      const data = await res.json();
                      if (data.secure_url) {
                        receiptUrl = data.secure_url;
                      }
                    }

                    const nowStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    const autoComment: LeadComment = {
                      id: Date.now().toString(),
                      text: paymentMethod === 'Dinheiro'
                        ? `✅ Pagamento confirmado em Dinheiro.`
                        : `✅ Pagamento confirmado via ${paymentMethod}. Comprovante anexado.`,
                      createdAt: nowStr,
                      attachments: receiptUrl ? [receiptUrl] : undefined,
                    };

                    setLeads(prev => prev.map(l => {
                      if (l.member.id === paymentPromptLead.member.id) {
                        const upd: Lead = {
                          ...l,
                          status: 'pago',
                          paymentMethod: paymentMethod,
                          paymentDate: new Date().toISOString(),
                          comments: [autoComment, ...(l.comments || [])],
                        };
                        if (activeLead && activeLead.member.id === l.member.id) setActiveLead(upd);
                        return upd;
                      }
                      return l;
                    }));

                    setPaymentPromptLead(null);
                    setPaymentReceiptFile(null);
                    setPaymentReceiptError('');
                  } catch (err) {
                    console.error('Error recording payment', err);
                    setPaymentReceiptError('Erro ao enviar comprovante. Tente novamente.');
                  } finally {
                    setPaymentReceiptUploading(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                {paymentReceiptUploading ? (
                  <><span>Enviando...</span></>
                ) : (
                  <><span>Confirmar Pagamento</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLeads(prev => prev.filter(l => l.member.id !== activeLead.member.id));
                    setActiveLead(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  title="Remover membro desta campanha"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Remover</span>
                </button>
                <button onClick={() => setActiveLead(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Valor Combinado</label>
                    <input
                      type="text"
                      defaultValue={activeLead.paymentValue || billingValue}
                      onChange={e => {
                        const val = e.target.value;
                        setLeads(prev => prev.map(l => l.member.id === activeLead.member.id ? { ...l, paymentValue: val } : l));
                        setActiveLead(prev => prev ? { ...prev, paymentValue: val } : null);
                      }}
                      placeholder="0,00"
                      className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-white text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-400 font-bold uppercase">Pago (Parcial / Total)</label>
                    <input
                      type="text"
                      defaultValue={activeLead.paidValue || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setLeads(prev => prev.map(l => l.member.id === activeLead.member.id ? { ...l, paidValue: val } : l));
                        setActiveLead(prev => prev ? { ...prev, paidValue: val } : null);
                      }}
                      placeholder="Ex: 50,00"
                      className="w-full h-9 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 text-amber-300 text-xs mt-1 font-bold focus:outline-none focus:border-amber-400"
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
                        setActiveLead(prev => prev ? { ...prev, paymentDate: val } : null);
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

                        {c.attachments && c.attachments.map((att, idx) => {
                          const isImg = att.match(/\.(jpg|jpeg|png|gif|webp)/i) || att.includes('image/upload');
                          return (
                            <div key={idx} className="mt-2 pt-2 border-t border-white/5">
                              {isImg ? (
                                <a href={att} target="_blank" rel="noreferrer" className="block mt-1 group">
                                  <img src={att} className="w-full max-h-36 object-cover rounded-lg border border-white/10 group-hover:opacity-90 transition-opacity" alt="Comprovante" />
                                  <span className="flex items-center gap-1.5 text-[10px] text-[#BF76FF] mt-1 font-semibold group-hover:underline">
                                    <ExternalLink className="w-3 h-3" /> Abrir comprovante original
                                  </span>
                                </a>
                              ) : (
                                <a href={att} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] text-[#BF76FF] hover:underline bg-[#BF76FF]/10 p-2 rounded-lg">
                                  <Paperclip className="w-3.5 h-3.5" /> Ver documento anexo
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 italic py-4 text-center">Nenhum comentário registrado.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer with OK button */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setActiveLead(null)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 font-black" />
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
