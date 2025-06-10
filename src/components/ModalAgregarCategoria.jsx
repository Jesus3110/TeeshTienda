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
            <h3 className="modal-title">✅ Categoría agregada correctamente</h3>
            <button className="btn-red" onClick={onClose}>Aceptar</button>
          </>
        ) : (
          <form onSubmit={agregarCategoria}>
            <h2 className="modal-title">Agregar Categoría</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="nombreCategoria">Nombre de categoría:</label>
              <input
                id="nombreCategoria"
                type="text"
                placeholder="Nombre de categoría"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="form-input"
              />
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-red">Agregar</button>
              <button type="button" onClick={onClose} className="btn-table btn-delete">Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalAgregarCategoria;
