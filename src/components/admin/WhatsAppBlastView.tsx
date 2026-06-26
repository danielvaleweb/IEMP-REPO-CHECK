import React, { useState, useMemo, useRef } from 'react';
import {
  Megaphone,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  SkipForward,
  Clock,
  AlertTriangle,
  MessageSquare,
  Users,
  X,
  Check,
  History,
  RotateCcw,
  ExternalLink,
  ImageIcon,
  Upload,
  Loader2,
  Trash2,
} from 'lucide-react';
import { CampaignKanban, Lead, LeadStatus } from './CampaignKanban';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Cloudinary config (same as project)
const CLOUD_NAME = 'dvkgodvhm';
const UPLOAD_PRESET = 'site_uploads';

export interface Member {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  photoURL?: string;
  photoUrl?: string;
  [key: string]: any;
}

interface BlastHistoryEntry {
  id: string;
  message: string;
  imageUrl?: string;
  sentAt: any;
  totalSelected: number;
  totalSent: number;
  totalSkipped: number;
  recipients: { memberId: string; memberName: string; status: 'sent' | 'skipped' | 'no_phone' }[];
  sentBy: string;
  sentByName: string;
}

interface WhatsAppBlastViewProps {
  isDark: boolean;
  members: Member[];
  profile: any;
}

type Step = 'message' | 'recipients' | 'kanban' | 'history';

const WhatsAppSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export function WhatsAppBlastView({ isDark, members, profile }: WhatsAppBlastViewProps) {
  const [step, setStep] = useState<Step>('message');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Cloudinary URL
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Billing fields
  const [billingValue, setBillingValue] = useState('');
  const [billingType, setBillingType] = useState('Por pessoa');
  const [pixKey, setPixKey] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<BlastHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── Image Upload ──────────────────────────────────────────────────────────
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Apenas arquivos de imagem são aceitos.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError('A imagem deve ter no máximo 4MB.');
      return;
    }
    setImageError('');
    setImageUploading(true);
    setImageUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, true);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setImageUploadProgress((e.loaded / e.total) * 100);
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const url: string = data.secure_url;
            // Add Cloudinary optimizations
            const optimized = url.includes('/upload/') && !url.includes('q_auto')
              ? url.replace('/upload/', '/upload/q_auto/f_auto/')
              : url;
            setImageUrl(optimized);
            resolve();
          } else {
            reject(new Error('Falha no upload'));
          }
        };
        xhr.onerror = () => reject(new Error('Erro de conexão'));
        xhr.send(formData);
      });
    } catch (err) {
      setImageError('Erro ao enviar imagem. Tente novamente.');
      console.error('Image upload error:', err);
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const removeImage = () => {
    setImageUrl('');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Members ───────────────────────────────────────────────────────────────
  const eligibleMembers = useMemo(() => {
    return members.filter(m =>
      m.status !== 'pending' &&
      m.status !== 'pending_approval' &&
      m.id !== profile?.id
    );
  }, [members, profile?.id]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return eligibleMembers;
    const q = memberSearch.toLowerCase();
    return eligibleMembers.filter(m => m.name?.toLowerCase().includes(q));
  }, [eligibleMembers, memberSearch]);

  const selectedCount = selectedMemberIds.size;
  const selectedWithPhone = useMemo(() => {
    return [...selectedMemberIds].filter(id => {
      const m = members.find(x => x.id === id);
      return m && m.phone;
    }).length;
  }, [selectedMemberIds, members]);
  const selectedWithoutPhone = selectedCount - selectedWithPhone;

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  // ─── Message personalization ───────────────────────────────────────────────
  const personalizeMessage = (msg: string, member: Member) => {
    const firstName = member.name?.split(' ')[0] || member.name || '';
    return msg.replace(/\{\{nome\}\}/gi, firstName).replace(/\{\{name\}\}/gi, firstName);
  };

  // Build wa.me URL — image URL appended to message text so WhatsApp shows a preview
  const buildWaUrl = (member: Member, msg: string, imgUrl: string) => {
    const phone = member.phone?.replace(/\D/g, '') || '';
    const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const fullText = imgUrl
      ? `${personalizeMessage(msg, member)}\n\n${imgUrl}`
      : personalizeMessage(msg, member);
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(fullText)}`;
  };

  // ─── Blast flow ────────────────────────────────────────────────────────────
  const startKanban = () => {
    const initialLeads: Lead[] = [...selectedMemberIds]
      .map(id => members.find(m => m.id === id))
      .filter(Boolean)
      .map(m => ({ member: m!, status: 'a_enviar' as LeadStatus }));
    setLeads(initialLeads);
    setStep('kanban');
  };

  const finishBlast = async (finalLeads: Lead[]) => {
    setIsSaving(true);
    const sentCount = finalLeads.filter(r => r.status !== 'a_enviar' && r.status !== 'erro' && r.status !== 'cancelado').length;

    const recipients = finalLeads.map(r => ({
      memberId: r.member.id,
      memberName: r.member.name,
      status: r.status,
    }));

    try {
      await addDoc(collection(db, 'whatsapp_blasts'), {
        message,
        imageUrl: imageUrl || null,
        billingValue,
        billingType,
        pixKey,
        sentAt: serverTimestamp(),
        totalSelected: finalLeads.length,
        totalSent: sentCount,
        recipients,
        sentBy: profile?.id,
        sentByName: profile?.name || 'Admin',
      });
    } catch (err) {
      console.error('Error saving blast history:', err);
    } finally {
      setIsSaving(false);
      setStep('history');
    }
  };

  const resetAll = () => {
    setStep('message');
    setMessage('');
    setImageUrl('');
    setImageError('');
    setSelectedMemberIds(new Set());
    setLeads([]);
    setBillingValue('');
    setPixKey('');
    setCurrentIndex(0);
    setMemberSearch('');
  };

  // ─── History ───────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    setLoadingHistory(true);
    setStep('history');
    try {
      const q = query(collection(db, 'whatsapp_blasts'), orderBy('sentAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlastHistoryEntry));
      setHistory(items);
    } catch (err) {
      console.error('Error loading blast history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 flex items-center justify-center shadow-lg shadow-[#25D366]/10">
            <Megaphone className="w-6 h-6 text-[#25D366]" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Disparo WhatsApp
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Envie mensagens para membros de forma sequencial
            </p>
          </div>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Histórico</span>
        </button>
      </div>

      {/* Step Indicator */}
      {step !== 'history' && (
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: 'message', label: 'Mensagem', num: 1 },
            { key: 'recipients', label: 'Membros', num: 2 },
            { key: 'kanban', label: 'Funil CRM', num: 3 },
          ].map((s, i) => {
            const isActive = step === s.key;
            const isDone =
              (s.key === 'message' && (step === 'recipients' || step === 'kanban')) ||
              (s.key === 'recipients' && step === 'kanban');
            return (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300",
                    isActive ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/30" :
                      isDone ? "bg-[#25D366] text-white" :
                        "bg-white/5 text-gray-500"
                  )}>
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest hidden sm:block",
                    isActive ? "text-white" : isDone ? "text-[#25D366]" : "text-gray-600"
                  )}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={cn(
                    "flex-1 h-px transition-all duration-500",
                    isDone ? "bg-[#25D366]" : "bg-white/5"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          STEP 1: Message + Image
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 'message' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Message Card */}
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-[#BF76FF]" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Escreva a Mensagem</h2>
            </div>

            {/* Variable hint */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#BF76FF]/5 border border-[#BF76FF]/10">
              <AlertTriangle className="w-4 h-4 text-[#BF76FF] shrink-0" />
              <p className="text-xs text-gray-400">
                Use <code className="bg-[#BF76FF]/10 text-[#BF76FF] px-1.5 py-0.5 rounded font-mono font-bold">{'{{nome}}'}</code> para inserir o primeiro nome do membro automaticamente
              </p>
            </div>

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Ex: Paz do Senhor {{nome}}! 🙏\nVocê está convidado(a) para o culto desta semana...`}
              rows={7}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm leading-relaxed resize-none focus:outline-none focus:border-[#BF76FF]/40 placeholder:text-gray-600 transition-all font-medium"
            />
          </div>

          {/* Image Card */}
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-[#BF76FF]" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">
                  Imagem <span className="text-gray-500 font-semibold text-sm normal-case">(opcional)</span>
                </h2>
              </div>
              {imageUrl && (
                <button
                  onClick={removeImage}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              )}
            </div>

            {imageUrl ? (
              /* Image preview */
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={removeImage}
                    className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="mt-2 px-1">
                  <p className="text-[10px] text-gray-500 font-semibold">
                    ✅ A URL da imagem será anexada ao final da mensagem — o WhatsApp exibe o preview automaticamente.
                  </p>
                </div>
              </div>
            ) : (
              /* Upload zone */
              <div
                onClick={() => !imageUploading && fileInputRef.current?.click()}
                onDrop={handleFileDrop}
                onDragOver={e => e.preventDefault()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
                  imageUploading
                    ? "border-[#BF76FF]/30 bg-[#BF76FF]/5 cursor-not-allowed"
                    : "border-white/10 hover:border-[#BF76FF]/40 hover:bg-[#BF76FF]/5"
                )}
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-[#BF76FF] animate-spin" />
                    <p className="text-xs font-bold text-[#BF76FF] uppercase tracking-widest">
                      Enviando... {Math.round(imageUploadProgress)}%
                    </p>
                    {/* Progress bar */}
                    <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7300FF] to-[#BF76FF] rounded-full transition-all duration-300"
                        style={{ width: `${imageUploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-300">Clique ou arraste uma imagem</p>
                      <p className="text-xs text-gray-600 font-semibold mt-1">JPG, PNG, WebP, GIF — máx. 4MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {imageError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-semibold">{imageError}</p>
              </div>
            )}
          </div>

          {/* Configuração de Cobrança (CRM) */}
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 flex items-center justify-center">
                <span className="text-[#25D366] font-black text-xs">R$</span>
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Dados da Cobrança</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor Cobrado</label>
                <input
                  type="text"
                  value={billingValue}
                  onChange={e => setBillingValue(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#25D366]/50 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Cobrança</label>
                <select
                  value={billingType}
                  onChange={e => setBillingType(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#25D366]/50 transition-all appearance-none"
                >
                  <option value="Por pessoa" className="bg-roxo-bg">Por pessoa</option>
                  <option value="Por família" className="bg-roxo-bg">Por família</option>
                  <option value="Mensalidade" className="bg-roxo-bg">Mensalidade</option>
                  <option value="Doação" className="bg-roxo-bg">Doação</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chave PIX (Opcional)</label>
              <input
                type="text"
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="Ex: celular, CPF ou email"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#25D366]/50 transition-all"
              />
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Essa chave será enviada na mensagem de pagamento da campanha.
              </p>
            </div>
          </div>

          {/* Preview Card */}
          {(message.trim() || imageUrl) && (
            <div className="bg-white/3 border border-white/5 rounded-3xl p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pré-visualização</p>
              <div className="bg-[#075E54]/10 border border-[#075E54]/20 rounded-2xl p-4">
                <div className="bg-[#DCF8C6] text-gray-800 rounded-[16px] rounded-tl-none p-3 shadow-sm max-w-xs space-y-2">
                  {imageUrl && (
                    <img src={imageUrl} alt="Preview" className="w-full rounded-xl object-cover max-h-40" />
                  )}
                  {message.trim() && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {personalizeMessage(message, { id: '_preview', name: 'Maria Silva' })}
                    </p>
                  )}
                </div>
                <p className="text-[9px] text-gray-600 mt-2 font-semibold">← Pré-visualização com nome de exemplo "Maria"</p>
              </div>
            </div>
          )}

          <button
            disabled={!message.trim() || imageUploading}
            onClick={() => setStep('recipients')}
            className={cn(
              "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300",
              message.trim() && !imageUploading
                ? "bg-gradient-to-r from-[#7300FF] to-[#BF76FF] text-white shadow-lg shadow-[#7300FF]/25 hover:shadow-xl hover:shadow-[#7300FF]/30 hover:scale-[1.01]"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            )}
          >
            {imageUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Aguardando upload...</>
            ) : (
              <>Próximo: Selecionar Membros <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          STEP 2: Recipients
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 'recipients' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#BF76FF]" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Selecionar Membros</h2>
              </div>
              <button
                onClick={() => setStep('message')}
                className="text-gray-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Selecionados', value: selectedCount, color: 'text-[#BF76FF]' },
                { label: 'Com telefone', value: selectedWithPhone, color: 'text-[#25D366]' },
                { label: 'Sem telefone', value: selectedWithoutPhone, color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center">
                  <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Buscar membro por nome..."
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-semibold placeholder:text-gray-600 focus:outline-none focus:border-[#BF76FF]/40 transition-all"
              />
            </div>

            {/* Select All */}
            <div
              onClick={toggleAll}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#BF76FF]/20 cursor-pointer transition-all group"
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                selectedMemberIds.size === filteredMembers.length && filteredMembers.length > 0
                  ? "bg-[#BF76FF] border-[#BF76FF]"
                  : "border-white/20 group-hover:border-[#BF76FF]/50"
              )}>
                {selectedMemberIds.size === filteredMembers.length && filteredMembers.length > 0 && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                Selecionar todos ({filteredMembers.length})
              </span>
            </div>

            {/* Member List */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto scrollbar-hide pr-1">
              {filteredMembers.map(m => {
                const isSelected = selectedMemberIds.has(m.id);
                const hasPhone = !!m.phone;
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200",
                      isSelected
                        ? "bg-[#BF76FF]/10 border-[#BF76FF]/30"
                        : "bg-white/3 border-white/5 hover:border-white/10 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-[#BF76FF] border-[#BF76FF]" : "border-white/20"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {m.photoURL || m.photoUrl ? (
                      <img
                        src={m.photoURL || m.photoUrl}
                        className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                        alt=""
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#BF76FF]/10 text-[#BF76FF] text-sm font-black flex items-center justify-center shrink-0">
                        {m.name?.[0]}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 font-semibold truncate">{m.role || 'Membro'}</p>
                    </div>

                    <div className="shrink-0">
                      {hasPhone ? (
                        <WhatsAppSVG className="w-3.5 h-3.5 text-[#25D366]" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="py-8 text-center text-gray-600 text-sm font-semibold">Nenhum membro encontrado</div>
              )}
            </div>

            {selectedWithoutPhone > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400 font-semibold">
                  {selectedWithoutPhone} membro{selectedWithoutPhone > 1 ? 's' : ''} sem telefone — ser{selectedWithoutPhone > 1 ? 'ão' : 'á'} pulado{selectedWithoutPhone > 1 ? 's' : ''} automaticamente.
                </p>
              </div>
            )}

            <button
              disabled={selectedCount === 0}
              onClick={startKanban}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300",
                selectedCount > 0
                  ? "bg-gradient-to-r from-[#7300FF] to-[#BF76FF] text-white shadow-lg shadow-[#7300FF]/25 hover:shadow-xl hover:shadow-[#7300FF]/30 hover:scale-[1.01]"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
            >
              <Users className="w-5 h-5" />
              Abrir Funil CRM ({selectedCount} membros)
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          STEP 3: Kanban
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 'kanban' && (
        <div className="max-w-[95vw] mx-auto overflow-x-auto pb-8">
           <CampaignKanban
             leads={leads}
             setLeads={setLeads}
             message={message}
             imageUrl={imageUrl}
             billingValue={billingValue}
             billingType={billingType}
             pixKey={pixKey}
             onFinish={() => {
                finishBlast(leads);
             }}
           />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          HISTORY
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 'history' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <History className="w-5 h-5 text-[#BF76FF]" />
              Histórico de Disparos
            </h2>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Novo Disparo
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#BF76FF] border-t-transparent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-gray-600 font-semibold">
              <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
              Nenhum disparo registrado ainda
            </div>
          ) : (
            history.map(h => (
              <div key={h.id} className="bg-white/3 border border-white/5 rounded-3xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail if image */}
                  {h.imageUrl && (
                    <img
                      src={h.imageUrl}
                      alt="img"
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold">{formatDate(h.sentAt)}</p>
                    <p className="text-white font-bold text-sm mt-1 line-clamp-2">{h.message}</p>
                    <p className="text-[10px] text-gray-600 font-semibold mt-1">Enviado por: {h.sentByName}</p>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <span className="text-[10px] font-black bg-[#25D366]/10 text-[#25D366] px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                      ✅ {h.totalSent}
                    </span>
                    <span className="text-[10px] font-black bg-amber-400/10 text-amber-400 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                      ⏭️ {h.totalSkipped}
                    </span>
                  </div>
                </div>

                {/* Recipients breakdown */}
                <div className="flex flex-wrap gap-1.5">
                  {h.recipients.map(r => (
                    <span
                      key={r.memberId}
                      className={cn(
                        "text-[10px] px-2.5 py-1 rounded-lg font-bold",
                        r.status === 'sent'
                          ? "bg-[#25D366]/10 text-[#25D366]"
                          : "bg-amber-400/10 text-amber-400"
                      )}
                    >
                      {r.status === 'sent' ? '✅' : '⏭️'} {r.memberName}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
