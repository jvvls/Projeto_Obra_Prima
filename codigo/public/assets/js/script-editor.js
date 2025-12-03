let obras = [];
let obraSelecionada = null;      
let obraEditandoId = null;       
let editIndex = null;            
let timelineAtual = [];          

const API_URL = 'http://localhost:3000/obras'; 

const filtros = {
  q: "",
  status: "",
  cidade: "",
  orgaos: [],
  empresas: [],
  sortBy: "titulo"
};

const $ = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

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
  const d = new Date(dataString);
  if (isNaN(d)) return dataString;
  return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  try {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(Number(valor) || 0);
  } catch (e) {
    return String(valor || '0,00');
  }
}

function debounce(fn, wait = 200) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
}

// ========================
// API 
// ========================
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return res.json();
}

async function carregarObras() {
  try {
    const data = await fetchJson(API_URL);
    obras = Array.isArray(data) ? data : (data.obras || []);
  } catch (err) {
    console.error('Erro carregarObras:', err);
    obras = [];
    alert('Não foi possível carregar obras do servidor. Verifique se o JSON Server está rodando em ' + API_URL);
  }

  popularSelects();
  popularOrgaos();
  popularEmpresas();

  aplicarEAtualizar();
}

async function criarObraServer(obra) {
  return await fetchJson(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obra)
  });
}

async function atualizarObraServer(obra) {
  return await fetchJson(`${API_URL}/${obra.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obra)
  });
}

async function buscarObraPorId(id) {
  return await fetchJson(`${API_URL}/${id}`);
}

async function excluirObraServer(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir obra');
  return true;
}

// ========================
// INICIALIZAÇÃO & BIND UI
// ========================
document.addEventListener('DOMContentLoaded', () => {
  $("#obraForm")?.addEventListener('submit', (e) => { e.preventDefault(); salvarObra(); });
  $("#limpar")?.addEventListener('click', (e) => { e.preventDefault(); limparFormulario(); });

  $("#adicionarMarcoBtn")?.addEventListener('click', (e) => { e.preventDefault(); adicionarMarco(); });
  $("#limparMarcoBtn")?.addEventListener('click', (e) => { e.preventDefault(); limparFormularioMarco(); });

  $("#salvarEdicaoBtn")?.addEventListener('click', (e) => { e.preventDefault(); salvarEdicao(); });
  $("#cancelarEdicaoBtn")?.addEventListener('click', (e) => { e.preventDefault(); cancelarEdicao(); });
  $("#modalClose")?.addEventListener('click', (e) => { e.preventDefault(); cancelarEdicao(); });

  $("#q")?.addEventListener('input', debounce((e) => { filtros.q = e.target.value || ""; }, 300));
  $("#filterStatus")?.addEventListener('change', (e) => { filtros.status = e.target.value || ""; });
  $("#filterCidade")?.addEventListener('change', (e) => { filtros.cidade = e.target.value || ""; });
  $("#sortBy")?.addEventListener('change', (e) => { filtros.sortBy = e.target.value || "titulo"; });
  $("#aplicarFiltros")?.addEventListener('click', (e) => { e.preventDefault(); aplicarEAtualizar(); });
  $("#resetFiltros")?.addEventListener('click', (e) => { e.preventDefault(); resetFiltros(); });

  setupOrgaoDropdown();
  setupEmpresaDropdown();

  if ($("#marcoData")) $("#marcoData").value = new Date().toISOString().split('T')[0];
  if ($("#editData")) $("#editData").value = new Date().toISOString().split('T')[0];

  carregarObras();
});

// ========================
// FORMULÁRIO DE OBRA (
// ========================
function limparFormulario() {
  $("#obraForm")?.reset();
  obraSelecionada = null;
  obraEditandoId = null;
  timelineAtual = [];
  renderTimeline();
  atualizarViewObraSelecionada();
}

function coletarDadosDoFormulario() {
  const anexosFiles = Array.from($("#anexos")?.files || []);
  const anexos = anexosFiles.map(f => ({
    nomeArquivo: f.name,
    tipo: f.type.startsWith('image/') ? 'imagem' : 'documento',
    url: `uploads/${f.name}`
  }));

  const endereco = {
    logradouro: $("#logradouro")?.value || '',
    numero: $("#numero")?.value || '',
    bairro: $("#bairro")?.value || '',
    cidade: $("#cidade")?.value || '',
    estado: $("#estado")?.value || '',
    cep: $("#cep")?.value || ''
  };

  const id = obraEditandoId ?? (obraSelecionada ? obraSelecionada.id : undefined);

  return {
    id: id,
    titulo: $("#titulo")?.value.trim() || '',
    descricao: $("#descricao")?.value.trim() || '',
    valorContratado: parseFloat($("#valorContratado")?.value || 0) || 0,
    status: $("#status")?.value || 'Planejada',
    dataInicio: $("#dataInicio")?.value || '',
    previsaoTermino: $("#previsaoTermino")?.value || '',
    orgaoResponsavel: $("#orgaoResponsavel")?.value.trim() || '',
    empresaExecutora: $("#empresaExecutora")?.value.trim() || '',
    endereco,
    anexos,
    marcos: Array.isArray(timelineAtual) ? timelineAtual.slice() : []
  };
}

async function salvarObra() {
  const dados = coletarDadosDoFormulario();

  if (!dados.titulo) {
    alert('Título é obrigatório.');
    $("#titulo")?.focus();
    return;
  }

  try {
    const isEdicao = Boolean(dados.id);
    const url = isEdicao ? `${API_URL}/${dados.id}` : API_URL;
    const method = isEdicao ? 'PUT' : 'POST';

    console.log(`[salvarObra] Enviando ${method} para ${url}`);
    console.log('Dados:', dados);

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const erro = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${erro}`);
    }

    const obraSalva = await response.json();

    if (isEdicao) {
      const idx = obras.findIndex(o => String(o.id) === String(obraSalva.id));
      if (idx > -1) obras[idx] = obraSalva;
    } else {
      obras.push(obraSalva);
    }

    obraSelecionada = obraSalva;
    obraEditandoId = null;
    timelineAtual = Array.isArray(obraSalva.marcos) ? obraSalva.marcos.slice() : [];

    popularSelects();
    popularOrgaos();
    popularEmpresas();
    aplicarEAtualizar();
    atualizarViewObraSelecionada();

    alert('Obra salva com sucesso.');
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('[salvarObra] Erro:', err);
    alert('Erro ao salvar obra. Verifique o console para detalhes.');
  }
}

