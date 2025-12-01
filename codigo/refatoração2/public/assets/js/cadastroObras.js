// Configurações e estado
const API_URL = "http://localhost:3000/obras";
let obraEditando = null;
const $ = s => document.querySelector(s);
let obrasData = [];

// Filtros
const filtros = {
  q: "",
  status: "",
  cidade: "",
  orgaos: [],
  empresas: [],
  sortBy: "titulo"
};

// Inicialização após DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#obraForm");
  if (form) form.addEventListener("submit", salvarObra);

  const limparBtn = document.querySelector("#limpar");
  if (limparBtn) limparBtn.addEventListener("click", limparFormulario);

  const qInput = document.querySelector("#q");
  if (qInput) qInput.addEventListener("input", debounce(e => { filtros.q = e.target.value; aplicarEAtualizar(); }, 300));

  const statusSel = document.querySelector("#filterStatus");
  if (statusSel) statusSel.addEventListener("change", e => { filtros.status = e.target.value; aplicarEAtualizar(); });

  const cidadeSel = document.querySelector("#filterCidade");
  if (cidadeSel) cidadeSel.addEventListener("change", e => { filtros.cidade = e.target.value; aplicarEAtualizar(); });

  const sortSel = document.querySelector("#sortBy");
  if (sortSel) sortSel.addEventListener("change", e => { filtros.sortBy = e.target.value; aplicarEAtualizar(); });

  document.querySelector("#aplicarFiltros")?.addEventListener("click", () => aplicarEAtualizar());
  document.querySelector("#resetFiltros")?.addEventListener("click", resetFiltros);

  setupOrgaoDropdown();
  setupEmpresaDropdown();
  carregarObras();
});

// Função debounce
function debounce(fn, ms = 200) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

// Função: carregar obras (API ou fallback)
async function carregarObras() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('não foi possível carregar da API');
    const data = await res.json();
    obrasData = Array.isArray(data) ? data : (data.obras || []);
  } catch (err) {
    try {
      const r = await fetch("obras.json");
      const j = await r.json();
      obrasData = j.obras || [];
    } catch (err2) {
      obrasData = [];
    }
  }
  popularSelects();
  popularOrgaos();
  popularEmpresas();
  aplicarEAtualizar();
}

// Função: popular selects (status, cidade)
function popularSelects() {
  const statusSet = new Set();
  const cidadeSet = new Set();
  obrasData.forEach(o => {
    if (o.status) statusSet.add(o.status);
    if (o.endereco && o.endereco.cidade) cidadeSet.add(o.endereco.cidade);
  });
  const statusSel = document.querySelector("#filterStatus");
  const cidadeSel = document.querySelector("#filterCidade");
  if (!statusSel || !cidadeSel) return;
  statusSel.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());
  cidadeSel.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());
  Array.from(statusSet).sort().forEach(s => {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    statusSel.appendChild(o);
  });
  Array.from(cidadeSet).sort().forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    cidadeSel.appendChild(o);
  });
}

