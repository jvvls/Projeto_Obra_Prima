import { Schema, model, Types } from "mongoose";

export interface IMarco {
  titulo: string;
  descricao: string;
  percentual: number;
  data: string;
}

export interface IFeedback {
  nome: string;
  cpf?: string;
  email?: string;
  tipo: "elogio" | "reclamacao" | "sugestao";
  titulo: string;
  descricao: string;
  dataEnvio: string;
  anexo?: string;
}

export interface IAnexo {
  tipo: string;
  nomeArquivo: string;
  url?: string | null;
}

export interface IObra {
  _id: Types.ObjectId;
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
  anexos: IAnexo[];
  marcos: IMarco[];
  feedbacks: IFeedback[];
}

const obraSchema = new Schema<IObra>({
  titulo: { type: String, required: true },
  descricao: String,
  valorContratado: Number,
  status: { type: String, required: true },
  dataInicio: String,
  previsaoTermino: String,
  orgaoResponsavel: String,
  empresaExecutora: String,
  latitude: Number,
  longitude: Number,
  endereco: {
    logradouro: String,
    numero: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String,
  },
  anexos: [{ tipo: String, nomeArquivo: String, url: Schema.Types.Mixed }],
  marcos: [{ titulo: String, descricao: String, percentual: Number, data: String }],
  feedbacks: [
    {
      nome: String,
      cpf: String,
      email: String,
      tipo: { type: String, enum: ["elogio", "reclamacao", "sugestao"] },
      titulo: String,
      descricao: String,
      dataEnvio: String,
      anexo: String,
    },
  ],
});

export const Obra = model<IObra>("Obra", obraSchema);
