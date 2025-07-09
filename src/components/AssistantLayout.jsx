import React, { useContext } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaComments, FaUser, FaSignOutAlt } from "react-icons/fa";
import "../styles/assistantLayout.css";

const AssistantLayout = ({ children }) => {
  const location = useLocation();
  const { usuario, cerrarSesion } = useContext(AuthContext);

  const handleLogout = async () => {
    await cerrarSesion();         // Marca como offline y limpia contexto
    window.location.href = "/";   // Recarga limpia y asegura el Navbar
  };

  return (
    <div className="assistant-layout">
      <nav className="assistant-sidebar">
        <div className="assistant-profile">
          <img
            src={usuario?.imagen || "/img/default-user.png"}
            alt="Perfil"
            className="assistant-avatar"
          />
          <span className="assistant-name">{usuario?.nombre || "Asistente"}</span>
        </div>

        <div className="assistant-menu">
          <Link
            to="/asistente"
            className={`menu-item ${location.pathname === "/asistente" ? "active" : ""}`}
          >
            <FaComments style={{ marginRight: 8 }} /> Chats Activos
          </Link>
          <Link
            to="/asistente/perfil"
            className={`menu-item ${location.pathname === "/asistente/perfil" ? "active" : ""}`}
          >
            <FaUser style={{ marginRight: 8 }} /> Mi Perfil
          </Link>
        </div>

        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt style={{ marginRight: 8 }} /> Cerrar Sesión
        </button>
      </nav>

      <main className="assistant-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AssistantLayout;
