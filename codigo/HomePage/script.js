// ==================== SCRIPT PRINCIPAL - OBRA PRIMA ====================
// Integrado com Bootstrap, API e funcionalidades avançadas

// Utilitários
const utils = {
  showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('d-none');
  },
  
  hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('d-none');
  },
  
  showToast(message, type = 'info') {
    const toastEl = document.getElementById('toastNotification');
    const toastBody = document.getElementById('toastBody');
    if (toastEl && toastBody) {
      toastBody.textContent = message;
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  },
  
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  }
};

// Aguardar o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
  
  // ==================== CARREGAR DADOS DA API ====================
  async function carregarDados() {
    utils.showLoading();
    
    try {
      // Carregar obras
      const obrasResponse = await api.getObras();
      if (obrasResponse.success) {
        carregarCarrossel(obrasResponse.data);
        carregarCardsObras(obrasResponse.data);
      }
      
      // Carregar feedbacks
      const feedbacksResponse = await api.getFeedbacks();
      if (feedbacksResponse.success) {
        carregarFeedbacks(feedbacksResponse.data);
      }
      
      // Carregar estatísticas
      const statsResponse = await api.getEstatisticas();
      if (statsResponse.success) {
        atualizarEstatisticas(statsResponse.data);
        atualizarGraficos(statsResponse.data);
      }
      
      // Carregar notificações
      await atualizarNotificacoes();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      utils.showToast('Erro ao carregar dados. Tente novamente.', 'error');
    } finally {
      utils.hideLoading();
    }
  }

  // ==================== CARROSSEL DE OBRAS ====================
  function carregarCarrossel(obras) {
    const carousel = document.getElementById("obrasCarousel");
    if (carousel && obras) {
      carousel.innerHTML = '';
      obras.forEach(o => {
        const item = document.createElement('div');
        item.className = 'card carousel-item';
        item.style.minWidth = '230px';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <img src="${o.img}" alt="${o.nome}" class="card-img-top" style="height: auto; max-height: 250px; object-fit: contain; background: #f0f0f0;" />
          <div class="card-body">
            <h5 class="card-title">${o.nome}</h5>
            <p class="card-text text-muted mb-0">${o.status} - ${o.progresso}%</p>
          </div>
        `;
        item.addEventListener('click', () => mostrarDetalhesObra(o));
        carousel.appendChild(item);
      });
    }
  }

  // ==================== CARDS DE OBRAS ====================
  function carregarCardsObras(obras) {
    const cardsContainer = document.getElementById('obrasDestaque');
    if (cardsContainer && obras) {
      cardsContainer.innerHTML = '';
      obras.slice(0, 3).forEach(obra => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
          <div class="card card-obra h-100">
            <img src="${obra.img}" class="card-img-top" alt="${obra.nome}" />
            <div class="card-body">
              <h5 class="card-title">${obra.nome}</h5>
              <p class="card-text">Status: ${obra.status}</p>
              <small class="text-muted">Progresso: ${obra.progresso}%</small>
            </div>
          </div>
        `;
        const card = col.querySelector('.card');
        card.addEventListener('click', () => mostrarDetalhesObra(obra));
        cardsContainer.appendChild(col);
      });
    }
  }

  // ==================== DETALHES DA OBRA ====================
  function mostrarDetalhesObra(obra) {
    const mensagem = `
      <strong>${obra.nome}</strong><br>
      Status: ${obra.status}<br>
      Progresso: ${obra.progresso}%<br>
      Bairro: ${obra.bairro}<br>
      Tipo: ${obra.tipo}<br>
      Custo: ${utils.formatCurrency(obra.custo)}
    `;
    utils.showToast(mensagem, 'info');
  }

  // ==================== FEEDBACKS ====================
  function carregarFeedbacks(feedbacks) {
    const feedbackFeed = document.getElementById("feedbackFeed");
    if (feedbackFeed && feedbacks) {
      feedbackFeed.innerHTML = '';
      feedbacks.forEach((f, index) => {
        const div = document.createElement('article');
        div.className = 'card mb-2 feedback-card';
        div.setAttribute('role', 'article');
        div.setAttribute('aria-labelledby', `feedback-${index}`);
        div.innerHTML = `
          <div class="card-body">
            <div class="d-flex align-items-start">
              <i class="fas fa-comment-alt me-2 text-success" aria-hidden="true"></i>
              <div class="flex-grow-1">
                <p id="feedback-${index}" class="mb-1">${f.texto}</p>
                <small class="text-muted">
                  <span class="sr-only">Autor: </span>${f.autor} - 
                  <span class="sr-only">Data: </span>${new Date(f.data).toLocaleDateString('pt-BR')}
                </small>
              </div>
            </div>
          </div>
        `;
        feedbackFeed.appendChild(div);
      });
      
      // Anunciar para screen readers
      const announcement = document.createElement('div');
      announcement.className = 'sr-only';
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = `${feedbacks.length} feedbacks carregados`;
      feedbackFeed.appendChild(announcement);
    }
  }

  // ==================== ESTATÍSTICAS ====================
  function atualizarEstatisticas(stats) {
    const cards = document.querySelectorAll('.mini-card .valor');
    if (cards && stats) {
      const valores = [
        stats.obrasAtivas,
        stats.obrasConcluidas,
        stats.obrasAtrasadas,
        stats.satisfacaoMedia + ' ★',
        stats.equipesAtivas,
        'R$ ' + (stats.custosMes / 1000) + 'k',
        stats.materiaisFalta
      ];
      
      cards.forEach((card, index) => {
        if (valores[index]) {
          card.textContent = valores[index];
        }
      });
    }
  }

  // ==================== GRÁFICOS ====================
  function atualizarGraficos(stats) {
    // Gráfico de Indicadores (Obras)
    const graficoObrasCanvas = document.getElementById("graficoObras");
    if (graficoObrasCanvas) {
      const chart = new Chart(graficoObrasCanvas, {
        type: "bar",
        data: {
          labels: ["Andamento", "Concluídas", "Atrasadas"],
          datasets: [{ 
            label: "Quantidade de Obras", 
            data: [stats.obrasAtivas, stats.obrasConcluidas, stats.obrasAtrasadas],
            backgroundColor: ["#27ae60", "#2ecc71", "#e74c3c"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.parsed.y + ' obras';
                }
              }
            }
          },
          accessibility: {
            enabled: true
          }
        }
      });
      
      // Atualizar descrição para screen readers
      const desc = document.getElementById('graficoObras-desc');
      if (desc) {
        desc.textContent = `Gráfico de barras: ${stats.obrasAtivas} obras em andamento, ${stats.obrasConcluidas} concluídas, ${stats.obrasAtrasadas} atrasadas`;
      }
    }

    // Gráfico de Progresso
    const graficoProgressoCanvas = document.getElementById("graficoProgresso");
    if (graficoProgressoCanvas) {
      const chart = new Chart(graficoProgressoCanvas, {
        type: "line",
        data: {
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          datasets: [{
            label: "Progresso (%)",
            data: [65, 70, 75, 80, 85, 90],
            borderColor: "#27ae60",
            backgroundColor: "rgba(39, 174, 96, 0.1)",
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { 
            legend: { display: true },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  return 'Progresso: ' + context.parsed.y + '%';
                }
              }
            }
          },
          scales: { y: { beginAtZero: true, max: 100 } },
          accessibility: {
            enabled: true
          }
        }
      });
      
      // Atualizar descrição para screen readers
      const desc = document.getElementById('graficoProgresso-desc');
      if (desc) {
        desc.textContent = 'Gráfico de linha mostrando progresso das obras: Janeiro 65%, Fevereiro 70%, Março 75%, Abril 80%, Maio 85%, Junho 90%';
      }
    }

    // Gráfico de Custos
    const graficoCustosCanvas = document.getElementById("graficoCustos");
    if (graficoCustosCanvas) {
      const chart = new Chart(graficoCustosCanvas, {
        type: "bar",
        data: {
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          datasets: [{
            label: "Custos (R$)",
            data: [150000, 165000, 180000, 175000, 190000, 187000],
            backgroundColor: "#27ae60"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  return 'Custos: R$ ' + context.parsed.y.toLocaleString('pt-BR');
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'R$ ' + (value / 1000) + 'k';
                }
              }
            }
          },
          accessibility: {
            enabled: true
          }
        }
      });
      
      // Atualizar descrição para screen readers
      const desc = document.getElementById('graficoCustos-desc');
      if (desc) {
        desc.textContent = 'Gráfico de barras mostrando custos mensais: Janeiro R$ 150.000, Fevereiro R$ 165.000, Março R$ 180.000, Abril R$ 175.000, Maio R$ 190.000, Junho R$ 187.000';
      }
    }
  }

  // ==================== NOTIFICAÇÕES ====================
  async function atualizarNotificacoes() {
    try {
      const response = await api.getNotificacoes();
      if (response.success) {
        const bellButton = document.querySelector('.bell');
        if (bellButton && response.naoLidas > 0) {
          // Adicionar badge de notificações não lidas
          let badge = bellButton.querySelector('.badge');
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
            badge.style.fontSize = '0.7rem';
            bellButton.style.position = 'relative';
            bellButton.appendChild(badge);
          }
          badge.textContent = response.naoLidas;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  async function carregarNotificacoesModal() {
    try {
      const response = await api.getNotificacoes();
      if (response.success) {
        const lista = document.getElementById('notificacoesLista');
        if (lista) {
          lista.innerHTML = '';
          if (response.data.length === 0) {
            lista.innerHTML = '<p class="text-muted text-center">Nenhuma notificação</p>';
          } else {
            response.data.forEach(notif => {
              const div = document.createElement('div');
              div.className = `alert ${notif.lida ? 'alert-light' : 'alert-info'} mb-2`;
              div.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">${notif.titulo}</h6>
                    <p class="mb-0">${notif.mensagem}</p>
                  </div>
                  ${!notif.lida ? '<span class="badge bg-primary">Nova</span>' : ''}
                </div>
              `;
              div.style.cursor = 'pointer';
              div.addEventListener('click', async () => {
                if (!notif.lida) {
                  await api.marcarNotificacaoLida(notif.id);
                  div.classList.remove('alert-info');
                  div.classList.add('alert-light');
                  div.querySelector('.badge')?.remove();
                  await atualizarNotificacoes();
                }
              });
              lista.appendChild(div);
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  const bellButton = document.querySelector('.bell');
  if (bellButton) {
    bellButton.addEventListener('click', function() {
      carregarNotificacoesModal();
      const modal = new bootstrap.Modal(document.getElementById('notificacoesModal'));
      modal.show();
    });
  }

  // ==================== AUTENTICAÇÃO ====================
  const loginBtn = document.querySelector('.login-btn');
  const cadastroBtn = document.querySelector('.cadastro-btn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('loginModal'));
      modal.show();
    });
  }

  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', async function() {
      const email = document.getElementById('loginEmail').value;
      const senha = document.getElementById('loginSenha').value;
      
      if (!email || !senha) {
        utils.showToast('Preencha todos os campos', 'error');
        return;
      }
      
      utils.showLoading();
      try {
        const response = await api.login(email, senha);
        if (response.success) {
          utils.showToast('Login realizado com sucesso!', 'success');
          const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
          modal.hide();
          // Salvar token no localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        } else {
          utils.showToast(response.message || 'Erro ao fazer login', 'error');
        }
      } catch (error) {
        utils.showToast('Erro ao fazer login', 'error');
      } finally {
        utils.hideLoading();
      }
    });
  }
  
  if (cadastroBtn) {
    cadastroBtn.addEventListener('click', function() {
      const modal = new bootstrap.Modal(document.getElementById('cadastroModal'));
      modal.show();
    });
  }

  const btnCadastroSubmit = document.getElementById('btnCadastroSubmit');
  if (btnCadastroSubmit) {
    btnCadastroSubmit.addEventListener('click', async function() {
      const nome = document.getElementById('cadastroNome').value;
      const email = document.getElementById('cadastroEmail').value;
      const senha = document.getElementById('cadastroSenha').value;
      const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;
      
      if (!nome || !email || !senha || !confirmarSenha) {
        utils.showToast('Preencha todos os campos', 'error');
        return;
      }
      
      if (senha !== confirmarSenha) {
        utils.showToast('As senhas não coincidem', 'error');
        return;
      }
      
      utils.showLoading();
      try {
        const response = await api.cadastro({ nome, email, senha });
        if (response.success) {
          utils.showToast('Cadastro realizado com sucesso!', 'success');
          const modal = bootstrap.Modal.getInstance(document.getElementById('cadastroModal'));
          modal.hide();
        } else {
          utils.showToast(response.message || 'Erro ao cadastrar', 'error');
        }
      } catch (error) {
        utils.showToast('Erro ao cadastrar', 'error');
      } finally {
        utils.hideLoading();
      }
    });
  }

  // ==================== NAVEGAÇÃO ====================
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      utils.showToast(`Navegando para: ${this.textContent.trim()}`, 'info');
    });
  });

  // ==================== BUSCA ====================
  const buscaForm = document.getElementById('formBusca');
  const buscaInput = document.getElementById('buscaBairro');
  const buscaSelect = document.getElementById('buscaTipo');
  const buscaButton = document.getElementById('btnBuscar');
  
  async function executarBusca() {
    const bairro = buscaInput.value.trim();
    const tipoObra = buscaSelect.value;
    
    if (bairro || tipoObra) {
      utils.showLoading();
      try {
        const response = await api.getObras({ bairro, tipo: tipoObra });
        if (response.success) {
          carregarCarrossel(response.data);
          carregarCardsObras(response.data);
          const mensagem = `${response.data.length} obra(s) encontrada(s)`;
          utils.showToast(mensagem, 'success');
          
          // Anunciar para screen readers
          const announcement = document.createElement('div');
          announcement.className = 'sr-only';
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('aria-atomic', 'true');
          announcement.textContent = mensagem;
          document.body.appendChild(announcement);
          setTimeout(() => announcement.remove(), 1000);
        }
      } catch (error) {
        utils.showToast('Erro ao buscar obras', 'error');
      } finally {
        utils.hideLoading();
      }
    } else {
      utils.showToast('Preencha pelo menos um campo de busca', 'warning');
    }
  }
  
  if (buscaForm) {
    buscaForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      await executarBusca();
    });
  }
  
  if (buscaButton) {
    buscaButton.addEventListener('click', async function(e) {
      e.preventDefault();
      await executarBusca();
    });
  }

  // ==================== BOTÃO "VER TODAS AS OBRAS" ====================
  const verTodasBtn = document.getElementById('btnVerTodas');
  if (verTodasBtn) {
    verTodasBtn.addEventListener('click', async function() {
      utils.showLoading();
      try {
        const response = await api.getObras();
        if (response.success) {
          carregarCarrossel(response.data);
          carregarCardsObras(response.data);
          utils.showToast('Todas as obras carregadas', 'success');
        }
      } catch (error) {
        utils.showToast('Erro ao carregar obras', 'error');
      } finally {
        utils.hideLoading();
      }
    });
  }

  // ==================== MINI CARDS (MÉTRICAS) ====================
  const miniCards = document.querySelectorAll('.mini-card');
  miniCards.forEach(card => {
    card.addEventListener('click', function() {
      const titulo = this.querySelector('h6').textContent;
      const valor = this.querySelector('.valor').textContent;
      utils.showToast(`${titulo}: ${valor}`, 'info');
    });
  });

  // ==================== INICIALIZAÇÃO ====================
  carregarDados();
  atualizarNotificacoes();
  
  console.log('✅ Todas as funcionalidades foram inicializadas!');
});
