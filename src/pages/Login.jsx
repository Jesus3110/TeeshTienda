import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getDatabase, ref, set, get } from "firebase/database";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [modoRegistro, setModoRegistro] = useState(false);
  const [exito, setExito] = useState(false);
  const [datos, setDatos] = useState({
    nombre: "",
    telefono: "",
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    estado: "",
    cp: "",
    imagen: null,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setDatos((prev) => ({ ...prev, imagen: files[0] }));
    } else {
      setDatos((prev) => ({ ...prev, [name]: value }));
    }
  };

  const registrar = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      let urlImagen = "/img/user-default.png"; // ✅ Imagen por defecto

      if (datos.imagen) {
        const storage = getStorage();
        const storageRef = sRef(storage, `usuarios/${uuidv4()}_${datos.imagen.name}`);
        await uploadBytes(storageRef, datos.imagen);
        urlImagen = await getDownloadURL(storageRef);
      }

      const direccion = `${datos.calle} ${datos.numero}, ${datos.colonia}, ${datos.ciudad}, ${datos.estado}, CP ${datos.cp}`;

      const db = getDatabase();
      const newRef = ref(db, `usuarios/${cred.user.uid}`);
      await set(newRef, {
        nombre: datos.nombre,
        correo: email,
        telefono: datos.telefono,
        direccion,
        imagen: urlImagen,
        rol: "cliente",
        activo: true
      });

      setExito(true);
      setTimeout(() => {
        setExito(false);
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error al registrar:", error.message);
    }
  };

  const ingresar = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const db = getDatabase();
      const rolRef = ref(db, `usuarios/${cred.user.uid}/rol`);
      const snap = await get(rolRef);
      const rol = snap.val();

      if (rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error al ingresar:", error.message);
    }
  };

  return (
    <div className="login-page">
      {exito && (
        <div className="modal-backdrop">
          <div className="modal-form">
            <h3>✅ ¡Registro exitoso!</h3>
            <p>Redirigiendo...</p>
          </div>
        </div>
      )}

      {!exito && (
        <>
          <h2>{modoRegistro ? "Registro de Cliente" : "Iniciar Sesión"}</h2>

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

          {modoRegistro && (
            <>
              <input name="nombre" placeholder="Nombre" onChange={handleChange} />
              <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
              <input name="calle" placeholder="Calle" onChange={handleChange} />
              <input name="numero" placeholder="Número" onChange={handleChange} />
              <input name="colonia" placeholder="Colonia" onChange={handleChange} />
              <input name="ciudad" placeholder="Ciudad" onChange={handleChange} />
              <input name="estado" placeholder="Estado" onChange={handleChange} />
              <input name="cp" placeholder="Código Postal" onChange={handleChange} />
              <input name="imagen" type="file" accept="image/*" onChange={handleChange} />
            </>
          )}

          <br />
          <button onClick={modoRegistro ? registrar : ingresar}>
            {modoRegistro ? "Registrarse" : "Iniciar sesión"}
          </button>

          <br />
          <p style={{ marginTop: "1rem" }}>
            {modoRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <button onClick={() => setModoRegistro(!modoRegistro)}>
              {modoRegistro ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default Login;
