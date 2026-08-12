import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cadastrarUsuario } from "../api/usuarios";

const inputClass = "w-full rounded-lg border border-surface-border bg-white px-2.5 py-2.5 text-sm";
const labelClass = "mb-1.5 block text-sm font-semibold text-primary";

export default function CadastroCidadao() {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (password !== confirmarSenha) {
      setErro("As senhas não coincidem!");
      return;
    }
    if (!aceitouTermos) {
      setErro("Você deve aceitar os termos.");
      return;
    }

    setEnviando(true);
    try {
      await cadastrarUsuario({
        gestor: false,
        dadosPessoais: { nomeCompleto, cpf, dataNascimento, genero },
        contato: { email, telefone },
        endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado },
        seguranca: { password },
      });
      navigate("/login");
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-primary px-5 py-2.5 text-white shadow">
        <Link to="/" className="flex items-center">
          <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
        </Link>
        <div className="flex-1 pl-2.5 text-lg font-bold">Cadastro de Cidadão</div>
        <button
          className="rounded-lg border border-white px-3 py-1.5 font-semibold"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-4.5 pb-5 pt-24">
        <div className="rounded-xl border border-surface-border bg-surface-soft p-4.5 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Cadastro de Cidadão</h2>
          <p className="mb-4 text-sm text-neutral-600">Preencha seus dados para criar seu acesso ao sistema.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h3 className="mt-1 text-lg font-bold text-primary">Dados Pessoais</h3>

            <div>
              <label className={labelClass}>Nome Completo *</label>
              <input required value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>CPF *</label>
                <input required value={cpf} onChange={(e) => setCpf(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Data de Nascimento *</label>
                <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Gênero</label>
              <select value={genero} onChange={(e) => setGenero(e.target.value)} className={inputClass}>
                <option value=""></option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <h3 className="mt-2 text-lg font-bold text-primary">Contato</h3>

            <div>
              <label className={labelClass}>E-mail *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Telefone</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputClass} />
            </div>

            <h3 className="mt-2 text-lg font-bold text-primary">Endereço</h3>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>CEP *</label>
                <input required value={cep} onChange={(e) => setCep(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Número *</label>
                <input required value={numero} onChange={(e) => setNumero(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Logradouro *</label>
              <input required value={logradouro} onChange={(e) => setLogradouro(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Complemento</label>
              <input value={complemento} onChange={(e) => setComplemento(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>Bairro *</label>
                <input required value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Cidade *</label>
                <input required value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Estado *</label>
              <input required value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass} />
            </div>

            <h3 className="mt-2 text-lg font-bold text-primary">Segurança</h3>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>Senha *</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Confirmar Senha *</label>
                <input type="password" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className={inputClass} />
              </div>
            </div>

            <label className="mt-1 flex cursor-pointer items-center gap-2 font-semibold text-neutral-700">
              <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} />
              Aceito os termos de uso e privacidade
            </label>

            {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

            <div className="mt-1.5 flex gap-3">
              <button
                type="reset"
                className="rounded-lg border border-primary px-3 py-2 font-semibold text-primary"
              >
                Limpar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="rounded-lg bg-primary px-3 py-2 font-semibold text-white disabled:opacity-60"
              >
                {enviando ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="py-4 text-center text-sm text-neutral-600">
        © 2025 Obra Prima — Todos os direitos reservados.
      </footer>
    </div>
  );
}
