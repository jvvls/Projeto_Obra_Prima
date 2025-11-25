// script.js
// ========================
// ESTADO
// ========================
let obras = [];
let obraSelecionada = null;
let editIndex = null;
const API_URL = 'http://localhost:3000'; // URL do JSON Server

const $ = (selector) => document.querySelector(selector);

// ========================
// CARREGAR DADOS
// ========================
async function carregarObras() {
  try {
    const response = await fetch(`${API_URL}/obras`);
    obras = await response.json();
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
    obras = [];
  }
  popularSelectObras();
}

// Popula select de obras, preservando a seleção atual
function popularSelectObras() {
  const select = $("#selecionarObra");
  if (!select) return;

  const valorAtual = select.value || ""; // salva seleção atual (pode ser "")
  select.innerHTML = '<option value="">Selecione uma obra...</option>';

  obras.forEach(obra => {
    const option = document.createElement("option");
    option.value = obra.id;
    option.textContent = `${obra.titulo || 'Sem título'} (${obra.status || '—'})`;
    select.appendChild(option);
  });

  // reaplica valor anterior - se não existir mais, deixa vazio
  if (valorAtual) {
    select.value = valorAtual;
    // atualiza obraSelecionada localmente se necessário
    if (select.value) {
      // procura obra no array
      const encontrada = obras.find(o => String(o.id) === String(select.value));
      if (encontrada) {
        obraSelecionada = encontrada;
        atualizarViewObraSelecionada(false); // false = não forçar fetch
      } else {
        // obra removida/indisponível
        obraSelecionada = null;
        atualizarViewObraSelecionada(false);
      }
    }
  }
}

// ========================
// SELECIONAR OBRA
// ========================
async function selecionarObra(obraId) {
  // Se obraId vazio, limpa seleção
  if (!obraId) {
    obraSelecionada = null;
    atualizarViewObraSelecionada(false);
    return;
  }

  try {
    // tentar buscar obra atualizada do servidor (caso precise dados completos)
    const response = await fetch(`${API_URL}/obras/${obraId}`);
    if (!response.ok) throw new Error('Obra não encontrada no servidor');
    obraSelecionada = await response.json();
    atualizarViewObraSelecionada(false);
  } catch (error) {
    console.error('Erro ao carregar obra:', error);
    // fallback: tenta usar obra já carregada em `obras`
    const local = obras.find(o => String(o.id) === String(obraId));
    if (local) {
      obraSelecionada = local;
      atualizarViewObraSelecionada(false);
    } else {
      obraSelecionada = null;
      atualizarViewObraSelecionada(false);
    }
  }
}

// Atualiza título, info e timeline com base em obraSelecionada
function atualizarViewObraSelecionada(forceCarregarMarcos = false) {
  if (obraSelecionada) {
    $("#obraTitulo").textContent = obraSelecionada.titulo || "Progresso da Obra";
    const obraInfo = $("#obraInfo");
    obraInfo.innerHTML = `
      <div><strong>Descrição:</strong> ${escapeHtml(obraSelecionada.descricao || '-')}</div>
      <div><strong>Status:</strong> ${escapeHtml(obraSelecionada.status || '-')}</div>
      <div><strong>Valor:</strong> R$ ${formatarMoeda(obraSelecionada.valorContratado || 0)}</div>
      <div><strong>Data Início:</strong> ${formatarData(obraSelecionada.dataInicio)}</div>
      <div><strong>Previsão Término:</strong> ${formatarData(obraSelecionada.previsaoTermino)}</div>
    `;
  } else {
    $("#obraTitulo").textContent = "Progresso da Obra";
    $("#obraInfo").innerHTML = "";
  }
  renderTimeline();
}

// ========================
// RENDER TIMELINE
// ========================
function renderTimeline() {
  const timelineList = $("#timelineList");
  const emptyState = $("#emptyState");
  if (!timelineList) return;

  timelineList.innerHTML = "";

  if (!obraSelecionada || !Array.isArray(obraSelecionada.marcos) || obraSelecionada.marcos.length === 0) {
    if (emptyState) {
      emptyState.style.display = "flex";
      emptyState.innerHTML = `
        <div class="empty-icon">🕒</div>
        ${obraSelecionada ? 'Nenhum marco adicionado ainda.' : 'Selecione uma obra para ver os marcos.'}
      `;
    }
    updateProgress();
    return;
  } else {
    if (emptyState) emptyState.style.display = "none";
  }

  // Ordenar marcos por data (mais recente primeiro)
  const marcosOrdenados = [...obraSelecionada.marcos].sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  marcosOrdenados.forEach((m) => {
    // para obter índice original na array da obra
    const originalIndex = obraSelecionada.marcos.indexOf(m);
    const div = document.createElement("div");
    div.className = "marco";
    div.setAttribute("data-porcentagem", m.percentual);
    div.innerHTML = `
      <div class="marco-info">
        <div class="marco-title">${escapeHtml(m.titulo || m.nome || '-')}</div>
        <div class="marco-desc">${escapeHtml(m.descricao || '')}</div>
        <div class="marco-meta">
          <span>Concluído: ${Number(m.percentual || 0).toFixed(0)}%</span>
          ${m.data ? `<span style="margin-left: 12px;">Data: ${formatarData(m.data)}</span>` : ''}
        </div>
      </div>
      <div class="marco-actions">
        <button type="button" class="btn btn-ghost btn-small" data-action="editar" data-index="${originalIndex}">Editar</button>
        <button type="button" class="btn btn-danger btn-small" data-action="excluir" data-index="${originalIndex}">Excluir</button>
      </div>
    `;
    timelineList.appendChild(div);
  });

  // Delegação de eventos para os botões de editar/excluir (mais seguro do que onclick inline)
  timelineList.querySelectorAll('[data-action="editar"]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault && e.preventDefault();
      const idx = Number(btn.getAttribute('data-index'));
      editarMarco(idx);
    };
  });
  timelineList.querySelectorAll('[data-action="excluir"]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault && e.preventDefault();
      const idx = Number(btn.getAttribute('data-index'));
      excluirMarco(idx);
    };
  });

  updateProgress();
}

