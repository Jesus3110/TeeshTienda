import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Producto from "./pages/Producto";
import Carrito from "./pages/Carrito";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import RutaAdmin from "./router/RutaAdmin";
import AdminLayout from "./components/AdminLayout";
import AdminPanel from "./pages/AdminPanel";
import Productos from "./pages/Productos";
import Pedidos from "./pages/Pedidos";
import Categorias from "./pages/Categorias";
import Usuarios from "./pages/Usuarios";
import Checkout from "./pages/Checkout"; 
import Banners from "./pages/Banners"; 
import Descuentos from "./pages/Descuentos"; 
import Historial from "./pages/HistorialPedidos";
import Perfil from "./pages/Perfil"; 
import CompletarPerfil from "./pages/CompletarPerfil";
import RutaProtegidaPorRol from "./router/RutaProtegidaPorRol";
import Ingresos from "./pages/Ingresos";





function App() {
  const location = useLocation();
  const ocultarNavbar = location.pathname.startsWith("/admin");

  return (
    <>
      {!ocultarNavbar && <Navbar />}

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/completar-perfil/:id" element={<CompletarPerfil />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/perfil" element={<Perfil />} />

        <Route
  path="/admin"
  element={
    <RutaAdmin>
      <AdminLayout />
    </RutaAdmin>
  }
>
  <Route index element={<AdminPanel />} />

  {/* Accesibles para todos los administradores */}
  <Route path="productos" element={<Productos />} />
  <Route path="categorias" element={<Categorias />} />
  <Route path="pedidos" element={<Pedidos />} />
  <Route path="banners" element={<Banners />} />
  <Route path="descuentos" element={<Descuentos />} />
  <Route path="historial" element={<Historial />} />
  <Route path="perfil" element={<Perfil />} />

  {/* Usuarios: solo god y premium */}
  <Route
    path="usuarios"
    element={
      <RutaProtegidaPorRol rolesPermitidos={["god", "premium"]}>
        <Usuarios />
      </RutaProtegidaPorRol>
    }
  />

  {/* Ingresos: solo god */}
  <Route
    path="ingresos"
    element={
      <RutaProtegidaPorRol rolesPermitidos={["god"]}>
        <Ingresos />
      </RutaProtegidaPorRol>
    }
  />
</Route>

      </Routes>
    </>
  );
}

export default App;