// Função: popular dropdown de órgãos (com busca interna)
function popularOrgaos() {
  const orgaoSet = new Set();
  obrasData.forEach(o => { if (o.orgaoResponsavel) orgaoSet.add(o.orgaoResponsavel); });
  const list = document.querySelector("#orgaoList");
  const search = document.querySelector("#orgaoSearch");
  if (!list) return;
  list.innerHTML = "";
  const orgaos = Array.from(orgaoSet).sort();

  orgaos.forEach(nome => {
    const id = `orgao_${slugify(nome)}`;
    const wrapper = document.createElement("label");
    wrapper.className = "orgao-item";
    wrapper.setAttribute("data-nome", nome);
    wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${escapeHtml(nome)}"/><span>${escapeHtml(nome)}</span>`;
    list.appendChild(wrapper);
    const checkbox = wrapper.querySelector("input");
    checkbox.addEventListener("change", () => {
      atualizarOrgaosSelecionados();
    });
    wrapper.addEventListener("click", (ev) => {
      if (ev.target.tagName.toLowerCase() === 'input') return;
      checkbox.checked = !checkbox.checked;
      atualizarOrgaosSelecionados();
    });
  });

  if (search) {
    search.value = "";
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      list.querySelectorAll(".orgao-item").forEach(item => {
        const nome = item.getAttribute("data-nome") || "";
        item.style.display = nome.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }

  const selAllBtn = document.querySelector("#orgaoSelecionarTudo");
  const limparBtn = document.querySelector("#orgaoLimpar");
  if (selAllBtn) selAllBtn.addEventListener("click", (e) => {
    e.preventDefault();
    list.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
    atualizarOrgaosSelecionados();
  });
  if (limparBtn) limparBtn.addEventListener("click", (e) => {
    e.preventDefault();
    list.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    atualizarOrgaosSelecionados();
  });
  atualizarOrgaoToggle();
}

// Função: atualizar órgãos selecionados
function atualizarOrgaosSelecionados() {
  const checked = Array.from(document.querySelectorAll("#orgaoList input[type=checkbox]:checked")).map(i => i.value);
  filtros.orgaos = checked;
  atualizarOrgaoToggle();
  aplicarEAtualizar();
}

// Função: atualizar texto do toggle de órgãos
function atualizarOrgaoToggle() {
  const toggle = document.querySelector("#orgaoToggle");
  const total = document.querySelectorAll("#orgaoList input[type=checkbox]").length;
  const selected = document.querySelectorAll("#orgaoList input[type=checkbox]:checked").length;
  if (!toggle) return;
  if (selected === 0) toggle.innerHTML = `Todos os órgãos <span class="arrow">&#9662;</span>`;
  else if (selected === total && total > 0) toggle.innerHTML = `Todos selecionados (${selected}) <span class="arrow">&#9662;</span>`;
  else toggle.innerHTML = `${selected} selecionado${selected > 1 ? 's' : ''} <span class="arrow">&#9662;</span>`;
}

// Função utilitária: criar id slug
function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
}

// Função: configurar comportamento do dropdown de órgãos (com foco, teclado e posicionamento correto)
function setupOrgaoDropdown() {
  const toggle = document.querySelector("#orgaoToggle");
  const panel = document.querySelector("#orgaoPanel");
  const container = document.querySelector("#orgaoDropdown");

  if (!toggle || !panel || !container) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display !== 'none';
    closeAllDropdowns();

    if (isOpen) {
      panel.style.display = 'none';
      toggle.classList.remove("active");
      panel.classList.remove("show");
      panel.style.top = "";
      panel.style.left = "";
      container.setAttribute('aria-expanded', 'false');
    } else {
      // abrir painel e posicionar corretamente
      panel.style.display = 'block';
      toggle.classList.add("active");
      panel.classList.add("show");
      container.setAttribute('aria-expanded', 'true');

      // posição responsiva: em tela pequena, painel fica estático (flow)
      if (window.innerWidth <= 720) {
        panel.style.position = 'static';
        panel.style.top = "";
        panel.style.left = "";
      } else {
        panel.style.position = 'absolute';
        const rect = toggle.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        const top = rect.bottom - parentRect.top + 6; // 6px space
        const left = rect.left - parentRect.left;
        panel.style.top = top + 'px';
        panel.style.left = left + 'px';
      }

      const s = panel.querySelector("#orgaoSearch");
      if (s) s.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      panel.style.display = 'none';
      toggle.classList.remove("active");
      panel.classList.remove("show");
      panel.style.top = "";
      panel.style.left = "";
      container.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!container.contains(document.activeElement) && panel.style.display === 'none') return;
    if (e.key === "Escape") {
      panel.style.display = 'none';
      toggle.classList.remove("active");
      panel.classList.remove("show");
      panel.style.top = "";
      panel.style.left = "";
      container.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const visible = Array.from(panel.querySelectorAll(".orgao-item")).filter(it => it.style.display !== 'none');
      if (visible.length === 0) return;
      const current = visible.findIndex(it => it.classList.contains("focused"));
      let nextIndex = 0;
      if (e.key === "ArrowDown") nextIndex = current < visible.length - 1 ? current + 1 : 0;
      if (e.key === "ArrowUp") nextIndex = current > 0 ? current - 1 : visible.length - 1;
      visible.forEach(it => it.classList.remove("focused"));
      visible[nextIndex].classList.add("focused");
      const cb = visible[nextIndex].querySelector("input");
      if (cb) cb.focus();
    }
    if (e.key === "Enter") {
      const focused = panel.querySelector(".orgao-item.focused");
      if (focused) {
        const cb = focused.querySelector("input");
        if (cb) {
          cb.checked = !cb.checked;
          atualizarOrgaosSelecionados();
        }
      }
    }
  });
}

