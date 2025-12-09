const path = require("path");
const express = require("express");
const jsonServer = require("json-server");

const app = express();

// 1. SERVE FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// 2. JSON SERVER EM /api
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

app.use("/api", middlewares);
app.use("/api", router);

// 3. PORTA DO RENDER
const PORT = process.env.PORT || 3000;

// 4. FALLBACK PARA O index.html  (🚨 importante)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
