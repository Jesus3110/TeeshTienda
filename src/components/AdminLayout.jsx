import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


import {
  FaUser,
  FaDatabase,
  FaBox,
  FaTags,
  FaUsers,
  FaShoppingCart,
  FaImage,
  FaPercent,
  FaChartLine,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";
import "../styles/dashboard.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario } = useContext(AuthContext);


  const toggleSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  console.log(usuario);

  return (
    <div className={`dashboard ${sidebarOpen ? "sidebar-open" : ""}`}>
      <aside
        className="sidebar"
        onMouseEnter={toggleSidebar}
        onMouseLeave={closeSidebar}
      >
        
        <div className="top-section">
  {usuario && usuario.imagen ? (
    <img src={usuario.imagen} alt="Perfil" className="sidebar-avatar" />
  ) : (
    <div className="logo">A</div>
  )}
</div>

        <nav className="nav-links">
          <Link to="/admin/perfil">
            <FaUser />
            {sidebarOpen && <span>Perfil</span>}
          </Link>
          <Link to="/admin">
            <FaDatabase />
            {sidebarOpen && <span>Datos</span>}
          </Link>
          <Link to="/admin/productos">
            <FaBox />
            {sidebarOpen && <span>Productos</span>}
          </Link>
          <Link to="/admin/categorias">
            <FaTags />
            {sidebarOpen && <span>Categorías</span>}
          </Link>
          <Link to="/admin/usuarios">
            <FaUsers />
            {sidebarOpen && <span>Usuarios</span>}
          </Link>
          <Link to="/admin/pedidos">
            <FaShoppingCart />
            {sidebarOpen && <span>Pedidos</span>}
          </Link>
          <Link to="/admin/banners">
            <FaImage />
            {sidebarOpen && <span>Banners</span>}
          </Link>
          <Link to="/admin/descuentos">
            <FaPercent />
            {sidebarOpen && <span>Descuentos</span>}
          </Link>
          <Link to="/admin/ingresos">
            <FaChartLine />
            {sidebarOpen && <span>Ingresos</span>}
          </Link>
          <Link to="/admin/historial">
            <FaHistory />
            {sidebarOpen && <span>Historial</span>}
          </Link>
          <Link to="/">
            <FaSignOutAlt />
            {sidebarOpen && <span>Salir</span>}
          </Link>
        </nav>
      </aside>

      <main className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
