import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GestaoObras() {
  const { usuario, carregando, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (carregando) return;
    if (!usuario) navigate("/login");
  }, [carregando, usuario, navigate]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (carregando || !usuario) {
    return <div className="p-8 text-neutral-700">Carregando...</div>;
  }

  if (!usuario.gestor) {
    return (
      <div className="p-8 text-center">
        <p className="mb-3 text-lg font-semibold text-red-600">Acesso restrito a gestores.</p>
        <button onClick={() => navigate("/main")} className="text-primary hover:underline">
          Voltar para o painel principal
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="flex items-center gap-4 bg-primary px-5 py-2.5 text-white shadow">
        <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
        <div className="flex-1 text-lg font-bold">Obra Prima — Gestão</div>
        <button onClick={() => navigate("/main")} className="rounded-xl border border-white px-3 py-1.5">
          Página Inicial
        </button>
        <button onClick={handleLogout} className="rounded-xl border border-white px-3 py-1.5">
          Sair
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-neutral-700">Painel de gestão em construção.</p>
      </main>
    </div>
  );
}
