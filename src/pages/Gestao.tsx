import React, { useEffect, useState } from "react";
import { Campanha, MembroOrganizador, CardMembro, SaidaDespesa } from "@/types/GestaoTypes";
import { gestaoService } from "@/services/gestaoService";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NovaCampanhaTab } from "@/components/gestao/NovaCampanhaTab";
import { CampanhaKanbanView } from "@/components/gestao/CampanhaKanbanView";
import { RelatorioCampanhaModal } from "@/components/gestao/RelatorioCampanhaModal";
import { BorderGlow } from "@/components/ui/BorderGlow";
import {
  FolderKanban,
  PlusCircle,
  ListTodo,
  CheckCircle2,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  Loader2,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

type AbaGestao = "nova" | "abertas" | "concluidas";

export default function Gestao() {
  const { user, profile } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<AbaGestao>("abertas");
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [todosMembros, setTodosMembros] = useState<MembroOrganizador[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroPermissao, setErroPermissao] = useState(false);

  // Campanha selecionada para visualizar no Kanban
  const [campanhaAtivaId, setCampanhaAtivaId] = useState<string | null>(null);

  // Estados para visualizar relatório de campanha concluída
  const [campanhaRelatorio, setCampanhaRelatorio] = useState<Campanha | null>(null);
  const [cardsRelatorio, setCardsRelatorio] = useState<CardMembro[]>([]);
  const [saidasRelatorio, setSaidasRelatorio] = useState<SaidaDespesa[]>([]);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  useEffect(() => {
    // Buscar membros globais para passar aos subcomponentes
    const fetchMembros = async () => {
      try {
        const mapa = new Map<string, MembroOrganizador>();

        // 1. Buscar de "members"
        try {
          const snapMembers = await getDocs(query(collection(db, "members")));
          snapMembers.forEach(docSnap => {
            const d = docSnap.data();
            const foto = d.photoURL || d.photoUrl || d.foto || d.photo || d.avatar || d.avatarUrl || "";
            const fone = d.phone || d.telefone || d.whatsapp || d.celular || d.phoneNumber || d.contato || d.tel || "";
            mapa.set(docSnap.id, {
              id: docSnap.id,
              name: d.name || d.nome || "Sem nome",
              email: d.email || "",
              phone: fone,
              telefone: fone,
              whatsapp: fone,
              celular: fone,
              role: d.role || d.cargo || "",
              photoUrl: foto,
              photoURL: foto,
              foto: foto
            });
          });
        } catch (e) { console.error(e); }

        // 2. Buscar de "users" para complementar fotos e telefones
        try {
          const snapUsers = await getDocs(query(collection(db, "users")));
          snapUsers.forEach(docSnap => {
            const d = docSnap.data();
            const foto = d.photoURL || d.photoUrl || d.foto || d.photo || d.avatar || d.avatarUrl || "";
            const fone = d.phone || d.telefone || d.whatsapp || d.celular || d.phoneNumber || d.contato || d.tel || "";
            if (!mapa.has(docSnap.id)) {
              mapa.set(docSnap.id, {
                id: docSnap.id,
                name: d.name || d.displayName || d.nome || "Sem nome",
                email: d.email || "",
                phone: fone,
                telefone: fone,
                whatsapp: fone,
                celular: fone,
                role: d.role || "",
                photoUrl: foto,
                photoURL: foto,
                foto: foto
              });
            } else {
              const existente = mapa.get(docSnap.id)!;
              if (!existente.photoUrl && foto) {
                existente.photoUrl = foto;
                existente.photoURL = foto;
                existente.foto = foto;
              }
              if (!existente.phone && fone) {
                existente.phone = fone;
                existente.telefone = fone;
                existente.whatsapp = fone;
                existente.celular = fone;
              }
            }
          });
        } catch (e) { console.error(e); }

        setTodosMembros(Array.from(mapa.values()));
      } catch (err) {
        console.error("Erro ao carregar membros em Gestao:", err);
      }
    };

    fetchMembros();

    // Observar campanhas
    const unsub = gestaoService.subscribeCampanhas((lista) => {
      setCampanhas(lista);
      setErroPermissao(false);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao observar campanhas:", err);
      setErroPermissao(true);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const usuarioId = profile?.id || user?.uid || "";
  const isDeveloper = profile?.role?.toLowerCase() === "desenvolvedor" || user?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com";

  const isAdmin = isDeveloper || 
    profile?.role?.toLowerCase() === "admin" || 
    profile?.role?.toLowerCase() === "administradores" || 
    profile?.role?.toLowerCase() === "direção" || 
    user?.email?.toLowerCase().trim() === "iempministerioprofecia@gmail.com";

  const temAcessoCampanhaAberta = (c: Campanha) => {
    if (isAdmin) {
      return true;
    }
    if (c.criada_por_id === usuarioId || (user?.uid && c.criada_por_id === user.uid)) return true;
    const isOrg = c.membros_organizadores?.some(m => 
      (m.id && (m.id === profile?.id || m.id === user?.uid)) || 
      (user?.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()) || 
      (profile?.email && m.email && m.email.toLowerCase().trim() === profile.email.toLowerCase().trim()) || 
      (profile?.name && m.name && m.name.toLowerCase().trim() === profile.name.toLowerCase().trim()) ||
      (user?.displayName && m.name && m.name.toLowerCase().trim() === user.displayName.toLowerCase().trim())
    ) || c.organizadores_ids?.some(id => id === profile?.id || id === user?.uid);
    return isOrg;
  };

  const campanhasAbertas = campanhas.filter(c => c.status === "aberta" && temAcessoCampanhaAberta(c));
  const campanhasConcluidas = campanhas.filter(c => c.status === "concluida"); // Todos os membros autenticados veem as encerradas

  const campanhaSelecionada = campanhas.find(c => c.id === campanhaAtivaId) || null;

  useEffect(() => {
    if (!loading && !campanhaSelecionada) {
      if (abaAtiva === "abertas" && campanhasAbertas.length === 0) {
        setAbaAtiva("concluidas");
      }
      if (abaAtiva === "nova" && !isAdmin) {
        setAbaAtiva("concluidas");
      }
    }
  }, [loading, campanhasAbertas.length, isAdmin, abaAtiva, campanhaSelecionada]);

  const handleCampanhaCriada = (novaId: string) => {
    setCampanhaAtivaId(novaId);
    setAbaAtiva("abertas");
  };

  const handleAbrirRelatorio = async (c: Campanha) => {
    setLoadingRelatorio(true);
    setCampanhaRelatorio(c);
    try {
      // Buscar cards e saídas unicamente para o relatório
      const snapCards = await getDocs(query(collection(db, "gestao_cards")));
      const listaC: CardMembro[] = [];
      snapCards.forEach(docSnap => {
        const d = docSnap.data() as CardMembro;
        if (d.campanha_id === c.id) listaC.push({ id: docSnap.id, ...d });
      });

      const snapSaidas = await getDocs(query(collection(db, "gestao_saidas")));
      const listaS: SaidaDespesa[] = [];
      snapSaidas.forEach(docSnap => {
        const d = docSnap.data() as SaidaDespesa;
        if (d.campanha_id === c.id) listaS.push({ id: docSnap.id, ...d });
      });

      setCardsRelatorio(listaC);
      setSaidasRelatorio(listaS);
    } catch (err) {
      console.error("Erro ao buscar dados do relatório:", err);
    } finally {
      setLoadingRelatorio(false);
    }
  };

  const formatarData = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString("pt-BR");
    } catch {
      return isoStr;
    }
  };

  const renderOrganizadoresCard = (campanha: Campanha, bgRing: string = "ring-[#13131f]") => {
    const orgsListaInicial = (campanha.organizadores_ids && campanha.organizadores_ids.length > 0)
      ? campanha.organizadores_ids.map(id => todosMembros.find(m => m.id === id)).filter(Boolean) as MembroOrganizador[]
      : (campanha.membros_organizadores || []);

    const orgsCard = orgsListaInicial.map(org => {
      const atualizado = todosMembros.find(m => m.id === org.id || (org.email && m.email === org.email) || m.name === org.name);
      return atualizado || org;
    });

    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5 overflow-hidden shrink-0">
          {orgsCard.slice(0, 4).map((org, idx) => (
            <div key={org.id || idx} className={`inline-block h-6 w-6 rounded-full ring-2 ${bgRing} overflow-hidden bg-primary/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
              {org.photoUrl ? (
                <img src={org.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                org.name.charAt(0).toUpperCase()
              )}
            </div>
          ))}
          {orgsCard.length > 4 && (
            <div className={`inline-block h-6 w-6 rounded-full ring-2 ${bgRing} bg-[#262036] flex items-center justify-center text-[9px] font-bold text-gray-300 shrink-0`}>
              +{orgsCard.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {orgsCard.length} {orgsCard.length === 1 ? "organizador" : "organizadores"}
        </span>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Você precisa estar autenticado no portal para acessar o sistema de gestão de campanhas e o CRM financeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-gray-100 pb-16">
      {/* Hero Banner / Cabeçalho Premium com Efeito Glow */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1025] via-[#0d0a14] to-[#07070b] border-b border-[#1f1f2e] pt-24 sm:pt-28 pb-10 px-4 sm:px-8">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">

              <span>Gestão de Campanhas</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
              Organização de confraternizações, retiros e eventos da igreja.
            </p>
          </div>

          {/* Abas de Navegação */}
          {!campanhaSelecionada && (
            <div className="flex items-center gap-1.5 p-1.5 bg-[#13131f] border border-[#2a2a40] rounded-2xl shadow-lg shrink-0">
              {campanhasAbertas.length > 0 && (
                <button
                  onClick={() => { setAbaAtiva("abertas"); setCampanhaAtivaId(null); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    abaAtiva === "abertas"
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Em Aberto</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px]", abaAtiva === "abertas" ? "bg-black/20 text-white" : "bg-[#2a2a40] text-gray-300")}>
                    {campanhasAbertas.length}
                  </span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => { setAbaAtiva("nova"); setCampanhaAtivaId(null); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    abaAtiva === "nova"
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nova Campanha</span>
                </button>
              )}

              <button
                onClick={() => { setAbaAtiva("concluidas"); setCampanhaAtivaId(null); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  abaAtiva === "concluidas"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Concluídas</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px]", abaAtiva === "concluidas" ? "bg-black/20 text-white" : "bg-[#2a2a40] text-gray-300")}>
                  {campanhasConcluidas.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={cn("pt-8 transition-all duration-300", campanhaSelecionada ? "w-full max-w-[100vw] px-2 sm:px-4" : "max-w-7xl mx-auto px-4 sm:px-8")}>
        {erroPermissao && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-200 animate-in fade-in">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
              <CheckCircle2 className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-red-400">Atenção: Permissão Insuficiente no Banco de Dados</h4>
              <p className="text-xs text-gray-300 mt-0.5">
                As novas regras de segurança do Firestore (<code className="bg-black/40 px-1 py-0.5 rounded text-primary">firestore.rules</code>) contendo as permissões de Gestão de Campanhas ainda não foram publicadas no servidor Firebase. Peça ao Administrador para rodar o comando <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">firebase deploy --only firestore:rules</code> no terminal.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="text-sm font-semibold">Carregando campanhas financeiras...</span>
          </div>
        ) : campanhaSelecionada ? (
          /* Renderiza o Kanban da Campanha Ativa */
          <CampanhaKanbanView
            campanha={campanhaSelecionada}
            todosMembros={todosMembros}
            onVoltar={() => setCampanhaAtivaId(null)}
          />
        ) : (
          <>
            {/* Aba 1: Nova Campanha */}
            {abaAtiva === "nova" && (
              <NovaCampanhaTab onCampanhaCriada={handleCampanhaCriada} />
            )}

            {/* Aba 2: Campanhas em Aberto */}
            {abaAtiva === "abertas" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {campanhasAbertas.length === 0 ? (
                  <div className="py-20 bg-card/40 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <FolderKanban className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Nenhuma campanha ativa no momento</h3>
                    <p className="text-xs text-muted-foreground mb-6">
                      Você não possui campanhas financeiras abertas vinculadas ao seu usuário.
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => setAbaAtiva("nova")}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Criar Primeira Campanha</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campanhasAbertas.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setCampanhaAtivaId(c.id)}
                        className="cursor-pointer block w-full transition-all duration-200"
                      >
                        <BorderGlow
                          edgeSensitivity={45}
                          glowColor="40 80 80"
                          backgroundColor="#13131f"
                          borderRadius={18}
                          glowRadius={40}
                          glowIntensity={2.0}
                          coneSpread={30}
                          colors={['#c084fc', '#f472b6', '#38bdf8']}
                          className="w-full h-full border border-[#2a2a40] hover:border-[#4c4c70] shadow-md hover:shadow-2xl transition-all"
                        >
                          <div className="group p-6 flex flex-col justify-between h-56 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/15 transition-all pointer-events-none" />

                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  Em Aberto
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatarData(c.criada_em)}
                                </span>
                              </div>

                              <h3 className="text-lg font-extrabold text-white group-hover:text-primary transition-colors line-clamp-2">
                                {c.nome}
                              </h3>
                            </div>

                            <div className="pt-4 border-t border-[#2a2a40] flex items-center justify-between">
                              {renderOrganizadoresCard(c, "ring-[#13131f]")}

                              <div className="w-8 h-8 rounded-xl bg-[#1f1f30] group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </BorderGlow>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aba 3: Campanhas Concluídas */}
            {abaAtiva === "concluidas" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {campanhasConcluidas.length === 0 ? (
                  <div className="py-20 bg-card/40 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Nenhum histórico concluído</h3>
                    <p className="text-xs text-muted-foreground">
                      As campanhas que forem concluídas no CRM aparecerão aqui com os relatórios detalhados.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campanhasConcluidas.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleAbrirRelatorio(c)}
                        className="cursor-pointer block w-full transition-all duration-200"
                      >
                        <BorderGlow
                          edgeSensitivity={45}
                          glowColor="140 80 70"
                          backgroundColor="#111818"
                          borderRadius={18}
                          glowRadius={40}
                          glowIntensity={2.0}
                          coneSpread={30}
                          colors={['#34d399', '#10b981', '#059669']}
                          className="w-full h-full border border-[#1f3a3a] hover:border-emerald-500/50 shadow-md hover:shadow-2xl transition-all"
                        >
                          <div className="group p-6 flex flex-col justify-between h-56 relative overflow-hidden">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Concluída
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatarData(c.criada_em)}
                                </span>
                              </div>

                              <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                                {c.nome}
                              </h3>
                            </div>

                            <div className="pt-4 border-t border-[#1f3a3a] flex items-center justify-between gap-2">
                              {renderOrganizadoresCard(c, "ring-[#111818]")}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-semibold text-emerald-400 hover:underline">
                                  Relatório
                                </span>
                                <div className="w-8 h-8 rounded-xl bg-[#1f2d2d] group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </BorderGlow>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Relatório Final */}
      {loadingRelatorio ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="p-6 rounded-2xl bg-card border flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-semibold">Carregando relatório financeiro...</span>
          </div>
        </div>
      ) : (
        <RelatorioCampanhaModal
          isOpen={!!campanhaRelatorio}
          campanha={campanhaRelatorio}
          cards={cardsRelatorio}
          saidas={saidasRelatorio}
          todosMembros={todosMembros}
          onClose={() => setCampanhaRelatorio(null)}
        />
      )}
    </div>
  );
}
