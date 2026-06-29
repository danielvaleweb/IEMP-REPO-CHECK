import React, { useEffect, useState } from "react";
import { MembroOrganizador, CamposPagamento } from "@/types/GestaoTypes";
import { gestaoService } from "@/services/gestaoService";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Sparkles, 
  DollarSign, 
  Users, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NovaCampanhaTabProps {
  onCampanhaCriada: (campanhaId: string) => void;
}

export const NovaCampanhaTab: React.FC<NovaCampanhaTabProps> = ({ onCampanhaCriada }) => {
  const { user, profile } = useAuth();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [criando, setCriando] = useState(false);

  // Passo 1 - Form
  const [nome, setNome] = useState("");
  const [mensagemTemplate, setMensagemTemplate] = useState(
    "Paz do Senhor, {nome}!\n\nPassando aqui para lembrar sobre a nossa confraternização da igreja.\nEstamos organizando tudo com muito carinho, por isso, se possível, pedimos que o pagamento seja realizado o quanto antes, para nos ajudar na programação e nos preparativos."
  );

  // Campos de Pagamento
  const [valorCobrado, setValorCobrado] = useState("");
  const [aceitaDinheiro, setAceitaDinheiro] = useState(true);
  
  const [habilitaPix, setHabilitaPix] = useState(false);
  const [pixChave, setPixChave] = useState("");
  const [pixNome, setPixNome] = useState("");
  const [pixBanco, setPixBanco] = useState("");
  const [pixValor, setPixValor] = useState("");

  const [habilitaCartao, setHabilitaCartao] = useState(false);
  const [linkCartao, setLinkCartao] = useState("");

  // Membros e seleções separadas
  const [todosMembros, setTodosMembros] = useState<MembroOrganizador[]>([]);
  const [organizadoresIds, setOrganizadoresIds] = useState<Set<string>>(new Set());
  const [participantesIds, setParticipantesIds] = useState<Set<string>>(new Set());
  const [filtroBusca, setFiltroBusca] = useState("");

  useEffect(() => {
    const fetchMembros = async () => {
      setLoadingMembros(true);
      try {
        const q = query(collection(db, "members"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        const lista: MembroOrganizador[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data();
          const role = data.role || data.cargo || "";
          // Excluir automaticamente visitantes
          if (role.toLowerCase().trim() !== "visitante") {
            const foto = data.photoURL || data.photoUrl || data.foto || data.photo || data.avatar || data.avatarUrl || "";
            lista.push({
              id: docSnap.id,
              name: data.name || data.nome || "Sem nome",
              email: data.email || "",
              phone: data.phone || data.telefone || data.whatsapp || "",
              role: role,
              photoUrl: foto,
              photoURL: foto,
              foto: foto
            });
          }
        });
        setTodosMembros(lista);
        
        // Por padrão, seleciona todos como participantes
        setParticipantesIds(new Set(lista.map(m => m.id)));

        // Por padrão, seleciona o usuário atual como organizador se estiver na lista
        const uId = profile?.id || user?.uid;
        const uEmail = user?.email;
        const atual = lista.find(m => m.id === uId || (uEmail && m.email === uEmail));
        if (atual) {
          setOrganizadoresIds(new Set([atual.id]));
        }
      } catch (err) {
        console.error("Erro ao buscar membros:", err);
      } finally {
        setLoadingMembros(false);
      }
    };

    fetchMembros();
  }, [profile?.id, user?.uid, user?.email]);

  const handleProximoPasso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert("Por favor, dê um nome à campanha.");
      return;
    }
    if (!mensagemTemplate.trim() || !mensagemTemplate.includes("{nome}")) {
      alert("A mensagem personalizada deve conter a variável {nome}.");
      return;
    }

    const valNum = parseFloat(valorCobrado.replace(",", "."));
    const temValor = !isNaN(valNum) && valNum > 0;
    const temPix = habilitaPix && pixChave.trim().length > 0;
    const temCartao = habilitaCartao && linkCartao.trim().length > 0;

    if (!temValor && !aceitaDinheiro && !temPix && !temCartao) {
      alert("Ao menos uma opção de pagamento (Valor, Dinheiro, PIX ou Link Cartão) deve ser preenchida/selecionada.");
      return;
    }

    setFiltroBusca("");
    setPasso(2);
  };

  const handleProximoPasso2 = () => {
    if (organizadoresIds.size === 0) {
      if (!window.confirm("Você não selecionou nenhum organizador específico. Apenas você e os administradores gerais terão acesso para gerenciar esta campanha. Deseja continuar?")) {
        return;
      }
    }
    setFiltroBusca("");
    setPasso(3);
  };

  const handleToggleSelectAllOrg = () => {
    if (organizadoresIds.size === membrosFiltrados.length) {
      setOrganizadoresIds(new Set());
    } else {
      setOrganizadoresIds(new Set(membrosFiltrados.map(m => m.id)));
    }
  };

  const handleToggleOrg = (id: string) => {
    const next = new Set(organizadoresIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOrganizadoresIds(next);
  };

  const handleToggleSelectAllPart = () => {
    if (participantesIds.size === membrosFiltrados.length) {
      setParticipantesIds(new Set());
    } else {
      setParticipantesIds(new Set(membrosFiltrados.map(m => m.id)));
    }
  };

  const handleTogglePart = (id: string) => {
    const next = new Set(participantesIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setParticipantesIds(next);
  };

  const handleConfirmarCriacao = async () => {
    if (participantesIds.size === 0) {
      alert("Selecione pelo menos um participante (pagante) para compor o CRM da campanha.");
      return;
    }

    setCriando(true);
    try {
      const valNum = parseFloat(valorCobrado.replace(",", "."));
      const valPixNum = parseFloat(pixValor.replace(",", "."));

      const camposPagamento: CamposPagamento = {
        dinheiro: aceitaDinheiro
      };
      if (!isNaN(valNum) && valNum > 0) {
        camposPagamento.valor = valNum;
      }
      if (habilitaPix && pixChave.trim()) {
        camposPagamento.pix = {
          chave: pixChave.trim(),
          nome: pixNome.trim() || "Igreja Ministério Profecia",
          banco: pixBanco.trim() || "Banco",
          valor: !isNaN(valPixNum) && valPixNum > 0 ? valPixNum : (!isNaN(valNum) ? valNum : undefined)
        };
      }
      if (habilitaCartao && linkCartao.trim()) {
        camposPagamento.cartao = linkCartao.trim();
      }

      const membrosOrg = todosMembros.filter(m => organizadoresIds.has(m.id));
      const membrosPart = todosMembros.filter(m => participantesIds.has(m.id));

      const usuarioId = profile?.id || user?.uid || "anonimo";
      const usuarioNome = profile?.name || user?.displayName || user?.email || "Organizador";

      const novaId = await gestaoService.createCampanha(
        {
          nome: nome.trim(),
          mensagem_template: mensagemTemplate.trim(),
          campos_pagamento: camposPagamento,
          membros_organizadores: membrosOrg,
          organizadores_ids: Array.from(organizadoresIds)
        },
        membrosPart,
        usuarioId,
        usuarioNome
      );

      onCampanhaCriada(novaId);
    } catch (err) {
      console.error("Erro ao criar campanha:", err);
      alert("Ocorreu um erro ao criar a campanha.");
    } finally {
      setCriando(false);
    }
  };

  const membrosFiltrados = todosMembros.filter(m => 
    m.name.toLowerCase().includes(filtroBusca.toLowerCase()) ||
    m.role?.toLowerCase().includes(filtroBusca.toLowerCase())
  );

  const isAllOrgSelected = membrosFiltrados.length > 0 && organizadoresIds.size === membrosFiltrados.length;
  const isAllPartSelected = membrosFiltrados.length > 0 && participantesIds.size === membrosFiltrados.length;

  return (
    <div className="max-w-4xl mx-auto bg-[#120f17] border border-[#262036] text-gray-100 rounded-3xl shadow-2xl overflow-hidden">
      {/* Indicador de Passos */}
      <div className="grid grid-cols-3 border-b border-[#262036] bg-[#181424] p-3 sm:p-5 gap-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all shrink-0",
            passo === 1 ? "bg-primary text-primary-foreground shadow-md" : passo > 1 ? "bg-emerald-500 text-white" : "bg-[#262036] text-gray-400"
          )}>
            {passo > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
          </div>
          <div className="min-w-0">
            <h4 className={cn("font-bold text-xs sm:text-sm truncate", passo === 1 ? "text-white" : "text-gray-400")}>
              1. Mensagem & Valor
            </h4>
            <p className="text-[10px] text-gray-400 hidden md:block truncate">WhatsApp e cobrança</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-l border-[#262036] pl-2 sm:pl-4">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all shrink-0",
            passo === 2 ? "bg-primary text-primary-foreground shadow-md" : passo > 2 ? "bg-emerald-500 text-white" : "bg-[#262036] text-gray-400"
          )}>
            {passo > 2 ? <CheckCircle2 className="w-4 h-4" /> : "2"}
          </div>
          <div className="min-w-0">
            <h4 className={cn("font-bold text-xs sm:text-sm truncate", passo === 2 ? "text-white" : "text-gray-400")}>
              2. Organizadores
            </h4>
            <p className="text-[10px] text-gray-400 hidden md:block truncate">Acesso à pipeline em aberto</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-l border-[#262036] pl-2 sm:pl-4">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all shrink-0",
            passo === 3 ? "bg-primary text-primary-foreground shadow-md" : "bg-[#262036] text-gray-400"
          )}>
            3
          </div>
          <div className="min-w-0">
            <h4 className={cn("font-bold text-xs sm:text-sm truncate", passo === 3 ? "text-white" : "text-gray-400")}>
              3. Participantes
            </h4>
            <p className="text-[10px] text-gray-400 hidden md:block truncate">Pagantes no CRM</p>
          </div>
        </div>
      </div>

      {/* Passo 1 - Form */}
      {passo === 1 && (
        <form onSubmit={handleProximoPasso1} className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Informações Básicas da Campanha</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Nome da Campanha *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Confraternização de Jovens 2026"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Mensagem Personalizada do WhatsApp *
                </label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  Use {'{nome}'} para o nome de cada membro
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={mensagemTemplate}
                onChange={(e) => setMensagemTemplate(e.target.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, ""))}
                className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl p-4 text-sm text-white placeholder:text-gray-500 font-sans leading-relaxed focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-[#262036]">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>Opções de Pagamento</span>
              </h3>
              <p className="text-xs text-gray-400">
                Estes dados serão anexados automaticamente ao final da mensagem do WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Valor Geral */}
              <div className="p-4 rounded-2xl bg-[#181424] border border-[#262036] space-y-3">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Valor a ser Cobrado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={valorCobrado}
                  onChange={(e) => setValorCobrado(e.target.value)}
                  className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-400 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <label className="flex items-center gap-2 text-sm text-gray-300 font-medium cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={aceitaDinheiro}
                    onChange={(e) => setAceitaDinheiro(e.target.checked)}
                    className="rounded border-[#262036] text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Aceitar pagamento em Dinheiro físico</span>
                </label>
              </div>

              {/* PIX */}
              <div className="p-4 rounded-2xl bg-[#181424] border border-[#262036] space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Cobrança via PIX
                  </span>
                  <input
                    type="checkbox"
                    checked={habilitaPix}
                    onChange={(e) => setHabilitaPix(e.target.checked)}
                    className="rounded border-[#262036] text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </label>

                {habilitaPix && (
                  <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      placeholder="Chave PIX *"
                      value={pixChave}
                      onChange={(e) => setPixChave(e.target.value)}
                      className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Nome do Beneficiário (Ex: Igreja Profecia)"
                      value={pixNome}
                      onChange={(e) => setPixNome(e.target.value)}
                      className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Banco"
                        value={pixBanco}
                        onChange={(e) => setPixBanco(e.target.value)}
                        className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor Específico PIX"
                        value={pixValor}
                        onChange={(e) => setPixValor(e.target.value)}
                        className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cartão / Link */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-[#181424] border border-[#262036] space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Link para Cartão / Pagamento Online
                  </span>
                  <input
                    type="checkbox"
                    checked={habilitaCartao}
                    onChange={(e) => setHabilitaCartao(e.target.checked)}
                    className="rounded border-[#262036] text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </label>

                {habilitaCartao && (
                  <input
                    type="url"
                    placeholder="https://asaas.com/... ou link do Mercado Pago/Stripe"
                    value={linkCartao}
                    onChange={(e) => setLinkCartao(e.target.value)}
                    className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary animate-in fade-in duration-150"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Próximo: Selecionar Organizadores</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Passo 2 - Selecionar Organizadores */}
      {/* Passo 2 - Selecionar Organizadores */}
      {passo === 2 && (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Selecionar Organizadores da Campanha</span>
              </h3>
              <p className="text-xs text-gray-400">
                Estes membros terão acesso à pipeline da campanha enquanto ela estiver <strong>Em Aberto</strong> para gerenciar cobranças e pagamentos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <input
                type="text"
                placeholder="Buscar organizador..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="flex-1 sm:w-56 min-w-[140px] bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleToggleSelectAllOrg}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#262036] hover:bg-[#322a48] text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
              >
                {isAllOrgSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                <span>{isAllOrgSelected ? "Desmarcar Todos" : "Selecionar Todos"}</span>
              </button>
            </div>
          </div>

          {loadingMembros ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Carregando membros...</span>
            </div>
          ) : membrosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm border-2 border-dashed border-[#262036] rounded-2xl">
              Nenhum membro encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {membrosFiltrados.map((membro) => {
                const selected = organizadoresIds.has(membro.id);
                return (
                  <div
                    key={membro.id}
                    onClick={() => handleToggleOrg(membro.id)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none",
                      selected 
                        ? "bg-primary/20 border-primary text-white shadow-sm" 
                        : "bg-[#181424] hover:bg-[#201b30] border-[#262036] text-gray-300 hover:text-white"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border", selected ? "bg-primary border-primary text-white" : "border-gray-500")}>
                      {selected && <CheckSquare className="w-4 h-4" />}
                    </div>
                    {membro.photoUrl ? (
                      <img src={membro.photoUrl} alt={membro.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#262036]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {membro.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <strong className="text-sm font-bold block truncate">{membro.name}</strong>
                      <span className="text-[11px] text-gray-400 block truncate">
                        {membro.role || "Membro"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-[#262036]">
            <button
              type="button"
              onClick={() => setPasso(1)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#262036] text-sm font-bold text-gray-400 hover:text-white hover:bg-[#262036] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-primary">
                {organizadoresIds.size} organizadores marcados
              </span>
              <button
                type="button"
                onClick={handleProximoPasso2}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Próximo: Selecionar Participantes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passo 3 - Selecionar Participantes */}
      {passo === 3 && (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                <span>Selecionar Participantes (Pagantes)</span>
              </h3>
              <p className="text-xs text-gray-400">
                Estes são os membros que receberão cobranças e serão acompanhados como cartões na pipeline Kanban da campanha.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <input
                type="text"
                placeholder="Buscar participante..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="flex-1 sm:w-56 min-w-[140px] bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleToggleSelectAllPart}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#262036] hover:bg-[#322a48] text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
              >
                {isAllPartSelected ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                <span>{isAllPartSelected ? "Desmarcar Todos" : "Selecionar Todos"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
            {membrosFiltrados.map((membro) => {
              const selected = participantesIds.has(membro.id);
              return (
                <div
                  key={membro.id}
                  onClick={() => handleTogglePart(membro.id)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none",
                    selected 
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-sm" 
                      : "bg-[#181424] hover:bg-[#201b30] border-[#262036] text-gray-300 hover:text-white"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border", selected ? "bg-emerald-500 border-emerald-500 text-white font-bold" : "border-gray-500")}>
                    {selected && <CheckSquare className="w-4 h-4" />}
                  </div>
                  {membro.photoUrl ? (
                    <img src={membro.photoUrl} alt={membro.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#262036]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                      {membro.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm font-bold block truncate">{membro.name}</strong>
                    <span className="text-[11px] text-gray-400 block truncate">
                      {membro.role || "Membro"} {membro.phone ? `• ${membro.phone}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-[#262036]">
            <button
              type="button"
              onClick={() => setPasso(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#262036] text-sm font-bold text-gray-400 hover:text-white hover:bg-[#262036] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-emerald-400">
                {participantesIds.size} participantes selecionados
              </span>
              <button
                type="button"
                onClick={handleConfirmarCriacao}
                disabled={criando || participantesIds.size === 0}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {criando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando CRM...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar e Abrir CRM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