// ========================
// ADICIONAR MARCO
// ========================
async function adicionarMarco() {
  if (!obraSelecionada) {
    alert("Selecione uma obra primeiro.");
    return;
  }

  const tituloEl = $("#marcoTitulo");
  const descricaoEl = $("#marcoDescricao");
  const porcentEl = $("#marcoPorcentagem");
  const dataEl = $("#marcoData");

  const titulo = (tituloEl?.value || "").trim();
  const descricao = (descricaoEl?.value || "").trim();
  const percentual = parseFloat(porcentEl?.value) || 0;
  const data = dataEl?.value || new Date().toISOString().split('T')[0];

  if (!titulo) {
    alert("O título é obrigatório.");
    if (tituloEl) tituloEl.focus();
    return;
  }
  if (percentual < 0 || percentual > 100) {
    alert("Porcentagem deve estar entre 0 e 100.");
    if (porcentEl) porcentEl.focus();
    return;
  }

  try {
    if (!Array.isArray(obraSelecionada.marcos)) obraSelecionada.marcos = [];

    const novoMarco = {
      titulo,
      descricao,
      percentual,
      data
    };

    // adiciona localmente
    obraSelecionada.marcos.push(novoMarco);
    renderTimeline();
    limparFormulario();

    // persiste no servidor (PUT)
    const res = await fetch(`${API_URL}/obras/${obraSelecionada.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obraSelecionada)
    });

    if (!res.ok) throw new Error('Erro ao salvar no servidor');

    // atualizar array global 'obras' para manter consistência
    const idxGlobal = obras.findIndex(o => String(o.id) === String(obraSelecionada.id));
    if (idxGlobal > -1) obras[idxGlobal] = { ...obraSelecionada };

  } catch (error) {
    console.error('Erro ao adicionar marco:', error);
    alert('Erro ao adicionar marco. A operação pode não ter sido salva no servidor.');
    // opcional: poderia fazer rollback se necessário
  }
}

// ========================
// LIMPAR FORM
// ========================
function limparFormulario() {
  if ($("#marcoTitulo")) $("#marcoTitulo").value = "";
  if ($("#marcoDescricao")) $("#marcoDescricao").value = "";
  if ($("#marcoPorcentagem")) $("#marcoPorcentagem").value = 0;
  if ($("#marcoData")) $("#marcoData").value = new Date().toISOString().split('T')[0];
}

// ========================
// EDIÇÃO
// ========================
function editarMarco(index) {
  if (!obraSelecionada || !Array.isArray(obraSelecionada.marcos)) return;
  editIndex = index;
  const m = obraSelecionada.marcos[index];
  if (!m) return;

  if ($("#editTitulo")) $("#editTitulo").value = m.titulo || m.nome || "";
  if ($("#editDescricao")) $("#editDescricao").value = m.descricao || "";
  if ($("#editPorcentagem")) $("#editPorcentagem").value = m.percentual || 0;
  if ($("#editData")) $("#editData").value = m.data || new Date().toISOString().split('T')[0];

  const modal = $("#modalEditar");
  if (modal) modal.style.display = "flex";
}

async function salvarEdicao() {
  if (editIndex === null || !obraSelecionada || !Array.isArray(obraSelecionada.marcos)) return;

  const titulo = ($("#editTitulo")?.value || "").trim();
  const descricao = ($("#editDescricao")?.value || "").trim();
  const percentual = parseFloat($("#editPorcentagem")?.value) || 0;
  const data = $("#editData")?.value || new Date().toISOString().split('T')[0];

  if (!titulo) {
    alert("O título é obrigatório.");
    return;
  }
  if (percentual < 0 || percentual > 100) {
    alert("Porcentagem deve estar entre 0 e 100.");
    return;
  }

  const snapshot = [...obraSelecionada.marcos];

  try {
    obraSelecionada.marcos[editIndex] = {
      titulo,
      descricao,
      percentual,
      data
    };

    renderTimeline();

    const res = await fetch(`${API_URL}/obras/${obraSelecionada.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obraSelecionada)
    });

    if (!res.ok) throw new Error('Erro ao salvar edição no servidor');

    // atualiza obra global
    const idxGlobal = obras.findIndex(o => String(o.id) === String(obraSelecionada.id));
    if (idxGlobal > -1) obras[idxGlobal] = { ...obraSelecionada };

    editIndex = null;
    const modal = $("#modalEditar");
    if (modal) modal.style.display = "none";
  } catch (error) {
    console.error('Erro ao salvar edição:', error);
    alert('Erro ao salvar edição. Alteração revertida.');
    // rollback
    obraSelecionada.marcos = snapshot;
    renderTimeline();
  }
}

