const detalhesBtn = document.querySelector('.detalhes');
let detalhesBar = false;

if (detalhesBtn) {
  detalhesBtn.addEventListener('click', () => {
    detalhesBar = !detalhesBar;
    detalhesBtn.classList.toggle('active', detalhesBar);
    console.log("Clique no detalhes!");
  });
}

const detalhesSidebar = document.getElementById('detalhesSidebar');
const detalhesContent = document.getElementById('detalhesContent');
const closeDetalhes = document.getElementById('closeDetalhes');
let currentObraDetalhe = null;
let timelineShadowRoot = null;

async function showDetalhesSidebar(obraOrId) {
  sidebar.classList.remove('open');
  sidebar.classList.add('closed');

  detalhesSidebar.classList.add('open');
  detalhesContent.innerHTML = '<div class="detalhes-card"><p>Carregando...</p></div>';

  let obraDetalhada = null;
  try {
    const possibleId = typeof obraOrId === 'object' ? obraOrId?.id : obraOrId;
    if (possibleId != null) {
      const apiBase = (typeof API !== 'undefined' ? API : 'http://localhost:3000/obras');
      const res = await fetch(`${apiBase}/${possibleId}`);
      if (res.ok) {
        obraDetalhada = await res.json();
      }
    }
  } catch (e) {
    console.error('Erro ao buscar detalhes da obra:', e);
  }

  // Fallback para o objeto recebido caso fetch falhe ou não exista id
  if (!obraDetalhada && typeof obraOrId === 'object') {
    obraDetalhada = obraOrId;
  }

  const obra = obraDetalhada || {};
  currentObraDetalhe = obra;

  detalhesContent.innerHTML = `
    <h2>${obra.titulo || ''}</h2>

    <div class="tabs">
      <button class="tab active" data-tab="resumo">Resumo</button>
      <button class="tab" data-tab="timeline">Linha do tempo</button>
      <button class="tab" data-tab="publicacoes">Publicações</button>
    </div>

    <div class="tab-content active" id="resumo">
      <div class="detalhes-card">
        <img src="${obra.anexos?.find(a => a.tipo === "imagem")?.url || './img/Logo2.png'}" />
        <p><strong>Bairro:</strong> ${obra.endereco?.bairro || '-'}</p>
        <p><strong>Construtora:</strong> ${obra.empresaExecutora || '-'}</p>
        <p><strong>Status:</strong> ${obra.status || '-'}</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(obra.valorContratado || 0)}</p>
        <p>${obra.descricao || ''}</p>
      </div>
    </div>

    <div class="tab-content" id="timeline">
      <div class="detalhes-card">
        <p><strong>Etapas executadas:</strong></p>
        <ul class="timeline-list">
          ${(obra.etapas || []).map(etapa => `<li>${etapa}</li>`).join('') || "<li>Nenhuma etapa registrada</li>"}
        </ul>
      </div>
    </div>

    <div class="tab-content" id="publicacoes">
      <div class="detalhes-card">
        ${(obra.publicacoes || []).map(pub => `
          <div class="pub-card">
            <img src="${pub.img || './img/placeholder.jpg'}"/>
            <p>${pub.texto || ''}</p>
          </div>
        `).join('') || "<p>Nenhuma publicação registrada</p>"}
      </div>
    </div>
  `;

  setupTabs();
}

async function loadTimelineContent() {
  const container = document.getElementById('timeline');
  if (!container) return;

  // Se já carregamos a estrutura uma vez, apenas reidrata com a obra atual
  if (container.dataset.timelineLoaded === 'true' && timelineShadowRoot) {
    hydrateTimelineForCurrentObra();
    return;
  }

  container.innerHTML = '<div class="detalhes-card"><p>Carregando timeline...</p></div>';
  try {
    const res = await fetch('../guilherme/timeline/timeline.html');
    if (!res.ok) throw new Error('Falha ao carregar timeline');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Seleciona apenas a área de conteúdo principal da timeline (sem header)
    let piece = doc.querySelector('.timeline-content');
    if (!piece) {
      // fallback: pega container principal
      piece = doc.querySelector('.timeline-container') || doc.body;
    }

    // Ajusta caminhos relativos para assets dentro do bloco
    fixRelativeAssets(piece, '../guilherme/timeline/');

    // Isola em Shadow DOM e injeta CSS localmente
    container.innerHTML = '';
    const host = document.createElement('div');
    host.setAttribute('data-shadow-host', 'timeline');
    container.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const styleHrefs = collectExternalStyleHrefs(doc, '../guilherme/timeline/');
    await injectStylesIntoShadow(shadow, styleHrefs);

    shadow.appendChild(piece.cloneNode(true));
    timelineShadowRoot = shadow;
    container.dataset.timelineLoaded = 'true';
    hydrateTimelineForCurrentObra();
  } catch (e) {
    container.innerHTML = '<div class="detalhes-card"><p>Não foi possível carregar a timeline.</p></div>';
    console.error(e);
  }
}

