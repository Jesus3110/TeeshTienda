import React from "react";
import { Link } from "react-router-dom";
import { FiUser, FiShoppingCart, FiPackage, FiClock, FiLogOut } from "react-icons/fi";
import "../styles/sidebarCliente.css"; // crea este archivo

const ClienteLayout = ({ children }) => {
  return (
    <div className="cliente-layout">
      <aside className="sidebar-cliente">
        <div className="cliente-logo">🛍️ M&J</div>
        <nav>
            <Link to="/"><FiShoppingCart /> Tienda</Link>
          <Link to="/perfil"><FiUser /> Perfil</Link>
          <Link to="/carrito"><FiShoppingCart /> Carrito</Link>
          <Link to="/pedidos"><FiPackage /> Pedidos</Link>
          <Link to="/historial"><FiClock /> Historial</Link>
          <Link to="/login" onClick={() => localStorage.removeItem("adminId")}>
            <FiLogOut /> Cerrar sesión
          </Link>
        </nav>
      </aside>

      <main className="contenido-cliente">{children}</main>
    </div>
  );
};

export default ClienteLayout;
