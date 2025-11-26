
const detalhesBtn = document.querySelector('.detalhes');
let detalhesBar = false;

if (detalhesBtn) {
  detalhesBtn.addEventListener('click', () => {
    detalhesBar = !detalhesBar;
    detalhesBtn.classList.toggle('active', detalhesBar);
    console.log('Clique no detalhes!');
  });
}

const detalhesSidebar = document.getElementById('detalhesSidebar');
const detalhesContent = document.getElementById('detalhesContent');
const closeDetalhes = document.getElementById('closeDetalhes');
let currentObraDetalhe = null;
let timelineShadowRoot = null;

const DEFAULT_IMG = '../img/Logo2.png';
const PLACEHOLDER_IMG = '../img/placeholder.jpg';

function resolveImageUrl(rawUrl) {
  // Normaliza URLs: mantém absolutas e converte relativas para ../img/<basename>
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') return PLACEHOLDER_IMG;
  const clean = rawUrl.trim();
  if (/^https?:\/\//i.test(clean) || clean.startsWith('http://localhost')) return clean;
  const fileName = clean.split('/').pop();
  return fileName ? `../img/${fileName}` : PLACEHOLDER_IMG;
}

async function showDetalhesSidebar(obraOrId) {
  if (typeof sidebar !== 'undefined') {
    sidebar.classList.remove('open');
    sidebar.classList.add('closed');
  }

  detalhesSidebar.classList.add('open');
  detalhesContent.innerHTML = '<div class="detalhes-card"><p>Carregando...</p></div>';

  let obraDetalhada = null;
  try {
    const possibleId = typeof obraOrId === 'object' ? obraOrId?.id : obraOrId;
    if (possibleId != null) {
      const apiBase = (typeof API !== 'undefined' ? API : 'http://localhost:3000/obras');
      const res = await fetch(`${apiBase}/${possibleId}`);
      if (res.ok) obraDetalhada = await res.json();
    }
  } catch (e) {
    console.error('Erro ao buscar detalhes da obra:', e);
  }

  // fallback para o objeto passado
  if (!obraDetalhada && typeof obraOrId === 'object') obraDetalhada = obraOrId;

  const obra = obraDetalhada || {};
  currentObraDetalhe = obra;

  const mainImgUrl = resolveImageUrl(obra.anexos?.find(a => a.tipo === 'imagem')?.url);

  detalhesContent.innerHTML = `
    <h2>${obra.titulo || ''}</h2>

    <div class="tabs">
      <button class="tab active" data-tab="resumo">Resumo</button>
      <button class="tab" data-tab="timeline">Linha do tempo</button>
      <button class="tab" data-tab="publicacoes">Publicações</button>
    </div>

    <div class="tab-content active" id="resumo">
      <div class="detalhes-card">
        <img src="${mainImgUrl || DEFAULT_IMG}" alt="Imagem da obra" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}'" />

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
          ${(obra.etapas || []).map(etapa => `<li>${escapeHtmlValue(etapa)}</li>`).join('') || '<li>Nenhuma etapa registrada</li>'}
        </ul>
      </div>
    </div>

    <div class="tab-content" id="publicacoes">
      <div class="detalhes-card">
        ${(obra.publicacoes || []).map(pub => `
          <div class="pub-card">
            <img src="${resolveImageUrl(pub.img)}" alt="Publicação" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}'" />
            <p>${escapeHtmlValue(pub.texto || '')}</p>
          </div>
        `).join('') || '<p>Nenhuma publicação registrada</p>'}
      </div>
    </div>
  `;

  setupTabs();
}

