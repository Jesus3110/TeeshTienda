import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/assistantLayout.css";

const AssistantLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    navigate("/login");
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
            💬 Chats Activos
          </Link>
          <Link
            to="/asistente/perfil"
            className={`menu-item ${location.pathname === "/asistente/perfil" ? "active" : ""}`}
          >
            👤 Mi Perfil
          </Link>
        </div>

        <button onClick={handleLogout} className="logout-button">
          🚪 Cerrar Sesión
        </button>
      </nav>

      <main className="assistant-main">
        {children}
      </main>
    </div>
  );
};

export default AssistantLayout; 