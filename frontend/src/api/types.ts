export interface Marco {
  titulo: string;
  descricao: string;
  percentual: number;
  data: string;
}

export interface Feedback {
  nome: string;
  cpf?: string;
  email?: string;
  tipo: "elogio" | "reclamacao" | "sugestao";
  titulo: string;
  descricao: string;
  dataEnvio: string;
  anexo?: string;
}

export interface Anexo {
  tipo: string;
  nomeArquivo: string;
  url?: string | null;
}

export interface Obra {
  _id: string;
  titulo: string;
  descricao: string;
  valorContratado: number;
  status: string;
  dataInicio: string;
  previsaoTermino: string;
  orgaoResponsavel: string;
  empresaExecutora: string;
  latitude?: number;
  longitude?: number;
  endereco: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  anexos: Anexo[];
  marcos: Marco[];
  feedbacks: Feedback[];
}

export interface Usuario {
  _id: string;
  gestor: boolean;
  dadosPessoais: {
    nomeCompleto: string;
    cpf: string;
    dataNascimento?: string;
    genero?: string;
  };
  contato: {
    email: string;
    telefone?: string;
  };
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  dadosProfissionais?: {
    orgaoInstituicao?: string;
    cargo?: string;
    experiencia?: string;
    areaAtuacao?: string;
  };
  aceitouTermos?: boolean;
  receberNotificacoes?: boolean;
}
