// src/components/AdminLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import "../styles/dashboard.css";

const AdminLayout = () => {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2 className="logo">Admin</h2>
        <nav>
          <ul>
            <li><a href="/admin/perfil">Perfil</a></li>
            <li><a href="/admin">Datos</a></li>
            <li><a href="/admin/productos">Productos</a></li>
            <li><a href="/admin/categorias">Categorias</a></li>
            <li><a href="/admin/usuarios">Usuarios</a></li>
            <li><a href="/admin/pedidos">Pedidos</a></li>
            <li><a href="/admin/banners">Banners</a></li>
            <li><a href="/admin/descuentos">Descuentos</a></li>
            <li><a href="/admin/ingresos">Ingresos</a></li>
            <li><a href="/">Cerrar sesion</a></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