async function editarObra(id) {
  try {
    const o = await buscarObraPorId(id);
    $("#titulo").value = o.titulo || "";
    $("#descricao").value = o.descricao || "";
    $("#valorContratado").value = o.valorContratado || "";
    $("#status").value = o.status || "Planejada";
    $("#dataInicio").value = o.dataInicio || "";
    $("#previsaoTermino").value = o.previsaoTermino || "";
    $("#orgaoResponsavel").value = o.orgaoResponsavel || "";
    $("#empresaExecutora").value = o.empresaExecutora || "";
    $("#logradouro").value = o.endereco?.logradouro || "";
    $("#numero").value = o.endereco?.numero || "";
    $("#bairro").value = o.endereco?.bairro || "";
    $("#cidade").value = o.endereco?.cidade || "";
    $("#estado").value = o.endereco?.estado || "";
    $("#cep").value = o.endereco?.cep || "";

    obraSelecionada = JSON.parse(JSON.stringify(o)); 
    obraEditandoId = o.id;
    timelineAtual = Array.isArray(o.marcos) ? o.marcos.slice() : [];
    renderTimeline();
    atualizarViewObraSelecionada();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.info('[editarObra] editando id=', obraEditandoId);
  } catch (err) {
    console.error('Erro editarObra:', err);
    alert('Erro ao carregar obra para edição.');
  }
}