// Função: fechar todos os dropdowns (reseta posição e classes)
function closeAllDropdowns() {
  document.querySelectorAll(".orgao-panel, .empresa-panel").forEach(p => {
    p.style.display = 'none';
    p.style.top = "";
    p.style.left = "";
  });
  document.querySelectorAll(".orgao-toggle, .empresa-toggle").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dropdown-panel").forEach(p => p.classList.remove("show"));
}

// Função: popular dropdown de empresas
function popularEmpresas() {
  const set = new Set();
  obrasData.forEach(o => { if (o.empresaExecutora) set.add(o.empresaExecutora); });
  const list = document.querySelector("#empresaList");
  const search = document.querySelector("#empresaSearch");
  if (!list) return;
  list.innerHTML = "";

  Array.from(set).sort().forEach(nome => {
    const id = `empresa_${slugify(nome)}`;
    const wrapper = document.createElement("label");
    wrapper.className = "empresa-item";
    wrapper.setAttribute("data-nome", nome);
    wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${escapeHtml(nome)}"/><span>${escapeHtml(nome)}</span>`;
    list.appendChild(wrapper);

    wrapper.addEventListener("click", (ev) => {
      if (ev.target.tagName.toLowerCase() === "input") return;
      const cb = wrapper.querySelector("input");
      cb.checked = !cb.checked;
      atualizarEmpresasSelecionadas();
    });
  });

  const selAll = document.querySelector("#empresaSelecionarTudo");
  const limpar = document.querySelector("#empresaLimpar");
  if (selAll) selAll.onclick = () => {
    list.querySelectorAll("input").forEach(c => c.checked = true);
    atualizarEmpresasSelecionadas();
  };
  if (limpar) limpar.onclick = () => {
    list.querySelectorAll("input").forEach(c => c.checked = false);
    atualizarEmpresasSelecionadas();
  };

  if (search) {
    search.value = "";
    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();
      list.querySelectorAll(".empresa-item").forEach(i => {
        const nome = i.getAttribute("data-nome").toLowerCase();
        i.style.display = nome.includes(q) ? "" : "none";
      });
    });
  }

  atualizarEmpresaToggle();
}

// Atualiza empresas selecionadas
function atualizarEmpresasSelecionadas() {
  filtros.empresas = Array.from(document.querySelectorAll("#empresaList input:checked")).map(i => i.value);
  atualizarEmpresaToggle();
  aplicarEAtualizar();
}

// Atualiza texto do dropdown de empresas
function atualizarEmpresaToggle() {
  const toggle = document.querySelector("#empresaToggle");
  const total = document.querySelectorAll("#empresaList input").length;
  const selected = document.querySelectorAll("#empresaList input:checked").length;
  if (!toggle) return;
  if (selected === 0) toggle.innerHTML = `Todas as empresas <span class="arrow">&#9662;</span>`;
  else if (selected === total) toggle.innerHTML = `Todas selecionadas (${selected}) <span class="arrow">&#9662;</span>`;
  else toggle.innerHTML = `${selected} selecionada(s) <span class="arrow">&#9662;</span>`;
}

