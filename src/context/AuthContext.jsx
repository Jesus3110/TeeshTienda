import React, { createContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualizador, setActualizador] = useState(0);

  useEffect(() => {
    const db = getDatabase();
    const adminId = localStorage.getItem("adminId");
    let unsubscribe = null;

    const handleAuthChange = (snapshot) => {
      if (snapshot.exists()) {
        const perfil = snapshot.val();
        setUsuario({ uid: adminId, ...perfil });
        setRol(perfil.rol || null);
      } else {
        // Si el usuario no existe en la base de datos, limpiar la sesión
        localStorage.removeItem("adminId");
        setUsuario(null);
        setRol(null);
      }
      setLoading(false);
    };

    if (!adminId) {
      setUsuario(null);
      setRol(null);
      setLoading(false);
      return;
    }

    // Usar onValue en lugar de get para mantener una suscripción activa
    unsubscribe = onValue(ref(db, `usuarios/${adminId}`), handleAuthChange, (error) => {
      console.error("Error al verificar autenticación:", error);
      setLoading(false);
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [actualizador]); // Mantener actualizador para forzar recargas cuando sea necesario

  return (
    <AuthContext.Provider
      value={{ 
        usuario, 
        rol, 
        loading, 
        setUsuario, 
        setRol, 
        setActualizador 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
