const API_BASE = 'http://localhost:3000';
const ENDPOINTS = {
  cidadao: 'cidadaos',
  gestor: 'usuarios'
};

const HOME_URL = '/public/home.html';
const loginForm = document.getElementById('loginForm');
const profileSelect = document.getElementById('profile');
const identifierInput = document.getElementById('identifier');
const passwordInput = document.getElementById('password');
const statusBox = document.getElementById('loginStatus');

const setStatus = (message, variant = 'info') => {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.dataset.variant = variant;
};

async function handleLoginSubmit(event) {
  event.preventDefault();

  const profile = profileSelect.value;
  const identifier = identifierInput.value.trim();
  const password = passwordInput.value.trim();

  if (!identifier || !password) {
    setStatus('Preencha todos os campos antes de continuar.', 'error');
    return;
  }

  setStatus('Verificando credenciais...', 'info');

  try {
    const endpoint = ENDPOINTS[profile];
    const response = await fetch(`${API_BASE}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`Falha ao consultar ${endpoint}`);
    }

    const data = await response.json();
    const match = findMatch(profile, data, identifier, password);

    if (match) {
      persistSession(profile, match);
      setStatus(`Bem-vindo(a), ${match.nome || match.dadosPessoais?.nomeCompleto}!`, 'success');
      setTimeout(() => {
        // Uso da variável de caminho HOME_URL
        window.location.href = HOME_URL;
      }, 600);
      return;
    }

    setStatus('Credenciais não encontradas para o perfil selecionado.', 'error');
  } catch (error) {
    console.error(error);
    setStatus('Não foi possível validar o login. Verifique o servidor e tente novamente.', 'error');
  }
}

function findMatch(profile, data, identifier, password) {
  if (!Array.isArray(data)) return null;

  if (profile === 'cidadao') {
    const normalizedId = identifier.replace(/\D/g, '').toLowerCase();
    return data.find((cid) => {
      const cpf = cid.dadosPessoais?.cpf?.replace(/\D/g, '').toLowerCase();
      const email = cid.contato?.email?.toLowerCase();
      const storedPassword = cid.seguranca?.password;
      const matchesId = cpf === normalizedId || email === identifier.toLowerCase();
      const matchesPassword = storedPassword === password;
      return matchesId && matchesPassword;
    });
  }

  const loweredIdentifier = identifier.toLowerCase();
  return data.find((gestor) => {
    const login = gestor.login?.toLowerCase();
    const email = gestor.email?.toLowerCase();
    const storedPassword = gestor.senha;
    const matchesId = login === loweredIdentifier || email === loweredIdentifier;
    const matchesPassword = storedPassword === password;
    return matchesId && matchesPassword;
  });
}

function persistSession(profile, user) {
  const sessionData = {
    profile,
    id: user.id,
    nome: user.nome || user.dadosPessoais?.nomeCompleto || 'Usuário',
    email: user.email || user.contato?.email || '',
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('obraPrimaUser', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Falha ao salvar sessão:', error);
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLoginSubmit);
}