function cancelarEdicao() {
  editIndex = null;
  const modal = $("#modalEditar");
  if (modal) modal.style.display = "none";
}

// ========================
// EXCLUSÃO
// ========================
async function excluirMarco(index) {
  if (!confirm("Deseja excluir este marco?")) return;
  if (!obraSelecionada || !Array.isArray(obraSelecionada.marcos)) return;

  const snapshot = [...obraSelecionada.marcos];

  // remoção imediata para UX responsiva
  obraSelecionada.marcos.splice(index, 1);
  renderTimeline();

  try {
    const res = await fetch(`${API_URL}/obras/${obraSelecionada.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obraSelecionada)
    });

    if (!res.ok) throw new Error('Erro ao excluir no servidor');

    // atualiza array global
    const idxGlobal = obras.findIndex(o => String(o.id) === String(obraSelecionada.id));
    if (idxGlobal > -1) obras[idxGlobal] = { ...obraSelecionada };
  } catch (error) {
    console.error('Erro ao excluir marco:', error);
    alert('Erro ao excluir marco no servidor. A alteração foi revertida.');
    // rollback
    obraSelecionada.marcos = snapshot;
    renderTimeline();
  }
}

// ========================
// PROGRESSO (média das porcentagens)
// ========================
function updateProgress() {
  const progressFill = $("#progressFill");
  const progressText = $("#progressText");
  if (!progressFill || !progressText) return;

  if (!obraSelecionada || !Array.isArray(obraSelecionada.marcos) || obraSelecionada.marcos.length === 0) {
    progressFill.style.width = "0%";
    progressText.textContent = "0%";
    return;
  }

  const soma = obraSelecionada.marcos.reduce((acc, m) => acc + (Number(m.percentual) || 0), 0);
  const media = soma / obraSelecionada.marcos.length;
  const limitada = Math.max(0, Math.min(100, media));
  progressFill.style.width = limitada + "%";
  progressText.textContent = limitada.toFixed(0) + "%";
}

// ========================
// UTILS
// ========================
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarData(dataString) {
  if (!dataString) return 'Não informada';
  const data = new Date(dataString);
  if (isNaN(data)) return dataString;
  return data.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

// ========================
// EVENTOS
// ========================
document.addEventListener("DOMContentLoaded", () => {
  // Selecionar obra
  const selectObra = $("#selecionarObra");
  if (selectObra) {
    selectObra.addEventListener("change", (e) => {
      e.preventDefault && e.preventDefault();
      const val = e.target.value;
      selecionarObra(val);
    });
  }

  // botões de adicionar/limpar
  const addBtn = $("#adicionarMarcoBtn");
  if (addBtn) addBtn.addEventListener("click", (e) => { e.preventDefault && e.preventDefault(); adicionarMarco(); });

  const limparBtn = $("#limparFormBtn");
  if (limparBtn) limparBtn.addEventListener("click", (e) => { e.preventDefault && e.preventDefault(); limparFormulario(); });

  // modal editar: salvar/cancelar/fechar
  const salvarBtn = $("#salvarEdicaoBtn");
  if (salvarBtn) salvarBtn.addEventListener("click", (e) => { e.preventDefault && e.preventDefault(); salvarEdicao(); });

  const cancelarBtn = $("#cancelarEdicaoBtn");
  if (cancelarBtn) cancelarBtn.addEventListener("click", (e) => { e.preventDefault && e.preventDefault(); cancelarEdicao(); });

  const modalClose = $("#modalClose");
  if (modalClose) modalClose.addEventListener("click", (e) => { e.preventDefault && e.preventDefault(); cancelarEdicao(); });

  // fechar modal com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = $("#modalEditar");
      if (modal && modal.style.display === "flex") modal.style.display = "none";
      editIndex = null;
    }
  });

  // Proteção extra: prevenir qualquer submit nativo de formulários, caso existam
  document.addEventListener('submit', (e) => {
    if (e && e.preventDefault) e.preventDefault();
  });

  // Valor padrão para campo data do formulário
  if ($("#marcoData")) $("#marcoData").value = new Date().toISOString().split('T')[0];
  if ($("#editData")) $("#editData").value = new Date().toISOString().split('T')[0];

  // Carregar obras ao iniciar
  carregarObras();
});
