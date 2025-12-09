const path = require("path");
const express = require("express");
const jsonServer = require("json-server");

const app = express();

// =============================
// 1. Servir o frontend (/public)
// =============================
app.use(express.static(path.join(__dirname, "public")));

// =============================
// 2. Configurar JSON Server
// =============================
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

app.use("/api", middlewares);
app.use("/api", router);

// =============================
// 3. Porta obrigatória do Render
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
