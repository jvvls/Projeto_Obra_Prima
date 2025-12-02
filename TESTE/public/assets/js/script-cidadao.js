const API = "http://localhost:3000/usuarios";
const form = document.getElementById("formCidadao");

// Toast simples
function toast(msg, tipo = "sucesso") {
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

// MÁSCARAS
document.getElementById("cpf").addEventListener("input", e => {
    e.target.value = e.target.value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
});

document.getElementById("telefone").addEventListener("input", e => {
    e.target.value = e.target.value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
});

document.getElementById("cep").addEventListener("input", e => {
    e.target.value = e.target.value
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2");
});

// SUBMIT
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeCompleto = document.getElementById("nomeCompleto").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const dataNascimento = document.getElementById("dataNascimento").value.trim();
    const genero = document.getElementById("genero").value;

    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();

    const cep = document.getElementById("cep").value.trim();
    const logradouro = document.getElementById("logradouro").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const complemento = document.getElementById("complemento").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();

    const password = document.getElementById("password").value.trim();
    const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

    const aceitouTermos = document.getElementById("aceitouTermos").checked;

    if (!nomeCompleto || !cpf || !email || !password) {
        toast("Preencha todos os campos obrigatórios!", "erro");
        return;
    }

    if (password !== confirmarSenha) {
        toast("As senhas não coincidem!", "erro");
        return;
    }

    if (!aceitouTermos) {
        toast("Você deve aceitar os termos.", "erro");
        return;
    }

    // NOVO OBJETO FINAL
    const dados = {
        gestor: false,
        dadosPessoais: {
            nomeCompleto,
            cpf,
            dataNascimento,
            genero
        },
        contato: {
            email,
            telefone
        },
        endereco: {
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado
        },
        seguranca: {
            password
        }
    };

    // ENVIO
    try {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!res.ok) throw new Error(await res.text());

        toast("Cidadão cadastrado com sucesso!");
        form.reset();

    } catch (e) {
        toast("Erro ao salvar. Verifique o servidor!", "erro");
        console.error(e);
    }
});
