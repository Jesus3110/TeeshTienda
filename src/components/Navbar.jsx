import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

function Navbar() {
  const { usuario, rol } = useContext(AuthContext);

  const cerrarSesion = () => {
    signOut(auth);
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        {/* Cambia el texto según el rol */}
        <Link to="/">
          {rol === "admin" ? "Previsualización" : "Inicio"}
        </Link>

        {/* Opciones para cliente */}
        {rol !== "admin" && (
          <Link to="/carrito">Carrito</Link>
        )}

        {/* Opciones para admin */}
        {rol === "admin" && (
          <>
            <Link to="/admin">Admin</Link>
            <Link to="/pedidos">Pedidos</Link>
          </>
        )}

        {/* Botón de login o logout */}
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
