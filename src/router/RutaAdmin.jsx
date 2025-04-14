import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RutaAdmin = ({ children }) => {
  const { usuario, rol, loading } = useContext(AuthContext);

  if (loading) return <p>Cargando...</p>;
  if (!usuario || rol !== "admin") return <Navigate to="/" />;

  return children;
};

export default RutaAdmin;
