export type PipelineType = 
  | 'a_contatar' 
  | 'msg_enviada' 
  | 'msg_nao_chegou' 
  | 'respondeu' 
  | 'cobrar' 
  | 'pagou' 
  | 'cancelou';

export const PIPELINE_LABELS: Record<PipelineType, string> = {
  a_contatar: 'A Contatar',
  msg_enviada: 'Msg Enviada',
  msg_nao_chegou: 'Msg Não Chegou',
  respondeu: 'Respondeu',
  cobrar: 'Cobrar',
  pagou: 'Pagou',
  cancelou: 'Cancelou',
};

export const PIPELINE_ORDER: PipelineType[] = [
  'a_contatar',
  'msg_enviada',
  'msg_nao_chegou',
  'respondeu',
  'cobrar',
  'pagou',
  'cancelou',
];

export interface SubcamposPix {
  chave: string;
  nome: string;
  banco: string;
  valor?: number;
}

export interface CamposPagamento {
  valor?: number;
  dinheiro: boolean;
  pix?: SubcamposPix;
  cartao?: string; // link de pagamento
}

export interface MembroOrganizador {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  telefone?: string;
  whatsapp?: string;
  celular?: string;
  role?: string;
  photoUrl?: string;
  photoURL?: string;
  foto?: string;
}

export interface Campanha {
  id: string;
  nome: string;
  mensagem_template: string;
  campos_pagamento: CamposPagamento;
  membros_organizadores: MembroOrganizador[];
  organizadores_ids?: string[];
  status: 'aberta' | 'concluida';
  criada_em: string;
  criada_por_id?: string;
}

export interface CardMembro {
  id: string;
  campanha_id: string;
  membro_id: string;
  membro_nome: string;
  membro_phone?: string;
  membro_telefone?: string;
  membro_foto?: string;
  pipeline: PipelineType;
  data_cobranca?: string; // YYYY-MM-DD
  comprovante_url?: string;
  valor_pago?: number;
  data_pagamento?: string;
  tem_comentarios?: boolean;
  historico_pagamentos?: { data: string; valor: number; observacao?: string }[];
}

export interface HistoricoCard {
  id: string;
  card_id: string;
  tipo: 'movimentacao' | 'comentario' | 'acao';
  descricao: string;
  usuario_id: string;
  usuario_nome?: string;
  criado_em: string; // ISO string
  imagem_url?: string;
}

export interface SaidaDespesa {
  id: string;
  campanha_id: string;
  titulo: string;
  valor: number;
  operador_id: string;
  operador_nome?: string;
  data_hora: string; // dd/mm/aaaa - hh:mm ou ISO
  anexo_url?: string;
}
