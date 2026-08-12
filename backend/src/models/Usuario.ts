import { Schema, model, Types } from "mongoose";

export interface IUsuario {
  _id: Types.ObjectId;
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
  seguranca: {
    passwordHash: string;
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

const usuarioSchema = new Schema<IUsuario>(
  {
    gestor: { type: Boolean, required: true, default: false },
    dadosPessoais: {
      nomeCompleto: { type: String, required: true },
      cpf: { type: String, required: true },
      dataNascimento: String,
      genero: String,
    },
    contato: {
      email: { type: String, required: true, unique: true },
      telefone: String,
    },
    endereco: {
      cep: String,
      logradouro: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String,
    },
    seguranca: {
      passwordHash: { type: String, required: true },
    },
    dadosProfissionais: {
      orgaoInstituicao: String,
      cargo: String,
      experiencia: String,
      areaAtuacao: String,
    },
    aceitouTermos: Boolean,
    receberNotificacoes: Boolean,
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: false } }
);

export const Usuario = model<IUsuario>("Usuario", usuarioSchema);
