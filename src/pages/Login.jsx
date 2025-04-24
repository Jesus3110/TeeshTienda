import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getDatabase, ref, set, get } from "firebase/database";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [modoRegistro, setModoRegistro] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
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

  const guardarUsuarioEnDB = async (userId, email, nombre = "", imagenURL = "/img/user-default.png") => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${userId}`);
    
    const direccion = datos.calle ? 
      `${datos.calle} ${datos.numero}, ${datos.colonia}, ${datos.ciudad}, ${datos.estado}, CP ${datos.cp}` : 
      "Dirección no proporcionada";

    await set(userRef, {
      nombre: nombre || datos.nombre || "Usuario",
      correo: email,
      telefono: datos.telefono || "",
      direccion,
      imagen: imagenURL,
      rol: "cliente",
      activo: true
    });
  };

  const verificarRolYRedirigir = async (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${userId}/rol`);
    const snapshot = await get(userRef);
    const rol = snapshot.val() || "cliente";
    
    if (rol === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const registrar = async () => {
    try {
      setError("");
      if (!datos.nombre) {
        throw new Error("El nombre es requerido");
      }
      
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      let urlImagen = "/img/user-default.png";

      if (datos.imagen) {
        const storage = getStorage();
        const storageRef = sRef(storage, `usuarios/${uuidv4()}_${datos.imagen.name}`);
        await uploadBytes(storageRef, datos.imagen);
        urlImagen = await getDownloadURL(storageRef);
      }

      await guardarUsuarioEnDB(cred.user.uid, email, datos.nombre, urlImagen);
      setExito(true);
      setTimeout(() => verificarRolYRedirigir(cred.user.uid), 2000);
    } catch (error) {
      console.error("Error al registrar:", error);
      setError(error.message);
    }
  };

  const ingresar = async () => {
    try {
      setError("");
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await verificarRolYRedirigir(cred.user.uid);
    } catch (error) {
      console.error("Error al ingresar:", error);
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="auth-container">
      {exito && (
        <div className="modal-backdrop">
          <div className="modal-form">
            <h3>✅ ¡Registro exitoso!</h3>
            <p>Redirigiendo...</p>
          </div>
        </div>
      )}

      <div className="auth-card">
        <h2 className="auth-title">
          {modoRegistro ? "Registro de Cliente" : "Iniciar Sesión"}
        </h2>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form-group">
          <label className="auth-label">Correo electrónico</label>
          <input
            className="auth-input"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Contraseña</label>
          <input
            className="auth-input"
            placeholder="••••••••"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
        </div>

        {modoRegistro && (
          <>
            <div className="auth-form-group">
              <input
                name="nombre"
                className="auth-input"
                placeholder="Nombre completo"
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form-group">
              <input
                name="telefono"
                className="auth-input"
                placeholder="Teléfono"
                onChange={handleChange}
              />
            </div>

            <div className="address-section">
              <div className="address-row">
                <div className="address-field">
                  <input
                    name="calle"
                    className="address-input"
                    placeholder="Calle"
                    onChange={handleChange}
                  />
                </div>
                <div className="address-field">
                  <input
                    name="numero"
                    className="address-input"
                    placeholder="Número"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <input
                  name="colonia"
                  className="address-input"
                  placeholder="Colonia"
                  onChange={handleChange}
                />
              </div>

              <div className="address-row">
                <div className="address-field">
                  <input
                    name="ciudad"
                    className="address-input"
                    placeholder="Ciudad"
                    onChange={handleChange}
                  />
                </div>
                <div className="address-field">
                  <input
                    name="estado"
                    className="address-input"
                    placeholder="Estado"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <input
                  name="cp"
                  className="address-input"
                  placeholder="Código Postal"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Foto de perfil (opcional)</label>
              <input
                name="imagen"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="auth-file-input"
              />
            </div>
          </>
        )}

        <button
          onClick={modoRegistro ? registrar : ingresar}
          className="auth-submit-btn"
        >
          {modoRegistro ? "Registrarse" : "Iniciar sesión"}
        </button>

        <p className="auth-switch-text">
          {modoRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button 
            onClick={() => {
              setModoRegistro(!modoRegistro);
              setError("");
            }}
            className="auth-switch-btn"
          >
            {modoRegistro ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;