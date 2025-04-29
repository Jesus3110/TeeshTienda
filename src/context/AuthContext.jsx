import React, { createContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const db = getDatabase();
        const perfilRef = ref(db, `usuarios/${user.uid}`);
        const snap = await get(perfilRef);

        if (snap.exists()) {
          const perfil = snap.val();
          // Combinas los datos de Firebase Auth con los datos de tu base de datos
          setUsuario({ ...user, ...perfil });
          setRol(perfil.rol || null);
        } else {
          setUsuario(user);
          setRol(null);
        }
      } else {
        setUsuario(null);
        setRol(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, rol, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
