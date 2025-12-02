const API = "../db/db.json"; // caminho correto

async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipo").value;
    
    try {
        const resposta = await fetch(API);
        if (!resposta.ok) throw new Error("Erro ao carregar base de dados");

        const db = await resposta.json();

        let usuario = null;

        if (tipo === "cidadao") {
            usuario = db.cidadaos?.find(u =>
                u.contato?.email === email &&
                u.seguranca?.password === senha
            );
        }

        if (tipo === "gestor") {
            usuario = db.gestores?.find(u =>
                u.email === email && u.senha === senha
            );
        }

        if (usuario) {
            alert(`Login realizado com sucesso! Bem-vindo(a), ${email}`);
            window.location.href = "../home-main.html"; 
            return;
        }

        alert("Email ou senha incorretos!");

    } catch (e) {
        console.error(e);
        alert("Erro ao validar login.");
    }
}

document.getElementById("formLogin").addEventListener("submit", fazerLogin);
