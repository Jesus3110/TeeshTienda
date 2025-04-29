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
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/perfil" element={<Perfil />} />

        {/* Rutas admin anidadas con layout */}
        <Route
          path="/admin"
          element={
            <RutaAdmin>
              <AdminLayout />
            </RutaAdmin>
          }
        >
          <Route index element={<AdminPanel />} />
          <Route path="productos" element={<Productos />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="banners" element={<Banners />} />
          <Route path="descuentos" element={<Descuentos />} />
          <Route path="historial" element={<Historial />} />
          <Route path="perfil" element={<Perfil />} />
          {/* Agrega aquí más subrutas */}
        </Route>
      </Routes>
    </>
  );
}

export default App;
