import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cadastrarUsuario } from "../api/usuarios";

const inputClass = "w-full rounded-lg border border-surface-border bg-white px-2.5 py-2.5 text-sm";
const labelClass = "mb-1.5 block text-sm font-semibold text-primary";

export default function CadastroGestor() {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [orgaoInstituicao, setOrgaoInstituicao] = useState("");
  const [cargo, setCargo] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [receberNotificacoes, setReceberNotificacoes] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem!");
      return;
    }
    if (!aceitouTermos) {
      setErro("Você deve aceitar os termos de uso.");
      return;
    }

    setEnviando(true);
    try {
      await cadastrarUsuario({
        gestor: true,
        dadosPessoais: { nomeCompleto, cpf },
        contato: { email, telefone },
        endereco: { logradouro: rua, numero, bairro, cidade, estado, cep },
        dadosProfissionais: { orgaoInstituicao, cargo, experiencia, areaAtuacao },
        seguranca: { password: senha },
        aceitouTermos,
        receberNotificacoes,
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
        <div className="flex-1 pl-2.5 text-lg font-bold">Cadastro de Gestor</div>
        <button
          className="rounded-lg border border-white px-3 py-1.5 font-semibold"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-4.5 pb-5 pt-24">
        <div className="rounded-xl border border-surface-border bg-surface-soft p-4.5 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Cadastro de Gestor</h2>
          <p className="mb-4 text-sm text-neutral-600">Preencha os dados abaixo para criar seu acesso ao sistema.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                <label className={labelClass}>Telefone</label>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Órgão / Instituição</label>
              <input value={orgaoInstituicao} onChange={(e) => setOrgaoInstituicao(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>Cargo</label>
                <input value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Experiência</label>
                <select value={experiencia} onChange={(e) => setExperiencia(e.target.value)} className={inputClass}>
                  <option value=""></option>
                  <option>1 a 3 anos</option>
                  <option>4 a 6 anos</option>
                  <option>7+ anos</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Área de Atuação</label>
              <select value={areaAtuacao} onChange={(e) => setAreaAtuacao(e.target.value)} className={inputClass}>
                <option value=""></option>
                <option>Engenharia</option>
                <option>Gestão Pública</option>
                <option>Infraestrutura</option>
                <option>Outros</option>
              </select>
            </div>

            <h3 className="mt-2 text-lg font-bold text-primary">Endereço</h3>

            <div>
              <label className={labelClass}>Rua</label>
              <input value={rua} onChange={(e) => setRua(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>Número</label>
                <input value={numero} onChange={(e) => setNumero(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Bairro</label>
                <input value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>Cidade</label>
                <input value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Estado</label>
                <input value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>CEP</label>
              <input value={cep} onChange={(e) => setCep(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>Senha *</label>
                <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Confirmar Senha *</label>
                <input type="password" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className={inputClass} />
              </div>
            </div>

            <label className="mt-1 flex cursor-pointer items-center gap-2 font-semibold text-neutral-700">
              <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} />
              Aceito os termos de uso e política de privacidade
            </label>

            <label className="flex cursor-pointer items-center gap-2 font-semibold text-neutral-700">
              <input type="checkbox" checked={receberNotificacoes} onChange={(e) => setReceberNotificacoes(e.target.checked)} />
              Desejo receber notificações do sistema
            </label>

            {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

            <div className="mt-1.5 flex gap-3">
              <button type="reset" className="rounded-lg border border-primary px-3 py-2 font-semibold text-primary">
                Limpar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="rounded-lg bg-primary px-3 py-2 font-semibold text-white disabled:opacity-60"
              >
                {enviando ? "Cadastrando..." : "Cadastrar Gestor"}
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
