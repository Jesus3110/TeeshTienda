import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import "../styles/navbar.css"; // Asegúrate de tener estilos

function Navbar() {
  const { usuario, rol } = useContext(AuthContext);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarSesion = () => {
    signOut(auth);
  };

  if (rol === "cliente") {
    return (
      <nav className="navbar-cliente">
        <div className="logo">
          <Link to="/"></Link>
        </div>

        <div className="hamburguesa" onClick={() => setMenuAbierto(!menuAbierto)}>
          ☰
        </div>

        {menuAbierto && (
          <ul className="menu-cliente">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/perfil">👤 Perfil</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
            <li><Link to="/pedidos">🛒 Pedidos</Link></li>
            <li><Link to="/historial">📦 Historial</Link></li>
            <li><Link to="/tarjeta">💳 Datos de tarjeta</Link></li>
            <li><button onClick={cerrarSesion}>🚪 Cerrar sesión</button></li>
          </ul>
        )}
      </nav>
    );
  }

  // Navbar default para otros roles
  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Inicio</Link>
        {usuario ? (
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        ) : (
          <Link to="/login">Iniciar sesión</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
