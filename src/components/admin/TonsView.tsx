import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRadio } from '@/contexts/RadioContext';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Music, Plus, Play, Pause, Search, User, Youtube, Trash2, Edit, X, Save, Mic, Speaker, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appAlert, appConfirm } from '@/lib/modalHelpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'motion/react';

interface Song {
  id: string;
  memberId: string;
  name: string;
  singer: string;
  key: string;
  youtubeLink: string;
  youtubeId?: string;
  createdAt: any;
}

export function TonsView({ isDark, members, canCreate, canEdit, canDelete }: {
  isDark: boolean,
  members: any[],
  canCreate: boolean,
  canEdit: boolean,
  canDelete: boolean
}) {
  const { user, profile } = useAuth();

  const { playTrack, isPlaying, currentTrack } = useRadio();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVocalists, setExpandedVocalists] = useState<Set<string>>(new Set());

  const toggleExpand = (vocalistId: string) => {
    setExpandedVocalists(prev => {
      const next = new Set(prev);
      if (next.has(vocalistId)) next.delete(vocalistId);
      else next.add(vocalistId);
      return next;
    });
  };

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    singer: '',
    key: '',
    youtubeLink: ''
  });

  const userRoles = useMemo(() => {
    const roles = new Set<string>();
    if (profile?.role) roles.add(profile.role);
    if (profile?.roles && Array.isArray(profile.roles)) {
      profile.roles.forEach((r: any) => roles.add(typeof r === 'string' ? r : r.name));
    }
    if (profile?.ministries && Array.isArray(profile.ministries)) {
      profile.ministries.forEach((m: any) => roles.add(typeof m === 'object' ? m.name : m));
    }
    return Array.from(roles);
  }, [profile]);

  const isMasterAdmin = profile?.email === "iempministerioprofecia@gmail.com" || user?.email === "iempministerioprofecia@gmail.com";
  const hasGlobalTonsPermission = isMasterAdmin || 
                                  userRoles.includes("Administradores") || 
                                  userRoles.includes("Desenvolvedor") ||
                                  userRoles.includes("ED. TON");

  const canEditVocalist = (vocalistId: string) => {
    if (hasGlobalTonsPermission) return true;
    return profile?.id === vocalistId;
  };

  // Filter vocalists
  const vocalists = useMemo(() => {
    return members.filter(m => {
      const skillsStr = (m.churchSkills || "").toLowerCase();
      const hasCantoSkill = skillsStr.includes('canto') ||
        (m.skills || []).some((s: string) => s.toLowerCase().includes('canto'));

      return hasCantoSkill;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const vocalistsForDropdown = useMemo(() => {
    if (hasGlobalTonsPermission) return vocalists;
    return vocalists.filter(v => v.id === profile?.id);
  }, [vocalists, hasGlobalTonsPermission, profile]);

  useEffect(() => {
    const q = query(collection(db, "member-songs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const songsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Song[];
      setSongs(songsData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSaveSong = async () => {
    if (!formData.name || !formData.key || !targetMemberId) {
      await appAlert("Por favor, preencha o nome da música, o tom e selecione o vocalista.", "warning");
      return;
    }

    const youtubeId = extractYoutubeId(formData.youtubeLink) || null;

    const songPayload = {
      ...formData,
      memberId: targetMemberId,
      youtubeId,
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing && editingSongId) {
        await updateDoc(doc(db, "member-songs", editingSongId), songPayload);
      } else {
        await addDoc(collection(db, "member-songs"), {
          ...songPayload,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar música:", error);
      await appAlert("Erro ao salvar música.", "error");
    }
  };

  const resetForm = () => {
    setFormData({ name: '', singer: '', key: '', youtubeLink: '' });
    setIsEditing(false);
    setEditingSongId(null);
    setTargetMemberId('');
  };

  const handleEdit = (song: Song) => {
    setFormData({
      name: song.name,
      singer: song.singer,
      key: song.key,
      youtubeLink: song.youtubeLink
    });
    setTargetMemberId(song.memberId);
    setEditingSongId(song.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await appConfirm("Deseja realmente excluir esta música?", "Excluir música", "Sim, excluir")) {
      try {
        await deleteDoc(doc(db, "member-songs", id));
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  const handlePlaySong = (song: Song) => {
    if (!song.youtubeId) return;

    const track = {
      id: `song-${song.id}`,
      title: song.name,
      artist: song.singer,
      youtubeId: song.youtubeId,
      thumbnail: `https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`
    };

    playTrack(track, [track]);
  };

  const filteredVocalists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return vocalists;
    return vocalists.filter(v => {
      const nameMatches = v.name.toLowerCase().includes(query);
      if (nameMatches) return true;

      const vocalistSongs = songs.filter(s => s.memberId === v.id);
      return vocalistSongs.some(s => 
        s.name.toLowerCase().includes(query) || 
        s.key.toLowerCase().includes(query) ||
        (s.singer && s.singer.toLowerCase().includes(query))
      );
    });
  }, [vocalists, songs, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>
            Gestão de <span className="text-[#BF76FF]">Tons</span>
          </h2>
          <p className={cn("text-sm opacity-60 mt-1", isDark ? "text-gray-300" : "text-gray-600")}>Configure o tom de cada música para os vocalistas.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#BF76FF]" />
            <Input
              placeholder="Buscar vocalista, música ou tom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-11 rounded-2xl border-none transition-all focus:ring-1 focus:ring-[#BF76FF]/40",
                isDark ? "bg-white/5 focus:bg-white/10" : "bg-black/5 focus:bg-black/10 shadow-sm"
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {filteredVocalists.length > 0 ? (
          filteredVocalists.map((vocalist) => {
            const vocalistSongs = songs.filter(s => s.memberId === vocalist.id);
            const isExpanded = expandedVocalists.has(vocalist.id);
            return (
              <Card
                key={vocalist.id}
                className={cn(
                  "px-4 py-3 rounded-2xl border-none shadow-md overflow-hidden relative",
                  isDark ? "bg-white/[0.03]" : "bg-white"
                )}
              >
                {/* Header row */}
                <div className={cn("flex items-center gap-3", isExpanded && "mb-3")}>
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#BF76FF]/30 shrink-0">
                    {vocalist.photoURL ? (
                      <img src={vocalist.photoURL} alt={vocalist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#BF76FF]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#BF76FF]" />
                      </div>
                    )}
                  </div>

                  {/* Name + badge */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-black text-base truncate leading-tight", isDark ? "text-white" : "text-black")}>{vocalist.name}</h3>
                    <div className={cn("mt-0.5 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500")}>
                      {vocalistSongs.length} {vocalistSongs.length === 1 ? 'música' : 'músicas'}
                    </div>
                  </div>

                  {/* Actions — far right */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {canCreate && canEditVocalist(vocalist.id) && (
                      <button
                        onClick={() => { resetForm(); setTargetMemberId(vocalist.id); setIsModalOpen(true); }}
                        className="w-7 h-7 rounded-xl bg-[#BF76FF]/10 text-[#BF76FF] hover:bg-[#BF76FF] hover:text-white flex items-center justify-center transition-all"
                        title="Adicionar Música"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(vocalist.id)}
                      className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center transition-all",
                        isDark ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white" : "bg-black/5 text-gray-400 hover:bg-black/10 hover:text-black"
                      )}
                      title={isExpanded ? "Recolher músicas" : "Expandir músicas"}
                    >
                      <ChevronDown
                        className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="songs-grid"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {vocalistSongs.map(song => (
                          <div
                            key={song.id}
                            className={cn(
                              "group p-4 rounded-2xl border transition-all flex items-center justify-between",
                              isDark ? "bg-white/5 border-white/5 hover:bg-white/[0.08]" : "bg-gray-50 border-black/5 hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all",
                                  song.youtubeId ? "bg-[#BF76FF] text-white hover:scale-105 active:scale-95 shadow-lg shadow-[#BF76FF]/30" : "bg-gray-400/20 text-gray-400 cursor-default"
                                )}
                                onClick={() => song.youtubeId && handlePlaySong(song)}
                              >
                                {isPlaying && currentTrack?.id === `song-${song.id}` ? (
                                  <Speaker className="w-5 h-5 animate-pulse" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                                )}
                              </div>
                              <div className="truncate">
                                <p className={cn("font-bold text-sm truncate", isDark ? "text-white" : "text-black")}>{song.name}</p>
                                <p className={cn("text-[10px] opacity-50 truncate", isDark ? "text-gray-400" : "text-gray-500")}>Ref: {song.singer || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-center px-3 py-1 rounded-lg bg-[#BF76FF]/10 border border-[#BF76FF]/20">
                                <span className="text-xs font-black text-[#BF76FF]">{song.key}</span>
                              </div>

                              <div className="flex items-center">
                                {canEdit && canEditVocalist(vocalist.id) && (
                                  <button
                                    onClick={() => handleEdit(song)}
                                    className="p-2 text-gray-400 hover:text-[#BF76FF] transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {canDelete && canEditVocalist(vocalist.id) && (
                                  <button
                                    onClick={() => handleDelete(song.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })
        ) : (
          <div className={cn("py-20 flex flex-col items-center justify-center text-center rounded-[32px] border border-dashed", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")}>
            <Mic className={cn("w-16 h-16 mb-4 opacity-20", isDark ? "text-white" : "text-black")} />
            <p className={cn("text-lg font-bold", isDark ? "text-white" : "text-black")}>Nenhum vocalista encontrado</p>
            <p className={cn("text-sm opacity-60", isDark ? "text-gray-400" : "text-gray-500")}>Certifique-se de que os membros tenham a habilidade "Canto".</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsModalOpen(open); }}>
        <DialogContent className={cn("rounded-[32px] border-none shadow-2xl max-w-lg", isDark ? "bg-[#0f0f0f] text-white" : "bg-white text-black")}>
          <DialogHeader>
            <DialogTitle className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>{isEditing ? 'Editar Música' : 'Cadastrar Nova Música'}</DialogTitle>
            <DialogDescription className={cn("text-xs font-bold uppercase tracking-widest opacity-50", isDark ? "text-gray-400" : "text-gray-500")}>
              {isEditing ? 'Atualize as informações do tom' : 'Preencha os detalhes para configurar o tom do vocalista'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 ml-1", isDark ? "text-gray-300" : "text-gray-600")}>Vocalista</label>
              <select
                value={targetMemberId}
                onChange={(e) => setTargetMemberId(e.target.value)}
                className={cn(
                  "w-full h-12 rounded-2xl px-4 text-sm font-bold focus:outline-none transition-all appearance-none",
                  isDark ? "bg-white/5 focus:bg-white/10" : "bg-black/5 focus:bg-black/10"
                )}
                disabled={isEditing}
              >
                <option value="">Selecione um vocalista...</option>
                {vocalistsForDropdown.map(v => (
                  <option key={v.id} value={v.id} className={isDark ? "bg-[#0f0f0f]" : "bg-white"}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 ml-1", isDark ? "text-gray-300" : "text-gray-600")}>Nome da Música</label>
                <Input
                  placeholder="Ex: Hosana"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn("h-12 rounded-2xl border-none", isDark ? "bg-white/5" : "bg-black/5")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 ml-1", isDark ? "text-gray-300" : "text-gray-600")}>Tom (Key)</label>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note) => {
                      const isSelected = formData.key.startsWith(note) && (formData.key.length === note.length || formData.key[note.length] === 'm');
                      const baseNote = formData.key.endsWith('m') ? formData.key.slice(0, -1) : formData.key;
                      const isThisNote = baseNote === note;

                      return (
                        <button
                          key={note}
                          onClick={() => {
                            const isMinor = formData.key.endsWith('m');
                            setFormData({ ...formData, key: isMinor ? `${note}m` : note });
                          }}
                          className={cn(
                            "h-10 rounded-xl text-xs font-bold transition-all border",
                            isThisNote
                              ? "bg-[#BF76FF] text-white border-transparent shadow-lg shadow-[#BF76FF]/20"
                              : isDark ? "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 border-black/5 text-gray-600 hover:bg-black/10"
                          )}
                        >
                          {note}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (formData.key.endsWith('m')) {
                          setFormData({ ...formData, key: formData.key.slice(0, -1) });
                        }
                      }}
                      className={cn(
                        "flex-1 h-10 rounded-xl text-xs font-bold transition-all border",
                        !formData.key.endsWith('m') && formData.key !== ""
                          ? "bg-[#BF76FF]/20 text-[#BF76FF] border-[#BF76FF]/30"
                          : isDark ? "bg-white/5 border-white/5 text-gray-500" : "bg-black/5 border-black/5 text-gray-400"
                      )}
                    >
                      MAIOR
                    </button>
                    <button
                      onClick={() => {
                        if (formData.key && !formData.key.endsWith('m')) {
                          setFormData({ ...formData, key: `${formData.key}m` });
                        }
                      }}
                      className={cn(
                        "flex-1 h-10 rounded-xl text-xs font-bold transition-all border",
                        formData.key.endsWith('m')
                          ? "bg-[#BF76FF]/20 text-[#BF76FF] border-[#BF76FF]/30"
                          : isDark ? "bg-white/5 border-white/5 text-gray-500" : "bg-black/5 border-black/5 text-gray-400"
                      )}
                    >
                      MENOR (m)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 ml-1", isDark ? "text-gray-300" : "text-gray-600")}>Quem canta (Referência)</label>
              <Input
                placeholder="Ex: Hillsong Worship"
                value={formData.singer}
                onChange={(e) => setFormData({ ...formData, singer: e.target.value })}
                className={cn("h-12 rounded-2xl border-none", isDark ? "bg-white/5" : "bg-black/5")}
              />
            </div>

            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-60 ml-1", isDark ? "text-gray-300" : "text-gray-600")}>Link do Youtube (OPCIONAL)</label>
              <div className="relative">
                <Youtube className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.youtubeLink}
                  onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                  className={cn("h-12 rounded-2xl border-none pl-12", isDark ? "bg-white/5" : "bg-black/5")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className={cn("rounded-2xl h-12 px-6 font-bold w-full sm:flex-1", isDark ? "hover:bg-white/5" : "hover:bg-black/5")}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSong}
              className="bg-[#BF76FF] hover:bg-[#a65de6] text-white rounded-2xl h-12 px-8 font-bold w-full sm:flex-1"
            >
              <Save className="w-4 h-4 mr-2" /> {isEditing ? 'Salvar Alterações' : 'Cadastrar Música'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