async function loadTimelineContent() {
  const container = document.getElementById('timeline');
  if (!container) return;

  // se já carregado em shadow, apenas reidrata
  if (container.dataset.timelineLoaded === 'true' && timelineShadowRoot) {
    hydrateTimelineForCurrentObra();
    return;
  }

  container.innerHTML = '<div class="detalhes-card"><p>Carregando timeline...</p></div>';
  try {
    // arquivo agora em /html
    const res = await fetch('../html/timeline.html');
    if (!res.ok) throw new Error('Falha ao carregar timeline');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // seleciona a área principal
    let piece = doc.querySelector('.timeline-content') || doc.querySelector('.timeline-container') || doc.body;

    // ajusta assets relativos para a nova estrutura
    fixRelativeAssets(piece, '../');

    // isola em Shadow DOM para evitar conflito de estilos
    container.innerHTML = '';
    const host = document.createElement('div');
    host.setAttribute('data-shadow-host', 'timeline');
    container.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const styleHrefs = collectExternalStyleHrefs(doc, '../css/');
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
  container.innerHTML = '<div class="detalhes-card"><p>Carregando feedbacks...</p></div>';

  if (!currentObraDetalhe || !currentObraDetalhe.titulo) {
    container.innerHTML = '<div class="detalhes-card"><p>Nenhuma obra selecionada.</p></div>';
    return;
  }

  try {
    const API_URL = 'http://localhost:3000/feedbacks';
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Falha ao buscar feedbacks');

    const todosFeedbacks = await res.json();

    // filtra por título da obra
    const obraTitulo = currentObraDetalhe.titulo;
    const feedbacksFiltrados = todosFeedbacks.filter(fb =>
      fb.obra && fb.obra.trim().toLowerCase() === obraTitulo.trim().toLowerCase()
    );

    renderFeedbacks(container, feedbacksFiltrados, obraTitulo);
  } catch (e) {
    container.innerHTML = '<div class="detalhes-card"><p>Não foi possível carregar os feedbacks. Verifique se o servidor está rodando.</p></div>';
    console.error('Erro ao carregar feedbacks:', e);
  }
}

function renderFeedbacks(container, feedbacks, obraTitulo) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.style.marginBottom = '20px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <h3 style="margin-bottom: 10px; margin: 0;">Feedbacks da Obra: ${escapeHtmlValue(obraTitulo)}</h3>
    <button id="btnAdicionarFeedback" type="button" style="background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background-color 0.2s;">+ Adicionar Feedback</button>
  `;
  container.appendChild(header);

  const btnAdicionar = header.querySelector('#btnAdicionarFeedback');
  if (btnAdicionar) {
    btnAdicionar.addEventListener('click', () => {
      showFeedbackForm(obraTitulo);
    });
  }

  const feedbackList = document.createElement('div');
  feedbackList.className = 'feedback-list';
  feedbackList.style.display = 'flex';
  feedbackList.style.flexDirection = 'column';
  feedbackList.style.gap = '15px';

  if (feedbacks.length === 0) {
    feedbackList.innerHTML = '<div class="detalhes-card"><p>Nenhum feedback cadastrado para esta obra.</p></div>';
    container.appendChild(feedbackList);
    return;
  }

  feedbacks.forEach(fb => {
    const card = document.createElement('div');
    card.className = `feedback-card-detail type-${(fb.tipo || 'geral').toLowerCase()}`;
    card.style.cssText = `
      background: #fff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid ${getTipoColor(fb.tipo)};
    `;

    const tipoFormatado = formatTipo(fb.tipo);
    const dataFormatada = formatFeedbackDate(fb.dataEnvio);
    const feedbackId = fb.id;
    const currentLikes = fb.likes || 0;
    const currentDislikes = fb.dislikes || 0;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="background: ${getTipoColor(fb.tipo)}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">
          ${tipoFormatado}
        </span>
        <span style="font-size: 0.85em; color: #666;">Postado por: ${escapeHtmlValue(fb.nome || 'Anônimo')}</span>
      </div>
      <h4 style="margin: 10px 0 5px 0; color: #333; font-size: 1.1em;">${escapeHtmlValue(fb.titulo || 'Sem Título')}</h4>
      <p style="margin: 10px 0; color: #555; line-height: 1.5;">${escapeHtmlValue(fb.descricao || '')}</p>
      ${fb.anexo ? `<img src="${resolveImageUrl(fb.anexo)}" alt="Anexo" style="max-width: 100%; border-radius: 4px; margin-top: 10px;" onerror="this.onerror=null; this.style.display='none'">` : ''}
      <div style="margin-top: 10px; font-size: 0.85em; color: #888;">
        ${dataFormatada}
      </div>
      <div style="display: flex; gap: 10px; margin-top: 15px; align-items: center;">
        <button class="like-btn" data-feedback-id="${feedbackId}" data-action="like" style="background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;">
          👍 <span class="like-count">${currentLikes}</span>
        </button>
        <button class="dislike-btn" data-feedback-id="${feedbackId}" data-action="dislike" style="background: #F44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;">
          👎 <span class="dislike-count">${currentDislikes}</span>
        </button>
      </div>
    `;

    feedbackList.appendChild(card);
  });

  container.appendChild(feedbackList);

  // listeners de like/dislike
  setupLikeDislikeButtons(container);
}

