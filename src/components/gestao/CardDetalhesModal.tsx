import React, { useEffect, useState } from "react";
import { CardMembro, Campanha, HistoricoCard, MembroOrganizador, PIPELINE_LABELS, PipelineType } from "@/types/GestaoTypes";
import { gestaoService } from "@/services/gestaoService";
import { useAuth } from "@/contexts/AuthContext";
import {
  X,
  MessageSquare,
  Send,
  History,
  UserCheck,
  Phone,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  CreditCard,
  DollarSign,
  Image as ImageIcon,
  Plus,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CardDetalhesModalProps {
  card: CardMembro | null;
  campanha: Campanha;
  todosMembros: MembroOrganizador[];
  onClose: () => void;
}

export const CardDetalhesModal: React.FC<CardDetalhesModalProps> = ({
  card,
  campanha,
  todosMembros,
  onClose
}) => {
  const { user, profile } = useAuth();
  const [historico, setHistorico] = useState<HistoricoCard[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [imagemAnexo, setImagemAnexo] = useState<string>("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [membroSelecionadoId, setMembroSelecionadoId] = useState("");
  const [alterandoMembro, setAlterandoMembro] = useState(false);

  // Abas e expansões
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'comentarios'>('historico');
  const [mensagemExpandida, setMensagemExpandida] = useState(false);

  // Pagamento Parcial
  const [modoPagamentoParcial, setModoPagamentoParcial] = useState(false);
  const [valorParcialInput, setValorParcialInput] = useState("");
  const [obsParcialInput, setObsParcialInput] = useState("");

  const [buscaMembro, setBuscaMembro] = useState("");
  const [tipoCobrancaSelecionado, setTipoCobrancaSelecionado] = useState<'pix' | 'link' | 'completo' | null>(null);
  const [textoCobrancaEditavel, setTextoCobrancaEditavel] = useState<string>("");
  const [atualizacaoLocal, setAtualizacaoLocal] = useState(0);

  const valorSugerido = campanha?.campos_pagamento?.valor || 0;
  const valorPago = card?.valor_pago || 0;
  const valorDevedor = Math.max(0, valorSugerido - valorPago);

  const gerarModeloCobranca = (tipo: 'pix' | 'link' | 'completo') => {
    if (!card) return "";
    const valorShow = valorPago > 0 ? valorDevedor.toFixed(2) : valorSugerido.toFixed(2);
    const pix = campanha.campos_pagamento?.pix;
    const pixInfo = pix && pix.chave
      ? `Chave PIX: ${pix.chave}\nTitular: ${pix.nome}${pix.banco ? `\nBanco: ${pix.banco}` : ""}`
      : "Chave PIX não configurada na campanha.";
    const linkInfo = campanha.campos_pagamento?.cartao || "Link não configurado na campanha.";

    if (tipo === 'completo') {
      return `Paz do Senhor, ${card.membro_nome} !\n\nPassando aqui para lembrar sobre a nosso evento ${campanha.nome}.\nEstamos organizando tudo com muito carinho, por isso, se possível, pedimos que o pagamento seja realizado o quanto antes, para nos ajudar na programação e nos preparativos.\n\n*INFORMAÇÕES DE PAGAMENTO*\nValor: R$ ${valorShow}\nAceitamos pagamento em Dinheiro\n\n❖ PIX:\n${pixInfo}\n\nCaso queira pagar com o cartão temos a opção de link de pagamento:\n${linkInfo}`;
    } else if (tipo === 'pix') {
      return `Paz do Senhor, ${card.membro_nome} !\n\nPassando aqui para lembrar sobre a nosso evento ${campanha.nome}.\nEstamos organizando tudo com muito carinho, por isso, se possível, pedimos que o pagamento seja realizado o quanto antes, para nos ajudar na programação e nos preparativos.\n\n*INFORMAÇÕES DE PAGAMENTO*\nValor: R$ ${valorShow}\nAceitamos pagamento em Dinheiro\n\n❖ PIX:\n${pixInfo}`;
    } else {
      return `Paz do Senhor, ${card.membro_nome} !\n\nPassando aqui para lembrar sobre a nosso evento ${campanha.nome}.\nEstamos organizando tudo com muito carinho, por isso, se possível, pedimos que o pagamento seja realizado o quanto antes, para nos ajudar na programação e nos preparativos.\n\n*INFORMAÇÕES DE PAGAMENTO*\nValor: R$ ${valorShow}\n\nLink para Pagamento Online *como solicitado*:\n${linkInfo}`;
    }
  };

  useEffect(() => {
    if (!card) return;
    setMembroSelecionadoId(card.membro_id);

    const unsubscribe = gestaoService.subscribeHistorico(card.id, (lista) => {
      setHistorico(lista);
    });

    return () => unsubscribe();
  }, [card]);

  useEffect(() => {
    if (tipoCobrancaSelecionado && card) {
      setTextoCobrancaEditavel(gerarModeloCobranca(tipoCobrancaSelecionado));
    }
  }, [valorPago, valorDevedor, valorSugerido, tipoCobrancaSelecionado, atualizacaoLocal, card?.membro_nome]);

  if (!card) return null;

  const usuarioId = profile?.id || user?.uid || "anonimo";
  const usuarioNome = profile?.name || user?.displayName || user?.email || "Usuário";
  const mVinculado = todosMembros.find(m => m.id === card.membro_id || (m.name && card.membro_nome && m.name.toLowerCase().trim() === card.membro_nome.toLowerCase().trim()));
  const fotoExibir = card.membro_foto || mVinculado?.photoUrl || mVinculado?.foto || mVinculado?.photoURL || "";
  const foneExibir = card.membro_phone || card.membro_telefone || mVinculado?.phone || mVinculado?.telefone || mVinculado?.whatsapp || mVinculado?.celular || "";

  const gerarTextoWhatsApp = () => {
    let msg = campanha.mensagem_template.replace(/\{nome\}/gi, card.membro_nome);
    // Remover emojis caso existam no template
    msg = msg.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "");

    msg += "\n\n*--- INFORMAÇÕES DE PAGAMENTO ---*";

    if (campanha.campos_pagamento.valor !== undefined && campanha.campos_pagamento.valor > 0) {
      const vShow = valorPago > 0 ? valorDevedor : campanha.campos_pagamento.valor;
      msg += `\nValor: R$ ${vShow.toFixed(2)}`;
    }
    if (campanha.campos_pagamento.dinheiro) {
      msg += `\nAceitamos pagamento em Dinheiro`;
    }
    if (campanha.campos_pagamento.pix) {
      const pix = campanha.campos_pagamento.pix;
      msg += `\n\nPIX:`;
      msg += `\nChave: ${pix.chave}`;
      msg += `\nNome: ${pix.nome}`;
      if (pix.banco) msg += `\nBanco: ${pix.banco}`;
    }
    if (campanha.campos_pagamento.cartao) {
      msg += `\n\nLink para Pagamento Online:\n${campanha.campos_pagamento.cartao}`;
    }

    return msg;
  };

  const handleEnviarWhatsApp = () => {
    let phone = foneExibir.replace(/\D/g, "");
    if (!phone) {
      alert("Este membro não possui um número de telefone cadastrado.");
      return;
    }
    if (phone.length >= 10 && !phone.startsWith("55")) {
      phone = "55" + phone;
    }

    const mensagem = gerarTextoWhatsApp();
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");

    gestaoService.addComentario(
      card.id,
      `Mensagem de WhatsApp enviada por ${usuarioNome}.`,
      undefined,
      usuarioId,
      usuarioNome
    );
  };

  const handleEnviarLinkPagamento = () => {
    let phone = foneExibir.replace(/\D/g, "");
    if (!phone) {
      alert("Este membro não possui um número de telefone cadastrado.");
      return;
    }
    if (phone.length >= 10 && !phone.startsWith("55")) {
      phone = "55" + phone;
    }

    let msgLink = `Paz do Senhor, ${card.membro_nome}!\nSeguem os dados para pagamento da campanha *${campanha.nome}*:\n`;
    if (campanha.campos_pagamento.valor) msgLink += `\nValor: R$ ${campanha.campos_pagamento.valor.toFixed(2)}`;
    if (campanha.campos_pagamento.pix) {
      msgLink += `\n\nPIX:\nChave: ${campanha.campos_pagamento.pix.chave}\nTitular: ${campanha.campos_pagamento.pix.nome}`;
    }
    if (campanha.campos_pagamento.cartao) {
      msgLink += `\n\nLink de Pagamento Online:\n${campanha.campos_pagamento.cartao}`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgLink)}`, "_blank");

    gestaoService.addComentario(
      card.id,
      `Link de pagamento enviado via WhatsApp por ${usuarioNome}.`,
      undefined,
      usuarioId,
      usuarioNome
    );
  };

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim() && !imagemAnexo) return;

    setEnviandoComentario(true);
    try {
      await gestaoService.addComentario(card.id, novoComentario.trim(), imagemAnexo || undefined, usuarioId, usuarioNome);
      setNovoComentario("");
      setImagemAnexo("");
      setAbaAtiva("comentarios");
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      alert("Ocorreu um erro ao salvar o comentário.");
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemAnexo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAlterarMembro = async () => {
    if (membroSelecionadoId === card.membro_id) {
      setAlterandoMembro(false);
      return;
    }

    const novoMembro = todosMembros.find(m => m.id === membroSelecionadoId);
    if (!novoMembro) return;

    try {
      await gestaoService.alterarMembroCard(card.id, novoMembro, card.membro_nome, usuarioId, usuarioNome);
      setAlterandoMembro(false);
    } catch (err) {
      console.error("Erro ao alterar membro:", err);
      alert("Erro ao alterar membro vinculado.");
    }
  };

  const handleMudarStatus = async (novoStatus: PipelineType) => {
    try {
      await gestaoService.updateCardPipeline(card.id, card.pipeline, novoStatus, usuarioId, usuarioNome);
    } catch (err) {
      console.error("Erro ao mudar status:", err);
      alert("Erro ao alterar o status do card.");
    }
  };

  const handleSalvarPagamentoParcial = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorParcialInput);
    if (isNaN(val) || val <= 0) {
      alert("Digite um valor válido.");
      return;
    }

    try {
      card.valor_pago = (card.valor_pago || 0) + val;
      card.historico_pagamentos = [
        ...(card.historico_pagamentos || []),
        { data: new Date().toISOString(), valor: val, observacao: obsParcialInput }
      ];
      setAtualizacaoLocal(prev => prev + 1);
      await gestaoService.addPagamentoParcial(card, val, obsParcialInput, usuarioId, usuarioNome);
      setValorParcialInput("");
      setObsParcialInput("");
      setModoPagamentoParcial(false);
    } catch (err) {
      console.error("Erro ao registrar pagamento parcial:", err);
      alert("Erro ao salvar pagamento parcial.");
    }
  };

  const formatarData = (isoStr: string) => {
    try {
      const data = new Date(isoStr);
      return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  const listaHistorico = historico.filter(h => h.tipo !== "comentario");
  const listaComentarios = historico.filter(h => h.tipo === "comentario");

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#13131f] border border-[#2a2a40] text-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho Escuro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-[#2a2a40] bg-[#1a1a2e] relative">
          <div className="flex items-center gap-3.5">
            {fotoExibir ? (
              <img src={fotoExibir} alt={card.membro_nome} className="w-12 h-12 rounded-full object-cover border border-primary/30 shrink-0 shadow-md" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-primary font-extrabold text-xl shadow-md shrink-0">
                {card.membro_nome.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 relative">
                <h3 className="text-xl font-extrabold text-white">{card.membro_nome}</h3>

                {/* Vínculo no Topo ao lado do nome */}
                <button
                  onClick={() => {
                    setBuscaMembro("");
                    setAlterandoMembro(!alterandoMembro);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#262036] hover:bg-[#322a48] text-xs font-bold text-primary border border-primary/30 transition-colors cursor-pointer shrink-0"
                  title="Alterar pessoa vinculada"
                >
                  Alterar
                </button>

                {alterandoMembro && (
                  <div className="absolute top-full left-0 mt-2 z-[1050] w-80 sm:w-96 bg-[#120f17] border border-[#262036] rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262036]">
                      <span className="text-xs font-extrabold text-white">Vincular Membro</span>
                      <button onClick={() => setAlterandoMembro(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={buscaMembro}
                        onChange={(e) => setBuscaMembro(e.target.value)}
                        className="w-full bg-[#0d0d14] border border-[#262036] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {todosMembros
                        .filter(m => m.name.toLowerCase().includes(buscaMembro.toLowerCase()) || (m.phone && m.phone.includes(buscaMembro)))
                        .map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={async () => {
                              try {
                                card.membro_id = m.id;
                                card.membro_nome = m.name;
                                card.membro_phone = m.phone || "";
                                card.membro_foto = m.photoUrl || m.foto || "";
                                setAlterandoMembro(false);
                                setAtualizacaoLocal(prev => prev + 1);
                                await gestaoService.alterarMembroCard(card.id, m, card.membro_nome, usuarioId, usuarioNome);
                              } catch (err) {
                                console.error("Erro ao alterar membro:", err);
                                alert("Erro ao alterar membro vinculado.");
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left group cursor-pointer border",
                              m.id === card.membro_id
                                ? "bg-primary/20 border-primary/40"
                                : "bg-transparent hover:bg-[#181424] border-transparent hover:border-[#262036]"
                            )}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
                              {m.photoUrl || m.foto ? (
                                <img src={m.photoUrl || m.foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                m.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-primary truncate">{m.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{m.phone || (m as any).telefone || "Sem telefone"}</p>
                            </div>
                            {m.id === card.membro_id && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Atual</span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {foneExibir ? (
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 font-sans">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>{foneExibir}</span>
                </p>
              ) : (
                <p className="text-xs text-amber-500 mt-1">Sem telefone cadastrado</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Seletor de Status */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Status da Pipeline</span>
              <select
                value={card.pipeline}
                onChange={(e) => handleMudarStatus(e.target.value as PipelineType)}
                className="bg-[#151520] border border-[#2a2a40] rounded-xl px-3 py-1.5 text-xs font-bold text-primary focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="a_contatar">A Contatar</option>
                <option value="msg_enviada">Msg Enviada</option>
                <option value="msg_nao_chegou">Msg Não Chegou</option>
                <option value="respondeu">Respondeu</option>
                <option value="cobrar">Cobrar</option>
                <option value="pagou">Pagou</option>
                <option value="cancelou">Cancelou</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Seção Financeira e Pagamento Parcial */}
          <div className="p-4 rounded-2xl bg-[#151520] border border-[#2a2a40] space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#2a2a40]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Financeiro</h4>
              </div>
              <button
                onClick={() => setModoPagamentoParcial(!modoPagamentoParcial)}
                className="px-3 py-1 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Valor</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 bg-[#0d0d14] px-3 py-1.5 rounded-xl border border-[#2a2a40]">
                <span>Valor do Evento: <strong className="text-white">R$ {valorSugerido.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <span>Valor Pago: <strong>R$ {valorPago.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                <span>Valor Devedor: <strong>R$ {valorDevedor.toFixed(2)}</strong></span>
              </div>
            </div>

            {modoPagamentoParcial && (
              <form onSubmit={handleSalvarPagamentoParcial} className="pt-3 border-t border-[#2a2a40] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Valor Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 50.00"
                    value={valorParcialInput}
                    onChange={(e) => setValorParcialInput(e.target.value)}
                    className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Observação</label>
                  <input
                    type="text"
                    placeholder="Ex: Pix 1ª parcela"
                    value={obsParcialInput}
                    onChange={(e) => setObsParcialInput(e.target.value)}
                    className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
                    Registrar
                  </button>
                  <button type="button" onClick={() => setModoPagamentoParcial(false)} className="px-3 py-2 rounded-xl bg-[#2a2a40] hover:bg-[#3a3a50] text-gray-300 text-xs font-bold">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Histórico de pagamentos parciais */}
            {card.historico_pagamentos && card.historico_pagamentos.length > 0 && (
              <div className="pt-2 border-t border-[#2a2a40]/60 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Detalhamento de Pagamentos:</span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {card.historico_pagamentos.map((hp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[#0d0d14] p-2 rounded-lg border border-[#2a2a40]/40">
                      <span className="text-gray-300">{hp.observacao || "Pagamento Parcial"} ({formatarData(hp.data)})</span>
                      <strong className="text-emerald-400">R$ {hp.valor.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mensagem configurada fechada com botão de clique para expandir acima dos botões */}
          <div className="rounded-xl bg-[#151520] border border-[#2a2a40] overflow-hidden">
            <button
              type="button"
              onClick={() => setMensagemExpandida(!mensagemExpandida)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-gray-200 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Mensagem WhatsApp Configurável (Clique para {mensagemExpandida ? "recolher" : "expandir"})</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform text-gray-400", mensagemExpandida && "rotate-180")} />
            </button>
            {mensagemExpandida && (
              <pre className="p-4 border-t border-[#2a2a40] text-xs text-gray-300 font-sans whitespace-pre-wrap leading-relaxed bg-[#0d0d14]">
                {gerarTextoWhatsApp()}
              </pre>
            )}
          </div>

          {/* Seção Enviar Cobrança */}
          <div className="p-4 rounded-2xl bg-[#151520] border border-[#2a2a40] space-y-3.5 shadow-md">
            <div className="flex items-center gap-2 border-b border-[#2a2a40]/60 pb-2.5">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Enviar Cobrança</h4>
              <span className="text-[11px] text-gray-400 ml-auto hidden sm:inline">Selecione um modelo abaixo para carregar e editar</span>
            </div>

            {/* Botões de Modelos de Cobrança */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTipoCobrancaSelecionado('pix');
                  setTextoCobrancaEditavel(gerarModeloCobranca('pix'));
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                  tipoCobrancaSelecionado === 'pix'
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md scale-[1.02]"
                    : "bg-[#0d0d14] text-gray-300 border-[#2a2a40] hover:bg-[#181828]"
                )}
              >
                <span>❖ PIX</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoCobrancaSelecionado('link');
                  setTextoCobrancaEditavel(gerarModeloCobranca('link'));
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                  tipoCobrancaSelecionado === 'link'
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-md scale-[1.02]"
                    : "bg-[#0d0d14] text-gray-300 border-[#2a2a40] hover:bg-[#181828]"
                )}
              >
                <span>Link de Pagamento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoCobrancaSelecionado('completo');
                  setTextoCobrancaEditavel(gerarModeloCobranca('completo'));
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                  tipoCobrancaSelecionado === 'completo'
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-md scale-[1.02]"
                    : "bg-[#0d0d14] text-gray-300 border-[#2a2a40] hover:bg-[#181828]"
                )}
              >
                <span>Completo</span>
              </button>
            </div>

            {/* Caixa de Mensagem Editável */}
            {tipoCobrancaSelecionado && (
              <div className="space-y-2.5 animate-in fade-in duration-200 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    Mensagem de Cobrança (Você pode editar antes de enviar):
                  </label>
                  <button
                    type="button"
                    onClick={() => setTipoCobrancaSelecionado(null)}
                    className="text-[10px] text-gray-400 hover:text-white cursor-pointer underline"
                  >
                    Recolher
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={textoCobrancaEditavel}
                  onChange={(e) => setTextoCobrancaEditavel(e.target.value)}
                  className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl p-3 text-xs text-gray-200 font-sans focus:outline-none focus:border-primary custom-scrollbar leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => {
                    let phone = card.membro_phone?.replace(/\D/g, "") || "";
                    if (!phone) {
                      alert("Este membro não possui um número de telefone cadastrado.");
                      return;
                    }
                    if (phone.length >= 10 && !phone.startsWith("55")) {
                      phone = "55" + phone;
                    }
                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(textoCobrancaEditavel)}`;
                    window.open(url, "_blank");

                    gestaoService.addComentario(
                      card.id,
                      `Cobrança (${tipoCobrancaSelecionado.toUpperCase()}) enviada no WhatsApp por ${usuarioNome}.`,
                      undefined,
                      usuarioId,
                      usuarioNome
                    );
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            )}
          </div>

          {/* Abas Diferentes: Histórico vs Comentários */}
          <div className="space-y-4 pt-4 border-t border-[#2a2a40]">
            <div className="flex items-center gap-2 border-b border-[#2a2a40]">
              <button
                onClick={() => setAbaAtiva('historico')}
                className={cn(
                  "pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                  abaAtiva === 'historico' ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                <History className="w-4 h-4" />
                <span>Linha do Tempo ({listaHistorico.length})</span>
              </button>

              <button
                onClick={() => setAbaAtiva('comentarios')}
                className={cn(
                  "pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                  abaAtiva === 'comentarios' ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comentários & Anexos ({listaComentarios.length})</span>
              </button>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="min-h-[160px] max-h-64 overflow-y-auto pr-1">
              {abaAtiva === 'historico' ? (
                <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a2a40]">
                  {listaHistorico.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Nenhuma movimentação registrada no histórico.</p>
                  ) : (
                    listaHistorico.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-[#13131f] bg-amber-500 flex items-center justify-center" />
                        <div className="p-3 rounded-xl bg-[#151520] border border-[#2a2a40] text-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-gray-200">{item.usuario_nome || "Sistema"}</span>
                            <span className="text-[10px] text-gray-500">{formatarData(item.criado_em)}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {listaComentarios.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Nenhum comentário ou observação cadastrada.</p>
                  ) : (
                    listaComentarios.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-[#1a1a2e] border border-primary/20 text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-primary flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{item.usuario_nome || "Usuário"}</span>
                          </span>
                          <span className="text-[10px] text-gray-400">{formatarData(item.criado_em)}</span>
                        </div>
                        {item.descricao && <p className="text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">{item.descricao}</p>}
                        {item.imagem_url && (
                          <div className="pt-2">
                            <a href={item.imagem_url} target="_blank" rel="noreferrer">
                              <img src={item.imagem_url} alt="Anexo do comentário" className="max-h-48 rounded-xl object-cover border border-[#2a2a40] hover:opacity-95 transition-opacity" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé: Adicionar Comentário com suporte a Imagem */}
        <form onSubmit={handleAddComentario} className="p-4 border-t border-[#2a2a40] bg-[#1a1a2e] space-y-2">
          {imagemAnexo && (
            <div className="flex items-center gap-2 bg-[#0d0d14] p-2 rounded-xl border border-[#2a2a40] w-fit">
              <img src={imagemAnexo} alt="Prévia" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-xs text-gray-300 font-bold">Imagem anexada</span>
              <button type="button" onClick={() => setImagemAnexo("")} className="text-rose-400 hover:text-rose-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="p-2.5 rounded-xl bg-[#151520] hover:bg-[#252538] border border-[#2a2a40] text-gray-300 hover:text-primary transition-colors cursor-pointer shrink-0" title="Anexar Imagem">
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            <input
              type="text"
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Digite um comentário ou observação no card..."
              className="flex-1 bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
            />

            <button
              type="submit"
              disabled={enviandoComentario || (!novoComentario.trim() && !imagemAnexo)}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-lg shadow-primary/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Rodapé do Modal com botão de Salvar / Concluir */}
        <div className="p-4 bg-[#1a1a2e] border-t border-[#2a2a40] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
