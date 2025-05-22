import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import ClienteLayout from "../components/ClienteLayout";

import { getDatabase, ref, get, update } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "../styles/perfil.css";
import Modal from "react-modal";

const Perfil = () => {
  const { usuario } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const direccionCompleta = perfil
    ? `${perfil.calle} ${perfil.numero}, ${perfil.colonia}, ${perfil.ciudad}, ${perfil.estado}, CP ${perfil.cp}`
    : "";
  const direccionURL = `https://www.google.com/maps?q=${encodeURIComponent(
    direccionCompleta
  )}&output=embed`;

  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const perfilRef = ref(db, `usuarios/${usuario.uid}`);


    get(perfilRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPerfil(snapshot.val());
        setFormData(snapshot.val());
      }
    });
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    if (e.target.files[0]) {
      setNuevaImagen(e.target.files[0]);
    }
  };

  const handleGuardar = async () => {
  const db = getDatabase();
  const perfilRef = ref(db, `usuarios/${usuario.uid}`);
  let datosActualizados = { ...formData };

  if (formData.nuevaPass && formData.nuevaPass.length >= 6) {
    datosActualizados.password = formData.nuevaPass;
  }

  delete datosActualizados.nuevaPass;

  if (nuevaImagen) {
    const storage = getStorage();
    const storageReference = storageRef(storage, `usuarios/${usuario.uid}`);
    await uploadBytes(storageReference, nuevaImagen);
    const urlImagen = await getDownloadURL(storageReference);
    datosActualizados.imagen = urlImagen;
  }

  await update(perfilRef, datosActualizados);
  setPerfil(datosActualizados);
  setEditando(false);
  setNuevaImagen(null);
};


  if (!perfil) return <div className="loading">Cargando perfil...</div>;


  const contenido = (
    <div className="perfil-container">
      <div className="perfil-card">
        <img src={perfil.imagen} alt="Foto de perfil" className="perfil-foto" />
        {editando ? (
          <div className="perfil-info">
            <input type="file" accept="image/*" onChange={handleImagenChange} />
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ""}
              onChange={handleChange}
              placeholder="Nombre"
            />
            <p>
              <strong>Correo:</strong> {perfil.correo}
            </p>

            <input
              type="password"
              name="nuevaPass"
              value={formData.nuevaPass || ""}
              onChange={handleChange}
              placeholder="Nueva contraseña"
            />

            <input
              type="text"
              name="telefono"
              value={formData.telefono || ""}
              onChange={handleChange}
              placeholder="Teléfono"
            />
            <input
              type="text"
              name="calle"
              value={formData.calle || ""}
              onChange={handleChange}
              placeholder="Calle"
            />
            <input
              type="text"
              name="numero"
              value={formData.numero || ""}
              onChange={handleChange}
              placeholder="Número"
            />
            <input
              type="text"
              name="colonia"
              value={formData.colonia || ""}
              onChange={handleChange}
              placeholder="Colonia"
            />
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad || ""}
              onChange={handleChange}
              placeholder="Ciudad"
            />
            <input
              type="text"
              name="estado"
              value={formData.estado || ""}
              onChange={handleChange}
              placeholder="Estado"
            />
            <input
              type="text"
              name="cp"
              value={formData.cp || ""}
              onChange={handleChange}
              placeholder="Código Postal"
            />
            <button onClick={handleGuardar}>Guardar</button>
            <button
              onClick={() => {
                setFormData(perfil);
                setEditando(false);
                setNuevaImagen(null);
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="perfil-info">
            <h2>{perfil.nombre}</h2>
            <p>
              <strong>Correo:</strong> {perfil.correo}
            </p>
            <p>
              <strong>Teléfono:</strong> {perfil.telefono}
            </p>
            <p>
              <strong>Dirección:</strong>
            </p>
            <button
              className="btn-ver-maps"
              onClick={() => setModalAbierto(true)}
            >
              Ver en Google Maps
            </button>

            <Modal
              isOpen={modalAbierto}
              onRequestClose={() => setModalAbierto(false)}
              className="modal-maps"
              overlayClassName="overlay-maps"
            >
              <h2>Ubicación</h2>
              <iframe
                src={direccionURL}
                width="100%"
                height="400"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ borderRadius: "12px", border: "none" }}
              ></iframe>
              <button
                onClick={() => setModalAbierto(false)}
                className="btn-cerrar-maps"
              >
                Cerrar
              </button>
            </Modal>

            <p>
              <strong>Rol:</strong> {perfil.rol}
            </p>
            <button onClick={() => setEditando(true)}>Editar</button>
          </div>
        )}
      </div>
    </div>
  );

return perfil?.rol === "cliente" ? (
  <ClienteLayout>{contenido}
</ClienteLayout>
) : (
  contenido
);
};

export default Perfil;
