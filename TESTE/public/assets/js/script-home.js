const API = "http://localhost:3000";

// =========================================
// CARREGAR DADOS
// =========================================

async function carregarDados() {
  try {
    const obrasRes = await fetch(API + "/obras");

    if (!obrasRes.ok) {
      throw new Error('Erro ao buscar /obras: ' + obrasRes.status);
    }

    const obras = await obrasRes.json();

    // Total de obras
    document.getElementById("totalObras").textContent = Array.isArray(obras) ? obras.length : 0;

    // Agora feedbacks são internos às obras
    const totalFeedbacks = obras.reduce((acc, obra) => {
      const qtd = Array.isArray(obra.feedbacks) ? obra.feedbacks.length : 0;
      return acc + qtd;
    }, 0);
    document.getElementById("totalFeedbacks").textContent = totalFeedbacks;

    // Contagem por status
    const concluidas = obras.filter(o =>
      String(o.status).toLowerCase().includes("conclu")
    ).length;

    const andamento = obras.filter(o =>
      String(o.status).toLowerCase().includes("andamento")
    ).length;

    const paralisadas = obras.filter(o =>
      String(o.status).toLowerCase().includes("paralis")
    ).length;

    gerarGrafico(concluidas, andamento, paralisadas);
    gerarObrasDestaque(obras);

  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

// =========================================
// OBRAS DE DESTAQUE
// =========================================

function gerarObrasDestaque(obras) {
  const container = document.getElementById("obrasDestaque");
  if (!Array.isArray(obras) || obras.length === 0) {
    container.innerHTML = '<div class="card">Nenhuma obra de destaque.</div>';
    return;
  }

  const ordenadas = obras.slice().sort((a, b) => {
    const da = a.dataInicio ? new Date(a.dataInicio).getTime() : 0;
    const db = b.dataInicio ? new Date(b.dataInicio).getTime() : 0;
    return db - da;
  });

  const destaque = ordenadas.slice(0, 3);
  container.innerHTML = "";

  destaque.forEach(obra => {
    const titulo = obra.titulo || "(Sem título)";
    const status = obra.status || "—";
    const bairro = obra.endereco?.bairro || "—";
    const cidade = obra.endereco?.cidade || "—";
    const valor = obra.valorContratado ? formatarMoeda(obra.valorContratado) : "—";

    const card = document.createElement("div");
    card.className = "obra-card";

    card.innerHTML = `
      <h3>${escapeHtml(titulo)}</h3>
      <p><strong>Status:</strong> ${escapeHtml(status)}</p>
      <p><strong>Local:</strong> ${escapeHtml(bairro)} — ${escapeHtml(cidade)}</p>
      <p><strong>Valor:</strong> R$ ${valor}</p>
    `;

    card.addEventListener('click', () => {
      window.location.href = `obra-detalhe.html?id=${encodeURIComponent(obra.id)}`;
    });

    container.appendChild(card);
  });
}

// =========================================
// UTILITÁRIOS
// =========================================

function escapeHtml(str) {
  return String(str || "").replace(/&/g,"&amp;")
                          .replace(/</g,"&lt;")
                          .replace(/>/g,"&gt;");
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 })
    .format(Number(valor) || 0);
}

// =========================================
// GRÁFICO (Chart.js)
// =========================================

function gerarGrafico(concluidas, andamento, paralisadas) {
  const ctx = document.getElementById("graficoObras");
  if (!ctx) return;

  if (ctx.__chartInstance) ctx.__chartInstance.destroy();

  ctx.__chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Concluídas", "Em andamento", "Paralisadas"],
      datasets: [{
        label: "Quantidade de Obras",
        data: [concluidas, andamento, paralisadas],
        backgroundColor: ["#27ae60", "#f1c40f", "#e74c3c"]
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { display: false } }
    }
  });
}

carregarDados();
