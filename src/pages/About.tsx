import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Instagram, 
  Play, 
  Check, 
  BriefcaseBusiness, 
  Clock, 
  MessageCircle, 
  X,
  Award,
  Cake
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getImageUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const isProfileComplete = (m: any) => {
  return m && m.name && m.photoURL && m.profession && m.birthDate && m.joinedDate && (m.ministries?.length > 0 || m.role !== "Membro") && m.coverImage;
};

const formatBirthday = (dateStr: any) => {
  if (!dateStr || typeof dateStr !== 'string') return "Não informado";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const day = parts[2];
  const monthIdx = parseInt(parts[1]) - 1;
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  return `${day} de ${months[monthIdx]}`;
};

export default function About() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snap = await getDocs(query(collection(db, "members"), limit(100)));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const activeMembers = data.filter(m => {
          const mRole = m.role || "";
          const isVisitor = typeof mRole === "string" ? mRole.toLowerCase() === "visitante" : (Array.isArray(mRole) && mRole.includes("Visitante"));
          const isAdminRole = typeof mRole === "string" ? mRole === "Administradores" : (Array.isArray(mRole) && mRole.includes("Administradores"));
          
          return (
            m.status !== "visitor" && 
            m.status !== "visitor_session" && 
            m.status !== "pending" && 
            m.status !== "pending_approval" &&
            !isVisitor &&
            !isAdminRole
          );
        });
        setMembers(activeMembers);
      } catch (e) {
        console.error("Error fetching members", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const calculateMemberDuration = (createdAt: any) => {
    if (!createdAt || typeof createdAt !== 'string') return "Membro recente";
    const date = new Date(createdAt + (createdAt.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(date.getTime())) return "Membro recente";
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      if (months === 0) return "Menos de 1 mês";
      return `${months} ${months > 1 ? 'Meses' : 'Mês'}`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years > 1 ? 'Anos' : 'Ano'}`;
  };

  const handleStartChat = (memberId: string) => {
    navigate(`/admin?chatUser=${memberId}`);
  };

  const isEligibleToChat = user && profile && profile.role !== "Visitante" && profile.status !== "pending_approval";

  const roleOrder = [
    "Direção", "Secretaria", "Desenvolvedor", "Mídia", "Diácono", "Diaconisa", "Obreiro",
    "Minis. infantil", "Minis. louvor", "Minis. Jovens", "Coord. Mulheres", "Coord. Coreografia",
    "Coord. Vist. Hospitalar", "Recepcionista", "Visitante", "Membro"
  ];

  const getPrimaryRole = (m: any) => {
    const leaderRoles = (m.ministries || []).filter((min: any) => typeof min === 'object' && min.isLeader).map((min: any) => min.name);
    if (leaderRoles.length > 0) {
      for (const role of roleOrder) {
        if (leaderRoles.includes(role)) return role;
      }
    }
    const memberRoles = (m.ministries || []).map((min: any) => typeof min === 'string' ? min : min.name);
    if (m.role) memberRoles.push(m.role);
    for (const role of roleOrder) {
      if (memberRoles.includes(role)) return role;
    }
    return m.role === "Visitante" ? "Visitante" : "Membro";
  };

  const groupedMembers = members.reduce((acc, member) => {
    const role = getPrimaryRole(member);
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedRoles = Object.keys(groupedMembers).sort((a, b) => {
    const getIndex = (r: string) => {
      const idx = roleOrder.findIndex(o => o.toLowerCase() === r.toLowerCase());
      return idx === -1 ? 999 : idx;
    };
    return getIndex(a) - getIndex(b);
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24">
      <div className="w-full bg-black h-20 md:h-24"></div>

      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="bg-black/5 rounded-[2rem] p-8 md:p-16 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-black/10 text-center relative overflow-hidden group transition-all hover:bg-black/10">
          <Play className="w-16 h-16 text-black/20 mb-6 group-hover:scale-110 group-hover:text-black/40 transition-all duration-500" />
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-black/40 uppercase mb-4">Vídeo da Igreja</h2>
          <p className="text-gray-500 max-w-lg font-medium">Em breve adicionaremos um vídeo institucional mostrando nossa história, missão e valores.</p>
        </div>
      </section>

      <section className="px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">Nossa Equipe</h2>
            <p className="text-gray-500 text-lg">Conheça as pessoas que fazem parte da nossa história.</p>
          </div>
          <div className="flex-shrink-0 text-sm font-bold bg-white px-6 py-3 rounded-full shadow-sm text-black uppercase tracking-widest border border-black/5">
            {members.length} Membros cadastrados
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(n => (
              <div key={n} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-black/5 h-[400px] animate-pulse">
                <div className="h-32 bg-gray-200"></div>
                <div className="w-24 h-24 rounded-full bg-white mx-auto -mt-12 p-1 relative z-10"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-20">
            {sortedRoles.map(role => (
              <div key={role}>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 px-2 opacity-80 border-b border-black/5 pb-3">{role}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {groupedMembers[role].map((member: any) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] transition-all duration-300 border border-black/5 flex flex-col group relative"
                    >
                      <div className="h-32 relative overflow-hidden bg-[#111] flex-shrink-0">
                        {member.coverImage ? (
                          <img src={getImageUrl(member.coverImage)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        {member.instagram && (
                          <a href={member.instagram.includes('instagram.com') ? member.instagram : `https://instagram.com/${member.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-4 text-white hover:scale-110 transition-all z-20">
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                      </div>

                      <div className="px-6 relative flex justify-between items-start mb-2 z-10">
                        <div className="relative w-24 h-24 -mt-12 shrink-0">
                          <button onClick={() => setSelectedPhoto(member.photoURL)} className="w-full h-full rounded-full border-[4px] border-white bg-white overflow-hidden shadow-sm hover:scale-105 transition-transform cursor-zoom-in">
                             <img src={getImageUrl(member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`)} alt={member.name} className="w-full h-full object-cover" />
                          </button>
                          {isProfileComplete(member) && (
                            <div className="absolute top-0.5 right-0.5 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_2px_10px_rgba(59,130,246,0.5)] z-20">
                              <Check className="w-3.5 h-3.5 stroke-[4]" />
                            </div>
                          )}
                        </div>
                        <div className="pt-3">
                          <button onClick={() => setSelectedMember(member)} className="h-10 px-8 rounded-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm active:scale-95">Ver Perfil</button>
                        </div>
                      </div>

                      <div className="px-6 pb-6 flex-1 flex flex-col pt-2">
                        <h3 className="text-[22px] font-bold text-gray-900 leading-tight mb-4">
                          {(member.name || 'Sem Nome').split(' ')[0]} {(member.name || '').split(' ')[1] || ''}
                        </h3>
                        <div className="grid grid-cols-1 gap-y-2.5 text-[14px] text-gray-500 mb-5">
                          <div className="flex items-center gap-3"><BriefcaseBusiness className="w-4 h-4 text-gray-400 shrink-0" /> <span className="truncate">{member.profession || "Não informada"}</span></div>
                          <div className="flex items-center gap-3"><Cake className="w-4 h-4 text-gray-400 shrink-0" /> <span>{formatBirthday(member.birthDate)}</span></div>
                          <div className="flex items-center gap-3"><Award className="w-4 h-4 text-gray-400 shrink-0" /> <span className="truncate font-medium text-gray-700">{member.ministries?.length > 0 ? member.ministries.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') : (member.role || "Membro")}</span></div>
                          <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-gray-400 shrink-0" /> <span className="truncate">{member.joinedDate ? `${calculateMemberDuration(member.joinedDate)} na IEMP` : "Membro recente"}</span></div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Principais habilidades</p>
                          <div className="flex flex-wrap gap-1.5">
                            {member.churchSkills ? member.churchSkills.split(',').slice(0,3).map((skill: string, i: number) => (
                                 <span key={i} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 rounded-md">{skill.trim()}</span>
                            )) : <span className="text-xs italic text-gray-400">Não possui habilidades cadastradas</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-white max-h-[90vh] overflow-y-auto custom-scrollbar mt-20 sm:my-8 [&>button]:hidden outline-none ring-0">
          {selectedMember && (
            <div className="relative pb-12">
              <div className="h-44 relative overflow-hidden bg-black">
                {selectedMember.coverImage ? (
                  <img src={getImageUrl(selectedMember.coverImage)} alt="" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-[60] shadow-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center -mt-16 relative z-10 px-8 mb-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <img src={getImageUrl(selectedMember.photoURL)} alt="" className="w-full h-full object-cover" />
                  </div>
                  {isProfileComplete(selectedMember) && (
                    <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }} className="absolute top-1 right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(59,130,246,0.6)] z-20">
                      <Check className="w-4 h-4 stroke-[4]" />
                    </motion.div>
                  )}
                </div>
                <div className="text-center mt-3 space-y-1">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedMember.name}</h2>
                  <div className="inline-flex px-4 py-1 rounded-full bg-blue-50 text-blue-600 font-bold uppercase tracking-widest text-[10px]">{selectedMember.role || "Membro"}</div>
                </div>
              </div>

              <div className="px-6 md:px-10 space-y-5">
                {(selectedMember.bio || selectedMember.additionalInfo) && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Biografia</h4>
                    <div className="text-gray-600 text-sm leading-snug font-medium bg-gray-50/50 p-4 rounded-3xl border border-gray-100 prose prose-sm prose-slate max-w-none [&_p]:m-0 [&_p]:whitespace-pre-wrap">
                      <ReactMarkdown>
                        {(selectedMember.bio || selectedMember.additionalInfo || "").trim()}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Informações Pessoais</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500"><BriefcaseBusiness className="w-5 h-5" /></div>
                      <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Profissão</p><p className="text-sm font-bold text-gray-700">{selectedMember.profession || "Não informada"}</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-pink-500"><Cake className="w-5 h-5" /></div>
                      <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Aniversário</p><p className="text-sm font-bold text-gray-700">{formatBirthday(selectedMember.birthDate)}</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-500"><Clock className="w-5 h-5" /></div>
                      <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tempo na IEMP</p><p className="text-sm font-bold text-gray-700">{selectedMember.joinedDate ? `${calculateMemberDuration(selectedMember.joinedDate).replace(' na IEMP', '')} de caminhada` : "Membro recente"}</p></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Habilidades & Talentos</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.churchSkills ? selectedMember.churchSkills.split(',').map((skill: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-wider">{skill.trim()}</span>
                    )) : <p className="text-sm italic text-gray-400 pl-2">Nenhuma habilidade listada</p>}
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  {selectedMember.instagram && (
                    <a href={selectedMember.instagram.includes('instagram.com') ? selectedMember.instagram : `https://instagram.com/${selectedMember.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-90 transition-all shadow-lg active:scale-[0.98]">
                      <Instagram className="w-5 h-5" />
                      <span className="font-black uppercase tracking-widest text-[11px]">@{selectedMember.instagram.replace('@', '')}</span>
                    </a>
                  )}
                  {isEligibleToChat && profile?.id !== selectedMember.id && (
                    <Button className="w-full h-14 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-[11px] hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]" onClick={() => { setSelectedMember(null); handleStartChat(selectedMember.id); }}>
                      <MessageCircle className="w-5 h-5" />
                      Enviar mensagem privada
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl p-0 border-0 bg-transparent shadow-none flex items-center justify-center outline-none ring-0 [&>button]:hidden">
          {selectedPhoto && (
            <div className="relative group">
              <img src={getImageUrl(selectedPhoto)} alt="" className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain" />
              <button onClick={() => setSelectedPhoto(null)} className="absolute -top-4 -right-4 p-2 bg-white text-black rounded-full shadow-xl hover:scale-110 transition-transform z-50">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
