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
    imagen: null,
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

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

      const direccion = `${datos.calle} ${datos.numero}, ${datos.colonia}, ${datos.ciudad}, ${datos.estado}, CP ${datos.cp}`;

      let hashedPassword = null;
      if (datos.nuevaPass) {
        hashedPassword = await bcrypt.hash(datos.nuevaPass, 10);
      }

      await update(ref(db, `usuarios/${id}`), {
        nombre: datos.nombre,
        telefono: datos.telefono,
        direccion,
        imagen: imagenURL,
        ...(hashedPassword && { password: hashedPassword }), // Solo se agrega si hay nueva contraseña
        primerInicio: false,
      });

      // ✅ Actualiza contexto y localStorage
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
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            value={datos.telefono}
            onChange={handleChange}
          />
          <input name="calle" placeholder="Calle" onChange={handleChange} />
          <input name="numero" placeholder="Número" onChange={handleChange} />
          <input name="colonia" placeholder="Colonia" onChange={handleChange} />
          <input name="ciudad" placeholder="Ciudad" onChange={handleChange} />
          <input name="estado" placeholder="Estado" onChange={handleChange} />
          <input
            name="cp"
            placeholder="Código Postal"
            onChange={handleChange}
          />
          <input
            name="nuevaPass"
            placeholder="Nueva Contraseña"
            onChange={handleChange}
            type="password"
          />
          <input
            name="imagen"
            type="file"
            accept="image/*"
            onChange={handleChange}
          />

          <button type="submit">Guardar</button>
        </form>
      </div>
    </div>
  );
};

export default CompletarPerfil;
