const API = "http://localhost:3000/usuarios";
const form = document.getElementById("formGestor");

function mostrarMensagem(msg, tipo = "sucesso") {
    const div = document.createElement("div");
    div.textContent = msg;
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.right = "20px";
    div.style.padding = "12px 18px";
    div.style.borderRadius = "8px";
    div.style.fontWeight = "600";
    div.style.color = "#fff";
    div.style.zIndex = "9999";
    div.style.background = tipo === "erro" ? "#e74c3c" : "#27ae60";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

// Máscaras
function mascaraCPF(v) {
    return v.replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

document.getElementById("cpf").addEventListener("input", e => {
    e.target.value = mascaraCPF(e.target.value);
});

document.getElementById("telefone").addEventListener("input", e => {
    e.target.value = e.target.value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
});

document.getElementById("cep").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");
});

// SUBMIT
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeCompleto = document.getElementById("nomeCompleto").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();

    const orgaoInstituicao = document.getElementById("orgaoInstituicao").value.trim();
    const cargo = document.getElementById("cargo").value.trim();
    const experiencia = document.getElementById("experiencia").value;
    const areaAtuacao = document.getElementById("areaAtuacao").value;

    const rua = document.getElementById("rua").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();
    const cep = document.getElementById("cep").value.trim();

    const senha = document.getElementById("senha").value.trim();
    const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

    const aceitouTermos = document.getElementById("aceitouTermos").checked;
    const receberNotificacoes = document.getElementById("receberNotificacoes").checked;

    if (!nomeCompleto || !cpf || !email || !senha) {
        mostrarMensagem("Preencha todos os campos obrigatórios!", "erro");
        return;
    }

    if (senha !== confirmarSenha) {
        mostrarMensagem("As senhas não coincidem!", "erro");
        return;
    }

    if (!aceitouTermos) {
        mostrarMensagem("Você deve aceitar os termos de uso.", "erro");
        return;
    }

    const dadosGestor = {
        gestor: true,
        dadosPessoais: {
            nomeCompleto,
            cpf
        },
        contato: {
            email,
            telefone
        },
        endereco: {
            logradouro: rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        },
        dadosProfissionais: {
            orgaoInstituicao,
            cargo,
            experiencia,
            areaAtuacao
        },
        seguranca: {
            password: senha
        },
        aceitouTermos,
        receberNotificacoes,
        criadoEm: new Date().toISOString()
    };

    try {
        await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosGestor)
        });

        mostrarMensagem("Gestor cadastrado com sucesso!");
        form.reset();

    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        mostrarMensagem("Erro ao cadastrar. Verifique o servidor.", "erro");
    }
});
