import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Producto from "./pages/Producto";
import Carrito from "./pages/Carrito";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import RutaAdmin from "./router/RutaAdmin";
import Pedidos from "./pages/Pedidos";

function App() {
  const location = useLocation();
  const ocultarNavbar = location.pathname.startsWith("/admin");

  return (
    <>
      {!ocultarNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RutaAdmin>
              <AdminPanel />
            </RutaAdmin>
          }
        />
        <Route
          path="/pedidos"
          element={
            <RutaAdmin>
              <Pedidos />
            </RutaAdmin>
          }
        />
      </Routes>
    </>
  );
}

export default App;
