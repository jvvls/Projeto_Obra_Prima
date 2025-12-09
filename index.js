const path = require("path");
const express = require("express");
const jsonServer = require("json-server");

const app = express();

// 1. FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// 2. BACKEND API (JSON SERVER)
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

app.use("/api", middlewares);
app.use("/api", router);

// 3. PORTA DO RENDER
const PORT = process.env.PORT || 3000;

// 4. FALLBACK APENAS para rotas que não têm arquivo
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
