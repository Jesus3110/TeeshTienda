import React, { useState } from "react";
import { getDatabase, ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { enviarCorreoAdmin } from "../utils/emailService"; // <- Asegúrate de implementar esto
import "../styles/modal.css";

const ModalAgregarUsuario = ({ onClose }) => {
  const [correoDestino, setCorreoDestino] = useState("");
  const [nivel, setNivel] = useState("estandar");
  const [subiendo, setSubiendo] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
const [apellido, setApellido] = useState("");


const generarCorreo = () => {
  const limpio = (str) =>
    str.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nombreLimpio = limpio(nombre);
  const apellidoLimpio = limpio(apellido);
  return `${nombreLimpio}.${apellidoLimpio}@adminm&jshop.com`;
};


  const generarPassword = () => {
    return Math.random().toString(36).slice(-10) + "A1!";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correoDestino) return setError("Debes ingresar un correo destino");

    const correo = generarCorreo();
    const password = generarPassword();

    setSubiendo(true);
    try {
      const db = getDatabase();
      const newRef = ref(db, `usuarios/${uuidv4()}`);
      await set(newRef, {
  correo,
  password,
  rol: "admin",
  privilegios: nivel,
  primerInicio: true,
  activo: true,
  nombre,
  apellido,
});


      await enviarCorreoAdmin(
  correoDestino,       // a quién se lo mandas (no se usa en plantilla)
  correo,              // correo generado para el nuevo admin
  password,            // contraseña generada
  `${nombre} ${apellido}` // nombre completo
);



      setExito(true);
    } catch (err) {
      setError("Error al crear administrador");
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
            <h3>✅ Admin creado y correo enviado</h3>
            <button onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Crear nuevo Administrador</h2>
            <input
              name="nombre"
              placeholder="Nombre"
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <input
              name="apellido"
              placeholder="Apellido"
              onChange={(e) => setApellido(e.target.value)}
              required
            />

            <input
              name="correoDestino"
              placeholder="Correo destino para enviar credenciales"
              onChange={(e) => setCorreoDestino(e.target.value)}
              type="email"
            />

            <label>Privilegios:</label>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="god">Admin God (acceso total)</option>
              <option value="premium">Admin Premium (sin ingresos)</option>
              <option value="estandar">Admin Estándar (limitado)</option>
            </select>

            <button type="submit" disabled={subiendo}>
              {subiendo ? "Creando..." : "Registrar"}
            </button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalAgregarUsuario;
