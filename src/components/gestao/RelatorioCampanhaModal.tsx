import React from "react";
import { Campanha, CardMembro, SaidaDespesa, MembroOrganizador } from "@/types/GestaoTypes";
import { X, Award, CheckCircle2, XCircle, TrendingDown, DollarSign, Printer, Users } from "lucide-react";

interface RelatorioCampanhaModalProps {
  isOpen: boolean;
  campanha: Campanha | null;
  cards: CardMembro[];
  saidas: SaidaDespesa[];
  todosMembros?: MembroOrganizador[];
  onClose: () => void;
  onConcluir?: () => void; // Se fornecido, exibe o botão de confirmar conclusão
}

export const RelatorioCampanhaModal: React.FC<RelatorioCampanhaModalProps> = ({
  isOpen,
  campanha,
  cards,
  saidas,
  todosMembros,
  onClose,
  onConcluir
}) => {
  if (!isOpen || !campanha) return null;

  const pagaram = cards.filter(c => c.pipeline === "pagou");

  const orgsListaInicial = (campanha.organizadores_ids && campanha.organizadores_ids.length > 0 && todosMembros)
    ? campanha.organizadores_ids.map(id => todosMembros.find(m => m.id === id)).filter(Boolean) as MembroOrganizador[]
    : (campanha.membros_organizadores || []);

  const organizadores = orgsListaInicial.map(org => {
    const atualizado = todosMembros?.find(m => m.id === org.id || (org.email && m.email === org.email) || m.name === org.name);
    return atualizado || org;
  });

  const totalArrecadado = pagaram.reduce((acc, c) => acc + (c.valor_pago || 0), 0);
  const totalDespesas = saidas.reduce((acc, s) => acc + s.valor, 0);
  const saldoFinal = totalArrecadado - totalDespesas;

  const getFormatDataPagamento = (c: any) => {
    const dt = c.data_pagamento || (c.historico_pagamentos?.length ? c.historico_pagamentos[c.historico_pagamentos.length - 1].data : null);
    if (!dt) return "Data não registrada";
    try {
      return new Date(dt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return dt;
    }
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#120f17] border border-[#262036] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-[#262036] bg-[#181424] print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Relatório Final de Campanha</h3>
              <p className="text-xs text-gray-400">{campanha.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#262036] rounded-xl transition-colors cursor-pointer"
              title="Imprimir Relatório"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#262036] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cabeçalho Impressão */}
        <div className="hidden print:block p-6 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-black">Relatório Financeiro de Campanha</h1>
          <p className="text-sm text-gray-600">Campanha: {campanha.nome}</p>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-6">
          {/* Organizadores do Evento */}
          <div className="p-4 rounded-2xl bg-[#181424] border border-[#262036] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Organizadores do Evento</h4>
                <p className="text-[11px] text-gray-400">Responsáveis pela coordenação e gestão</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {organizadores.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Administração Geral</span>
              ) : (
                organizadores.map((org, idx) => (
                  <div key={org.id || idx} className="flex items-center gap-2 bg-[#120f17] px-3 py-1.5 rounded-xl border border-[#262036] shadow-sm">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {org.photoUrl ? (
                        <img src={org.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        org.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-200">{org.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resumo Financeiro (Cards de Destaque) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Arrecadado</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-emerald-400">R$ {totalArrecadado.toFixed(2)}</span>
              <span className="text-[11px] text-gray-400 mt-1">{pagaram.length} pagantes</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Despesas / Saídas</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-rose-400">R$ {totalDespesas.toFixed(2)}</span>
              <span className="text-[11px] text-gray-400 mt-1">{saidas.length} registros</span>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              saldoFinal >= 0 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Saldo Final</span>
                <Award className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black">R$ {saldoFinal.toFixed(2)}</span>
              <span className="text-[11px] text-gray-400 mt-1">
                {saldoFinal >= 0 ? "Saldo Positivo" : "Déficit"}
              </span>
            </div>
          </div>

          {/* Lista de Pagantes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 border-b border-[#262036] pb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Entradas Registradas ({pagaram.length})</span>
            </div>
            {pagaram.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum pagamento registrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pagaram.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#181424] border border-[#262036] gap-2">
                    <div>
                      <strong className="text-sm font-bold text-white block">Entrada</strong>
                      <span className="text-xs text-gray-400">
                        {getFormatDataPagamento(c)}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400 shrink-0">
                      R$ {(c.valor_pago || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Saídas / Despesas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-400 border-b border-[#262036] pb-2">
              <TrendingDown className="w-4 h-4" />
              <span>Despesas Detalhadas ({saidas.length})</span>
            </div>
            {saidas.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhuma saída registrada.</p>
            ) : (
              <div className="space-y-2">
                {saidas.map(s => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#181424] border border-[#262036] gap-2">
                    <div>
                      <strong className="text-sm font-bold text-white block">{s.titulo}</strong>
                      <span className="text-xs text-gray-400">
                        Operador: {s.operador_nome || "Organizador"} | Data: {s.data_hora}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-rose-400 shrink-0">
                      - R$ {s.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-[#262036] bg-[#181424] flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#262036] text-sm font-medium text-gray-300 hover:text-white hover:bg-[#262036] transition-colors cursor-pointer"
          >
            Fechar
          </button>
          {onConcluir && (
            <button
              onClick={onConcluir}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              Confirmar e Concluir Campanha
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
