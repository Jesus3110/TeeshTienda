import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RutaProtegidaPorRol = ({ children, rolesPermitidos = [] }) => {
  const { usuario } = useContext(AuthContext);

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (!rolesPermitidos.includes(usuario.privilegios)) {
    return <Navigate to="/admin" />; // Redirige al dashboard si no tiene permiso
  }

  return children;
};

export default RutaProtegidaPorRol;