// Dropdown comportamento para empresas (com posicionamento correto)
function setupEmpresaDropdown() {
  const toggle = document.querySelector("#empresaToggle");
  const panel = document.querySelector("#empresaPanel");
  const container = document.querySelector("#empresaDropdown");
  const search = document.querySelector("#empresaSearch");

  if (!toggle || !panel || !container) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display !== "none";
    closeAllDropdowns();

    if (isOpen) {
      panel.style.display = 'none';
      toggle.classList.remove("active");
      panel.classList.remove("show");
      panel.style.top = "";
      panel.style.left = "";
    } else {
      panel.style.display = 'block';
      toggle.classList.add("active");
      panel.classList.add("show");

      if (window.innerWidth <= 720) {
        panel.style.position = 'static';
        panel.style.top = "";
        panel.style.left = "";
      } else {
        panel.style.position = 'absolute';
        const rect = toggle.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        const top = rect.bottom - parentRect.top + 6;
        const left = rect.left - parentRect.left;
        panel.style.top = top + 'px';
        panel.style.left = left + 'px';
      }

      if (!isOpen && search) search.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      panel.style.display = 'none';
      toggle.classList.remove("active");
      panel.classList.remove("show");
      panel.style.top = "";
      panel.style.left = "";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      panel.style.display = 'none';
      toggle.classList.remove("active");
      panel.classList.remove("show");
      panel.style.top = "";
      panel.style.left = "";
      toggle.focus();
    }
  });
}

// Função: salvar obra
function salvarObra(e) {
  if (e) e.preventDefault();
  const dados = coletarDados();
  if (!dados.titulo) return alert("Título é obrigatório.");
  const metodo = obraEditando ? "PUT" : "POST";
  const url = obraEditando ? `${API_URL}/${obraEditando}` : API_URL;
  if (!obraEditando && dados.id) delete dados.id;
  fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao salvar obra");
      return res.json();
    })
    .then(() => {
      limparFormulario();
      carregarObras();
    })
    .catch(err => {
      alert("Erro ao salvar obra. Veja console para detalhes.");
    });
}

