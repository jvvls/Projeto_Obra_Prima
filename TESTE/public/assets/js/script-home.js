const API = "http://localhost:3000";

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
    // Usuário está logado
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (userName) userName.textContent = usuario.nomeCompleto?.split(' ')[0] || 'Usuário';
    
    // Atualizar mensagens de boas-vindas
    if (heroTitle) heroTitle.textContent = `Bem-vindo, ${usuario.nomeCompleto?.split(' ')[0] || 'Usuário'}!`;
    if (heroSubtitle) heroSubtitle.textContent = 'Acompanhe as obras públicas da sua cidade.';
    
    // Botões para usuário logado
    if (heroButtons) {
      heroButtons.innerHTML = `
        <button class="btn btn-primary" onclick="window.location.href='main.html'">
          <i class="fa fa-road"></i> Ver Todas as Obras
        </button>
        <button class="btn btn-ghost" onclick="window.location.href='feedback.html'">
          <i class="fa fa-message"></i> Enviar Feedback
        </button>
      `;
    }
  } else {
    // Usuário NÃO está logado - APENAS opção de login
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'block';
    
    // Mensagens padrão
    if (heroTitle) heroTitle.textContent = 'Acompanhe as Obras Públicas da Cidade';
    if (heroSubtitle) heroSubtitle.textContent = 'Faça login para acessar todas as funcionalidades do sistema.';
    
    // Botões para visitante - APENAS LOGIN
    if (heroButtons) {
      heroButtons.innerHTML = `
        <button class="btn btn-primary" onclick="window.location.href='login.html'">
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
    window.location.reload(); // Recarrega a página para atualizar o estado
  }
}

// =========================================
// CARREGAR DADOS
// =========================================

async function carregarDados() {
  try {
    // Primeiro verifica o login
    verificarLogin();

    // Carrega os dados das obras
    const obrasRes = await fetch(API + "/obras");

    if (!obrasRes.ok) {
      throw new Error('Erro ao buscar /obras: ' + obrasRes.status);
    }

    const obras = await obrasRes.json();

    // Total de obras
    document.getElementById("totalObras").textContent = Array.isArray(obras) ? obras.length : 0;

    // Total de feedbacks
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
    // Mostra mensagem de erro amigável
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

  // Ordena por data mais recente ou por valor
  const ordenadas = obras.slice().sort((a, b) => {
    // Tenta ordenar por data primeiro
    const da = a.dataInicio ? new Date(a.dataInicio).getTime() : 0;
    const db = b.dataInicio ? new Date(b.dataInicio).getTime() : 0;
    if (db !== da) return db - da;
    
    // Se não tiver data, ordena por valor
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
      // Se estiver na main page, pode redirecionar para detalhes
      // Se estiver na home, redireciona para a main page
      if (window.location.pathname.includes('main.html')) {
        // Aqui você precisaria implementar a visualização de detalhes
        alert(`Detalhes da obra: ${titulo}\nImplemente a visualização de detalhes aqui.`);
      } else {
        window.location.href = `main.html`;
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

// Carrega tudo quando a página é aberta
document.addEventListener('DOMContentLoaded', carregarDados);