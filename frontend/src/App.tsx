import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CadastroCidadao from "./pages/CadastroCidadao";
import CadastroGestor from "./pages/CadastroGestor";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import Main from "./pages/Main";
import EditorObras from "./pages/EditorObras";
import GestaoObras from "./pages/GestaoObras";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro/cidadao" element={<CadastroCidadao />} />
          <Route path="/cadastro/gestor" element={<CadastroGestor />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/obras/:id" element={<ObraDetalhe />} />
          <Route path="/main" element={<Main />} />
          <Route path="/editor" element={<EditorObras />} />
          <Route path="/gestor" element={<GestaoObras />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