async function setupLikeDislikeButtons(container) {
  const likeButtons = container.querySelectorAll('.like-btn');
  const dislikeButtons = container.querySelectorAll('.dislike-btn');

  likeButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const feedbackId = btn.getAttribute('data-feedback-id');
      const dislikeBtn = container.querySelector(`.dislike-btn[data-feedback-id="${feedbackId}"]`);
      const isActive = btn.classList.contains('active');

      if (isActive) {
        await updateFeedbackReaction(feedbackId, 'like', -1);
        btn.classList.remove('active');
        updateButtonCount(btn, -1);
      } else {
        if (dislikeBtn && dislikeBtn.classList.contains('active')) {
          await updateFeedbackReaction(feedbackId, 'dislike', -1);
          dislikeBtn.classList.remove('active');
          updateButtonCount(dislikeBtn, -1);
        }
        await updateFeedbackReaction(feedbackId, 'like', 1);
        btn.classList.add('active');
        updateButtonCount(btn, 1);
      }
    });
  });

  dislikeButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const feedbackId = btn.getAttribute('data-feedback-id');
      const likeBtn = container.querySelector(`.like-btn[data-feedback-id="${feedbackId}"]`);
      const isActive = btn.classList.contains('active');

      if (isActive) {
        await updateFeedbackReaction(feedbackId, 'dislike', -1);
        btn.classList.remove('active');
        updateButtonCount(btn, -1);
      } else {
        if (likeBtn && likeBtn.classList.contains('active')) {
          await updateFeedbackReaction(feedbackId, 'like', -1);
          likeBtn.classList.remove('active');
          updateButtonCount(likeBtn, -1);
        }
        await updateFeedbackReaction(feedbackId, 'dislike', 1);
        btn.classList.add('active');
        updateButtonCount(btn, 1);
      }
    });
  });
}

async function updateFeedbackReaction(feedbackId, type, change) {
  try {
    const API_URL = `http://localhost:3000/feedbacks/${feedbackId}`;

    // busca atual
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Erro ao buscar feedback');

    const feedback = await res.json();

    const currentValue = feedback[type === 'like' ? 'likes' : 'dislikes'] || 0;
    const newValue = Math.max(0, currentValue + change);

    // atualiza
    const updateRes = await fetch(API_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [type === 'like' ? 'likes' : 'dislikes']: newValue })
    });

    if (!updateRes.ok) throw new Error('Erro ao atualizar feedback');

    return newValue;
  } catch (error) {
    console.error('Erro ao atualizar reação:', error);
    throw error;
  }
}

function updateButtonCount(button, change) {
  const countSpan = button.querySelector('span.like-count, span.dislike-count');
  if (countSpan) {
    const currentCount = parseInt(countSpan.textContent) || 0;
    const newCount = Math.max(0, currentCount + change);
    countSpan.textContent = newCount;
  }
}

async function showFeedbackForm(obraTitulo) {
  if (!detalhesContent) return;

  detalhesContent.innerHTML = '<div class="detalhes-card"><p>Carregando formulário...</p></div>';

  try {
    // permanece ../html/feedback.html
    const res = await fetch('../html/feedback.html');
    if (!res.ok) throw new Error('Falha ao carregar formulário de feedback');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let formContainer = doc.querySelector('.form-container') || doc.querySelector('form#feedbackForm') || doc.body;

    // corrige caminhos relativos (usa ../ como raiz)
    fixRelativeAssets(formContainer, '../');

    const wrapper = document.createElement('div');
    wrapper.id = 'feedback-form-wrapper';
    wrapper.style.cssText = 'padding: 20px; max-height: calc(100vh - 100px); overflow-y: auto;';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
    header.innerHTML = `
      <h2 style="margin: 0; color: #333;">Adicionar Feedback</h2>
      <button id="btnVoltarFeedbacks" type="button" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
        ← Voltar
      </button>
    `;

    wrapper.appendChild(header);

    const formClone = formContainer.cloneNode(true);
    const form = formClone.querySelector('form#feedbackForm');
    if (form) {
      form.id = 'feedbackFormDetalhes';
      const obraInput = form.querySelector('#obra');
      if (obraInput) {
        obraInput.value = obraTitulo;
        obraInput.readOnly = true;
      }
      const listagemBtn = form.querySelector('a[href*="listagem"]');
      if (listagemBtn) listagemBtn.remove();
    }

    wrapper.appendChild(formClone);

    // injeta estilos de maneira isolada (se houver links)
    const styleHrefs = collectExternalStyleHrefs(doc, '../css/');
    await injectStylesIntoContainer(wrapper, styleHrefs);

    detalhesContent.innerHTML = '';
    detalhesContent.appendChild(wrapper);

    setupFeedbackFormListeners(obraTitulo);
  } catch (e) {
    detalhesContent.innerHTML = '<div class="detalhes-card"><p>Não foi possível carregar o formulário de feedback.</p></div>';
    console.error('Erro ao carregar formulário:', e);
  }
}

