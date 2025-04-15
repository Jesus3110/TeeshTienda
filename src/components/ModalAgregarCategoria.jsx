import React, { useState } from "react";
import { getDatabase, ref, set } from "firebase/database";
import "../styles/modal.css";

const ModalAgregarCategoria = ({ onClose }) => {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const agregarCategoria = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    try {
      const db = getDatabase();
      const nuevaRef = ref(db, `categorias/${nombre.toLowerCase()}`);
      await set(nuevaRef, {
        nombre,
        activa: true,
        totalProductos: 0,
        porcentajeVentas: 0,
      });
      setExito(true);
    } catch (err) {
      setError("Error al agregar categoría.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        {exito ? (
          <>
            <h3>✅ Categoría agregada correctamente</h3>
            <button onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={agregarCategoria}>
            <h2>Agregar Categoría</h2>
            <input
              type="text"
              placeholder="Nombre de categoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ borderColor: error ? "red" : undefined }}
            />
            {error && <small style={{ color: "red" }}>{error}</small>}
            <button type="submit">Agregar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalAgregarCategoria;
