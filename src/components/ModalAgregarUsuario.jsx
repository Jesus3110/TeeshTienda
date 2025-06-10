import React, { useState } from "react";
import { getDatabase, ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { enviarCorreoAdmin } from "../utils/emailService"; // <- Asegúrate de implementar esto
import "../styles/modal.css";
import bcrypt from "bcryptjs"; // 👈 Importar bcryptjs


const ModalAgregarUsuario = ({ onClose }) => {
  const [correoDestino, setCorreoDestino] = useState("");
  const [nivel, setNivel] = useState("estandar");
  const [subiendo, setSubiendo] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
const [apellido, setApellido] = useState("");
const [rol, setRol] = useState("admin");


const generarCorreo = () => {
  const limpio = (str) =>
    str.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nombreLimpio = limpio(nombre);
  const apellidoLimpio = limpio(apellido);
  const dominio = rol === "admin" ? "adminmjshop.com" : "asistente.mjshop.com";
  return `${nombreLimpio}.${apellidoLimpio}@${dominio}`;
};


  const generarPassword = () => {
    return Math.random().toString(36).slice(-10) + "A1!";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correoDestino) return setError("Debes ingresar un correo destino");

    const correo = generarCorreo();
    const rawPassword = generarPassword();
const hashedPassword = await bcrypt.hash(rawPassword, 10); // 10 es el "salt rounds"


    setSubiendo(true);
    try {
      const db = getDatabase();
      const newRef = ref(db, `usuarios/${uuidv4()}`);
      await set(newRef, {
  correo,
  password : hashedPassword,
  rol: rol,
  privilegios: rol === "admin" ? nivel : "asistente",
  primerInicio: true,
  activo: true,
  nombre,
  apellido,
});


      await enviarCorreoAdmin(
  correoDestino,       // a quién se lo mandas (no se usa en plantilla)
  correo,              // correo generado para el nuevo admin
  rawPassword,            // contraseña generada
  `${nombre} ${apellido}` // nombre completo
);



      setExito(true);
    } catch (err) {
      setError(`Error al crear ${rol}`);
      console.error(err);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        {exito ? (
          <>
            <h3 className="modal-title">✅ {rol === "admin" ? "Admin" : "Asistente"} creado y correo enviado</h3>
            <button className="btn-red" onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="modal-title">Crear nuevo {rol === "admin" ? "Administrador" : "Asistente"}</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">Nombre:</label>
              <input
                name="nombre"
                id="nombre"
                placeholder="Nombre"
                onChange={(e) => setNombre(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="apellido">Apellido:</label>
              <input
                name="apellido"
                id="apellido"
                placeholder="Apellido"
                onChange={(e) => setApellido(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="correoDestino">Correo destino para enviar credenciales:</label>
              <input
                name="correoDestino"
                id="correoDestino"
                placeholder="Correo destino para enviar credenciales"
                onChange={(e) => setCorreoDestino(e.target.value)}
                type="email"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de usuario:</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="form-input">
                <option value="admin">Administrador</option>
                <option value="asistente">Asistente de atención al cliente</option>
              </select>
            </div>
            {rol === "admin" && (
              <div className="form-group">
                <label className="form-label">Privilegios:</label>
                <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="form-input">
                  <option value="god">Admin God (acceso total)</option>
                  <option value="premium">Admin Premium (sin ingresos)</option>
                  <option value="estandar">Admin Estándar (limitado)</option>
                </select>
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button type="submit" disabled={subiendo} className="btn-red">
                {subiendo ? "Creando..." : "Registrar"}
              </button>
              <button type="button" onClick={onClose} className="btn-table btn-delete">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalAgregarUsuario;
