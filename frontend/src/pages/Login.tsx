import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"cidadao" | "gestor">("cidadao");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha, tipo);
      navigate("/main");
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 bg-primary px-6 py-3 text-white">
        <Link to="/">
          <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
        </Link>
        <div className="text-lg font-bold">Portal de Login</div>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-1.5 text-2xl text-primary">Faça seu Login</h2>
          <p className="mb-5 text-sm text-neutral-600">Entre para acompanhar obras e enviar feedbacks.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label className="mb-1 block font-semibold text-primary">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-2.5 py-2.5 text-sm"
              />
            </div>

            <div className="mb-3.5">
              <label className="mb-1 block font-semibold text-primary">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-2.5 py-2.5 text-sm"
              />
            </div>

            <div className="mb-3.5">
              <label className="mb-1 block font-semibold text-primary">Tipo de Usuário</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "cidadao" | "gestor")}
                className="w-full rounded-lg border border-surface-border px-2.5 py-2.5 text-sm"
              >
                <option value="cidadao">Cidadão</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>

            {erro && <p className="mb-3.5 text-sm font-semibold text-red-600">{erro}</p>}

            <div className="mt-2.5">
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-primary py-2.5 font-bold text-white disabled:opacity-60"
              >
                {enviando ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-primary">Não tem uma conta?</p>
            <br />
            <Link to="/cadastro/cidadao" className="text-primary hover:underline">
              Criar conta de Cidadão
            </Link>
            <br />
            <Link to="/cadastro/gestor" className="text-primary hover:underline">
              Criar conta de Gestor
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-4 text-center text-sm text-neutral-600">
        © 2025 Obra Prima — Todos os direitos reservados.
      </footer>
    </div>
  );
}
