document.getElementById("gestorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nome: document.getElementById("nome").value,
    cpf: document.getElementById("cpf").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    instituicao: document.getElementById("instituicao").value,
    cargo: document.getElementById("cargo").value,
    experiencia: document.getElementById("experiencia").value,
    area: document.getElementById("area").value,
    senha: document.getElementById("senha").value,
    endereco: document.getElementById("endereco").value,
  };

  try {
    const response = await fetch("http://localhost:3000/gestores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Gestor cadastrado com sucesso!");
      document.getElementById("gestorForm").reset();
    } else {
      alert("Erro ao cadastrar gestor. Verifique os dados e tente novamente.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro na conexão com o servidor.");
  }
});
