import React, { createContext, useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualizador, setActualizador] = useState(0); // ✅

  useEffect(() => {
    const db = getDatabase();
    const adminId = localStorage.getItem("adminId");

    if (!adminId) {
      setUsuario(null);
      setRol(null);
      setLoading(false);
      return;
    }

    const cargar = async () => {
      const snap = await get(ref(db, `usuarios/${adminId}`));
      if (snap.exists()) {
        const perfil = snap.val();
        setUsuario({ uid: adminId, ...perfil });
        setRol(perfil.rol || null);
      } else {
        setUsuario(null);
        setRol(null);
      }
      setLoading(false);
    };

    cargar();
  }, [actualizador]); // ✅ escucha cambios en adminId

  return (
    <AuthContext.Provider
      value={{ usuario, rol, loading, setUsuario, setRol, setActualizador }} // ✅ exporta setActualizador
    >
      {children}
    </AuthContext.Provider>
  );
};