async function excluirObra(id) {
  if (!confirm('Deseja excluir esta obra?')) return;
  try {
    await excluirObraServer(id);
    obras = obras.filter(o => String(o.id) !== String(id));
    popularSelects();
    popularOrgaos();
    popularEmpresas();
    aplicarEAtualizar();
    if (obraSelecionada && String(obraSelecionada.id) === String(id)) limparFormulario();
  } catch (err) {
    console.error('Erro excluirObra:', err);
    alert('Erro ao excluir obra.');
  }
}

window.editarObra = editarObra;
window.excluirObra = excluirObra;

// ========================
// TIMELINE 
// ========================
function adicionarMarco() {
  const titulo = ($("#marcoTitulo")?.value || "").trim();
  const descricao = ($("#marcoDescricao")?.value || "").trim();
  const percentual = parseFloat($("#marcoPorcentagem")?.value || 0) || 0;
  const data = $("#marcoData")?.value || new Date().toISOString().split('T')[0];

  if (!titulo) { alert('Título do marco é obrigatório.'); $("#marcoTitulo")?.focus(); return; }
  if (percentual < 0 || percentual > 100) { alert('Porcentagem deve estar entre 0 e 100.'); return; }

  const novo = {
    id: String(Date.now()) + '-' + Math.floor(Math.random() * 10000),
    titulo, descricao, percentual, data
  };

  timelineAtual.push(novo);
  limparFormularioMarco();
  renderTimeline();
}

function limparFormularioMarco() {
  if ($("#marcoTitulo")) $("#marcoTitulo").value = '';
  if ($("#marcoDescricao")) $("#marcoDescricao").value = '';
  if ($("#marcoPorcentagem")) $("#marcoPorcentagem").value = 0;
  if ($("#marcoData")) $("#marcoData").value = new Date().toISOString().split('T')[0];
}

