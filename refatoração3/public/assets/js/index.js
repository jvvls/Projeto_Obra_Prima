// Trabalho Interdisciplinar 1 - Aplicações Web
//
// Esse módulo implementa uma API RESTful baseada no JSONServer
// O servidor JSONServer fica hospedado na seguinte URL
// https://jsonserver.rommelpuc.repl.co/contatos
//
// Para montar um servidor para o seu projeto, acesse o projeto 
// do JSONServer no Replit, faça o FORK do projeto e altere o 
// arquivo db.json para incluir os dados do seu projeto.
//
// URL Projeto JSONServer: https://replit.com/@rommelpuc/JSONServer
//
// Autor: Rommel Vieira Carneiro
// Data: 03/10/2023

const jsonServer = require('json-server')
const path = require('path')
const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, '../db/db.json'))
  
// Para permitir que os dados sejam alterados, altere a linha abaixo
// colocando o atributo readOnly como false.
const middlewares = jsonServer.defaults({ 
  noCors: true,
  static: path.join(__dirname, '..')
})

server.use(middlewares)
server.use(router)

// Rota raiz redireciona para a página principal
server.get('/', (req, res) => {
  res.redirect('/html/index.html.html')
})

server.listen(3000, () => {
  console.log(`JSON Server is running em http://localhost:3000`)
  console.log(`Acesse http://localhost:3000/html/ para ver as páginas HTML`)
})