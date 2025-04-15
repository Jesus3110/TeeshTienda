import React, { useState } from "react";
import { getDatabase, ref, set } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "../styles/modal.css";


const ModalAgregarUsuario = ({ onClose }) => {
  const [datos, setDatos] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    estado: "",
    cp: "",
    rol: "admin",
    imagen: null,
  });
  const [subiendo, setSubiendo] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setDatos((prev) => ({ ...prev, imagen: files[0] }));
    } else {
      setDatos((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validar = () => {
    if (!datos.nombre || !datos.correo || !datos.telefono || !datos.calle || !datos.numero || !datos.colonia || !datos.ciudad || !datos.estado || !datos.cp) {
      setError("Todos los campos son obligatorios.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
  
    setSubiendo(true);
    try {
        let urlImagen = "/img/default-user.png";// ✅ Ruta accesible directamente
  
      if (datos.imagen) {
        const storage = getStorage();
        const storageRef = sRef(storage, `usuarios/${uuidv4()}_${datos.imagen.name}`);
        await uploadBytes(storageRef, datos.imagen);
        urlImagen = await getDownloadURL(storageRef);
      }
  
      const direccion = `${datos.calle} ${datos.numero}, ${datos.colonia}, ${datos.ciudad}, ${datos.estado}, CP ${datos.cp}`;
      const db = getDatabase();
      const newRef = ref(db, `usuarios/${uuidv4()}`);
      await set(newRef, {
        ...datos,
        direccion,
        imagen: urlImagen,
        activo: true,
      });
  
      setExito(true);
    } catch (err) {
      setError("Error al registrar usuario.");
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
            <h3>✅ Usuario agregado correctamente</h3>
            <button onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Agregar Administrador</h2>
            <input name="nombre" placeholder="Nombre" onChange={handleChange} />
            <input name="correo" placeholder="Correo electrónico" onChange={handleChange} type="email" />
            <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
            <input name="calle" placeholder="Calle" onChange={handleChange} />
            <input name="numero" placeholder="Número" onChange={handleChange} />
            <input name="colonia" placeholder="Colonia" onChange={handleChange} />
            <input name="ciudad" placeholder="Ciudad" onChange={handleChange} />
            <input name="estado" placeholder="Estado" onChange={handleChange} />
            <input name="cp" placeholder="Código Postal" onChange={handleChange} />
            <input name="imagen" type="file" accept="image/*" onChange={handleChange} />
            <button type="submit" disabled={subiendo}>
              {subiendo ? "Subiendo..." : "Registrar"}
            </button>
            <button type="button" onClick={onClose}>Cancelar</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalAgregarUsuario;