function renderTimeline() {
  const list = $("#timelineList");
  const empty = $("#emptyState");
  if (!list) return;
  list.innerHTML = '';

  if (!Array.isArray(timelineAtual) || timelineAtual.length === 0) {
    if (empty) empty.style.display = 'flex';
    updateProgress();
    return;
  } else {
    if (empty) empty.style.display = 'none';
  }

  const ordenados = [...timelineAtual].sort((a,b) => new Date(b.data||0) - new Date(a.data||0));
  ordenados.forEach((m) => {
    const originalIndex = timelineAtual.findIndex(x => x.id === m.id);
    const div = document.createElement('div');
    div.className = 'marco';
    div.innerHTML = `
      <div class="marco-info">
        <div class="marco-title">${escapeHtml(m.titulo || '-')}</div>
        <div class="marco-desc">${escapeHtml(m.descricao || '')}</div>
        <div class="marco-meta">
          <span>Concluído: ${Number(m.percentual || 0).toFixed(0)}%</span>
          ${m.data ? `<span style="margin-left:12px">Data: ${formatarData(m.data)}</span>` : ''}
        </div>
      </div>
      <div class="marco-actions">
        <button type="button" class="btn btn-ghost btn-small" data-action="editar" data-index="${originalIndex}">Editar</button>
        <button type="button" class="btn btn-danger btn-small" data-action="excluir" data-index="${originalIndex}">Excluir</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('[data-action="editar"]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const idx = Number(btn.getAttribute('data-index'));
      abrirModalEdicao(idx);
    };
  });
  list.querySelectorAll('[data-action="excluir"]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const idx = Number(btn.getAttribute('data-index'));
      excluirMarco(idx);
    };
  });

  updateProgress();
}

function abrirModalEdicao(index) {
  if (!Array.isArray(timelineAtual) || index < 0 || index >= timelineAtual.length) return;
  editIndex = index;
  const m = timelineAtual[index];
  $("#editTitulo").value = m.titulo || '';
  $("#editDescricao").value = m.descricao || '';
  $("#editPorcentagem").value = m.percentual || 0;
  $("#editData").value = m.data || new Date().toISOString().split('T')[0];
  $("#modalEditar").style.display = 'flex';
}

function salvarEdicao() {
  if (editIndex === null || !Array.isArray(timelineAtual)) return;
  const titulo = ($("#editTitulo")?.value || "").trim();
  const descricao = ($("#editDescricao")?.value || "").trim();
  const percentual = parseFloat($("#editPorcentagem")?.value || 0) || 0;
  const data = ($("#editData")?.value || new Date().toISOString().split('T')[0]);

  if (!titulo) { alert('Título é obrigatório.'); return; }
  if (percentual < 0 || percentual > 100) { alert('Porcentagem deve estar entre 0 e 100.'); return; }

  timelineAtual[editIndex] = { ...timelineAtual[editIndex], titulo, descricao, percentual, data };

  if (obraSelecionada && obraSelecionada.id) {
    obraSelecionada.marcos = timelineAtual.slice();
    atualizarObraServer(obraSelecionada).then(atualizada => {
      const idx = obras.findIndex(o => String(o.id) === String(atualizada.id));
      if (idx > -1) obras[idx] = atualizada;
      obraSelecionada = atualizada;
      timelineAtual = Array.isArray(atualizada.marcos) ? atualizada.marcos.slice() : [];
      renderTimeline();
      aplicarEAtualizar();
      $("#modalEditar").style.display = 'none';
      editIndex = null;
    }).catch(err => {
      console.error('Erro salvarEdicao:', err);
      alert('Erro ao salvar edição no servidor.');
    });
  } else {
    renderTimeline();
    $("#modalEditar").style.display = 'none';
    editIndex = null;
  }
}

function cancelarEdicao() {
  editIndex = null;
  $("#modalEditar").style.display = 'none';
}

function excluirMarco(index) {
  if (!Array.isArray(timelineAtual) || index < 0 || index >= timelineAtual.length) return;
  if (!confirm('Deseja excluir este marco?')) return;
  const snapshot = timelineAtual.slice();
  timelineAtual.splice(index, 1);
  renderTimeline();

  if (obraSelecionada && obraSelecionada.id) {
    obraSelecionada.marcos = timelineAtual.slice();
    atualizarObraServer(obraSelecionada).then(atualizada => {
      const idx = obras.findIndex(o => String(o.id) === String(atualizada.id));
      if (idx > -1) obras[idx] = atualizada;
      obraSelecionada = atualizada;
      timelineAtual = Array.isArray(atualizada.marcos) ? atualizada.marcos.slice() : [];
      aplicarEAtualizar();
    }).catch(err => {
      console.error('Erro excluirMarco:', err);
      alert('Erro ao excluir marco no servidor. Revertendo.');
      timelineAtual = snapshot;
      renderTimeline();
    });
  }
}

// ========================
// PROGRESSO
// ========================
function updateProgress() {
  const fill = $("#progressFill");
  const text = $("#progressText");
  if (!fill || !text) return;
  if (!Array.isArray(timelineAtual) || timelineAtual.length === 0) {
    fill.style.width = '0%'; text.textContent = '0%'; return;
  }
  const soma = timelineAtual.reduce((acc, m) => acc + (Number(m.percentual) || 0), 0);
  const media = soma / timelineAtual.length;
  const limitada = Math.max(0, Math.min(100, media));
  fill.style.width = limitada + '%';
  text.textContent = limitada.toFixed(0) + '%';
}

// ========================
// FILTROS: popular & comportamento
// ========================
function popularSelects() {
  const statusSet = new Set();
  const cidadeSet = new Set();

  obras.forEach(o => {
    if (o.status) statusSet.add(o.status);
    if (o.endereco && o.endereco.cidade) cidadeSet.add(o.endereco.cidade);
  });

  const statusSel = $("#filterStatus");
  const cidadeSel = $("#filterCidade");

  if (statusSel) {
    const cur = statusSel.value || '';
    statusSel.innerHTML = '<option value="">Todos</option>';
    Array.from(statusSet).sort().forEach(s => {
      const opt = document.createElement('option'); opt.value = s; opt.textContent = s; statusSel.appendChild(opt);
    });
    if (cur) statusSel.value = cur;
  }

  if (cidadeSel) {
    const cur = cidadeSel.value || '';
    cidadeSel.innerHTML = '<option value="">Todas</option>';
    Array.from(cidadeSet).sort().forEach(c => {
      const opt = document.createElement('option'); opt.value = c; opt.textContent = c; cidadeSel.appendChild(opt);
    });
    if (cur) cidadeSel.value = cur;
  }
}

function popularOrgaos() {
  const set = new Set();
  obras.forEach(o => { if (o.orgaoResponsavel) set.add(o.orgaoResponsavel); });
  const list = $("#orgaoList");
  const search = $("#orgaoSearch");
  if (!list) return;
  list.innerHTML = '';
  Array.from(set).sort().forEach(nome => {
    const id = `orgao_${slugify(nome)}`;
    const wrapper = document.createElement('label');
    wrapper.className = 'orgao-item';
    wrapper.setAttribute('data-nome', nome);
    wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${escapeHtml(nome)}"/><span>${escapeHtml(nome)}</span>`;
    list.appendChild(wrapper);
    const cb = wrapper.querySelector('input');
    cb.addEventListener('change', () => { atualizarOrgaosSelecionados(); });
    wrapper.addEventListener('click', (ev) => {
      if (ev.target.tagName.toLowerCase() === 'input') return;
      cb.checked = !cb.checked;
      atualizarOrgaosSelecionados();
    });
  });

  if (search) {
    search.value = '';
    search.addEventListener('input', debounce(() => {
      const q = (search.value || '').toLowerCase();
      list.querySelectorAll('.orgao-item').forEach(item => {
        const nome = item.getAttribute('data-nome') || '';
        item.style.display = nome.toLowerCase().includes(q) ? '' : 'none';
      });
    }, 200));
  }

  $("#orgaoSelecionarTudo")?.addEventListener('click', (e) => { e.preventDefault(); list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true); atualizarOrgaosSelecionados(); });
  $("#orgaoLimpar")?.addEventListener('click', (e) => { e.preventDefault(); list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false); atualizarOrgaosSelecionados(); });

  atualizarOrgaoToggle();
}

