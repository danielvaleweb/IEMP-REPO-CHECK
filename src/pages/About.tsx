import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Instagram, Play, Check, Search, Calendar, Briefcase, Star, Clock, MessageCircle } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";

export default function About() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snap = await getDocs(collection(db, "members"));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        // Filter members only (no visitors or pending)
        const activeMembers = data.filter(m => {
          const mRole = m.role || "";
          const isVisitor = typeof mRole === "string" ? mRole.toLowerCase() === "visitante" : (Array.isArray(mRole) && mRole.includes("Visitante"));
          return (
            m.status !== "visitor" && 
            m.status !== "visitor_session" && 
            m.status !== "pending" && 
            m.status !== "pending_approval" &&
            !isVisitor
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

  const calculateMemberDuration = (createdAt: string) => {
    if (!createdAt) return "Membro recente";
    const date = new Date(createdAt + (createdAt.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(date.getTime())) return "Membro recente";
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mê${months > 1 ? 'ses' : 's'}`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ano${years > 1 ? 's' : ''}`;
  };

  const handleStartChat = (memberId: string) => {
    navigate(`/admin?chatUser=${memberId}`);
  };

  const isEligibleToChat = user && profile && profile.role !== "Visitante" && profile.status !== "pending_approval";

  const roleOrder = [
    "Administradores", 
    "Direção", 
    "Secretaria", 
    "Desenvolvedor", 
    "Mídia", 
    "Diácono", 
    "Diaconisa", 
    "Obreiro",
    "Minis. infantil", 
    "Minis. louvor", 
    "Minis. Jovens",
    "Coord. Mulheres",
    "Coord. Coreografia",
    "Coord. Vist. Hospitalar",
    "Recepcionista",
    "Visitante",
    "Membro"
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

  const sortedRoles = Object.keys(groupedMembers)
    .sort((a, b) => {
      const getIndex = (r: string) => {
        const idx = roleOrder.findIndex(o => o.toLowerCase() === r.toLowerCase());
        return idx === -1 ? 999 : idx;
      };
      const indexA = getIndex(a);
      const indexB = getIndex(b);
      if (indexA !== indexB) return indexA - indexB;
      return a.localeCompare(b);
    });

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24">
      {/* Header Space */}
      <div className="w-full bg-black h-20 md:h-24"></div>

      {/* Video Section - Espaço para o vídeo */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="bg-black/5 rounded-[2rem] p-8 md:p-16 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-black/10 text-center relative overflow-hidden group transition-all hover:bg-black/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Play className="w-16 h-16 text-black/20 mb-6 group-hover:scale-110 group-hover:text-black/40 transition-all duration-500" />
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-black/40 uppercase mb-4">
            Vídeo da Igreja
          </h2>
          <p className="text-gray-500 max-w-lg font-medium">
            Em breve adicionaremos um vídeo institucional mostrando nossa história, missão e valores. Fique ligado!
          </p>
        </div>
      </section>

      {/* Members Section */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-2">
              Nossa Equipe
            </h2>
            <p className="text-gray-500 text-lg">Conheça as pessoas que fazem parte da nossa história.</p>
          </div>
          <div className="flex-shrink-0 text-sm font-bold bg-white px-6 py-3 rounded-full shadow-sm text-black uppercase tracking-widest border border-black/5">
            {members.length} Integrantes
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(n => (
              <div key={n} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-black/5 h-[400px] animate-pulse">
                <div className="h-32 bg-gray-200"></div>
                <div className="w-24 h-24 rounded-full bg-white mx-auto -mt-12 p-1 relative z-10">
                  <div className="w-full h-full rounded-full bg-gray-200"></div>
                </div>
                <div className="p-6 pt-2 space-y-4">
                  <div className="h-6 bg-gray-200 w-1/2 mx-auto rounded-full"></div>
                  <div className="h-4 bg-gray-200 w-3/4 mx-auto rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-20">
            {sortedRoles.map(role => (
              <div key={role}>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 px-2 opacity-80 border-b border-black/5 pb-3">
                  {role} {(role === "Membro" || role === "Membros") ? "" : ""}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {groupedMembers[role].map((member: any) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] transition-all duration-300 border border-black/5 flex flex-col group relative"
                    >
                      {/* Top Half: Cover Image inside card */}
                      <div className="h-32 relative overflow-hidden bg-[#111] flex-shrink-0">
                        {member.coverImage ? (
                          <img src={getImageUrl(member.coverImage)} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800"></div>
                        )}
                        {/* Overlay shadow for text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      </div>

                      {/* Profile overlap & Action Button */}
                      <div className="px-6 relative flex justify-between items-start mb-2 z-10">
                        <div className="w-24 h-24 rounded-full border-[4px] border-white bg-white overflow-hidden shadow-sm -mt-12 shrink-0">
                           <img 
                            src={getImageUrl(member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`)} 
                            alt={member.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        
                        {/* Action Button - on the right */}
                        <div className="pt-3">
                          {isEligibleToChat && profile?.id !== member.id && (
                            <button
                              onClick={() => handleStartChat(member.id)}
                              className="h-10 px-6 rounded-full bg-black text-white text-sm font-bold tracking-wide hover:bg-gray-800 transition-colors shadow-sm active:scale-95"
                            >
                              Mensagem
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-6 pb-6 flex-1 flex flex-col pt-2">
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[22px] font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                               {member.name.split(' ')[0]} {member.name.split(' ')[1] || ''}
                            </h3>
                            {member.instagram && (
                               <a href={member.instagram.includes('instagram.com') ? member.instagram : `https://instagram.com/${member.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all shadow-sm">
                                 <Instagram className="w-5 h-5" />
                               </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[14px] text-gray-500 mb-5">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-[18px] h-[18px] shrink-0" />
                            <span className="truncate">{member.profession || "Não informada"}</span>
                          </div>
                          {member.birthDate && (
                             <div className="flex items-center gap-2">
                               <Calendar className="w-[18px] h-[18px] shrink-0" />
                               <span>
                                 {member.birthDate.split('-').length === 3 
                                   ? member.birthDate.split('-').reverse().join('/') 
                                   : member.birthDate} 
                               </span>
                             </div>
                          )}
                          <div className="flex items-center gap-2 col-span-2">
                             <Star className="w-[18px] h-[18px] shrink-0" />
                             <span className="truncate">
                               {member.ministries?.length > 0 
                                 ? member.ministries.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                                 : (member.role || "Membro")
                               }
                             </span>
                          </div>
                        </div>

                        {member.joinedDate && (
                          <div className="flex items-center gap-4 text-[14px] mb-4">
                             <div className="flex items-center gap-1.5">
                               <span className="font-bold text-gray-900">{calculateMemberDuration(member.joinedDate).split(' ')[0]}</span>
                               <span className="text-gray-500">{calculateMemberDuration(member.joinedDate).split(' ').slice(1).join(' ')} de Casa</span>
                             </div>
                          </div>
                        )}

                        {member.skills && member.skills.length > 0 && (
                          <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                            {member.skills.slice(0,4).map((skill: string, i: number) => (
                               <span key={i} className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-gray-100/80 text-gray-600 rounded-md">
                                 {skill}
                               </span>
                            ))}
                            {member.skills.length > 4 && (
                              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-gray-100/80 text-gray-600 rounded-md">
                                 +{member.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
