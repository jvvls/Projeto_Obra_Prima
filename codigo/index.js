const path = require("path");
const express = require("express");
const jsonServer = require("json-server");

const app = express();

// 1. Frontend estático
app.use(express.static(path.join(__dirname, "public")));

// 2. JSON Server
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

app.use("/api", middlewares);
app.use("/api", router);

// 3. Porta Render
const PORT = process.env.PORT || 3000;

// 4. Fallback apenas quando a rota NÃO é arquivo real e NÃO é API
app.get("*", (req, res) => {
  // se a API existir, não intercepta
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });

  // se for um arquivo existente, deixe o express servir
  if (req.path.includes(".")) {
    return res.status(404).send("Arquivo não encontrado");
  }

  // fallback para o index.html na raiz de /public
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