function atualizarOrgaosSelecionados() {
  filtros.orgaos = Array.from(document.querySelectorAll("#orgaoList input[type=checkbox]:checked")).map(i => i.value);
  atualizarOrgaoToggle();
}

function atualizarOrgaoToggle() {
  const toggle = $("#orgaoToggle");
  const total = document.querySelectorAll("#orgaoList input[type=checkbox]").length;
  const selected = document.querySelectorAll("#orgaoList input[type=checkbox]:checked").length;
  if (!toggle) return;
  if (selected === 0) toggle.innerHTML = `Todos os órgãos <span class="arrow">&#9662;</span>`;
  else if (selected === total && total > 0) toggle.innerHTML = `Todos selecionados (${selected}) <span class="arrow">&#9662;</span>`;
  else toggle.innerHTML = `${selected} selecionado${selected > 1 ? 's' : ''} <span class="arrow">&#9662;</span>`;
}

function popularEmpresas() {
  const set = new Set();
  obras.forEach(o => { if (o.empresaExecutora) set.add(o.empresaExecutora); });
  const list = $("#empresaList");
  const search = $("#empresaSearch");
  if (!list) return;
  list.innerHTML = '';
  Array.from(set).sort().forEach(nome => {
    const id = `empresa_${slugify(nome)}`;
    const wrapper = document.createElement('label');
    wrapper.className = 'empresa-item';
    wrapper.setAttribute('data-nome', nome);
    wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${escapeHtml(nome)}"/><span>${escapeHtml(nome)}</span>`;
    list.appendChild(wrapper);
    const cb = wrapper.querySelector('input');
    cb.addEventListener('change', () => { atualizarEmpresasSelecionadas(); });
    wrapper.addEventListener('click', (ev) => {
      if (ev.target.tagName.toLowerCase() === 'input') return;
      cb.checked = !cb.checked;
      atualizarEmpresasSelecionadas();
    });
  });

  if (search) {
    search.value = '';
    search.addEventListener('input', debounce(() => {
      const q = (search.value || '').toLowerCase();
      list.querySelectorAll('.empresa-item').forEach(item => {
        const nome = item.getAttribute('data-nome') || '';
        item.style.display = nome.toLowerCase().includes(q) ? '' : 'none';
      });
    }, 200));
  }

  $("#empresaSelecionarTudo")?.addEventListener('click', (e) => { e.preventDefault(); list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true); atualizarEmpresasSelecionadas(); });
  $("#empresaLimpar")?.addEventListener('click', (e) => { e.preventDefault(); list.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false); atualizarEmpresasSelecionadas(); });

  atualizarEmpresaToggle();
}

