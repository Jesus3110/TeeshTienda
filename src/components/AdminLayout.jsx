import React, { useState, useContext } from "react";
import { Outlet, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // ✅ IMPORTANTE
import {
  FaUser, FaDatabase, FaBox, FaTags, FaUsers, FaShoppingCart,
  FaImage, FaPercent, FaChartLine, FaHistory, FaSignOutAlt,
} from "react-icons/fa";
import "../styles/dashboard.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario } = useContext(AuthContext);

  const toggleSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const cerrarSesion = () => {
    localStorage.removeItem("adminId");
    window.location.href = "/login";
  };

  const privilegios = usuario?.privilegios || "";

  return (
    <div className={`dashboard ${sidebarOpen ? "sidebar-open" : ""}`}>
      <aside
        className="sidebar"
        onMouseEnter={toggleSidebar}
        onMouseLeave={closeSidebar}
      >
        <div className="top-section">
          {usuario?.imagen ? (
            <img src={usuario.imagen} alt="Perfil" className="sidebar-avatar" />
          ) : (
            <div className="logo">A</div>
          )}
        </div>

        <nav className="nav-links">
          {/* Acceso común */}
          <Link to="/admin/perfil">
            <FaUser /> {sidebarOpen && <span>Perfil</span>}
          </Link>

          {/* Solo god y premium */}
          {["god", "premium"].includes(privilegios) && (
            <Link to="/admin">
              <FaDatabase /> {sidebarOpen && <span>Datos</span>}
            </Link>
          )}

          {/* Todos los niveles de admin */}
          <Link to="/admin/productos">
            <FaBox /> {sidebarOpen && <span>Productos</span>}
          </Link>
          <Link to="/admin/categorias">
            <FaTags /> {sidebarOpen && <span>Categorías</span>}
          </Link>
          <Link to="/admin/pedidos">
            <FaShoppingCart /> {sidebarOpen && <span>Pedidos</span>}
          </Link>
          <Link to="/admin/banners">
            <FaImage /> {sidebarOpen && <span>Banners</span>}
          </Link>
          <Link to="/admin/descuentos">
            <FaPercent /> {sidebarOpen && <span>Descuentos</span>}
          </Link>
          <Link to="/admin/historial">
            <FaHistory /> {sidebarOpen && <span>Historial</span>}
          </Link>

          {/* Solo god y premium */}
          {["god", "premium"].includes(privilegios) && (
            <Link to="/admin/usuarios">
              <FaUsers /> {sidebarOpen && <span>Usuarios</span>}
            </Link>
          )}

          {/* Solo god */}
          {privilegios === "god" && (
            <Link to="/admin/ingresos">
              <FaChartLine /> {sidebarOpen && <span>Ingresos</span>}
            </Link>
          )}

          <Link to="/login" onClick={cerrarSesion}>
            <FaSignOutAlt /> {sidebarOpen && <span>Salir</span>}
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
