const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path"); // <-- NOVO: Módulo de caminhos
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const DATA_PATH = "./feedback.json";

// ************************************************
// CORREÇÃO: Serve arquivos estáticos a partir da pasta raiz do seu projeto.
// Isso permite que o navegador encontre arquivos como /codigo/lucas/sprint02/index.html
app.use(express.static(path.join(__dirname, '')));
// ************************************************

function readFeedbacks() {
// ... (restante da sua função readFeedbacks)
}
// ... (restante do código)

app.get("/", (req, res) => {
  // Redireciona a rota raiz para sua tela de cadastro
  res.redirect("/codigo/lucas/sprint02/index.html"); 
});

// ... (restante das suas rotas de API: /feedbacks, /feedbacks/:id, etc.)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});