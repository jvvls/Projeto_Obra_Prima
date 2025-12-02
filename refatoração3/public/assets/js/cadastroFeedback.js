document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("feedbackForm");
  const obraSelect = document.getElementById("obra");

  // Carregar obras da API
  try {
    const response = await fetch("http://localhost:3000/obras");
    const obras = await response.json();
    obras.forEach(obra => {
      const option = document.createElement("option");
      option.value = obra.titulo || obra.nome || obra.id;
      option.textContent = obra.titulo || obra.nome || `Obra ${obra.id}`;
      obraSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar obras:", error);
    // Fallback com obras padrão
    const obrasPadrao = [
      "Construção da Praça Central",
      "Reforma da Escola Municipal",
      "Pavimentação da Rua das Flores",
      "Ampliação do Hospital Regional"
    ];
    obrasPadrao.forEach(nome => {
      const option = document.createElement("option");
      option.value = nome;
      option.textContent = nome;
      obraSelect.appendChild(option);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const dados = {
      obra: obraSelect.value,
      nome: document.getElementById("nome").value,
      cpf: document.getElementById("cpf").value,
      email: document.getElementById("email").value,
      tipo: document.getElementById("tipo").value,
      titulo: document.getElementById("titulo").value,
      descricao: document.getElementById("descricao").value
    };

    fetch("http://localhost:3000/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message || "Feedback enviado com sucesso!");
      // Redireciona para a tela de feedbacks
      window.location.href = '../html/feed.html'; 
    })
    .catch(error => {
      console.error("Erro ao enviar feedback:", error);
      alert("Erro ao enviar feedback. Verifique a conexão com a API.");
    });
  });
});