function atualizarEmpresasSelecionadas() {
  filtros.empresas = Array.from(document.querySelectorAll("#empresaList input[type=checkbox]:checked")).map(i => i.value);
  atualizarEmpresaToggle();
}

function atualizarEmpresaToggle() {
  const toggle = $("#empresaToggle");
  const total = document.querySelectorAll("#empresaList input").length;
  const selected = document.querySelectorAll("#empresaList input:checked").length;
  if (!toggle) return;
  if (selected === 0) toggle.innerHTML = `Todas as empresas <span class="arrow">&#9662;</span>`;
  else if (selected === total && total > 0) toggle.innerHTML = `Todas selecionadas (${selected}) <span class="arrow">&#9662;</span>`;
  else toggle.innerHTML = `${selected} selecionada${selected > 1 ? 's' : ''} <span class="arrow">&#9662;</span>`;
}

// ========================
// DROPDOWN behavior 
// ========================
function setupOrgaoDropdown() {
  const toggle = $("#orgaoToggle");
  const panel = $("#orgaoPanel");
  const container = $("#orgaoDropdown");
  if (!toggle || !panel || !container) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display === 'block';
    closeAllDropdowns();
    if (isOpen) {
      panel.style.display = 'none';
      toggle.classList.remove('active');
      container.setAttribute('aria-expanded','false');
    } else {
      panel.style.display = 'block';
      toggle.classList.add('active');
      container.setAttribute('aria-expanded','true');
      positionPanel(toggle, panel, container);
      $("#orgaoSearch")?.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      panel.style.display = 'none';
      toggle.classList.remove('active');
      container.setAttribute('aria-expanded','false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!container.contains(document.activeElement) && panel.style.display !== 'block') return;
    if (e.key === 'Escape') {
      panel.style.display = 'none';
      toggle.classList.remove('active');
      toggle.focus();
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const visible = Array.from(panel.querySelectorAll(".orgao-item")).filter(it => it.style.display !== 'none');
      if (visible.length === 0) return;
      const current = visible.findIndex(it => it.classList.contains('focused'));
      let next = 0;
      if (e.key === 'ArrowDown') next = current < visible.length-1 ? current+1 : 0;
      if (e.key === 'ArrowUp') next = current > 0 ? current-1 : visible.length-1;
      visible.forEach(it => it.classList.remove('focused'));
      visible[next].classList.add('focused');
      const cb = visible[next].querySelector('input');
      if (cb) cb.focus();
    }
    if (e.key === 'Enter') {
      const focused = panel.querySelector('.orgao-item.focused');
      if (focused) {
        const cb = focused.querySelector('input');
        if (cb) { cb.checked = !cb.checked; atualizarOrgaosSelecionados(); }
      }
    }
  });
}

