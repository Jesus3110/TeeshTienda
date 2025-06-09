import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RutaAsistente = ({ children }) => {
  const { usuario, rol, loading } = useContext(AuthContext);

  // Mostrar un estado de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Cargando...
      </div>
    );
  }

  // Redirigir al login si no hay usuario
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir al inicio si el usuario no es asistente
  if (rol !== "asistente") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RutaAsistente; 