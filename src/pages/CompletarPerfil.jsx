import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDatabase, ref, get, update } from "firebase/database";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import bcrypt from "bcryptjs";
import "../styles/completarperfil.css";
import { FiEye, FiEyeOff } from "react-icons/fi";

const CompletarPerfil = () => {
  const { setUsuario } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({
    nombre: "",
    telefono: "",
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    estado: "",
    cp: "",
    nuevaPass: "",
    confirmarPass: "",
    imagen: null,
  });
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const requisitos = {
    longitud: datos.nuevaPass.length >= 8,
    mayuscula: /[A-Z]/.test(datos.nuevaPass),
    minuscula: /[a-z]/.test(datos.nuevaPass),
    numero: /[0-9]/.test(datos.nuevaPass),
    especial: /[^A-Za-z0-9]/.test(datos.nuevaPass),
  };

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase();
      const snapshot = await get(ref(db, `usuarios/${id}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDatos((prev) => ({ ...prev, nombre: data.nombre || "" }));
      } else {
        setError("Usuario no encontrado");
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setDatos((prev) => ({ ...prev, imagen: files[0] }));
    } else {
      setDatos((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (datos.nuevaPass && datos.nuevaPass !== datos.confirmarPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const db = getDatabase();
      let imagenURL = "/img/user-default.png";

      if (datos.imagen) {
        const storage = getStorage();
        const storageRef = sRef(
          storage,
          `usuarios/${uuidv4()}_${datos.imagen.name}`
        );
        await uploadBytes(storageRef, datos.imagen);
        imagenURL = await getDownloadURL(storageRef);
      }

      const direccion = {
  calle: datos.calle,
  numero: datos.numero,
  colonia: datos.colonia,
  ciudad: datos.ciudad,
  estado: datos.estado,
  cp: datos.cp,
};


      let hashedPassword = null;
      if (datos.nuevaPass) {
        hashedPassword = await bcrypt.hash(datos.nuevaPass, 10);
      }

      await update(ref(db, `usuarios/${id}`), {
        nombre: datos.nombre,
        telefono: datos.telefono,
        direccion,
        imagen: imagenURL,
        ...(hashedPassword && { password: hashedPassword }),
        primerInicio: false,
      });

      const userSnap = await get(ref(db, `usuarios/${id}`));
      if (userSnap.exists()) {
        const userData = userSnap.val();
        setUsuario({ uid: id, ...userData });
        localStorage.setItem("adminId", id);
      }

      setExito(true);
      setTimeout(() => navigate("/admin"), 1000);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el perfil.");
    }
  };

  const coincideConfirmacion =
    datos.nuevaPass && datos.nuevaPass === datos.confirmarPass;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Completa tu perfil</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {exito && (
          <p style={{ color: "green" }}>
            ✅ Perfil actualizado. Redirigiendo...
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            name="nombre"
            placeholder="Nombre"
            value={datos.nombre}
            onChange={handleChange}
            className="form-input"
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            value={datos.telefono}
            onChange={handleChange}
            className="form-input"
          />
          <div className="row">
            <input name="calle" placeholder="Calle" onChange={handleChange} className="form-input" />
            <input name="numero" placeholder="Número" onChange={handleChange} className="form-input" />
          </div>
          <input name="colonia" placeholder="Colonia" onChange={handleChange} className="form-input" />
          <input name="ciudad" placeholder="Ciudad" onChange={handleChange} className="form-input" />
          <input name="estado" placeholder="Estado" onChange={handleChange} className="form-input" />
          <input
            name="cp"
            placeholder="Código Postal"
            onChange={handleChange}
            className="form-input"
          />

          <div style={{ position: "relative" }}>
            <input
              type={mostrarPass ? "text" : "password"}
              name="nuevaPass"
              placeholder="Nueva Contraseña"
              onChange={handleChange}
              value={datos.nuevaPass}
              className={
                datos.nuevaPass
                  ? Object.values(requisitos).every(Boolean)
                    ? "valid"
                    : "invalid"
                  : ""
              }
            />

            <span
              onClick={() => setMostrarPass(!mostrarPass)}
              style={{
                position: "absolute",
                right: 10,
                top: "30%",
                cursor: "pointer",
              }}
              className="toggle-password"
            >
              {mostrarPass ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          <div className="password-rules">
            <span className={requisitos.longitud ? "valid" : ""}>
              Mínimo 8 caracteres
            </span>
            <span className={requisitos.mayuscula ? "valid" : ""}>
              Una letra mayúscula
            </span>
            <span className={requisitos.minuscula ? "valid" : ""}>
              Una letra minúscula
            </span>
            <span className={requisitos.numero ? "valid" : ""}>Un número</span>
            <span className={requisitos.especial ? "valid" : ""}>
              Un carácter especial
            </span>
          </div>

          <label>Confirmar Contraseña</label>
          <div style={{ position: "relative" }}>
            <input
              type={mostrarConfirmar ? "text" : "password"}
              name="confirmarPass"
              placeholder="Confirmar contraseña"
              value={datos.confirmarPass}
              onChange={handleChange}
              className={
                datos.confirmarPass
                  ? coincideConfirmacion
                    ? "valid"
                    : "invalid"
                  : ""
              }
            />
            <span
              onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
              style={{
                position: "absolute",
                right: 10,
                top: "30%",
                cursor: "pointer",
              }}
              className="toggle-password"
            >
              {mostrarConfirmar ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          <label>Foto de perfil (opcional)</label>
          <input
            name="imagen"
            type="file"
            accept="image/*"
            onChange={handleChange}
          />

          <button className="guardabtn" type="submit">Guardar</button>
        </form>
      </div>
    </div>
  );
};

export default CompletarPerfil;