async function loadPublicacoesContent() {
  const container = document.getElementById('publicacoes');
  if (!container) return;
  container.innerHTML = '<div class="detalhes-card"><p>Carregando publicações...</p></div>';
  try {
    const res = await fetch('../lucas/sprint02/feed.html');
    if (!res.ok) throw new Error('Falha ao carregar publicações');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Seleciona a seção de publicações (sem cabeçalho e sem outros blocos)
    let piece = doc.querySelector('.feedback-section');
    if (!piece) {
      // fallback: tenta o main content
      piece = doc.querySelector('main.content') || doc.body;
    }

    // Ajusta caminhos relativos para assets dentro do bloco
    fixRelativeAssets(piece, '../lucas/sprint02/');

    // Isola em Shadow DOM e injeta CSS localmente
    container.innerHTML = '';
    const host = document.createElement('div');
    host.setAttribute('data-shadow-host', 'publicacoes');
    container.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const styleHrefs = collectExternalStyleHrefs(doc, '../lucas/sprint02/');
    await injectStylesIntoShadow(shadow, styleHrefs);
    shadow.appendChild(piece.cloneNode(true));
  } catch (e) {
    container.innerHTML = '<div class="detalhes-card"><p>Não foi possível carregar as publicações.</p></div>';
    console.error(e);
  }
}

