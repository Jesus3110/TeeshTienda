import React, { createContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue, get, set } from "firebase/database";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    // Intenta restaurar usuario desde localStorage
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });
  const [rol, setRol] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      try {
        const user = JSON.parse(usuarioGuardado);
        return user.rol || null;
      } catch {
        return null;
      }
    }
    return null;
  });
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
          // Guarda usuario en localStorage
          localStorage.setItem("usuario", JSON.stringify({ uid: adminId, ...perfil }));
        } else {
          localStorage.removeItem("adminId");
          localStorage.removeItem("usuario");
          setUsuario(null);
          setRol(null);
        }
      } catch (error) {
        console.error("Error al cargar estado inicial:", error);
        localStorage.removeItem("adminId");
        localStorage.removeItem("usuario");
        setUsuario(null);
        setRol(null);
      }

      // Luego configuramos el listener para cambios en tiempo real
      const unsubscribe = onValue(
        ref(db, `usuarios/${adminId}`),
        (snapshot) => {
          if (snapshot.exists()) {
            const perfil = snapshot.val();
            const nuevoUsuario = { uid: adminId, ...perfil };
            // Solo actualiza si realmente cambió
            setUsuario(prev => {
              if (!prev || JSON.stringify(prev) !== JSON.stringify(nuevoUsuario)) {
                return nuevoUsuario;
              }
              return prev;
            });
            setRol(prevRol => {
              const nuevoRol = perfil.rol || null;
              if (prevRol !== nuevoRol) {
                return nuevoRol;
              }
              return prevRol;
            });
            // Actualiza usuario en localStorage solo si cambió
            const usuarioGuardado = localStorage.getItem("usuario");
            if (!usuarioGuardado || usuarioGuardado !== JSON.stringify(nuevoUsuario)) {
              localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
            }
          } else {
            localStorage.removeItem("adminId");
            localStorage.removeItem("usuario");
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

 // En tu AuthContext.js
const cerrarSesion = () => {
  return new Promise((resolve) => {
    const db = getDatabase();
    const adminId = localStorage.getItem("adminId");

    if (adminId) {
      const userOnlineRef = ref(db, `usuarios/${adminId}/online`);
      set(userOnlineRef, false).finally(() => {
        localStorage.removeItem("adminId");
        localStorage.removeItem("usuario");
        setUsuario(null);
        setRol(null);
        resolve(); // <-- ✅ importante
      });
    } else {
      localStorage.removeItem("adminId");
      localStorage.removeItem("usuario");
      setUsuario(null);
      setRol(null);
      resolve(); // <-- ✅ importante
    }
  });
};



  return (
    <AuthContext.Provider
      value={{
        usuario,
        rol,
        loading,
        setUsuario: (user) => {
          setUsuario(user);
          if (user) {
            localStorage.setItem("usuario", JSON.stringify(user));
          } else {
            localStorage.removeItem("usuario");
          }
        },
        setRol,
        actualizarSesion,
        cerrarSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
