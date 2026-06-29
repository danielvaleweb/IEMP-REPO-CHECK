import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Campanha, 
  CardMembro, 
  HistoricoCard, 
  SaidaDespesa, 
  PipelineType, 
  MembroOrganizador,
  PIPELINE_LABELS
} from "@/types/GestaoTypes";

export const gestaoService = {
  // Criar uma nova campanha junto com seus cards e históricos iniciais
  async createCampanha(
    dadosCampanha: Omit<Campanha, 'id' | 'criada_em' | 'status'>,
    membrosAlvo: MembroOrganizador[],
    usuarioId: string,
    usuarioNome: string
  ): Promise<string> {
    const agora = new Date().toISOString();
    
    // 1. Criar a campanha
    const campanhaRef = await addDoc(collection(db, "gestao_campanhas"), {
      ...dadosCampanha,
      status: 'aberta',
      criada_em: agora,
      criada_por_id: usuarioId
    });

    const campanhaId = campanhaRef.id;

    // 2. Criar os cards em lote (usando batches ou promises sequenciais)
    // Como firestore batch tem limite de 500, vamos usar Promise.all em chunks ou sequencial
    for (const membro of membrosAlvo) {
      const cardRef = await addDoc(collection(db, "gestao_cards"), {
        campanha_id: campanhaId,
        membro_id: membro.id,
        membro_nome: membro.name,
        membro_phone: membro.phone || "",
        membro_foto: membro.photoUrl || membro.foto || "",
        pipeline: 'a_contatar' as PipelineType
      });

      // 3. Registrar no histórico inicial do card
      await addDoc(collection(db, "gestao_historico"), {
        card_id: cardRef.id,
        tipo: 'movimentacao',
        descricao: `Card criado automaticamente na coluna "A Contatar" na criação da campanha.`,
        usuario_id: usuarioId,
        usuario_nome: usuarioNome,
        criado_em: agora
      });
    }

    return campanhaId;
  },

  // Observar campanhas
  subscribeCampanhas(callback: (campanhas: Campanha[]) => void, onError?: (error: any) => void) {
    const q = query(collection(db, "gestao_campanhas"), orderBy("criada_em", "desc"));
    return onSnapshot(q, (snapshot) => {
      const lista: Campanha[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Campanha));
      callback(lista);
    }, (error) => {
      console.error("Erro ao observar campanhas:", error);
      if (onError) onError(error);
    });
  },

  // Observar cards de uma campanha
  subscribeCards(campanhaId: string, callback: (cards: CardMembro[]) => void, onError?: (error: any) => void) {
    const q = query(collection(db, "gestao_cards"), where("campanha_id", "==", campanhaId));
    return onSnapshot(q, (snapshot) => {
      const lista: CardMembro[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as CardMembro));
      callback(lista);
    }, (error) => {
      console.error("Erro ao observar cards:", error);
      if (onError) onError(error);
    });
  },

  // Observar histórico de um card (imutável, ordenado por data)
  subscribeHistorico(cardId: string, callback: (historicos: HistoricoCard[]) => void) {
    const q = query(collection(db, "gestao_historico"), where("card_id", "==", cardId), orderBy("criado_em", "asc"));
    return onSnapshot(q, (snapshot) => {
      const lista: HistoricoCard[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as HistoricoCard));
      callback(lista);
    }, (error) => {
      console.error("Erro ao observar histórico:", error);
      // Fallback sem orderBy se o índice composto ainda não estiver criado
      if (error.message && error.message.includes("index")) {
        const qFallback = query(collection(db, "gestao_historico"), where("card_id", "==", cardId));
        onSnapshot(qFallback, (snap) => {
          const listaFb: HistoricoCard[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoricoCard));
          listaFb.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
          callback(listaFb);
        });
      }
    });
  },

  // Observar saídas/despesas de uma campanha
  subscribeSaidas(campanhaId: string, callback: (saidas: SaidaDespesa[]) => void) {
    const q = query(collection(db, "gestao_saidas"), where("campanha_id", "==", campanhaId));
    return onSnapshot(q, (snapshot) => {
      const lista: SaidaDespesa[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as SaidaDespesa));
      // Ordenar por data decrescente no cliente caso não tenha índice
      lista.sort((a, b) => b.data_hora.localeCompare(a.data_hora));
      callback(lista);
    }, (error) => {
      console.error("Erro ao observar saídas:", error);
    });
  },

  // Mover card entre pipelines e registrar histórico
  async moverCard(
    cardId: string,
    novaPipeline: PipelineType,
    colunaOrigem: PipelineType,
    usuarioId: string,
    usuarioNome: string,
    dadosExtras?: { data_cobranca?: string; comprovante_url?: string; valor_pago?: number }
  ) {
    const agora = new Date().toISOString();
    const updateData: any = { pipeline: novaPipeline };
    
    if (dadosExtras?.data_cobranca !== undefined) {
      updateData.data_cobranca = dadosExtras.data_cobranca;
    }
    if (dadosExtras?.comprovante_url !== undefined) {
      updateData.comprovante_url = dadosExtras.comprovante_url;
    }
    if (dadosExtras?.valor_pago !== undefined) {
      updateData.valor_pago = dadosExtras.valor_pago;
    }
    if (novaPipeline === 'pagou' || dadosExtras?.valor_pago !== undefined) {
      updateData.data_pagamento = agora;
    }

    await updateDoc(doc(db, "gestao_cards", cardId), updateData);

    const lblOrigem = PIPELINE_LABELS[colunaOrigem] || colunaOrigem;
    const lblDestino = PIPELINE_LABELS[novaPipeline] || novaPipeline;
    let desc = `Movido da coluna "${lblOrigem}" para "${lblDestino}".`;
    
    if (novaPipeline === 'cobrar' && dadosExtras?.data_cobranca) {
      desc += ` Agendado para cobrança em ${dadosExtras.data_cobranca}.`;
    }
    if (novaPipeline === 'pagou' && dadosExtras?.valor_pago) {
      desc += ` Pagamento registrado no valor de R$ ${dadosExtras.valor_pago.toFixed(2)}.`;
    }

    await addDoc(collection(db, "gestao_historico"), {
      card_id: cardId,
      tipo: 'movimentacao',
      descricao: desc,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      criado_em: agora
    });
  },

  // Alterar membro vinculado ao card
  async alterarMembroCard(
    cardId: string,
    novoMembro: MembroOrganizador,
    membroAntigoNome: string,
    usuarioId: string,
    usuarioNome: string
  ) {
    const agora = new Date().toISOString();
    await updateDoc(doc(db, "gestao_cards", cardId), {
      membro_id: novoMembro.id,
      membro_nome: novoMembro.name,
      membro_phone: novoMembro.phone || "",
      membro_foto: novoMembro.photoUrl || novoMembro.foto || ""
    });

    await addDoc(collection(db, "gestao_historico"), {
      card_id: cardId,
      tipo: 'acao',
      descricao: `Membro vinculado alterado de "${membroAntigoNome}" para "${novoMembro.name}".`,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      criado_em: agora
    });
  },

  // Atualizar organizadores da campanha
  async updateOrganizadores(campanhaId: string, organizadoresIds: string[], membrosOrganizadores: any[]) {
    await updateDoc(doc(db, "gestao_campanhas", campanhaId), {
      organizadores_ids: organizadoresIds,
      membros_organizadores: membrosOrganizadores
    });
  },

  // Registrar nova saída/despesa
  async addSaida(dadosSaida: Omit<SaidaDespesa, 'id'>) {
    await addDoc(collection(db, "gestao_saidas"), dadosSaida);
  },

  // Concluir campanha
  async concluirCampanha(campanhaId: string) {
    await updateDoc(doc(db, "gestao_campanhas", campanhaId), {
      status: 'concluida'
    });
  },

  // Mudar status do card diretamente
  async updateCardPipeline(
    cardId: string,
    pipelineAntigo: string,
    novoPipeline: PipelineType,
    usuarioId: string,
    usuarioNome: string
  ) {
    if (pipelineAntigo === novoPipeline) return;
    const agora = new Date().toISOString();
    await updateDoc(doc(db, "gestao_cards", cardId), {
      pipeline: novoPipeline
    });

    await addDoc(collection(db, "gestao_historico"), {
      card_id: cardId,
      tipo: 'movimentacao',
      descricao: `Movido para "${novoPipeline.toUpperCase().replace('_', ' ')}".`,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      criado_em: agora
    });
  },

  // Adicionar pagamento parcial
  async addPagamentoParcial(
    card: any,
    valorParcial: number,
    observacao: string,
    usuarioId: string,
    usuarioNome: string
  ) {
    const agora = new Date().toISOString();
    const valorAtual = card.valor_pago || 0;
    const novoValor = valorAtual + valorParcial;
    const historicoAntigo = card.historico_pagamentos || [];
    const novoHist = [...historicoAntigo, { data: agora, valor: valorParcial, observacao }];

    await updateDoc(doc(db, "gestao_cards", card.id), {
      valor_pago: novoValor,
      historico_pagamentos: novoHist,
      data_pagamento: agora
    });

    await addDoc(collection(db, "gestao_historico"), {
      card_id: card.id,
      tipo: 'acao',
      descricao: `Pagamento parcial registrado: R$ ${valorParcial.toFixed(2)} (${observacao || 'Sem observação'})`,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      criado_em: agora
    });
  },

  // Adicionar comentário / observação com imagem opcional
  async addComentario(
    cardId: string,
    texto: string,
    imagemUrl: string | undefined,
    usuarioId: string,
    usuarioNome: string
  ) {
    const agora = new Date().toISOString();
    await addDoc(collection(db, "gestao_historico"), {
      card_id: cardId,
      tipo: 'comentario',
      descricao: texto || (imagemUrl ? "Arquivo anexado." : ""),
      imagem_url: imagemUrl || null,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      criado_em: agora
    });

    await updateDoc(doc(db, "gestao_cards", cardId), {
      tem_comentarios: true
    });
  },

  // Alterar mensagem para todas as pessoas
  async updateCampanhaMensagem(
    campanhaId: string,
    novaMensagem: string,
    novosCamposPagamento: any
  ) {
    await updateDoc(doc(db, "gestao_campanhas", campanhaId), {
      mensagem_template: novaMensagem,
      campos_pagamento: novosCamposPagamento
    });
  }
};
