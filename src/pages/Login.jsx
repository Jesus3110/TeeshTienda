import React, { useState, useContext } from "react";
import { getDatabase, ref, set, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/login.css";
import { AuthContext } from "../context/AuthContext"; // ✅ Importa el contexto

function Login() {
  const { setUsuario, setRol } = useContext(AuthContext); // ✅ Usa el contexto
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [modoRegistro, setModoRegistro] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [modalInhabilitado, setModalInhabilitado] = useState(false);

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

  const guardarUsuarioEnDB = async (
    userId,
    email,
    nombre = "",
    imagenURL = "/img/user-default.png"
  ) => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${userId}`);

    const direccion = datos.calle
      ? `${datos.calle} ${datos.numero}, ${datos.colonia}, ${datos.ciudad}, ${datos.estado}, CP ${datos.cp}`
      : "Dirección no proporcionada";

    await set(userRef, {
      nombre: nombre || datos.nombre || "Usuario",
      correo: email,
      telefono: datos.telefono || "",
      direccion,
      imagen: imagenURL,
      rol: "cliente",
      activo: true,
      password: pass,
      primerInicio: false,
    });
  };

  const verificarRolYRedirigir = async (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `usuarios/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      localStorage.setItem("adminId", userId);
      setUsuario({ uid: userId, ...data });
      setRol(data.rol || null);

      if (data.rol === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      setError("Usuario no encontrado");
    }
  };

  const registrar = async () => {
    try {
      setError("");
      if (!datos.nombre) throw new Error("El nombre es requerido");

      const db = getDatabase();
      const userId = uuidv4();
      let urlImagen = "/img/default-user.png";

      if (datos.imagen) {
        const storage = getStorage();
        const storageRef = sRef(storage, `usuarios/${userId}_${datos.imagen.name}`);
        await uploadBytes(storageRef, datos.imagen);
        urlImagen = await getDownloadURL(storageRef);
      }

      await guardarUsuarioEnDB(userId, email, datos.nombre, urlImagen);
      setExito(true);
      setTimeout(() => verificarRolYRedirigir(userId), 2000);
    } catch (err) {
      console.error("Error al registrar:", err);
      setError("Hubo un error al registrar el usuario");
    }
  };

const ingresar = async () => {
  const db = getDatabase();
  const usuariosRef = ref(db, "usuarios");
  const snapshot = await get(usuariosRef);

  if (snapshot.exists()) {
    const usuarios = Object.entries(snapshot.val()).map(([id, u]) => ({
      id,
      ...u,
    }));

    const encontrado = usuarios.find(
      (u) => u.correo === email && u.password === pass
    );

    // 🚫 Si existe pero está inhabilitado
if (encontrado && !encontrado.activo) {
  setModalInhabilitado(true); // Abre el modal
  return;
}

    // ✅ Si está activo y coincide
    if (encontrado) {
      localStorage.setItem("adminId", encontrado.id);
      setUsuario({ uid: encontrado.id, ...encontrado });
      setRol(encontrado.rol || null);

      return encontrado.primerInicio
        ? navigate(`/completar-perfil/${encontrado.id}`)
        : navigate(encontrado.rol === "admin" ? "/admin" : "/");
    }
  }

  setError("Correo o contraseña incorrectos");
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
                <input
                  name="calle"
                  className="address-input"
                  placeholder="Calle"
                  onChange={handleChange}
                />
                <input
                  name="numero"
                  className="address-input"
                  placeholder="Número"
                  onChange={handleChange}
                />
              </div>

              <input
                name="colonia"
                className="address-input"
                placeholder="Colonia"
                onChange={handleChange}
              />

              <div className="address-row">
                <input
                  name="ciudad"
                  className="address-input"
                  placeholder="Ciudad"
                  onChange={handleChange}
                />
                <input
                  name="estado"
                  className="address-input"
                  placeholder="Estado"
                  onChange={handleChange}
                />
              </div>

              <input
                name="cp"
                className="address-input"
                placeholder="Código Postal"
                onChange={handleChange}
              />
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
      {modalInhabilitado && (
  <div className="modal-backdrop">
    <div className="modal-form">
      <h3>🚫 Cuenta inhabilitada</h3>
      <p>Tu cuenta ha sido desactivada por un administrador.</p>
      <p>Si crees que se trata de un error, por favor contacta con soporte:</p>
      <p style={{ fontWeight: "bold" }}>📧 soporte@mystore.com</p>
      <button
        onClick={() => setModalInhabilitado(false)}
        className="auth-submit-btn"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default Login;
