import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getDatabase, ref, set, get } from "firebase/database";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
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
  const googleProvider = new GoogleAuthProvider();

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
    const userRef = red(db, `usuarios/${userId}`);
    
    const direccion = datos.calle ? 
      `${datos.calle} ${datos.numero}, ${datos.colonia}, ${datos.ciudad}, ${datos.estado}, CP ${datos.cp}` : 
      "Dirección no proporcionada";

    await set(userRef, {
      nombre: nombre || datos.nombre || "Usuario",
      correo: email,
      telefono: datos.telefono || "",
      direccion,
      imagen: imagenURL,
      rol: "cliente", // Por defecto todos son clientes
      activo: true
    });
  };

  const verificarRolYRedirigir = async (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${userId}/rol`);
    const snapshot = await get(userRef);
    const rol = snapshot.val() || "cliente"; // Por defecto cliente si no existe
    
    if (rol === "admin") {
      navigate("/admin");
    } else {
      navigate("/"); // O a la ruta que prefieras para usuarios normales
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

  const loginConGoogle = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Verificar si existe en la base de datos
      const db = getDatabase();
      const userRef = ref(db, `usuarios/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        if (modoRegistro) {
          await guardarUsuarioEnDB(
            user.uid, 
            user.email, 
            user.displayName || "Usuario", 
            user.photoURL || "/img/user-default.png"
          );
        } else {
          setError("No existe una cuenta con Google. Regístrate primero.");
          await auth.signOut();
          return;
        }
      }
      
      await verificarRolYRedirigir(user.uid);
    } catch (error) {
      console.error("Error con Google:", error);
      setError(error.message);
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

        {/* Botón de Google arriba */}
        {modoRegistro && (
          <div className="social-buttons">
            <button
              onClick={loginConGoogle}
              className="social-btn google-btn"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="social-icon" />
              Registrarse con Google
            </button>
          </div>
        )}

        <div className="auth-form-group">
          <label className="auth-label">Correo electrónico</label>
          <input
            className="auth-input"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          />
        </div>

        {modoRegistro && (
          <>
            <div className="auth-form-group">
              <label className="auth-label">Nombre completo</label>
              <input
                name="nombre"
                className="auth-input"
                placeholder="Ej. Juan Pérez"
                onChange={handleChange}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Teléfono</label>
              <input
                name="telefono"
                className="auth-input"
                placeholder="Ej. 5551234567"
                onChange={handleChange}
              />
            </div>

            <div className="address-section">
              <h3 className="address-title">Dirección de envío</h3>

              <div className="address-row">
                <div className="address-field">
                  <label className="address-label">Calle</label>
                  <input
                    name="calle"
                    className="address-input"
                    placeholder="Calle"
                    onChange={handleChange}
                  />
                </div>
                <div className="address-field">
                  <label className="address-label">Número</label>
                  <input
                    name="numero"
                    className="address-input"
                    placeholder="Número"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="address-label">Colonia</label>
                <input
                  name="colonia"
                  className="address-input"
                  placeholder="Colonia"
                  onChange={handleChange}
                />
              </div>

              <div className="address-row">
                <div className="address-field">
                  <label className="address-label">Ciudad</label>
                  <input
                    name="ciudad"
                    className="address-input"
                    placeholder="Ciudad"
                    onChange={handleChange}
                  />
                </div>
                <div className="address-field">
                  <label className="address-label">Estado</label>
                  <input
                    name="estado"
                    className="address-input"
                    placeholder="Estado"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="address-label">Código Postal</label>
                <input
                  name="cp"
                  className="address-input"
                  placeholder="CP"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Foto de perfil (opcional)</label>
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

        {!modoRegistro && (
          <>
            <div className="auth-divider">
              <div className="auth-divider-line"></div>
              <span className="auth-divider-text">o</span>
              <div className="auth-divider-line"></div>
            </div>

            <div className="social-buttons">
              <button
                onClick={loginConGoogle}
                className="social-btn google-btn"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="social-icon" />
                Iniciar con Google
              </button>
            </div>
          </>
        )}

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