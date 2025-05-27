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
import { FiEye, FiEyeOff } from "react-icons/fi";
import bcrypt from "bcryptjs"; // al inicio del archivo

function Login() {
  const { setUsuario, setRol } = useContext(AuthContext); // ✅ Usa el contexto
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [modoRegistro, setModoRegistro] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [modalInhabilitado, setModalInhabilitado] = useState(false);
  const [confirmPass, setConfirmPass] = useState("");
  const [verConfirmPass, setVerConfirmPass] = useState(false);

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

   const direccion = {
  calle: datos.calle || "",
  numero: datos.numero || "",
  colonia: datos.colonia || "",
  ciudad: datos.ciudad || "",
  estado: datos.estado || "",
  cp: datos.cp || ""
};


await set(userRef, {
  nombre: nombre || datos.nombre || "Usuario",
  correo: email,
  telefono: datos.telefono || "",
  direccion,
  imagen: imagenURL,
  rol: "cliente",
  activo: true,
  password: await bcrypt.hash(pass, 10), // ← encripta aquí
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

  const validarPassword = (password) => {
    const requisitos = [
      { test: /.{8,}/, msg: "Mínimo 8 caracteres" },
      { test: /[A-Z]/, msg: "Una letra mayúscula" },
      { test: /[a-z]/, msg: "Una letra minúscula" },
      { test: /[0-9]/, msg: "Un número" },
      { test: /[^A-Za-z0-9]/, msg: "Un carácter especial" },
    ];

    const errores = requisitos
      .filter((r) => !r.test.test(password))
      .map((r) => r.msg);
    return errores;
  };

  const registrar = async () => {
    try {
      setError("");

      if (!datos.nombre) throw new Error("El nombre es requerido");

      const erroresPassword = validarPassword(pass);
      if (erroresPassword.length > 0) {
        throw new Error(
          "La contraseña no cumple con los requisitos:\n" +
            erroresPassword.join(", ")
        );
      }
      if (pass !== confirmPass) {
        throw new Error("Las contraseñas no coinciden");
      }

      const db = getDatabase();
      const userId = uuidv4();
      let urlImagen = "/img/default-user.png";

      if (datos.imagen) {
        const storage = getStorage();
        const storageRef = sRef(
          storage,
          `usuarios/${userId}_${datos.imagen.name}`
        );
        await uploadBytes(storageRef, datos.imagen);
        urlImagen = await getDownloadURL(storageRef);
      }

      await guardarUsuarioEnDB(userId, email, datos.nombre, urlImagen);
      setExito(true);
      setTimeout(() => verificarRolYRedirigir(userId), 2000);
    } catch (err) {
      console.error("Error al registrar:", err);
      setError(err.message || "Hubo un error al registrar el usuario");
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

      const encontrado = usuarios.find((u) => u.correo === email);

if (encontrado) {
  const passwordValida = await bcrypt.compare(pass, encontrado.password);

  if (!passwordValida) {
    setError("Correo o contraseña incorrectos");
    return;
  }

  if (!encontrado.activo) {
    setModalInhabilitado(true);
    return;
  }

  localStorage.setItem("adminId", encontrado.id);
  setUsuario({ uid: encontrado.id, ...encontrado });
  setRol(encontrado.rol || null);

  return encontrado.primerInicio
    ? navigate(`/completar-perfil/${encontrado.id}`)
    : navigate(encontrado.rol === "admin" ? "/admin" : "/");
}


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
          <input
            className="auth-input"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="auth-form-group">
          <div className="password-wrapper">
            <input
              className="auth-input"
              type={verPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setVerPassword(!verPassword)}
            >
              {verPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
        </div>

        {modoRegistro && (
          <>
            <ul className="password-requisitos">
              {validarPassword(pass).map((msg, i) => (
                <li key={i} className="requisito-incumplido">
                  ❌ {msg}
                </li>
              ))}
              {validarPassword(pass).length === 0 && (
                <li className="requisito-ok">✅ Contraseña válida</li>
              )}
            </ul>

            <div className="auth-form-group">
              <label className="auth-label">Confirmar Contraseña</label>
              <div className="password-wrapper">
                <input
                  className={`auth-input ${
                    confirmPass && confirmPass !== pass ? "error" : ""
                  }`}
                  type={verConfirmPass ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setVerConfirmPass(!verConfirmPass)}
                >
                  {verConfirmPass ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>  
            </div>

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
            <p>
              Si crees que se trata de un error, por favor contacta con soporte:
            </p>
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
