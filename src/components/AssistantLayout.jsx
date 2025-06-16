import React, { useContext } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaComments, FaUser, FaSignOutAlt } from "react-icons/fa";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signOut } from "firebase/auth";
import "../styles/assistantLayout.css";

const AssistantLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const handleLogout = async () => {
    const db = getDatabase();
    const auth = getAuth();
  
    try {
      // 🔴 Marcar como offline en la base de datos
      if (usuario?.uid) {
        await set(ref(db, `usuarios/${usuario.uid}/online`), false);
      }
  
      // 🔐 Cerrar sesión de Firebase Auth
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  
    // 🧹 Limpiar localStorage y redirigir
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