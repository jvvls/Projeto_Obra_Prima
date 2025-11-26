// URLs da API
const API_URL_FEEDBACKS = 'http://localhost:3000/feedbacks';
const API_URL_CIDADAOS = 'http://localhost:3000/cidadaos';

// Elementos do Formulário
const feedbackForm = document.getElementById('feedbackForm');
const searchCpfBtn = document.getElementById('searchCpfBtn');
const cpfInput = document.getElementById('cpf');
const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');

// --- NOVO: Evento para buscar o Cidadão por CPF ---
searchCpfBtn.addEventListener('click', async () => {
  const cpf = cpfInput.value;
  if (!cpf || cpf.length < 14) {
    alert('Por favor, digite um CPF válido.');
    return;
  }

  try {
    // Busca no db.json por um cidadão com este CPF
    // A URL fica: http://localhost:3000/cidadaos?dadosPessoais.cpf=178.197.816-61
    // ATENÇÃO: json-server pode ter dificuldade com campos aninhados.
    // Vamos buscar TODOS e filtrar no front-end, é mais garantido.

    const response = await fetch(API_URL_CIDADAOS);
    if (!response.ok) throw new Error('Erro ao buscar cidadãos.');

    const cidadaos = await response.json();

    // Filtra pelo CPF exato
    const cidadao = cidadaos.find((c) => c.dadosPessoais.cpf === cpf);

    if (cidadao) {
      // Encontrou!
      nomeInput.value = cidadao.dadosPessoais.nomeCompleto.trim();
      emailInput.value = cidadao.contato.email;
      alert('Cidadão encontrado e dados preenchidos!');
    } else {
      // Não encontrou
      alert('CPF não encontrado. Verifique o CPF ou cadastre-se primeiro.');
      nomeInput.value = '';
      emailInput.value = '';
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Não foi possível conectar ao banco de dados para verificar o CPF.');
  }
});

// --- Evento de SUBMIT (Enviar Feedback) ---
feedbackForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Verifica se o nome e email foram preenchidos (após a busca)
  if (!nomeInput.value || !emailInput.value) {
    alert('Por favor, busque e valide seu CPF antes de enviar.');
    return;
  }

  const anexoInput = document.getElementById('anexo');
  // Simula o caminho do anexo como no db.json
  const anexo =
    anexoInput.files.length > 0 ? `img/${anexoInput.files[0].name}` : null;

  // Monta o objeto conforme a estrutura do db.json
  const formData = {
    obra: document.getElementById('obra').value,
    nome: nomeInput.value,
    cpf: cpfInput.value,
    email: emailInput.value,
    tipo: document.getElementById('tipo').value,
    titulo: document.getElementById('titulo').value,
    descricao: document.getElementById('descricao').value,
    dataEnvio: new Date().toISOString(), // Adiciona a data atual
    anexo: anexo,
  };

  try {
    const response = await fetch(API_URL_FEEDBACKS, {
      // URL correta
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error('Erro ao enviar os dados.');

    alert('Solicitação/Feedback enviado com sucesso!');
    feedbackForm.reset();
    window.location.href = '../html/listagemUsers.html';
  } catch (error) {
    console.error('Erro:', error);
    alert('Ocorreu um erro ao enviar. Tente novamente.');
  }
});

// --- Formatador de CPF (Seu código original, está correto) ---
document.getElementById('cpf').addEventListener('input', function (e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 11) value = value.substring(0, 11);

  if (value.length > 9) {
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (value.length > 6) {
    value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (value.length > 3) {
    value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  e.target.value = value;
});