function setupEmpresaDropdown() {
  const toggle = $("#empresaToggle");
  const panel = $("#empresaPanel");
  const container = $("#empresaDropdown");
  if (!toggle || !panel || !container) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display === 'block';
    closeAllDropdowns();
    if (isOpen) {
      panel.style.display = 'none';
      toggle.classList.remove('active');
      container.setAttribute('aria-expanded','false');
    } else {
      panel.style.display = 'block';
      toggle.classList.add('active');
      container.setAttribute('aria-expanded','true');
      positionPanel(toggle, panel, container);
      $("#empresaSearch")?.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      panel.style.display = 'none';
      toggle.classList.remove('active');
      container.setAttribute('aria-expanded','false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      panel.style.display = 'none';
      toggle.classList.remove('active');
      toggle.focus();
    }
  });
}

function positionPanel(toggle, panel, container) {
  if (window.innerWidth <= 720) {
    panel.style.position = 'static';
    panel.style.top = '';
    panel.style.left = '';
  } else {
    panel.style.position = 'absolute';
    const rect = toggle.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    panel.style.top = (rect.bottom - parentRect.top + 6) + 'px';
    panel.style.left = (rect.left - parentRect.left) + 'px';
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-panel').forEach(p => { p.style.display = 'none'; p.style.top = ''; p.style.left = ''; p.classList.remove('show'); });
  document.querySelectorAll('.dropdown-button').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.orgao-item, .empresa-item').forEach(i => i.classList.remove('focused'));
}

// ========================
// FILTRAGEM E LISTAGEM
// ========================
function filtrarObras(list, f) {
  let result = Array.isArray(list) ? list.slice() : [];

  if (f.q && f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    result = result.filter(o => {
      const texto = [
        o.titulo, o.descricao, o.empresaExecutora,
        o.endereco?.cidade, o.endereco?.logradouro, o.orgaoResponsavel
      ].filter(Boolean).join(' ').toLowerCase();
      return texto.indexOf(q) !== -1;
    });
  }

  if (f.status) result = result.filter(o => String(o.status || '') === String(f.status));

  if (f.cidade) result = result.filter(o => (o.endereco?.cidade || '') === f.cidade);

  if (Array.isArray(f.orgaos) && f.orgaos.length > 0) {
    result = result.filter(o => o.orgaoResponsavel && f.orgaos.includes(o.orgaoResponsavel));
  }

  if (Array.isArray(f.empresas) && f.empresas.length > 0) {
    result = result.filter(o => o.empresaExecutora && f.empresas.includes(o.empresaExecutora));
  }

  if (f.sortBy === 'dataInicio') result.sort((a,b) => new Date(a.dataInicio||0) - new Date(b.dataInicio||0));
  else result.sort((a,b) => (String(a.titulo||'')).localeCompare(String(b.titulo||'')));

  return result;
}

function renderizarObras(lista) {
  const data = Array.isArray(lista) ? lista : obras;
  const container = $("#obrasContainer");
  const msgNenhuma = $("#msgNenhuma");
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    if (msgNenhuma) msgNenhuma.style.display = 'block';
    return;
  } else {
    if (msgNenhuma) msgNenhuma.style.display = 'none';
  }

  data.forEach(obra => {
    const e = obra.endereco || {};
    const progresso = (() => {
      const marcos = obra.marcos || [];
      if (!Array.isArray(marcos) || marcos.length === 0) return 0;
      const soma = marcos.reduce((acc, m) => acc + (Number(m.percentual) || 0), 0);
      return Math.max(0, Math.min(100, soma / marcos.length));
    })();

    const div = document.createElement('div');
    div.className = 'obra-card';
    div.innerHTML = `
  <div class="obra-header">
    <h3>${escapeHtml(obra.titulo || obra.nome || '-')}</h3>
    <span class="status ${(obra.status || '').toLowerCase().replace(/\s/g, '-')}">${escapeHtml(obra.status || '--')}</span>
  </div>
  <p class="descricao">${escapeHtml(obra.descricao || "-")}</p>
  <p><strong>Cidade:</strong> ${escapeHtml(e.cidade || '-')}</p>
  <p><strong>Valor contratado:</strong> R$ ${formatarMoeda(obra.valorContratado)}</p>
  <div class="obra-progresso">
    <div class="obra-progresso-label">Progresso da obra:</div>
    <div class="obra-progresso-barra">
      <div class="barra-interna" style="width:${progresso.toFixed(0)}%;"></div>
    </div>
    <div class="obra-progresso-texto">${progresso.toFixed(0)}%</div>
  </div>
`;

const editarBtn = document.createElement('button');
editarBtn.textContent = 'Editar';
editarBtn.className = 'btn btn-small btn-ghost';
editarBtn.addEventListener('click', () => editarObra(obra.id));

const excluirBtn = document.createElement('button');
excluirBtn.textContent = 'Excluir';
excluirBtn.className = 'btn btn-small btn-danger';
excluirBtn.addEventListener('click', () => excluirObra(obra.id));

const actionsDiv = document.createElement('div');
actionsDiv.className = 'obra-actions';
actionsDiv.style.marginTop = '12px';
actionsDiv.appendChild(editarBtn);
actionsDiv.appendChild(excluirBtn);

div.appendChild(actionsDiv);
container.appendChild(div);
    container.appendChild(div);
  });
}
function aplicarEAtualizar() {
  filtros.q = $("#q")?.value || filtros.q || "";
  const resultados = filtrarObras(obras, filtros);
  renderizarObras(resultados);
}

