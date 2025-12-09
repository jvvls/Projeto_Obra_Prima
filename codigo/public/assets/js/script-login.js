const API = "https://projeto-obra-prima.onrender.com/usuarios";

async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipo").value;

    try {
        const resposta = await fetch(API);
        if (!resposta.ok) throw new Error("Erro ao carregar usuários");

        const usuarios = await resposta.json();
        const isGestor = tipo === "gestor";

        const usuario = usuarios.find(u =>
            u.contato?.email === email &&
            u.seguranca?.password === senha &&
            u.gestor === isGestor
        );

    if (usuario) {
        localStorage.setItem("usuarioLogado", JSON.stringify({
            id: usuario.id,
            dadosPessoais: {
            nomeCompleto: usuario.dadosPessoais.nomeCompleto
        },
        gestor: usuario.gestor
    }));

    alert(`Login realizado com sucesso! Bem-vindo(a), ${usuario.dadosPessoais.nomeCompleto}`);
    window.location.href = "modulos/main.html";
    return;
}


    alert("Email ou senha incorretos!");

    } catch (e) {
        console.error(e);
        alert("Erro ao validar login.");
    }
}

document.getElementById("formLogin").addEventListener("submit", fazerLogin);
