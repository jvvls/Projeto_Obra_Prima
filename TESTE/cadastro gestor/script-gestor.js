// ======================================
// CONFIGURAÇÃO
// ======================================

const API = "http://localhost:3000/gestores";
const form = document.getElementById("formGestor");

// Mensagem tipo toast
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
    div.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    div.style.background = tipo === "erro" ? "#e74c3c" : "#27ae60";

    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3500);
}

// ======================================
// MÁSCARAS
// ======================================

function mascaraCPF(v) {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
}

function mascaraTelefone(v) {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v;
}

document.getElementById("cpf").addEventListener("input", e => {
    e.target.value = mascaraCPF(e.target.value);
});

document.getElementById("telefone").addEventListener("input", e => {
    e.target.value = mascaraTelefone(e.target.value);
});

document.getElementById("cep").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");
});


// ======================================
// SALVAR NO SERVIDOR
// ======================================

async function salvarGestor(dados) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Erro HTTP ${res.status} - ${txt}`);
    }

    return res.json();
}


// ======================================
// SUBMIT DO FORMULÁRIO
// ======================================

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // -----------------------------
    // Coletar Dados
    // -----------------------------
    const nomeCompleto = document.getElementById("nomeCompleto").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();

    const orgaoInstituicao = document.getElementById("orgaoInstituicao").value.trim();
    const cargo = document.getElementById("cargo").value.trim();
    const experiencia = document.getElementById("experiencia").value;
    const areaAtuacao = document.getElementById("areaAtuacao").value;

    // ENDEREÇO
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


    // -----------------------------
    // Validações
    // -----------------------------
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


    // -----------------------------
    // Objeto final
    // -----------------------------
    const dadosGestor = {
        nomeCompleto,
        cpf,
        telefone,
        email,
        orgaoInstituicao,
        cargo,
        experiencia,
        areaAtuacao,
        
        endereco: {
            rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        },

        senha,
        aceitouTermos,
        receberNotificacoes,
        criadoEm: new Date().toISOString()
    };


    // -----------------------------
    // Enviar
    // -----------------------------
    try {
        await salvarGestor(dadosGestor);
        mostrarMensagem("Gestor cadastrado com sucesso!");
        form.reset();
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        mostrarMensagem("Erro ao cadastrar. Verifique o servidor.", "erro");
    }
});
