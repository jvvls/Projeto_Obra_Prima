const API = "http://localhost:3000";

async function carregarDados() {
  try {
    const [obrasRes, feedbacksRes] = await Promise.all([
      fetch(API + "/obras"),
      fetch(API + "/feedbacks")
    ]);

    if (!obrasRes.ok) throw new Error('Erro ao buscar /obras: ' + obrasRes.status);
    if (!feedbacksRes.ok) throw new Error('Erro ao buscar /feedbacks: ' + feedbacksRes.status);

    const obras = await obrasRes.json();
    const feedbacks = await feedbacksRes.json();

    document.getElementById("totalObras").textContent = Array.isArray(obras) ? obras.length : 0;
    document.getElementById("totalFeedbacks").textContent = Array.isArray(feedbacks) ? feedbacks.length : 0;

    const concluidas = obras.filter(o => String(o.status).toLowerCase() === "concluída" || String(o.status).toLowerCase() === "concluida").length;
    const andamento = obras.filter(o => String(o.status).toLowerCase() === "em andamento" || String(o.status).toLowerCase() === "em-andamento").length;
    const paralisadas = obras.filter(o => String(o.status).toLowerCase() === "paralisada").length;

    gerarGrafico(concluidas, andamento, paralisadas);

    gerarObrasDestaque(obras);
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

function gerarObrasDestaque(obras) {
  if (!Array.isArray(obras)) { document.getElementById("obrasDestaque").innerHTML = '<div class="card">Nenhuma obra.</div>'; return; }

  // Primeiro tenta ordenar por dataInicio (mais recente primeiro). Se dataInicio ausente, usa id (numérico quando possível).
  const ordenadas = obras.slice().sort((a, b) => {
    const da = a.dataInicio ? new Date(a.dataInicio).getTime() : null;
    const db = b.dataInicio ? new Date(b.dataInicio).getTime() : null;
    if (da !== null && db !== null) return db - da;
    if (da !== null) return -1;
    if (db !== null) return 1;
    // fallback por id numérico se possível
    const na = parseInt(a.id, 10);
    const nb = parseInt(b.id, 10);
    if (!isNaN(na) && !isNaN(nb)) return nb - na;
    return 0;
  });

  const destaque = ordenadas.slice(0, 3);

  const container = document.getElementById("obrasDestaque");
  container.innerHTML = "";

  destaque.forEach(obra => {
    // campos do seu db.json: titulo, endereco.{bairro,cidade}, status, descricao, valorContratado
    const titulo = obra.titulo || obra.nome || "(Sem título)";
    const status = obra.status || "—";
    const bairro = obra.endereco?.bairro || obra.endereco?.logradouro || "—";
    const cidade = obra.endereco?.cidade || "—";
    const valor = typeof obra.valorContratado !== 'undefined' ? formatarMoeda(obra.valorContratado) : "—";

    const card = document.createElement("div");
    card.className = "obra-card";

    card.innerHTML = `
      <h3>${escapeHtml(titulo)}</h3>
      <p><strong>Status:</strong> ${escapeHtml(status)}</p>
      <p><strong>Local:</strong> ${escapeHtml(bairro)} — ${escapeHtml(cidade)}</p>
      <p><strong>Valor:</strong> R$ ${valor}</p>
    `;

    card.addEventListener('click', () => {
      // redireciona para página de detalhe (página pode ser criada depois)
      window.location.href = `detalhes-obras/obra-detalhe.html?id=${encodeURIComponent(obra.id)}`;


    });

    container.appendChild(card);
  });

  if (destaque.length === 0) container.innerHTML = '<div class="card">Nenhuma obra de destaque.</div>';
}

// utilitários simples (escape e moeda)
function escapeHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function formatarMoeda(valor) {
  try {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor) || 0);
  } catch (e) { return String(valor || '0,00'); }
}

// GRÁFICO (Chart.js)
function gerarGrafico(concluidas, andamento, paralisadas) {
  const ctx = document.getElementById("graficoObras");
  if (!ctx) return;

  // destrói gráfico anterior se existir (evita duplicatas em hot-reload)
  if (ctx.__chartInstance) {
    ctx.__chartInstance.destroy();
  }

  ctx.__chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Concluídas", "Em andamento", "Paralisadas"],
      datasets: [{
        label: "Quantidade de Obras",
        data: [concluidas, andamento, paralisadas],
        backgroundColor: ["#27ae60", "#f1c40f", "#e74c3c"],
        borderWidth: 1
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, ticks: { precision:0 } } },
      plugins: { legend: { display: false } }
    }
  });
}

carregarDados();
