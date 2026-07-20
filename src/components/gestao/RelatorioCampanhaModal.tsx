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
                      {s.anexo_url && (
                        <a href={s.anexo_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-1 print:hidden">
                          Ver Anexo
                        </a>
                      )}
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

import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';

export const ExtratoPDFModal: React.FC<{ isOpen: boolean; onClose: () => void; campanha: Campanha; pagaram: CardMembro[]; saidas: SaidaDespesa[] }> = ({ isOpen, onClose, campanha, pagaram, saidas }) => {
  if (!isOpen) return null;

  const content = (
    <>
      <style>{`
        @media print {
          #root {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-size: 12px;
          }
          .extrato-container {
            position: relative;
            width: 100%;
            left: 0;
            top: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-[10000] flex bg-white text-black overflow-y-auto print:absolute print:inset-0 print:overflow-visible print:block print:p-0 p-4 sm:p-8 justify-center animate-in fade-in zoom-in duration-200 extrato-container">
        <div className="w-full max-w-4xl bg-white p-4 sm:p-8 relative print:p-0 print:shadow-none shadow-2xl print:bg-transparent">
          <div className="flex justify-between items-center print:hidden mb-6 border-b pb-4">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Printer className="w-5 h-5"/> Extrato PDF</h2>
             <div className="flex gap-2">
               <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow transition-colors cursor-pointer text-sm">Imprimir</button>
               <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold transition-colors cursor-pointer text-sm">Fechar</button>
             </div>
          </div>
          
          <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-black uppercase mb-1 tracking-tight text-gray-900">Prestação de Contas</h1>
            <h2 className="text-lg font-bold text-gray-600 uppercase tracking-wide">{campanha.nome}</h2>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold border-b border-gray-300 pb-1 mb-2 bg-gray-100 p-1 px-2 text-gray-800">Entradas (Arrecadado)</h3>
            {pagaram.length === 0 ? <p className="italic text-gray-500 text-xs px-2">Nenhuma entrada registrada.</p> : (
              <div className="space-y-2">
                {pagaram.map(p => (
                  <div key={p.id} className="border-b border-gray-200 p-2 flex flex-row items-center justify-between shadow-sm break-inside-avoid">
                    <div className="flex-1 min-w-0 pr-4">
                       <p className="font-extrabold text-sm text-gray-800 uppercase truncate">{p.membro_nome}</p>
                       <p className="text-emerald-600 font-black text-sm">+ R$ {(p.valor_pago || 0).toFixed(2)}</p>
                    </div>
                    {p.comprovante_url && (
                      <div className="flex flex-row items-center gap-2 shrink-0">
                         {p.comprovante_url.startsWith('data:image/') ? (
                           <>
                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider text-right w-16 leading-tight">Miniatura Comprovante</p>
                             <img src={p.comprovante_url} alt="Miniatura" className="w-14 h-14 border border-gray-200 rounded p-1 shadow-sm bg-white object-cover" />
                           </>
                         ) : (
                           <>
                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider text-right w-16 leading-tight">QR Code Comprovante</p>
                             <div className="w-14 h-14 border border-gray-200 rounded p-1 shadow-sm bg-white flex items-center justify-center">
                               <QRCode value={p.comprovante_url} size={46} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                             </div>
                           </>
                         )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold border-b border-gray-300 pb-1 mb-2 bg-gray-100 p-1 px-2 text-gray-800">Saídas (Despesas)</h3>
            {saidas.length === 0 ? <p className="italic text-gray-500 text-xs px-2">Nenhuma saída registrada.</p> : (
              <div className="space-y-2">
                {saidas.map(s => (
                  <div key={s.id} className="border-b border-gray-200 p-2 flex flex-row items-center justify-between shadow-sm break-inside-avoid">
                    <div className="flex-1 min-w-0 pr-4">
                       <p className="font-extrabold text-sm text-gray-800 truncate">{s.titulo}</p>
                       <p className="text-gray-500 text-[10px] font-medium truncate">Operador: {s.operador_nome || "Geral"}</p>
                       <p className="text-rose-600 font-black text-sm">- R$ {s.valor.toFixed(2)}</p>
                    </div>
                    {s.anexo_url && (
                      <div className="flex flex-row items-center gap-2 shrink-0">
                         {s.anexo_url.startsWith('data:image/') ? (
                           <>
                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider text-right w-16 leading-tight">Miniatura Anexo</p>
                             <img src={s.anexo_url} alt="Miniatura Anexo" className="w-14 h-14 border border-gray-200 rounded p-1 shadow-sm bg-white object-cover" />
                           </>
                         ) : (
                           <>
                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider text-right w-16 leading-tight">QR Code Anexo</p>
                             <div className="w-14 h-14 border border-gray-200 rounded p-1 shadow-sm bg-white flex items-center justify-center">
                               <QRCode value={s.anexo_url} size={46} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                             </div>
                           </>
                         )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t-2 border-gray-800 pt-3 flex flex-row justify-between items-center bg-gray-100 p-3 rounded mt-6 shadow-sm break-inside-avoid">
            <div>
              <p className="text-xs font-bold text-gray-700">Total Arrecadado: <span className="text-emerald-600 font-black">R$ {pagaram.reduce((a,c)=>a+(c.valor_pago||0),0).toFixed(2)}</span></p>
              <p className="text-xs font-bold text-gray-700 mt-1">Total Saídas: <span className="text-rose-600 font-black">R$ {saidas.reduce((a,s)=>a+s.valor,0).toFixed(2)}</span></p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Saldo Final</p>
               <p className={`text-xl font-black leading-none ${pagaram.reduce((a,c)=>a+(c.valor_pago||0),0) - saidas.reduce((a,s)=>a+s.valor,0) >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                 R$ {(pagaram.reduce((a,c)=>a+(c.valor_pago||0),0) - saidas.reduce((a,s)=>a+s.valor,0)).toFixed(2)}
               </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};
