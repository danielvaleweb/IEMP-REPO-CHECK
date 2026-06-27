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
  Plus,
  UserPlus,
  ChevronDown,
  ChevronUp,
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
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export interface SavedCampaign {
  id: string;
  title: string;
  createdAt: string;
  message: string;
  imageUrl?: string;
  billingValue?: string;
  billingType?: string;
  pixKey?: string;
  leads: Lead[];
  isCollapsed?: boolean;
}

export function WhatsAppBlastView({ isDark, members, profile }: WhatsAppBlastViewProps) {
  const [campaignTitle, setCampaignTitle] = useState('');
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>(() => {
    try {
      const stored = localStorage.getItem('wa_crm_saved_campaigns_v3');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const updateSavedCampaigns = (newList: SavedCampaign[] | ((prev: SavedCampaign[]) => SavedCampaign[])) => {
    setSavedCampaigns(prev => {
      const updated = typeof newList === 'function' ? newList(prev) : newList;
      try {
        localStorage.setItem('wa_crm_saved_campaigns_v3', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const [step, setStepState] = useState<Step>(() => {
    try {
      const active = localStorage.getItem('wa_crm_active_step_v3') as Step;
      if (active) return active;
      const stored = localStorage.getItem('wa_crm_saved_campaigns_v3');
      const list = stored ? JSON.parse(stored) : [];
      return list.length > 0 ? 'kanban' : 'message';
    } catch { return 'message'; }
  });

  const setStep = (newStep: Step) => {
    setStepState(newStep);
    try {
      localStorage.setItem('wa_crm_active_step_v3', newStep);
    } catch { }
  };
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
  const [confirmDeleteCamp, setConfirmDeleteCamp] = useState<SavedCampaign | null>(null);
  const [confirmFinishCamp, setConfirmFinishCamp] = useState<SavedCampaign | null>(null);
  const [addMemberCamp, setAddMemberCamp] = useState<SavedCampaign | null>(null);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberSelectedIds, setAddMemberSelectedIds] = useState<Set<string>>(new Set());

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
      .map(m => ({ member: m!, status: 'a_enviar' as LeadStatus, paymentValue: billingValue }));

    const now = new Date();
    const title = campaignTitle.trim() || `Campanha ${now.toLocaleDateString('pt-BR')} (${initialLeads.length} leads)`;
    const newCamp: SavedCampaign = {
      id: Date.now().toString(),
      title,
      createdAt: now.toISOString(),
      message,
      imageUrl: imageUrl || undefined,
      billingValue,
      billingType,
      pixKey,
      leads: initialLeads,
      isCollapsed: false
    };

    updateSavedCampaigns(prev => [newCamp, ...prev.map(c => ({ ...c, isCollapsed: true }))]);
    setCampaignTitle('');
    setStep('kanban');
  };

  const finishBlast = async (campaignToFinish: SavedCampaign) => {
    setIsSaving(true);
    const finalLeads = campaignToFinish.leads;
    const sentCount = finalLeads.filter(r => r.status !== 'a_enviar' && r.status !== 'erro' && r.status !== 'cancelado').length;

    const recipients = finalLeads.map(r => ({
      memberId: r.member.id,
      memberName: r.member.name,
      status: r.status,
    }));

    try {
      await addDoc(collection(db, 'whatsapp_blasts'), {
        title: campaignToFinish.title,
        message: campaignToFinish.message,
        imageUrl: campaignToFinish.imageUrl || null,
        billingValue: campaignToFinish.billingValue || null,
        billingType: campaignToFinish.billingType || null,
        pixKey: campaignToFinish.pixKey || null,
        sentAt: serverTimestamp(),
        totalSelected: finalLeads.length,
        totalSent: sentCount,
        recipients,
        sentBy: profile?.id,
        sentByName: profile?.name || 'Admin',
      });

      const remaining = savedCampaigns.filter(c => c.id !== campaignToFinish.id);
      updateSavedCampaigns(remaining);

      if (remaining.length === 0) {
        setStep('history');
      }
    } catch (err) {
      console.error('Error saving blast history:', err);
      alert('Erro ao salvar histórico da campanha.');
    } finally {
      setIsSaving(false);
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

      {/* Top Header & 3 Main Tabs Switcher */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-8 bg-[#120c1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3ad900] to-[#aaff00] flex items-center justify-center shadow-lg shadow-[#BF76FF]/20 text-white shrink-0">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Event Manager
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Gerenciamento de custos e organização para eventos
            </p>
          </div>
        </div>

        {/* 3 Main Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 w-full xl:w-auto">
          <button
            onClick={() => setStep('kanban')}
            className={cn(
              "flex-1 sm:flex-none px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none",
              step === 'kanban'
                ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/25 scale-[1.02]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Campanhas Abertas ({savedCampaigns.length})</span>
          </button>

          <button
            onClick={() => {
              if (history.length === 0) loadHistory();
              else setStep('history');
            }}
            className={cn(
              "flex-1 sm:flex-none px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none",
              step === 'history'
                ? "bg-[#BF76FF] text-white shadow-lg shadow-[#BF76FF]/25 scale-[1.02]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Campanhas Encerradas</span>
          </button>

          <button
            onClick={() => {
              setMessage('');
              setImageUrl('');
              setSelectedMemberIds(new Set());
              setStep('message');
            }}
            className={cn(
              "w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none",
              step === 'message' || step === 'recipients'
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]"
                : "bg-white/10 text-white hover:bg-white/15"
            )}
          >
            <Plus className="w-4 h-4 font-black shrink-0" />
            <span>Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* Wizard Progress Indicator (Only shown when creating Nova Campanha) */}
      {(step === 'message' || step === 'recipients') && (
        <div className="flex items-center gap-3 mb-8 bg-[#150f1d] px-5 py-3.5 rounded-2xl border border-white/10 shadow-lg w-fit mx-auto animate-in fade-in duration-200">
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest mr-1">Etapa atual:</span>

          <div className="flex items-center gap-2" onClick={() => setStep('message')} role="button">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all", step === 'message' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/30" : "bg-[#25D366] text-white")}>
              {step === 'recipients' ? <Check className="w-3.5 h-3.5 font-bold" /> : 1}
            </div>
            <span className={cn("text-xs font-black uppercase tracking-wider cursor-pointer", step === 'message' ? "text-white" : "text-gray-400 hover:text-white")}>1. Escrever Mensagem</span>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-600" />

          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all", step === 'recipients' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/30" : "bg-white/5 text-gray-600")}>
              2
            </div>
            <span className={cn("text-xs font-black uppercase tracking-wider", step === 'recipients' ? "text-white" : "text-gray-600")}>2. Selecionar Membros</span>
          </div>
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

          {/* Título do Funil */}
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-[#BF76FF]" /> Nome / Título da Campanha (CRM)
            </label>
            <input
              type="text"
              value={campaignTitle}
              onChange={e => setCampaignTitle(e.target.value)}
              placeholder="Ex: Campanha Ceia, Retiro de Jovens..."
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#BF76FF]/50 transition-all"
            />
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
          STEP 3: Hub de Funis CRM Salvos
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 'kanban' && (
        <div className="max-w-[95vw] mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
          {savedCampaigns.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-bold text-sm">Nenhuma campanha ativa no momento.</p>
              <button onClick={() => setStep('message')} className="mt-3 text-[#BF76FF] font-bold text-xs underline">
                Criar a primeira campanha
              </button>
            </div>
          ) : (
            savedCampaigns.map(camp => (
              <div key={camp.id} className="bg-[#120c1a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl transition-all">
                <div
                  onClick={() => {
                    updateSavedCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, isCollapsed: !c.isCollapsed } : c));
                  }}
                  className="p-5 bg-white/[0.03] hover:bg-white/[0.05] border-b border-white/5 flex items-center justify-between cursor-pointer transition-colors select-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#BF76FF]/10 border border-[#BF76FF]/20 flex items-center justify-center text-[#BF76FF] group-hover:scale-110 transition-transform">
                      {camp.isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base sm:text-lg tracking-tight flex items-center gap-2.5">
                        {camp.title}
                        {camp.billingValue && (
                          <span className="text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold">
                            R$ {camp.billingValue}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        Criada em {new Date(camp.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} • {camp.leads.length} membros na pipeline
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                    {/* Incluir Membro Button */}
                    <button
                      onClick={() => setAddMemberCamp(camp)}
                      className="px-3 py-1.5 rounded-xl bg-[#BF76FF]/10 hover:bg-[#BF76FF]/20 text-[#BF76FF] border border-[#BF76FF]/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                      title="Incluir novo membro na campanha"
                    >
                      <UserPlus className="w-3.5 h-3.5 font-black" />
                      <span>+ Membro</span>
                    </button>

                    {/* Concluir Campanha Button */}
                    <button
                      onClick={() => setConfirmFinishCamp(camp)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 font-black" />
                      <span>Concluir</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setConfirmDeleteCamp(camp)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Excluir campanha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {!camp.isCollapsed && (
                  <div className="p-4 sm:p-6 overflow-x-auto">
                    <CampaignKanban
                      leads={camp.leads}
                      setLeads={(newLeadsAction) => {
                        updateSavedCampaigns(prev => prev.map(c => {
                          if (c.id === camp.id) {
                            const updatedLeads = typeof newLeadsAction === 'function' ? newLeadsAction(c.leads) : newLeadsAction;
                            return { ...c, leads: updatedLeads };
                          }
                          return c;
                        }));
                      }}
                      message={camp.message}
                      imageUrl={camp.imageUrl}
                      billingValue={camp.billingValue}
                      billingType={camp.billingType}
                      pixKey={camp.pixKey}
                      campaignId={camp.id}
                      onFinish={() => {
                        finishBlast(camp);
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

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

      {/* ─── Confirmation Modal: Delete Campaign ────────────────────────── */}
      {confirmDeleteCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmDeleteCamp(null)}>
          <div className="bg-[#150f1d] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Excluir Campanha?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tem certeza que deseja excluir permanentemente a campanha <span className="text-white font-bold">"{confirmDeleteCamp.title}"</span>? Os dados deste funil serão perdidos.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setConfirmDeleteCamp(null)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateSavedCampaigns(prev => prev.filter(c => c.id !== confirmDeleteCamp.id));
                  setConfirmDeleteCamp(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal: Finish Campaign ────────────────────────── */}
      {confirmFinishCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmFinishCamp(null)}>
          <div className="bg-[#150f1d] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Check className="w-7 h-7 font-black" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Concluir Campanha?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Deseja encerrar e arquivar <span className="text-white font-bold">"{confirmFinishCamp.title}"</span>? Ela será gravada no Histórico e removida das campanhas abertas.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setConfirmFinishCamp(null)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  finishBlast(confirmFinishCamp);
                  setConfirmFinishCamp(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
              >
                Sim, Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Adicionar Novo Membro à Campanha ────────────────────── */}
      {addMemberCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setAddMemberCamp(null)}>
          <div className="bg-[#150f1d] border border-white/10 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-[#BF76FF]" />
                <h3 className="font-black text-white uppercase text-sm tracking-wide">Incluir Membros na Campanha</h3>
              </div>
              <button onClick={() => setAddMemberCamp(null)} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={addMemberSearch}
                onChange={e => setAddMemberSearch(e.target.value)}
                placeholder="Buscar membro por nome..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-semibold placeholder:text-gray-600 focus:outline-none focus:border-[#BF76FF]/40"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[200px] max-h-[350px] pr-1 scrollbar-hide">
              {members
                .filter(m => !addMemberCamp.leads.some(l => l.member.id === m.id))
                .filter(m => m.name?.toLowerCase().includes(addMemberSearch.toLowerCase().trim()))
                .map(m => {
                  const isSel = addMemberSelectedIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setAddMemberSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(m.id)) next.delete(m.id);
                          else next.add(m.id);
                          return next;
                        });
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150",
                        isSel ? "bg-[#BF76FF]/15 border-[#BF76FF]/40 text-white" : "bg-white/[0.02] border-white/5 hover:bg-white/5 text-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", isSel ? "bg-[#BF76FF] border-[#BF76FF]" : "border-white/20")}>
                          {isSel && <Check className="w-3 h-3 text-white font-black" />}
                        </div>
                        {m.photoURL || m.photoUrl ? (
                          <img src={m.photoURL || m.photoUrl} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 font-bold text-xs shrink-0">
                            {m.name?.charAt(0) || 'M'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold leading-tight">{m.name}</p>
                          <p className="text-[10px] text-gray-500">{m.phone || 'Sem telefone'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {members.filter(m => !addMemberCamp.leads.some(l => l.member.id === m.id)).length === 0 && (
                <div className="py-12 text-center text-gray-500 text-xs font-medium">
                  Todos os membros já estão nesta campanha.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button onClick={() => setAddMemberCamp(null)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-xs uppercase tracking-wider transition-colors">
                Cancelar
              </button>
              <button
                disabled={addMemberSelectedIds.size === 0}
                onClick={() => {
                  const membersToAdd = members.filter(m => addMemberSelectedIds.has(m.id));
                  const newLeads: Lead[] = membersToAdd.map(m => ({
                    member: m,
                    status: 'a_enviar',
                  }));

                  updateSavedCampaigns(prev => prev.map(c => {
                    if (c.id === addMemberCamp.id) {
                      return { ...c, leads: [...c.leads, ...newLeads] };
                    }
                    return c;
                  }));

                  setAddMemberCamp(null);
                  setAddMemberSelectedIds(new Set());
                  setAddMemberSearch('');
                }}
                className="px-5 py-2 rounded-xl bg-[#BF76FF] hover:bg-[#a855f7] disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#BF76FF]/20 transition-all"
              >
                Adicionar ({addMemberSelectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
