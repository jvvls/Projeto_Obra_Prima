import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getObra } from "../api/obras";
import type { Obra } from "../api/types";

function formatarValor(valor: number | undefined) {
  if (!valor) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ObraDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [obra, setObra] = useState<Obra | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getObra(id)
      .then(setObra)
      .catch((err) => setErro(err.message));
  }, [id]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="flex items-center justify-between bg-primary px-6 py-4 text-white">
        <Link to="/" className="flex items-center">
          <img src="/assets/images/Logo.png" alt="Logo" className="h-11" />
        </Link>
        <div className="text-xl font-bold">Detalhes da Obra</div>
        <Link to="/" className="rounded-md border border-white px-3.5 py-2 hover:bg-white hover:text-primary-darker">
          Home
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-7">
        {erro && (
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="font-bold text-red-600">Obra não encontrada.</p>
            <p className="text-sm text-neutral-600">{erro}</p>
          </div>
        )}

        {!erro && !obra && <p className="text-neutral-700">Carregando...</p>}

        {obra && (
          <>
            <div className="mb-7 rounded-xl bg-white p-6 shadow">
              <h1 className="mb-2.5 text-2xl font-bold">{obra.titulo}</h1>
              <p className="mb-5 text-neutral-700">{obra.descricao}</p>

              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                <div className="rounded-md bg-surface-muted p-3">
                  <strong>Status:</strong> {obra.status}
                </div>
                <div className="rounded-md bg-surface-muted p-3">
                  <strong>Bairro:</strong> {obra.endereco?.bairro || "—"}
                </div>
                <div className="rounded-md bg-surface-muted p-3">
                  <strong>Cidade:</strong> {obra.endereco?.cidade || "—"}
                </div>
                <div className="rounded-md bg-surface-muted p-3">
                  <strong>Valor Contratado:</strong> {formatarValor(obra.valorContratado)}
                </div>
                <div className="rounded-md bg-surface-muted p-3">
                  <strong>Data de Início:</strong> {obra.dataInicio || "—"}
                </div>
                <div className="rounded-md bg-surface-muted p-3">
                  <strong>Previsão de Conclusão:</strong> {obra.previsaoTermino || "—"}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-2 text-xl font-bold">Linha do Tempo (Marcos da Obra)</h2>
              {(!obra.marcos || obra.marcos.length === 0) && (
                <p className="mt-5 text-neutral-700">Esta obra não possui marcos cadastrados.</p>
              )}
              <div className="mt-5 border-l-[3px] border-primary-darker pl-5">
                {obra.marcos?.map((marco, i) => (
                  <div key={i} className="relative mb-6">
                    <span className="absolute -left-[29px] top-1.5 h-3.5 w-3.5 rounded-full bg-primary-darker" />
                    <h3 className="mb-1 text-lg">{marco.titulo}</h3>
                    <p className="mt-1 text-neutral-700">{marco.descricao}</p>
                    <p className="mt-2 inline-block rounded-md bg-primary-darker px-2.5 py-1 text-sm text-white">
                      Progresso: {marco.percentual}%
                    </p>
                    <br />
                    <span className="mt-1 text-neutral-700">
                      <strong>Data:</strong> {marco.data}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