async function injectStylesIntoContainer(container, hrefs) {
  if (!container || !hrefs || !hrefs.length) return;
  const containerId = container.id || 'feedback-form-wrapper';

  const stylePromises = hrefs.map(async (href) => {
    try {
      const res = await fetch(href);
      if (!res.ok) return null;
      let cssText = await res.text();

      // scope minimal para evitar conflito com a página
      cssText = scopeCSS(cssText, `#${containerId}`);

      const styleEl = document.createElement('style');
      styleEl.textContent = cssText;
      return styleEl;
    } catch (e) {
      console.error('Falha ao importar CSS:', href, e);
      return null;
    }
  });

  const styles = await Promise.all(stylePromises);
  styles.forEach(style => { if (style) container.insertBefore(style, container.firstChild); });
}

function scopeCSS(css, scopeSelector) {
  let scoped = css
    .replace(/^\*\s*\{[^}]*\}/gm, '')
    .replace(/^body\s*\{[^}]*\}/gm, function(match) {
      const textProps = match.match(/(font-family|color|font-size|line-height):[^;]+/g);
      if (textProps && textProps.length > 0) return scopeSelector + ' { ' + textProps.join('; ') + ' }';
      return '';
    })
    .replace(/^html\s*\{[^}]*\}/gm, '')
    .replace(/(^|\n)(\.[a-zA-Z][a-zA-Z0-9_-]*|#[a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g, function(match, before, selector) {
      if (selector.indexOf(scopeSelector) !== -1) return match;
      return before + scopeSelector + ' ' + selector + ' {';
    });

  return scoped;
}

