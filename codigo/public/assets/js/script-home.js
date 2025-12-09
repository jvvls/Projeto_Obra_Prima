const API = "https://projeto-obra-prima.onrender.com";

// =========================================
// VERIFICAÇÃO DE LOGIN
// =========================================

function verificarLogin() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const heroButtons = document.getElementById('heroButtons');
  const userName = document.getElementById('userName');

  if (usuario) {
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (userName) userName.textContent = usuario.nomeCompleto?.split(' ')[0] || 'Usuário';
    
    if (heroTitle) heroTitle.textContent = `Bem-vindo, ${usuario.nomeCompleto?.split(' ')[0] || 'Usuário'}!`;
    if (heroSubtitle) heroSubtitle.textContent = 'Acompanhe as obras públicas da sua cidade.';
    
    if (heroButtons) {
      heroButtons.innerHTML = `
        <button class="btn btn-primary" onclick="window.location.href='modulos/main.html'">
          <i class="fa fa-road"></i> Ver Todas as Obras
        </button>
        <button class="btn btn-ghost" onclick="window.location.href='modulos/feedback.html'">
          <i class="fa fa-message"></i> Enviar Feedback
        </button>
      `;
    }
  } else {
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'block';
    
    if (heroTitle) heroTitle.textContent = 'Acompanhe as Obras Públicas da Cidade';
    if (heroSubtitle) heroSubtitle.textContent = 'Faça login para acessar todas as funcionalidades do sistema.';
    
    if (heroButtons) {
      heroButtons.innerHTML = `
        <button class="btn btn-primary" onclick="window.location.href='modulos/login.html'">
          <i class="fa fa-user"></i> Fazer Login para Acessar
        </button>
      `;
    }
  }
}

// =========================================
// LOGOUT
// =========================================

function logout() {
  if (confirm("Deseja realmente sair?")) {
    localStorage.removeItem("usuarioLogado");
    window.location.reload(); 
  }
}

// =========================================
// CARREGAR DADOS
// =========================================

async function carregarDados() {
  try {
    verificarLogin();

    const obrasRes = await fetch(API + "/obras");

    if (!obrasRes.ok) {
      throw new Error('Erro ao buscar /obras: ' + obrasRes.status);
    }

    const obras = await obrasRes.json();

    document.getElementById("totalObras").textContent = Array.isArray(obras) ? obras.length : 0;

    const totalFeedbacks = obras.reduce((acc, obra) => {
      const qtd = Array.isArray(obra.feedbacks) ? obra.feedbacks.length : 0;
      return acc + qtd;
    }, 0);
    document.getElementById("totalFeedbacks").textContent = totalFeedbacks;

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
    const obrasDestaque = document.getElementById("obrasDestaque");
    if (obrasDestaque) {
      obrasDestaque.innerHTML = `
        <div class="card error-card">
          <i class="fa fa-exclamation-triangle"></i>
          <p>Não foi possível carregar os dados das obras.</p>
          <small>Verifique se o servidor está rodando em ${API}</small>
        </div>
      `;
    }
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
    if (db !== da) return db - da;
    
    return (b.valorContratado || 0) - (a.valorContratado || 0);
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
      <div class="card-footer">
        <small>Clique para ver detalhes</small>
      </div>
    `;

    card.addEventListener('click', () => {
      if (window.location.pathname.includes('modulos/main.html')) {
        alert(`Detalhes da obra: ${titulo}\nImplemente a visualização de detalhes aqui.`);
      } else {
        window.location.href = `modulos/main.html`;
      }
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

// =========================================
// INICIALIZAÇÃO
// =========================================

document.addEventListener('DOMContentLoaded', carregarDados);