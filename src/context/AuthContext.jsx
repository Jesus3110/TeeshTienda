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
        setUsuario(user);
        const db = getDatabase();
        const snap = await get(ref(db, `usuarios/${user.uid}/rol`));
        setRol(snap.val());
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
