import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RutaProtegidaCliente = ({ children }) => {
  const { usuario, rol } = useContext(AuthContext);

  if (!usuario || rol !== "cliente") {
    return <Navigate to="/login" />;
  }

  return children;
};

export default RutaProtegidaCliente;