function fixRelativeAssets(rootEl, basePath) {
  if (!rootEl) return;
  // Corrige src de img/script e href de link/a que começam sem barra
  rootEl.querySelectorAll('[src]').forEach(el => {
    const src = el.getAttribute('src');
    if (src && !/^https?:\/\//i.test(src) && !src.startsWith('/') && !src.startsWith(basePath)) {
      el.setAttribute('src', basePath + src.replace(/^\.\//, ''));
    }
  });
  rootEl.querySelectorAll('[href]').forEach(el => {
    const href = el.getAttribute('href');
    if (href && !/^https?:\/\//i.test(href) && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith(basePath)) {
      el.setAttribute('href', basePath + href.replace(/^\.\//, ''));
    }
  });
  // Remove quaisquer headers internos trazidos por engano
  rootEl.querySelectorAll('header').forEach(h => h.remove());
}

function collectExternalStyleHrefs(sourceDoc, basePath) {
  if (!sourceDoc) return [];
  const links = Array.from(sourceDoc.querySelectorAll('link[rel="stylesheet"][href]'));
  return links.map(link => {
    let href = link.getAttribute('href');
    if (!href) return null;
    if (!/^https?:\/\//i.test(href) && !href.startsWith('/') && !href.startsWith(basePath)) {
      href = basePath + href.replace(/^\.\//, '');
    }
    return href;
  }).filter(Boolean);
}

async function injectStylesIntoShadow(shadowRoot, hrefs) {
  if (!shadowRoot || !hrefs || !hrefs.length) return;
  for (const href of hrefs) {
    try {
      const res = await fetch(href);
      if (!res.ok) continue;
      const cssText = await res.text();
      const styleEl = document.createElement('style');
      styleEl.textContent = cssText;
      shadowRoot.appendChild(styleEl);
    } catch (e) {
      console.error('Falha ao importar CSS em shadow:', href, e);
    }
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");

      if (tab.dataset.tab === 'timeline') {
        loadTimelineContent();
      } else if (tab.dataset.tab === 'publicacoes') {
        loadPublicacoesContent();
      }
    });
  });
}

if (closeDetalhes) {
  closeDetalhes.addEventListener('click', () => {
    detalhesSidebar.classList.remove('open');
  });
}

function hydrateTimelineForCurrentObra() {
  if (!timelineShadowRoot) return;
  const titleEl = timelineShadowRoot.querySelector('#obraTitulo');
  const infoEl = timelineShadowRoot.querySelector('#obraInfo');
  const listEl = timelineShadowRoot.querySelector('#timelineList');
  const emptyStateEl = timelineShadowRoot.querySelector('#emptyState');
  const progressFill = timelineShadowRoot.querySelector('#progressFill');
  const progressText = timelineShadowRoot.querySelector('#progressText');

  if (!listEl || !titleEl || !infoEl || !progressFill || !progressText) return;

  if (!currentObraDetalhe) {
    titleEl.textContent = 'Progresso da Obra';
    infoEl.innerHTML = '<p style="margin: 0;">Selecione uma obra para visualizar a linha do tempo.</p>';
    listEl.innerHTML = '';
    if (emptyStateEl) {
      emptyStateEl.style.display = 'flex';
      emptyStateEl.innerHTML = '<div class="empty-icon">🕒</div>Selecione uma obra para ver os marcos.';
    }
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    return;
  }

  const marcos = buildTimelineEntries(currentObraDetalhe);

  titleEl.textContent = currentObraDetalhe.titulo || 'Progresso da Obra';
  infoEl.innerHTML = `
    <div><strong>Status:</strong> ${currentObraDetalhe.status || '-'}</div>
    <div><strong>Valor:</strong> ${formatCurrency(currentObraDetalhe.valorContratado || 0)}</div>
    <div><strong>Data de início:</strong> ${formatTimelineDate(currentObraDetalhe.dataInicio)}</div>
    <div><strong>Previsão de término:</strong> ${formatTimelineDate(currentObraDetalhe.previsaoTermino)}</div>
  `;

  listEl.innerHTML = '';
  if (!marcos.length) {
    if (emptyStateEl) {
      emptyStateEl.style.display = 'flex';
      emptyStateEl.innerHTML = '<div class="empty-icon">🕒</div>Nenhuma etapa registrada para esta obra.';
    }
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    return;
  }

  if (emptyStateEl) emptyStateEl.style.display = 'none';

  marcos.forEach((marco) => {
    const marcoEl = document.createElement('div');
    marcoEl.className = 'marco';
    if (marco.percentual != null) {
      marcoEl.setAttribute('data-porcentagem', marco.percentual);
    }
    marcoEl.innerHTML = `
      <div class="marco-info">
        <div class="marco-title">${marco.titulo}</div>
        <div class="marco-desc">${marco.descricao || ''}</div>
        <div class="marco-meta">
          <span>${marco.percentual != null ? `Concluído: ${marco.percentual}%` : ''}</span>
          ${marco.data ? `<span style="margin-left:12px;">Data: ${formatTimelineDate(marco.data)}</span>` : ''}
        </div>
      </div>
    `;
    listEl.appendChild(marcoEl);
  });

  const media = marcos.reduce((acc, m) => acc + (m.percentual || 0), 0) / marcos.length;
  const progresso = Math.min(100, Math.max(0, Math.round(media || 0)));
  progressFill.style.width = `${progresso}%`;
  progressText.textContent = `${progresso}%`;
}

function buildTimelineEntries(obra) {
  if (!obra) return [];

  if (Array.isArray(obra.marcos) && obra.marcos.length) {
    return obra.marcos.map((marco, index) => ({
      titulo: escapeHtmlValue(marco.titulo || `Marco ${index + 1}`),
      descricao: escapeHtmlValue(marco.descricao || ''),
      percentual: normalizePercent(marco.percentual, index, obra.marcos.length),
      data: marco.data || null
    }));
  }

  if (Array.isArray(obra.etapas) && obra.etapas.length) {
    return obra.etapas.map((etapa, index) => {
      if (typeof etapa === 'string') {
        return {
          titulo: escapeHtmlValue(etapa),
          descricao: '',
          percentual: Math.round(((index + 1) / obra.etapas.length) * 100),
          data: null
        };
      }
      if (typeof etapa === 'object' && etapa) {
        return {
          titulo: escapeHtmlValue(etapa.titulo || etapa.nome || `Etapa ${index + 1}`),
          descricao: escapeHtmlValue(etapa.descricao || etapa.texto || ''),
          percentual: normalizePercent(etapa.percentual, index, obra.etapas.length),
          data: etapa.data || null
        };
      }
      return null;
    }).filter(Boolean);
  }

  return [];
}

function normalizePercent(percentual, index, total) {
  if (percentual == null || Number.isNaN(Number(percentual))) {
    return Math.round(((index + 1) / total) * 100);
  }
  const value = Number(percentual);
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR');
}

function escapeHtmlValue(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