function setupFeedbackFormListeners(obraTitulo) {
  const form = document.getElementById('feedbackFormDetalhes');
  if (!form) return;

  const searchCpfBtn = form.querySelector('#searchCpfBtn');
  const cpfInput = form.querySelector('#cpf');
  const nomeInput = form.querySelector('#nome');
  const emailInput = form.querySelector('#email');
  const btnVoltar = document.getElementById('btnVoltarFeedbacks');
  const btnCancelar = form.querySelector('.btn.btn-secondary') || form.querySelector('a[href*="listagem"]');

  // formatação CPF
  if (cpfInput) {
    cpfInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.substring(0, 11);
      if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      e.target.value = value;
    });
  }

  if (searchCpfBtn && cpfInput) {
    searchCpfBtn.addEventListener('click', async () => {
      const cpf = cpfInput.value;
      if (!cpf || cpf.length < 14) {
        alert('Por favor, digite um CPF válido.');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/cidadaos');
        if (!response.ok) throw new Error('Erro ao buscar cidadãos.');
        const cidadaos = await response.json();
        const cidadao = cidadaos.find((c) => c.dadosPessoais.cpf === cpf);

        if (cidadao) {
          nomeInput.value = cidadao.dadosPessoais.nomeCompleto.trim();
          emailInput.value = cidadao.contato.email;
          alert('Cidadão encontrado e dados preenchidos!');
        } else {
          alert('CPF não encontrado. Verifique o CPF ou cadastre-se primeiro.');
          nomeInput.value = '';
          emailInput.value = '';
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível conectar ao banco de dados para verificar o CPF.');
      }
    });
  }

  const voltarParaFeedbacks = async () => {
    if (currentObraDetalhe) {
      const tabsContainer = detalhesContent.querySelector('.tabs');
      if (!tabsContainer) {
        await showDetalhesSidebar(currentObraDetalhe);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const tabPublicacoes = document.querySelector('.tab[data-tab="publicacoes"]');
    if (tabPublicacoes) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tabPublicacoes.classList.add('active');
      const publicacoesContent = document.getElementById('publicacoes');
      if (publicacoesContent) {
        publicacoesContent.classList.add('active');
        await loadPublicacoesContent();
      }
    } else {
      if (currentObraDetalhe) {
        await showDetalhesSidebar(currentObraDetalhe);
        await new Promise(resolve => setTimeout(resolve, 200));
        const tabPub = document.querySelector('.tab[data-tab="publicacoes"]');
        if (tabPub) tabPub.click();
      }
    }
  };

  if (btnVoltar) btnVoltar.addEventListener('click', voltarParaFeedbacks);
  if (btnCancelar) btnCancelar.addEventListener('click', (e) => { e.preventDefault(); voltarParaFeedbacks(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!nomeInput || !nomeInput.value || !emailInput || !emailInput.value) {
      alert('Por favor, busque e valide seu CPF antes de enviar.');
      return;
    }

    const anexoInput = form.querySelector('#anexo');
    const anexo = anexoInput && anexoInput.files.length > 0 ? `img/${anexoInput.files[0].name}` : null;

    const formData = {
      obra: form.querySelector('#obra').value,
      nome: nomeInput.value,
      cpf: cpfInput.value,
      email: emailInput.value,
      tipo: form.querySelector('#tipo').value,
      titulo: form.querySelector('#titulo').value,
      descricao: form.querySelector('#descricao').value,
      dataEnvio: new Date().toISOString(),
      anexo: anexo,
      likes: 0,
      dislikes: 0
    };

    try {
      const response = await fetch('http://localhost:3000/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erro ao enviar os dados.');

      alert('Feedback enviado com sucesso!');
      form.reset();

      voltarParaFeedbacks();
      setTimeout(() => { loadPublicacoesContent(); }, 100);
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao enviar. Tente novamente.');
    }
  });
}

function getTipoColor(tipo) {
  const tipoLower = (tipo || '').toLowerCase();
  if (tipoLower === 'elogio') return '#4CAF50';
  if (tipoLower === 'reclamacao') return '#F44336';
  if (tipoLower === 'sugestao') return '#FFC107';
  return '#2196F3';
}

function formatTipo(tipo) {
  const tipoLower = (tipo || '').toLowerCase();
  if (tipoLower === 'elogio') return 'Elogio';
  if (tipoLower === 'reclamacao') return 'Reclamação';
  if (tipoLower === 'sugestao') return 'Sugestão';
  return tipo || 'Geral';
}

function formatFeedbackDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

function fixRelativeAssets(rootEl, basePath = '../') {
  if (!rootEl) return;
  // Ajusta src/href que não são absolutos para usar a estrutura raiz (../)
  rootEl.querySelectorAll('[src]').forEach(el => {
    const src = el.getAttribute('src');
    if (src && !/^https?:\/\//i.test(src) && !src.startsWith('/')) {
      el.setAttribute('src', basePath + src.replace(/^\.\//, ''));
    }
  });
  rootEl.querySelectorAll('[href]').forEach(el => {
    const href = el.getAttribute('href');
    if (href && !/^https?:\/\//i.test(href) && !href.startsWith('/') && !href.startsWith('#')) {
      el.setAttribute('href', basePath + href.replace(/^\.\//, ''));
    }
  });
  // remove headers internos que podem vir ao injetar HTML
  rootEl.querySelectorAll('header').forEach(h => h.remove());
}

function collectExternalStyleHrefs(sourceDoc, basePath = '../css/') {
  if (!sourceDoc) return [];
  const links = Array.from(sourceDoc.querySelectorAll('link[rel="stylesheet"][href]'));
  return links.map(link => {
    let href = link.getAttribute('href');
    if (!href) return null;
    if (!/^https?:\/\//i.test(href) && !href.startsWith('/')) href = basePath + href.replace(/^\.\//, '');
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

      if (tab.dataset.tab === 'timeline') loadTimelineContent();
      else if (tab.dataset.tab === 'publicacoes') loadPublicacoesContent();
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
    if (marco.percentual != null) marcoEl.setAttribute('data-porcentagem', marco.percentual);
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
