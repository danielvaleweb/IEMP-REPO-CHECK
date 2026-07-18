import React, { useState } from "react";
import { MembroOrganizador } from "@/types/GestaoTypes";
import { X, Calendar, DollarSign, Upload, Link as LinkIcon, PlusCircle, Users, UserMinus, UserPlus } from "lucide-react";

interface ModalCobrancaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataCobranca: string) => void;
}

export const ModalCobranca: React.FC<ModalCobrancaProps> = ({ isOpen, onClose, onConfirm }) => {
  const [dataCobranca, setDataCobranca] = useState(() => {
    // Default para amanhã
    const amanhã = new Date();
    amanhã.setDate(amanhã.getDate() + 1);
    return amanhã.toISOString().split("T")[0];
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataCobranca) return;
    onConfirm(dataCobranca);
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
            <Calendar className="w-5 h-5" />
            <span>Agendar Cobrança</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Selecione a data agendada para realizar a cobrança deste membro. Um alerta visual será exibido no card.
          </p>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Data da Cobrança
            </label>
            <input
              type="date"
              required
              value={dataCobranca}
              onChange={(e) => setDataCobranca(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-amber-950 font-bold text-sm hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Confirmar e Mover
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface ModalPagouProps {
  isOpen: boolean;
  valorSugerido?: number;
  onClose: () => void;
  onConfirm: (dados: { valor_pago: number; comprovante_url?: string }) => void;
}

export const ModalPagou: React.FC<ModalPagouProps> = ({ isOpen, valorSugerido = 0, onClose, onConfirm }) => {
  const [valorPago, setValorPago] = useState<string>(valorSugerido > 0 ? valorSugerido.toString() : "");
  const [comprovanteUrl, setComprovanteUrl] = useState("");
  const [tipoAnexo, setTipoAnexo] = useState<"arquivo" | "link">("link");
  const [arquivoNome, setArquivoNome] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem é muito grande. O tamanho máximo permitido é 2MB.");
      return;
    }

    setArquivoNome(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprovanteUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorPago.replace(",", "."));
    if (isNaN(val) || val < 0) {
      alert("Por favor, informe um valor pago válido.");
      return;
    }
    onConfirm({ valor_pago: val, comprovante_url: comprovanteUrl || undefined });
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-lg">
            <DollarSign className="w-5 h-5" />
            <span>Registrar Pagamento</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Valor Pago (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 50.00"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              Comprovante (Opcional)
            </label>

            <div className="flex gap-2 p-1 bg-muted/40 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setTipoAnexo("link")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tipoAnexo === "link" ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Link do Arquivo</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoAnexo("arquivo")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tipoAnexo === "arquivo" ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload de Imagem</span>
              </button>
            </div>

            {tipoAnexo === "link" ? (
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={comprovanteUrl.startsWith("data:") ? "" : comprovanteUrl}
                onChange={(e) => setComprovanteUrl(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            ) : (
              <div className="relative border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/20">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                <span className="text-xs text-foreground font-medium block">
                  {arquivoNome || "Clique ou arraste a imagem ou PDF"}
                </span>
                <span className="text-[10px] text-muted-foreground">Tamanho máximo recomendado: 5MB</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-emerald-950 font-bold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface ModalSaidaProps {
  isOpen: boolean;
  membros: MembroOrganizador[];
  onClose: () => void;
  onConfirm: (dados: { titulo: string; valor: number; operador_id: string; operador_nome: string; data_hora: string }) => void;
}

export const ModalSaida: React.FC<ModalSaidaProps> = ({ isOpen, membros, onClose, onConfirm }) => {
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [operadorId, setOperadorId] = useState(membros[0]?.id || "");
  const [dataHora, setDataHora] = useState(() => {
    const agora = new Date();
    // Formato YYYY-MM-DDTHH:MM para input datetime-local
    return agora.toISOString().slice(0, 16);
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valor.replace(",", "."));
    if (!titulo.trim() || isNaN(val) || val <= 0) {
      alert("Por favor, preencha a descrição e um valor de saída válido.");
      return;
    }

    const operador = membros.find(m => m.id === operadorId) || { name: "Organizador" };

    // Formatar data para dd/mm/aaaa - hh:mm
    let formatedDate = dataHora;
    try {
      const d = new Date(dataHora);
      formatedDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} - ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      // mantém
    }

    onConfirm({
      titulo: titulo.trim(),
      valor: val,
      operador_id: operadorId,
      operador_nome: operador.name,
      data_hora: formatedDate
    });

    setTitulo("");
    setValor("");
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
            <PlusCircle className="w-5 h-5 rotate-45" />
            <span>Registrar Saída (Despesa)</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Título / Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Compra de carnes para confraternização"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Valor da Saída (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 150.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-rose-400 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Data e Hora
            </label>
            <input
              type="datetime-local"
              required
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Operador Responsável
            </label>
            <select
              value={operadorId}
              onChange={(e) => setOperadorId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {membros.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-400 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              Salvar Saída
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModalAlterarMensagem: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  campanha: any;
  onSave: (novaMsg: string, novosCampos: any) => void;
}> = ({ isOpen, onClose, campanha, onSave }) => {
  const [mensagem, setMensagem] = useState(campanha?.mensagem_template || "");
  const [valor, setValor] = useState(campanha?.campos_pagamento?.valor || "");
  const [dinheiro, setDinheiro] = useState(campanha?.campos_pagamento?.dinheiro || false);
  const [pixChave, setPixChave] = useState(campanha?.campos_pagamento?.pix?.chave || "");
  const [pixNome, setPixNome] = useState(campanha?.campos_pagamento?.pix?.nome || "");
  const [pixBanco, setPixBanco] = useState(campanha?.campos_pagamento?.pix?.banco || "");
  const [cartao, setCartao] = useState(campanha?.campos_pagamento?.cartao || "");

  React.useEffect(() => {
    if (campanha) {
      setMensagem(campanha.mensagem_template || "");
      setValor(campanha.campos_pagamento?.valor || "");
      setDinheiro(campanha.campos_pagamento?.dinheiro || false);
      setPixChave(campanha.campos_pagamento?.pix?.chave || "");
      setPixNome(campanha.campos_pagamento?.pix?.nome || "");
      setPixBanco(campanha.campos_pagamento?.pix?.banco || "");
      setCartao(campanha.campos_pagamento?.cartao || "");
    }
  }, [campanha, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novosCampos = {
      valor: valor ? parseFloat(valor.toString()) : undefined,
      dinheiro,
      pix: pixChave ? { chave: pixChave, nome: pixNome, banco: pixBanco } : undefined,
      cartao: cartao || undefined
    };
    onSave(mensagem, novosCampos);
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#13131f] border border-[#2a2a40] text-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a40] bg-[#1a1a2e]">
          <h3 className="text-lg font-bold">Alterar Mensagem & Pagamento (Geral)</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-1">
              Mensagem do WhatsApp (Sem Emojis) *
            </label>
            <textarea
              rows={4}
              required
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, ""))}
              className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
              placeholder="Digite a mensagem..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Valor Sugerido (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold"
                placeholder="Ex: 150.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Link de Pagamento (Cartão)</label>
              <input
                type="text"
                value={cartao}
                onChange={(e) => setCartao(e.target.value)}
                className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d0d14] border border-[#2a2a40] space-y-3">
            <h4 className="text-xs font-bold uppercase text-primary">Dados PIX</h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Chave PIX"
                value={pixChave}
                onChange={(e) => setPixChave(e.target.value)}
                className="bg-[#151520] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Nome do Titular"
                value={pixNome}
                onChange={(e) => setPixNome(e.target.value)}
                className="bg-[#151520] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Banco"
                value={pixBanco}
                onChange={(e) => setPixBanco(e.target.value)}
                className="bg-[#151520] border border-[#2a2a40] rounded-lg px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={dinheiro}
              onChange={(e) => setDinheiro(e.target.checked)}
              className="rounded border-[#2a2a40] bg-[#0d0d14] text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span>Aceitar pagamento em Dinheiro físico</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a40]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#2a2a40] text-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModalEditarOrganizadores: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  organizadoresAtual: string[];
  todosMembros: MembroOrganizador[];
  onSave: (novosOrgsIds: string[], novosOrgsObjs: MembroOrganizador[]) => void;
}> = ({ isOpen, onClose, organizadoresAtual, todosMembros, onSave }) => {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setSelecionados(new Set(organizadoresAtual));
    }
  }, [isOpen, organizadoresAtual]);

  if (!isOpen) return null;

  const toggleOrg = (id: string) => {
    const next = new Set(selecionados);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelecionados(next);
  };

  const filtrados = todosMembros.filter(m => m.name.toLowerCase().includes(filtro.toLowerCase()));

  const handleSalvar = () => {
    const ids = Array.from(selecionados);
    const objs = ids.map(id => todosMembros.find(m => m.id === id)).filter(Boolean) as MembroOrganizador[];
    onSave(ids, objs);
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col bg-[#120f17] border border-[#262036] text-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[#262036] bg-[#181424]">
          <h3 className="text-lg font-bold">Editar Organizadores da Campanha</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <input
            type="text"
            placeholder="Buscar membro..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto p-1">
            {filtrados.map(m => {
              const sel = selecionados.has(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleOrg(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    sel ? "bg-primary/20 border-primary text-white" : "bg-[#181424] border-[#262036] text-gray-300 hover:text-white"
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${sel ? "bg-primary border-primary text-white" : "border-gray-500"}`}>
                    {sel && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#262036]" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold truncate">{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-[#262036] bg-[#181424] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#262036] text-xs text-gray-300 hover:text-white cursor-pointer">Cancelar</button>
          <button onClick={handleSalvar} className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold cursor-pointer shadow-lg shadow-primary/20">Salvar Organizadores</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MODAL: Editar Participantes da Campanha
// ─────────────────────────────────────────────────────────────
interface CardResumido { id: string; membro_nome: string; membro_foto?: string | null; membro_id: string; pipeline: string; membro_phone?: string; membro_telefone?: string; }

export const ModalEditarParticipantes: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cards: CardResumido[];
  todosMembros: MembroOrganizador[];
  onAddMembros: (ids: string[]) => Promise<void>;
  onRemoveCard: (cardId: string) => Promise<void>;
}> = ({ isOpen, onClose, cards, todosMembros, onAddMembros, onRemoveCard }) => {
  const [aba, setAba] = useState<"participantes" | "adicionar">("participantes");
  const [filtro, setFiltro] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [removendo, setRemovendo] = useState<Set<string>>(new Set());
  const [adicionando, setAdicionando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelecionados(new Set());
      setFiltro("");
      setAba("participantes");
      setRemovendo(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // IDs já na campanha para não duplicar
  const idsJaNaCampanha = new Set(cards.map(c => c.membro_id));

  const membrosDisponiveis = todosMembros.filter(
    m => !idsJaNaCampanha.has(m.id) && (m.name.toLowerCase().includes(filtro.toLowerCase()) || (m.phone && m.phone.includes(filtro)) || (m.telefone && m.telefone.includes(filtro)))
  );

  const participantesFiltrados = cards.filter(c =>
    c.membro_nome.toLowerCase().includes(filtro.toLowerCase()) || (c.membro_phone && c.membro_phone.includes(filtro)) || (c.membro_telefone && c.membro_telefone.includes(filtro))
  );

  const toggleSel = (id: string) => {
    const next = new Set(selecionados);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelecionados(next);
  };

  const handleAdicionarSelecionados = async () => {
    if (selecionados.size === 0) return;
    setAdicionando(true);
    try {
      await onAddMembros(Array.from(selecionados));
      setSelecionados(new Set());
      setAba("participantes");
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemover = async (cardId: string) => {
    if (!confirm("Remover este participante da campanha?")) return;
    setRemovendo(prev => new Set(prev).add(cardId));
    try {
      await onRemoveCard(cardId);
    } finally {
      setRemovendo(prev => { const s = new Set(prev); s.delete(cardId); return s; });
    }
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center pt-24 pb-6 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col bg-[#120f17] border border-[#262036] text-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262036] bg-[#181424]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold">Editar Participantes</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-[#262036]">
          <button
            onClick={() => { setAba("participantes"); setFiltro(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all cursor-pointer ${aba === "participantes" ? "text-sky-400 border-b-2 border-sky-400 bg-sky-400/5" : "text-gray-400 hover:text-white"}`}
          >
            <UserMinus className="w-4 h-4" />
            Participantes ({cards.length})
          </button>
          <button
            onClick={() => { setAba("adicionar"); setFiltro(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all cursor-pointer ${aba === "adicionar" ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5" : "text-gray-400 hover:text-white"}`}
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </button>
        </div>

        {/* Busca */}
        <div className="px-6 pt-4">
          <input
            type="text"
            placeholder={aba === "participantes" ? "Buscar participante..." : "Buscar membro para adicionar..."}
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="w-full bg-[#0c0a10] border border-[#262036] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 pt-3 space-y-2">
          {aba === "participantes" ? (
            participantesFiltrados.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-xs">Nenhum participante encontrado.</div>
            ) : (
              participantesFiltrados.map(c => {
                const fone = c.membro_phone || c.membro_telefone || todosMembros.find(x => x.id === c.membro_id)?.phone || "";
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#181424] border border-[#262036]">
                    {c.membro_foto ? (
                      <img src={c.membro_foto} alt={c.membro_nome} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#262036]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs shrink-0">
                        {c.membro_nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-white">{c.membro_nome}</p>
                      {fone ? (
                        <p className="text-[11px] text-gray-300 font-sans truncate">{fone}</p>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic truncate">Sem telefone</p>
                      )}
                      <p className="text-[10px] text-gray-400 capitalize mt-0.5">{c.pipeline.replace(/_/g, " ")}</p>
                    </div>
                    <button
                      onClick={() => handleRemover(c.id)}
                      disabled={removendo.has(c.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50 cursor-pointer"
                      title="Remover participante"
                    >
                      {removendo.has(c.id) ? (
                        <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })
            )
          ) : (
            <>
              {selecionados.size > 0 && (
                <div className="text-[10px] text-emerald-400 font-bold text-center mb-2">
                  {selecionados.size} selecionado(s)
                </div>
              )}
              {membrosDisponiveis.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-xs">Todos os membros já estão na campanha ou não foram encontrados.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {membrosDisponiveis.map(m => {
                    const sel = selecionados.has(m.id);
                    const fone = m.phone || m.telefone || m.whatsapp || m.celular || "";
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleSel(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${sel ? "bg-emerald-500/15 border-emerald-500 text-white" : "bg-[#181424] border-[#262036] text-gray-300 hover:text-white"}`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${sel ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500"}`}>
                          {sel && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#262036]" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold truncate block text-white">{m.name}</span>
                          {fone ? (
                            <span className="text-[11px] text-gray-300 font-sans truncate block mt-0.5">{fone}</span>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic truncate block mt-0.5">Sem telefone</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#262036] bg-[#181424] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#262036] text-xs text-gray-300 hover:text-white cursor-pointer">
            Fechar
          </button>
          {aba === "adicionar" && selecionados.size > 0 && (
            <button
              onClick={handleAdicionarSelecionados}
              disabled={adicionando}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-60 transition-all"
            >
              {adicionando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Adicionar {selecionados.size > 0 ? `(${selecionados.size})` : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

