import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiShoppingCart,
  FiPackage,
  FiClock,
  FiLogOut,
  FiMenu,
  FiX
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import "../styles/sidebarCliente.css";

const ClienteLayout = ({ children }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { cerrarSesion } = useContext(AuthContext);

  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  const handleLogout = async () => {
    await cerrarSesion();             // 🔴 Marca offline, limpia contexto
    window.location.href = "/";       // 🔄 Redirige y recarga
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuAbierto(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="cliente-layout">
      {/* Botón hamburguesa visible solo en móvil */}
      <button className="btn-hamburguesa" onClick={toggleMenu}>
        {menuAbierto ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <aside className={`sidebar-cliente ${menuAbierto ? "mostrar" : ""}`}>
        <div className="cliente-logo">🛍️ M&J</div>
        <nav>
          <Link to="/" onClick={() => setMenuAbierto(false)}>
            <FiShoppingCart /> Tienda
          </Link>
          <Link to="/perfil" onClick={() => setMenuAbierto(false)}>
            <FiUser /> Perfil
          </Link>
          <Link to="/carrito" onClick={() => setMenuAbierto(false)}>
            <FiShoppingCart /> Carrito
          </Link>
          <Link to="/pedidos" onClick={() => setMenuAbierto(false)}>
            <FiPackage /> Pedidos
          </Link>
          <Link to="/historial" onClick={() => setMenuAbierto(false)}>
            <FiClock /> Historial
          </Link>
          <button className="logout-link" onClick={handleLogout}>
            <FiLogOut /> Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="contenido-cliente">{children}</main>
    </div>
  );
};

export default ClienteLayout;