function aplicarFiltros() { aplicarEAtualizar(); }

function resetFiltros() {
  filtros.q = ""; filtros.status = ""; filtros.cidade = ""; filtros.orgaos = []; filtros.empresas = []; filtros.sortBy = "titulo";
  if ($("#q")) $("#q").value = '';
  if ($("#filterStatus")) $("#filterStatus").value = '';
  if ($("#filterCidade")) $("#filterCidade").value = '';
  if ($("#sortBy")) $("#sortBy").value = 'titulo';
  document.querySelectorAll("#orgaoList input[type=checkbox]").forEach(cb => cb.checked = false);
  document.querySelectorAll("#empresaList input[type=checkbox]").forEach(cb => cb.checked = false);
  atualizarOrgaoToggle();
  atualizarEmpresaToggle();
  aplicarEAtualizar();
}

window.aplicarFiltros = aplicarFiltros;
window.resetFiltros = resetFiltros;

// ========================
// ATUALIZAÇÃO VISUAL DO RESUMO SELECIONADO
// ========================
function atualizarViewObraSelecionada() {
  const titulo = $("#obraTitulo");
  const info = $("#obraInfo");
  if (!titulo) return;
  if (obraSelecionada) {
    titulo.textContent = obraSelecionada.titulo || 'Progresso da Obra';
    if (info) {
      info.innerHTML = `
        <div><strong>Descrição:</strong> ${escapeHtml(obraSelecionada.descricao || '-')}</div>
        <div><strong>Status:</strong> ${escapeHtml(obraSelecionada.status || '-')}</div>
        <div><strong>Valor:</strong> R$ ${formatarMoeda(obraSelecionada.valorContratado || 0)}</div>
        <div><strong>Período:</strong> ${formatarData(obraSelecionada.dataInicio)} → ${formatarData(obraSelecionada.previsaoTermino)}</div>
      `;
    }
  } else {
    titulo.textContent = 'Progresso da Obra';
    if (info) info.innerHTML = '';
  }
}

// ======================================================
// DROPDOWN DO USUÁRIO
// ======================================================

userDropdownToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', (e) => {
  if (!userDropdown.contains(e.target) && !userDropdownToggle.contains(e.target)) {
    userDropdown.style.display = 'none';
  }
});

document.getElementById('homeBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'login.html';
});

toggleFontBtn.addEventListener('click', () => {
  document.body.classList.toggle('font-large');
  userDropdown.style.display = 'none';
});

// ======================================================
// Persistencia do login
// ======================================================

window.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  const primeiroNome = usuario.nomeCompleto.split(" ")[0];
  const spanUsuario = document.querySelector(".user span");
  if (spanUsuario) spanUsuario.textContent = primeiroNome;
});

