import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getDatabase, ref, set } from "firebase/database";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const registrar = async (rol = "cliente") => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const db = getDatabase();
      await set(ref(db, `usuarios/${cred.user.uid}`), {
        email,
        rol
      });
      navigate("/");
    } catch (error) {
      console.error("Error al registrar:", error.message);
    }
  };

  const ingresar = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      navigate("/");
    } catch (error) {
      console.error("Error al ingresar:", error.message);
    }
  };

  return (
    <div>
      <h2>Login / Registro</h2>
      <input
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Contraseña"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <br />
      <button onClick={ingresar}>Iniciar sesión</button>
      <br /><br />
      <p><strong>Registrarse como:</strong></p>
      <button onClick={() => registrar("cliente")}>Cliente</button>
      <button onClick={() => registrar("admin")}>Administrador</button>
    </div>
  );
}

export default Login;
