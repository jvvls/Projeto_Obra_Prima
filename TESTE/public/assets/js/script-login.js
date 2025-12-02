const API = "http://localhost:3000/usuarios"; // endpoint do JSON Server

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

        // Encontrar usuário pelo email, senha e tipo
        const usuario = usuarios.find(u =>
            u.contato?.email === email &&
            u.seguranca?.password === senha &&
            u.gestor === isGestor
        );

        if (usuario) {

            // Salvar usuário logado
            localStorage.setItem("usuarioLogado", JSON.stringify({
                id: usuario.id,
                nomeCompleto: usuario.dadosPessoais.nomeCompleto,
                tipo: usuario.gestor ? "gestor" : "colaborador"
            }));

            alert(`Login realizado com sucesso! Bem-vindo(a), ${usuario.dadosPessoais.nomeCompleto}`);

            window.location.href = "../modulos/main.html";
            return;
        }

        alert("Email ou senha incorretos!");

    } catch (e) {
        console.error(e);
        alert("Erro ao validar login.");
    }
}

document.getElementById("formLogin").addEventListener("submit", fazerLogin);