// Função: editar obra
function editarObra(id) {
  fetch(`${API_URL}/${id}`)
    .then(res => {
      if (!res.ok) throw new Error("Obra não encontrada");
      return res.json();
    })
    .then(o => {
      $("#titulo").value = o.titulo || "";
      $("#descricao").value = o.descricao || "";
      $("#valorContratado").value = o.valorContratado || "";
      $("#status").value = o.status || "";
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
      obraEditando = o.id;
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
    .catch(err => {
      alert("Erro ao carregar obra para edição.");
    });
}

// Função: excluir obra
function excluirObra(id) {
  if (!confirm("Deseja excluir esta obra?")) return;
  fetch(`${API_URL}/${id}`, { method: "DELETE" })
    .then(() => carregarObras())
    .catch(err => {
      alert("Erro ao excluir obra.");
    });
}

// Função: coletar dados do formulário
function coletarDados() {
  const files = Array.from($("#anexos")?.files || []);
  const anexos = files.map(f => ({
    tipo: f.type.startsWith("image/") ? "imagem" : "documento",
    nomeArquivo: f.name,
    url: `uploads/${f.name}`
  }));
  return {
    titulo: $("#titulo").value.trim(),
    descricao: $("#descricao").value.trim(),
    valorContratado: parseFloat($("#valorContratado").value) || 0,
    status: $("#status").value,
    dataInicio: $("#dataInicio").value,
    previsaoTermino: $("#previsaoTermino").value,
    orgaoResponsavel: $("#orgaoResponsavel").value.trim(),
    empresaExecutora: $("#empresaExecutora").value.trim(),
    endereco: {
      logradouro: $("#logradouro").value.trim(),
      numero: $("#numero").value.trim(),
      bairro: $("#bairro").value.trim(),
      cidade: $("#cidade").value.trim(),
      estado: $("#estado").value.trim(),
      cep: $("#cep").value.trim()
    },
    anexos
  };
}

// Função: limpar formulário
function limparFormulario() {
  $("#obraForm")?.reset();
  obraEditando = null;
}

// Função: aplicar filtros e atualizar lista
function aplicarEAtualizar() {
  const resultados = filtrarObras(obrasData, filtros);
  renderizarObras(resultados);
}

// Função: filtrar obras
function filtrarObras(list, f) {
  return list.filter(obra => {
    if (f.q) {
      const texto = [
        obra.titulo,
        obra.empresaExecutora,
        obra.endereco?.cidade,
        obra.endereco?.logradouro,
        obra.orgaoResponsavel
      ].filter(Boolean).join(' ').toLowerCase();
      if (!texto.includes(f.q.toLowerCase())) return false;
    }
    if (f.status && obra.status !== f.status) return false;
    if (f.cidade && obra.endereco?.cidade !== f.cidade) return false;
    if (f.orgaos && f.orgaos.length > 0) {
      if (!obra.orgaoResponsavel) return false;
      if (!f.orgaos.includes(obra.orgaoResponsavel)) return false;
    }
    if (f.empresas && f.empresas.length > 0) {
      if (!obra.empresaExecutora) return false;
      if (!f.empresas.includes(obra.empresaExecutora)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (f.sortBy === 'titulo') return (a.titulo || '').localeCompare(b.titulo || '');
    if (f.sortBy === 'dataInicio') return new Date(a.dataInicio || 0) - new Date(b.dataInicio || 0);
    return 0;
  });
}

// Função: renderizar obras na tela
function renderizarObras(obras) {
  const container = document.querySelector("#obrasContainer");
  const msgNenhuma = document.querySelector("#msgNenhuma");
  if (!container) return;
  container.innerHTML = "";
  if (!obras.length) {
    if (msgNenhuma) msgNenhuma.style.display = "block";
    return;
  } else {
    if (msgNenhuma) msgNenhuma.style.display = "none";
  }
  obras.forEach(obra => {
    const e = obra.endereco || {};
    const anexos = (obra.anexos || []).map(a => `<li><a href="${a.url}" target="_blank" rel="noopener">${a.nomeArquivo}</a> <span class="tag">${a.tipo}</span></li>`).join("");
    const formatarData = d => {
      if (!d) return "-";
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleDateString();
    };
    const div = document.createElement("div");
    div.className = "obra-card";
    div.innerHTML = `
      <div class="obra-header">
        <h3>${escapeHtml(obra.titulo || obra.nome || '-')}</h3>
        <span class="status ${(obra.status || '').toLowerCase().replace(/\s/g, '-')}">${escapeHtml(obra.status || '--')}</span>
      </div>
      <p class="descricao">${escapeHtml(obra.descricao || "-")}</p>
      <div class="obra-info">
        <p><strong>Período:</strong> ${formatarData(obra.dataInicio)} → ${formatarData(obra.previsaoTermino)}</p>
        <p><strong>Órgão Responsável:</strong> ${escapeHtml(obra.orgaoResponsavel || "-")}</p>
        <p><strong>Empresa Executora:</strong> ${escapeHtml(obra.empresaExecutora || "-")}</p>
        <p><strong>Endereço:</strong> ${[e.logradouro, e.numero, e.bairro, e.cidade, e.estado].filter(Boolean).join(', ')}${e.cep ? ', CEP ' + e.cep : ''}</p>
      </div>
      ${anexos ? `<div class="obra-anexos"><strong>Anexos:</strong><ul>${anexos}</ul></div>` : ""}
      <div class="obra-actions">
        <button class="btn btn-ghost" onclick="editarObra('${obra.id || ''}')">Editar</button>
        <button class="btn btn-danger" onclick="excluirObra('${obra.id || ''}')">Excluir</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Função: escape de HTML
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

// Função: resetar filtros
function resetFiltros() {
  filtros.q = ""; filtros.status = ""; filtros.cidade = ""; filtros.orgaos = []; filtros.empresas = []; filtros.sortBy = "titulo";
  const qInput = document.querySelector("#q"); if (qInput) qInput.value = "";
  const statusSel = document.querySelector("#filterStatus"); if (statusSel) statusSel.value = "";
  const cidadeSel = document.querySelector("#filterCidade"); if (cidadeSel) cidadeSel.value = "";
  const sortSel = document.querySelector("#sortBy"); if (sortSel) sortSel.value = "titulo";
  document.querySelectorAll("#orgaoList input[type=checkbox]").forEach(cb => cb.checked = false);
  document.querySelectorAll("#empresaList input[type=checkbox]").forEach(cb => cb.checked = false);
  atualizarOrgaoToggle();
  atualizarEmpresaToggle();
  aplicarEAtualizar();
}
