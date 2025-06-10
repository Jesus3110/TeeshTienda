import React, { createContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue, get } from "firebase/database";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualizador, setActualizador] = useState(0);

  // Efecto inicial para cargar el estado de autenticación
  useEffect(() => {
    const initAuth = async () => {
      const db = getDatabase();
      const adminId = localStorage.getItem("adminId");

      if (!adminId) {
        setUsuario(null);
        setRol(null);
        setLoading(false);
        return;
      }

      try {
        // Primero hacemos una carga inicial síncrona
        const snapshot = await get(ref(db, `usuarios/${adminId}`));
        if (snapshot.exists()) {
          const perfil = snapshot.val();
          setUsuario({ uid: adminId, ...perfil });
          setRol(perfil.rol || null);
        } else {
          localStorage.removeItem("adminId");
          setUsuario(null);
          setRol(null);
        }
      } catch (error) {
        console.error("Error al cargar estado inicial:", error);
        localStorage.removeItem("adminId");
        setUsuario(null);
        setRol(null);
      }

      // Luego configuramos el listener para cambios en tiempo real
      const unsubscribe = onValue(
        ref(db, `usuarios/${adminId}`),
        (snapshot) => {
          if (snapshot.exists()) {
            const perfil = snapshot.val();
            setUsuario({ uid: adminId, ...perfil });
            setRol(perfil.rol || null);
          } else {
            localStorage.removeItem("adminId");
            setUsuario(null);
            setRol(null);
          }
        },
        (error) => {
          console.error("Error en el listener de autenticación:", error);
        }
      );

      setLoading(false);
      return () => unsubscribe();
    };

    initAuth();
  }, [actualizador]);

  const actualizarSesion = () => {
    setActualizador(prev => prev + 1);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("adminId");
    setUsuario(null);
    setRol(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        rol,
        loading,
        setUsuario,
        setRol,
        actualizarSesion,
        cerrarSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
