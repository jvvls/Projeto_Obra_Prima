import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CadastroCidadao from "./pages/CadastroCidadao";
import CadastroGestor from "./pages/CadastroGestor";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";

function Placeholder({ nome }: { nome: string }) {
  return <div className="p-8 text-neutral-900">{nome}</div>;
}

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
          <Route path="/main" element={<Placeholder nome="Main" />} />
          <Route path="/editor" element={<Placeholder nome="Editor" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
